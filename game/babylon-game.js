// babylon-game.js - Babylon.js Game Logic and Functions

import {
    SteerMode,
    modeNames,
    getSteerMode,
    cycleSteerMode,
    getCurrentModeName,
    updateSteering
} from './modules/steering-system.js';
import { debugColours, FILTERS, trackRad } from './modules/constants.js';
import { toggleDebugOverlay, updateDebugOverlay } from './modules/debug-overlay.js';
import { initializeTestHelpers } from './modules/test-helpers.js';
import {
    setupPhysics,
    InitTyreMaterial,
    AddWheelPhysics,
    AddAxlePhysics,
    AddDynamicPhysics,
    AddDynamicPhysicsConvex,
    FilterMeshCollisions,
    AttachAxleToFrame,
    CreateWheelJoint,
    CreatePoweredWheelJoint,
    AttachSteering,
    CalculateWheelAngles
} from './modules/physics-config.js';
import { setupCamera } from './modules/camera-controller.js';

// Global variables for car physics system
let scene;
let engine;
let havokInstance = null;
let tyreMaterial;

// Export global variables for access from Vue app
export { scene, engine };

/**
 * Initialize Babylon.js game engine and scene
 * @param {Object} vueApp - Vue application instance
 */
export function initializeGame(vueApp) {
    const canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    // Create the scene
    createScene(vueApp).then(sceneInstance => {
        // Render loop
        engine.runRenderLoop(() => {
            sceneInstance.render();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Auto-focus the canvas after scene is ready
        setTimeout(() => {
            canvas.focus();
            canvas.setAttribute('tabindex', '0');

            // Add click listener to focus canvas when clicked
            canvas.addEventListener('click', () => {
                canvas.focus();
            });
        }, 100);

        console.log('🎮 Babylon.js scene created and render loop started');
    });
}

/**
 * Reset the entire game scene
 * @param {Object} vueApp - Vue application instance
 */
export async function resetGame(vueApp) {
    console.log("🔄 Resetting game using Babylon.js...");

    // Stop the render loop
    engine.stopRenderLoop();

    // Dispose the current scene completely
    if (scene) {
        scene.dispose();
    }

    // Create a fresh scene
    const newScene = await createScene(vueApp);

    // Restart the render loop with the new scene
    engine.runRenderLoop(() => {
        newScene.render();
    });

    // Re-focus canvas for immediate input with delay
    setTimeout(() => {
        const canvas = document.getElementById('renderCanvas');
        canvas.focus();
    }, 100);



    console.log("✅ Game reset complete!");
}

/**
 * Reset boxes in the current scene
 * @param {Object} vueApp - Vue application instance
 */
export function resetBoxes(vueApp) {
    // Reset box status in Vue
    vueApp.knockedBoxes = 0;
    vueApp.boxesStatus.forEach(box => {
        box.knocked = false;
    });

    // Reset boxes in the scene
    if (scene) {
        scene.meshes.forEach(mesh => {
            if (mesh.name.includes("knockableBox")) {
                mesh.knocked = false;
                mesh.positionSettled = false; // Reset settled flag
                if (mesh.physicsBody) {
                    // Reset position and rotation
                    mesh.position.copyFrom(mesh.originalPosition);
                    mesh.rotation.copyFrom(mesh.originalRotation);
                    // Reset physics velocities
                    mesh.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
                    mesh.physicsBody.setAngularVelocity(BABYLON.Vector3.Zero());
                }
            }
        });
    }
}

async function createScene(vueApp) {
    scene = new BABYLON.Scene(engine);

    // Set white studio background
    scene.clearColor = new BABYLON.Color3(0.95, 0.95, 0.95); // Light white/gray background

    // Initialize Havok Physics
    await setupPhysics(scene);

    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.5; // Much darker ambient lighting

    tyreMaterial = InitTyreMaterial(scene);

    const carF = await CreateCar(vueApp);

    const camera = setupCamera(scene, carF);

    // Create square race track
    const track = createSquareRaceTrack(scene, 800, 800);
    track.position.y = -20;

    new BABYLON.PhysicsAggregate(track, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 2 }, scene);

    // Create walls around the track
    createTrackWalls(scene, 800, 800);

    // Add collision towers
    createCollisionTowers(scene);

    // Add 5 knockable boxes
    createKnockableBoxes(scene, vueApp);

    // Add bridge
    createBridge(scene);

    addReflectionsToCar();

    addGlowLayer();

    // Setup physics-based collision detection after car is fully created
    // Add a small delay to ensure physics body is properly initialized
    setTimeout(() => {
        setupCollisionDetection(scene, carF, vueApp);
    }, 200);

    let alreadyTriggered = false;
    let raceTime = 0;
    let raceStarted = false;

    const velocity = new BABYLON.Vector3();
    let speed;
    let fCounter = 0;
    scene.onBeforeRenderObservable.add(() => {
        carF.physicsBody.getLinearVelocityToRef(velocity);
        speed = velocity.length();
        if (speed < 1) { speed = 0; }

        // Auto-start race when car starts moving
        if (!raceStarted && speed > 2 && vueApp) {
            console.log("Race started automatically - car is moving!");
            raceTime = Date.now();
            raceStarted = true;
            vueApp.isRacing = true;
            vueApp.raceTime = 0;
        }

        // Update Vue.js data
        if (vueApp) {
            vueApp.speed = speed; // Convert to km/h
            vueApp.position.x = carF.position.x;
            vueApp.position.y = carF.position.y;
            vueApp.position.z = carF.position.z;

            // Fix rotation calculation - use quaternion if available, otherwise use euler
            let rotationY = 0;
            if (carF.rotationQuaternion) {
                rotationY = carF.rotationQuaternion.toEulerAngles().y;
            } else {
                rotationY = carF.rotation.y;
            }
            vueApp.rotation = (rotationY * 180 / Math.PI) % 360;

            vueApp.maxSpeed = Math.max(vueApp.maxSpeed, vueApp.speed);

            // Update race time
            if (vueApp.isRacing && raceStarted && !alreadyTriggered && fCounter < 1) {
                vueApp.raceTime = ((Date.now() - raceTime) / 1000);
            }
        }
    });

    return scene;
}

function addReflectionsToCar() {
    const carProbe = new BABYLON.ReflectionProbe("reflections", 256, scene, false, false);

    for (const mesh of scene.meshes) {
        carProbe.renderList.push(mesh);
    }

    const reflection = carProbe.cubeTexture;
    reflection.coordinatesMode = 6; //3;
    reflection.level = 5;
    scene.getMaterialByName("material0").reflectionTexture = reflection;
    carProbe.attachToMesh(scene.getMeshByName("CarBody"));
}

function addGlowLayer() {
    const glowLayer = new BABYLON.GlowLayer("Glow", scene, {
        mainTextureSamples: 4
    });

    glowLayer.intensity = 4;
    glowLayer.blurKernelSize = 64;
}

function createSquareRaceTrack(scene, width = 800, height = 800) {
    // Create a square ground/track
    const track = BABYLON.MeshBuilder.CreateGround("SquareTrack", {
        width: width,
        height: height
    }, scene);

    // Apply gray racing track material with same lighting properties as walls
    const trackMaterial = new BABYLON.StandardMaterial("trackMaterial", scene);
    trackMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Medium gray racing track color
    trackMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Same specular as walls for consistent lighting

    track.material = trackMaterial;
    track.receiveShadows = true; // Enable shadow receiving

    return track;
}

function createTrackWalls(scene, trackWidth = 800, trackHeight = 800) {
    const wallHeight = 20;
    const wallThickness = 2; // Keep the thickness for visibility

    // Create white wall material for studio environment
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95); // Clean white color
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specular for matte look

    // North Wall
    const northWall = BABYLON.MeshBuilder.CreateBox("northWall", {
        width: trackWidth + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness
    }, scene);
    northWall.position.set(0, wallHeight / 2 - 20, trackHeight / 2 + wallThickness / 2);
    northWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(northWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    // South Wall
    const southWall = BABYLON.MeshBuilder.CreateBox("southWall", {
        width: trackWidth + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness
    }, scene);
    southWall.position.set(0, wallHeight / 2 - 20, -trackHeight / 2 - wallThickness / 2);
    southWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(southWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    // East Wall
    const eastWall = BABYLON.MeshBuilder.CreateBox("eastWall", {
        width: wallThickness,
        height: wallHeight,
        depth: trackHeight
    }, scene);
    eastWall.position.set(trackWidth / 2 + wallThickness / 2, wallHeight / 2 - 20, 0);
    eastWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(eastWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    // West Wall
    const westWall = BABYLON.MeshBuilder.CreateBox("westWall", {
        width: wallThickness,
        height: wallHeight,
        depth: trackHeight
    }, scene);
    westWall.position.set(-trackWidth / 2 - wallThickness / 2, wallHeight / 2 - 20, 0);
    westWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(westWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);
}

function createCollisionTowers(scene) {
    const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
    towerMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1); // Brown color
    // No emissiveColor - no lightning effect

    // Create several towers around the track
    const towerPositions = [
        { x: 200, z: 200 },
        { x: -200, z: 200 },
        { x: 200, z: -200 },
        { x: -200, z: -200 },
        { x: 0, z: 300 },
        { x: 300, z: 0 },
        { x: -300, z: 0 },
        { x: 0, z: -300 }
    ];

    towerPositions.forEach((pos, index) => {
        const tower = BABYLON.MeshBuilder.CreateBox(`tower_${index}`, {
            width: 15,
            height: 25,
            depth: 15
        }, scene);

        tower.position.set(pos.x, 12.5 - 20, pos.z); // Height/2 - ground level
        tower.material = towerMaterial;

        // Add physics for collision
        new BABYLON.PhysicsAggregate(tower, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.5 }, scene);
    });
}

function createKnockableBoxes(scene, vueApp) {
    const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // Orange color
    boxMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);

    // Create 5 boxes at different positions (moved away from bridge area X=185 to X=-75)
    const boxPositions = [
        { x: 250, z: 100 },  // Moved further right
        { x: -200, z: 100 }, // Moved further left  
        { x: 250, z: -250 }, // Moved further right and back
        { x: -200, z: -250 }, // Moved further left and back
        { x: 300, z: 0 }     // Moved much further right from center
    ];

    const boxes = [];

    boxPositions.forEach((pos, index) => {
        const box = BABYLON.MeshBuilder.CreateBox(`knockableBox_${index}`, {
            width: 8,
            height: 8,
            depth: 8
        }, scene);

        box.position.set(pos.x, 4, pos.z); // Height/2 above ground level
        box.material = boxMaterial;

        // Add physics - these boxes can be knocked over
        const boxAggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, {
            mass: 20, // Lighter mass for easier knockdown
            friction: 0.4, // Less friction
            restitution: 0.5 // More bounce
        }, scene);

        // Store original position for reset
        box.originalPosition = box.position.clone();
        box.originalRotation = box.rotation.clone();
        box.knocked = false;
        box.boxIndex = index;
        box.positionSettled = false; // Flag to track if position has settled

        boxes.push(box);
    });

    // Debug: List all created boxes
    console.log(`Created ${boxes.length} knockable boxes - position settling in 2 seconds`);

    return boxes;
}

// Physics-based collision detection system
function setupCollisionDetection(scene, car, vueApp) {
    // Get car's physics body with multiple fallback options
    let carPhysicsBody = null;

    if (car) {
        carPhysicsBody = car.physicsBody || car._physicsBody;

        // If still not found, try to wait a bit more for physics to initialize
        if (!carPhysicsBody) {
            console.log("⏳ Physics body not ready, retrying in 100ms...");
            setTimeout(() => {
                setupCollisionDetection(scene, car, vueApp);
            }, 100);
            return;
        }
    }

    if (!carPhysicsBody) {
        console.error("❌ Car physics body not found after retries!");
        return;
    }

    console.log("✅ Car physics body found, setting up collision detection");

    // Track collision cooldowns to prevent spam
    const collisionCooldowns = new Map();
    let lastVelocity = { x: 0, y: 0, z: 0 };
    let debugCounter = 0;
    let startTime = Date.now(); // Track when system started

    console.log("Collision detection system started, box detection active after 2 seconds...");

    // Setup collision detection
    scene.onBeforeRenderObservable.add(() => {
        debugCounter++;

        // Get current velocity
        const velocity = carPhysicsBody.getLinearVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

        // Check for sudden speed changes (collisions)
        const lastSpeed = Math.sqrt(lastVelocity.x * lastVelocity.x + lastVelocity.y * lastVelocity.y + lastVelocity.z * lastVelocity.z);
        const speedDifference = Math.abs(speed - lastSpeed);

        // If speed drops significantly (collision), increment counter
        if (speedDifference > 5 && speed < lastSpeed && lastSpeed > 2) {
            const now = Date.now();
            if (!collisionCooldowns.has('general') || now - collisionCooldowns.get('general') > 500) {
                if (vueApp) {
                    vueApp.collisions++;
                    console.log(`Collision detected! Speed change: ${speedDifference.toFixed(2)}, Total collisions: ${vueApp.collisions}`);
                }
                collisionCooldowns.set('general', now);
            }
        }

        // Debug every 300 frames (5 seconds at 60fps) - reduced spam
        if (debugCounter % 300 === 0) {
            const boxCount = scene.meshes.filter(m => m.name.includes("knockableBox_")).length;
            console.log(`Debug: Car at (${car.position.x.toFixed(1)}, ${car.position.y.toFixed(1)}, ${car.position.z.toFixed(1)}), Found ${boxCount} boxes`);
        }

        // Only start checking box movement after 2 seconds (let physics settle)
        if (Date.now() - startTime > 2000) {
            // Check for box movement (knocked boxes) - allow multiple hits per box
            scene.meshes.forEach(mesh => {
                if (mesh.name.includes("knockableBox_")) {
                    // Update initial position if this is first check after settling
                    if (!mesh.positionSettled) {
                        mesh.initialPosition = mesh.position.clone();
                        mesh.positionSettled = true;
                        return; // Skip this frame for this box
                    }

                    // Calculate how much the box has moved from its settled position
                    const movementDistance = BABYLON.Vector3.Distance(mesh.position, mesh.initialPosition);
                    const now = Date.now();

                    // If box moved more than 3 units and enough time passed since last count
                    if (movementDistance > 3) {
                        // Use cooldown per box to prevent rapid spam (1000ms)
                        if (!collisionCooldowns.has(mesh.name) || now - collisionCooldowns.get(mesh.name) > 1000) {
                            if (vueApp) {
                                vueApp.knockedBoxes++;
                                console.log(`Box ${mesh.name} moved ${movementDistance.toFixed(2)} units from settled position! Total: ${vueApp.knockedBoxes}`);
                                // Update initial position to current position to track further movement
                                mesh.initialPosition = mesh.position.clone();
                            }
                            collisionCooldowns.set(mesh.name, now);
                        }
                    }
                }
            });
        }

        lastVelocity = { x: velocity.x, y: velocity.y, z: velocity.z };
    });
}

// Create a ramp bridge for driving over
function createBridge(scene) {
    // Bridge spans from X=185 to X=-75 (total width: 260 units)
    const bridgeStartX = 185;
    const bridgeEndX = -75;
    const bridgeWidth = bridgeStartX - bridgeEndX; // 260 units
    const bridgeCenterX = (bridgeStartX + bridgeEndX) / 2; // 55
    const bridgeZ = 0; // Center on Z axis
    const bridgeHeight = 25; // Higher off the ground

    // Create bridge material - clean white/gray
    const bridgeMaterial = new BABYLON.StandardMaterial("bridgeMaterial", scene);
    bridgeMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    bridgeMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    // Define step parameters first
    const stepCount = 12; // More steps for gradual incline
    const stepWidth = 12; // Wider steps
    const stepHeight = 2;
    const stepDepth = 30; // Same depth as bridge

    // Create the main bridge platform (flat part on top) - much bigger
    // Position it to connect with the top of the highest steps
    const maxStepHeight = stepHeight * stepCount; // 24 units high
    const bridgePlatformWidth = 80;
    const bridgePlatform = BABYLON.MeshBuilder.CreateBox("bridgePlatform", {
        width: bridgePlatformWidth, // Much wider for easier driving
        height: 4,
        depth: 30 // Much deeper
    }, scene);
    bridgePlatform.position = new BABYLON.Vector3(bridgeCenterX, maxStepHeight - 20 + 2, bridgeZ); // Connect to top of steps
    bridgePlatform.material = bridgeMaterial;

    // Calculate where bridge starts and ends (bridge edges)
    const bridgeLeftEdge = bridgeCenterX - (bridgePlatformWidth / 2); // 55 - 40 = 15
    const bridgeRightEdge = bridgeCenterX + (bridgePlatformWidth / 2); // 55 + 40 = 95

    // Add physics to bridge platform
    new BABYLON.PhysicsAggregate(bridgePlatform, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 2 }, scene);
    bridgePlatform.receiveShadows = true;

    // Create support pillars under the bridge
    const pillarHeight = bridgeHeight;
    const pillarPositions = [
        { x: bridgeCenterX - 30, z: bridgeZ - 10 },
        { x: bridgeCenterX - 30, z: bridgeZ + 10 },
        { x: bridgeCenterX, z: bridgeZ - 10 },
        { x: bridgeCenterX, z: bridgeZ + 10 },
        { x: bridgeCenterX + 30, z: bridgeZ - 10 },
        { x: bridgeCenterX + 30, z: bridgeZ + 10 }
    ];

    pillarPositions.forEach((pos, index) => {
        const pillar = BABYLON.MeshBuilder.CreateBox(`bridgePillar${index}`, {
            width: 6,
            height: pillarHeight,
            depth: 6
        }, scene);
        pillar.position = new BABYLON.Vector3(pos.x, pillarHeight / 2 - 20, pos.z);
        pillar.material = bridgeMaterial;
        new BABYLON.PhysicsAggregate(pillar, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 1 }, scene);
        pillar.receiveShadows = true;
    });

    console.log(`🌉 Large ramp bridge created from X=${bridgeStartX} to X=${bridgeEndX} at height ${bridgeHeight}`);
}

// Create red taillights for the car
function createTaillights(carFrame, scene) {
    // Create left taillight (half size)
    const leftTaillight = BABYLON.MeshBuilder.CreateSphere("leftTaillight", { diameter: 1 }, scene);
    leftTaillight.position = new BABYLON.Vector3(5.2, 1.65, -13.5); // Left rear of car
    leftTaillight.parent = carFrame;

    // Create right taillight (half size)
    const rightTaillight = BABYLON.MeshBuilder.CreateSphere("rightTaillight", { diameter: 1 }, scene);
    rightTaillight.position = new BABYLON.Vector3(-5.2, 1.65, -13.5); // Right rear of car
    rightTaillight.parent = carFrame;

    // Create red glowing material for taillights
    const taillightMaterial = new BABYLON.StandardMaterial("taillightMaterial", scene);
    taillightMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red color
    taillightMaterial.emissiveColor = new BABYLON.Color3(0.8, 0, 0); // Red glow
    taillightMaterial.specularColor = new BABYLON.Color3(0.2, 0, 0);

    // Apply material to both taillights
    leftTaillight.material = taillightMaterial;
    rightTaillight.material = taillightMaterial;

    // Create one CENTRAL red spot light for both taillights (more efficient)
    const centralTaillightPosition = new BABYLON.Vector3(0, 1.65, -13.5); // Center between taillights
    const taillightSpot = new BABYLON.SpotLight("taillightSpot",
        centralTaillightPosition,
        new BABYLON.Vector3(0, 0, -1), // Direction pointing backward
        Math.PI / 1.2, // Wider angle to cover both taillight areas
        2, // Exponent for light falloff
        scene);
    taillightSpot.diffuse = new BABYLON.Color3(1, 0, 0); // Red diffuse light
    taillightSpot.specular = new BABYLON.Color3(0.3, 0, 0); // Red specular
    taillightSpot.intensity = 1.5; // Higher intensity to compensate for single light
    taillightSpot.range = 25; // Range for light distribution
    taillightSpot.parent = carFrame;

    // Enable shadow receiving for all car parts and ground
    carFrame.receiveShadows = true;

    // Make sure ground receives shadows and light
    const groundMesh = scene.getMeshByName("SquareTrack");
    if (groundMesh) {
        groundMesh.receiveShadows = true;
    }

    // Improve car material for better light reflection
    if (carFrame.material) {
        carFrame.material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        carFrame.material.specularPower = 16;
    }

    console.log("🔴 Enhanced red taillights with ESM shadows and focused beams created");
}

// Create front headlights for the car
function createHeadlights(carFrame, scene) {
    // Create left headlight as cylinder (like a cake - round with depth)
    const leftHeadlight = BABYLON.MeshBuilder.CreateCylinder("leftHeadlight", {
        diameter: 2.1,
        height: 0.8 // The "length/depth" of the headlight
    }, scene);
    leftHeadlight.position = new BABYLON.Vector3(5.1, 1.65, 13.5); // Left front of car
    leftHeadlight.rotation.x = Math.PI / 2; // Rotate 90° to lie flat against car front
    leftHeadlight.parent = carFrame;

    // Create right headlight as cylinder (like a cake - round with depth)
    const rightHeadlight = BABYLON.MeshBuilder.CreateCylinder("rightHeadlight", {
        diameter: 2.1,
        height: 0.8 // The "length/depth" of the headlight
    }, scene);
    rightHeadlight.position = new BABYLON.Vector3(-5.1, 1.65, 13.5); // Right front of car
    rightHeadlight.rotation.x = Math.PI / 2; // Rotate 90° to lie flat against car front
    rightHeadlight.parent = carFrame;

    // Create warm white glowing material for headlights (color #ddc584)
    const headlightMaterial = new BABYLON.StandardMaterial("headlightMaterial", scene);
    headlightMaterial.diffuseColor = new BABYLON.Color3(0.867, 0.773, 0.518); // #ddc584 converted to RGB
    headlightMaterial.emissiveColor = new BABYLON.Color3(0.867, 0.773, 0.518); // Warm glow
    headlightMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Apply material to both headlights
    leftHeadlight.material = headlightMaterial;
    rightHeadlight.material = headlightMaterial;

    // Create one CENTRAL headlight for both headlight areas (more efficient)
    const centralHeadlightPosition = new BABYLON.Vector3(0, 1.65, 13.5); // Center between headlights
    const headlightSpot = new BABYLON.SpotLight("headlightSpot",
        centralHeadlightPosition,
        new BABYLON.Vector3(0, -0.3, 1), // Direction pointing forward and down
        Math.PI / 2, // Wider angle to cover both headlight areas
        2, // Exponent for light falloff
        scene);
    headlightSpot.diffuse = new BABYLON.Color3(0.867, 0.773, 0.518); // #ddc584 warm light
    headlightSpot.specular = new BABYLON.Color3(0.8, 0.7, 0.5); // Higher specular to match ground reflectivity
    headlightSpot.intensity = 3.0; // Higher intensity to compensate for single light
    headlightSpot.range = 60; // Longer range for headlights
    headlightSpot.parent = carFrame;

    // Create shadow generator for the central headlight
    const headlightShadowGenerator = new BABYLON.ShadowGenerator(1024, headlightSpot);
    headlightShadowGenerator.useBlurExponentialShadowMap = true;
    headlightShadowGenerator.blurBoxOffset = 2.0;
    headlightShadowGenerator.bias = 0.00001;

    // Enable shadow receiving and add meshes to shadow rendering
    const groundMesh = scene.getMeshByName("SquareTrack");
    if (groundMesh) {
        headlightShadowGenerator.getShadowMap().renderList.push(carFrame);

        // Also add wheels to shadow casting if they exist
        const wheels = scene.meshes.filter(mesh => mesh.name.includes("Wheel"));
        wheels.forEach(wheel => {
            headlightShadowGenerator.getShadowMap().renderList.push(wheel);
        });
    }

    console.log("💡 Warm white headlights (#ddc584) with shadows created");
}

async function CreateCar(vueApp) {
    // Import the custom car model
    const customCarBody = await importCustomCar();

    // Use the imported car body instead of creating a box
    let carFrame;
    if (customCarBody) {
        carFrame = customCarBody;
    } else {
        console.error("Custom car loading failed! Using fallback box.");
        // Fallback to original box if model loading fails
        carFrame = BABYLON.MeshBuilder.CreateBox("CarBody", { height: 1, width: 12, depth: 24, faceColors: debugColours });
        carFrame.position = new BABYLON.Vector3(0, 1, 0);
        carFrame.visibility = 0.5;
        const carFrameBody = AddDynamicPhysics(carFrame, 2000, 0, 0, new BABYLON.Vector3(0, -2.5, 1), scene);
        FilterMeshCollisions(carFrame);

        // Continue with wheel creation for fallback
        const flWheel = CreateWheel(new BABYLON.Vector3(5, 0, 8));
        const flAxle = CreateAxle(new BABYLON.Vector3(5, 0, 8));
        const frWheel = CreateWheel(new BABYLON.Vector3(-5, 0, 8));
        const frAxle = CreateAxle(new BABYLON.Vector3(-5, 0, 8));
        const rlWheel = CreateWheel(new BABYLON.Vector3(5, 0, -10));
        const rlAxle = CreateAxle(new BABYLON.Vector3(5, 0, -10));
        const rrWheel = CreateWheel(new BABYLON.Vector3(-5, 0, -10));
        const rrAxle = CreateAxle(new BABYLON.Vector3(-5, 0, -10));

        const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel, scene);
        const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel, scene);
        const poweredWheelMotorC = CreatePoweredWheelJoint(rlAxle, rlWheel, scene);
        const poweredWheelMotorD = CreatePoweredWheelJoint(rrAxle, rrWheel, scene);

        const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelC = AttachAxleToFrame(rlAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelD = AttachAxleToFrame(rrAxle.physicsBody, carFrame.physicsBody, true, scene);

        // Phase 1.2: Store references for later use
        // Phase 1.3: Rear wheels now have steering capability
        // Phase 1.4: Rear wheels now have drive motors
        const wheels = { FL: flWheel, FR: frWheel, RL: rlWheel, RR: rrWheel };
        const axles = { FL: flAxle, FR: frAxle, RL: rlAxle, RR: rrAxle };
        const steeringJoints = { FL: steerWheelA, FR: steerWheelB, RL: steerWheelC, RR: steerWheelD };
        const motorJoints = { FL: poweredWheelMotorA, FR: poweredWheelMotorB, RL: poweredWheelMotorC, RR: poweredWheelMotorD };

        console.log('🔧 Wheels:', wheels);
        console.log('🔧 Axles:', axles);
        console.log('🔧 Steering joints:', steeringJoints);
        console.log('🔧 Motor joints:', motorJoints);

        InitKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints);

        return carFrame;
    }

    carFrame.position = new BABYLON.Vector3(0, 5, 0); // Higher position for larger car
    // Remove visibility setting to show the actual car model
    // carFrame.visibility = 0.5; 

    // Use ConvexHull physics for better performance with complex meshes
    const carFrameBody = AddDynamicPhysicsConvex(carFrame, 5000, 0, 0.8, new BABYLON.Vector3(0, -2.5, 1), scene);
    FilterMeshCollisions(carFrame);

    const flWheel = CreateWheel(new BABYLON.Vector3(5, 0, 8));
    const flAxle = CreateAxle(new BABYLON.Vector3(5, 0, 8));
    const frWheel = CreateWheel(new BABYLON.Vector3(-5, 0, 8));
    const frAxle = CreateAxle(new BABYLON.Vector3(-5, 0, 8));
    const rlWheel = CreateWheel(new BABYLON.Vector3(5, 0, -8)); // Moved forward
    const rlAxle = CreateAxle(new BABYLON.Vector3(5, 0, -8)); // Moved forward
    const rrWheel = CreateWheel(new BABYLON.Vector3(-5, 0, -8)); // Moved forward
    const rrAxle = CreateAxle(new BABYLON.Vector3(-5, 0, -8)); // Moved forward

    for (const mesh of [flAxle, frAxle, rlAxle, rrAxle]) {
        carFrame.addChild(mesh);
        AddAxlePhysics(mesh, 190, 0, 0, scene);
        FilterMeshCollisions(mesh);
    }

    for (const mesh of [flWheel, frWheel, rlWheel, rrWheel]) {
        AddWheelPhysics(mesh, 150, 0, 2.5, scene);
        FilterMeshCollisions(mesh);
    }

    const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel, scene);
    const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel, scene);
    const poweredWheelMotorC = CreatePoweredWheelJoint(rlAxle, rlWheel, scene);
    const poweredWheelMotorD = CreatePoweredWheelJoint(rrAxle, rrWheel, scene);

    const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelC = AttachAxleToFrame(rlAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelD = AttachAxleToFrame(rrAxle.physicsBody, carFrameBody, true, scene);

    // Phase 1.2: Store references for later use
    // Phase 1.3: Rear wheels now have steering capability
    // Phase 1.4: Rear wheels now have drive motors
    const wheels = { FL: flWheel, FR: frWheel, RL: rlWheel, RR: rrWheel };
    const axles = { FL: flAxle, FR: frAxle, RL: rlAxle, RR: rrAxle };
    const steeringJoints = { FL: steerWheelA, FR: steerWheelB, RL: steerWheelC, RR: steerWheelD };
    const motorJoints = { FL: poweredWheelMotorA, FR: poweredWheelMotorB, RL: poweredWheelMotorC, RR: poweredWheelMotorD };

    console.log('🔧 Wheels:', wheels);
    console.log('🔧 Axles:', axles);
    console.log('🔧 Steering joints:', steeringJoints);
    console.log('🔧 Motor joints:', motorJoints);

    InitKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints);

    // Add red taillights to the car
    createTaillights(carFrame, scene);

    // Add warm white headlights to the car
    createHeadlights(carFrame, scene);

    return carFrame;
}

function CreateAxle(position) {
    const axleMesh = BABYLON.MeshBuilder.CreateBox("Axle", { height: 1, width: 2.5, depth: 1, faceColors: debugColours });
    axleMesh.position = position;
    return axleMesh;
}

function CreateWheel(position) {
    const faceUVforArrowTexture = [
        new BABYLON.Vector4(0, 0, 0, 0),
        new BABYLON.Vector4(0, 1, 1, 0),
        new BABYLON.Vector4(0, 0, 0, 0),
    ];

    const wheelMesh = BABYLON.MeshBuilder.CreateCylinder("Wheel", { height: 1.6, diameter: 4, faceUV: faceUVforArrowTexture });
    wheelMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position = position;
    wheelMesh.material = tyreMaterial;
    return wheelMesh;
}

function InitKeyboardControls(motorWheelA, motorWheelB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints) {
    let forwardPressed = false;
    let backPressed = false;
    let leftPressed = false;
    let rightPressed = false;
    let brakePressed = false;
    let jumpPressed = false;

    let currentSteeringAngle = 0;
    let maxSpeed = 80;
    const maxSteeringAngle = Math.PI / 4;
    const jumpForce = 3000;

    let steerAngle = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let wheelSpeed = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let manualControl = { active: false }; // Flag to prevent keyboard override of manual test commands

    initializeTestHelpers(steerAngle, wheelSpeed, carFrame, manualControl);

    scene.onKeyboardObservable.add(e => {
        switch (e.event.key) {
            case "w": case "W": case "ArrowUp": forwardPressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "s": case "S": case "ArrowDown": backPressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "a": case "A": case "ArrowLeft": leftPressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "d": case "D": case "ArrowRight": rightPressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case "b": case "B": brakePressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                break;
            case " ":
                if (e.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
                    jumpPressed = true;
                    console.log("🚀 Jump button pressed!");

                    if (carFrame.physicsBody) {
                        carFrame.physicsBody.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), carFrame.getAbsolutePosition());

                        const currentVel = carFrame.physicsBody.getLinearVelocity();
                        carFrame.physicsBody.setLinearVelocity(new BABYLON.Vector3(currentVel.x, jumpForce / 100, currentVel.z));
                    } else {
                        console.error("❌ No physics body found on car frame!");
                    }
                } else {
                    jumpPressed = false;
                }
                break;
            case "F11":
                if (e.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
                    e.event.preventDefault();
                    toggleDebugOverlay();
                }
                break;
            case "Enter":
                if (e.type == BABYLON.KeyboardEventTypes.KEYDOWN && vueApp) {
                    vueApp.resetGame();
                }
                break;
            case "m": case "M":
                if (e.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                    cycleSteerMode();
                    currentSteeringAngle = 0; // Reset angle on mode switch to prevent contamination
                    console.log('🔄 Mode:', getCurrentModeName());
                }
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        const isForward = forwardPressed || (vueApp && vueApp.touchControls.forward);
        const isBackward = backPressed || (vueApp && vueApp.touchControls.backward);
        const isLeft = leftPressed || (vueApp && vueApp.touchControls.left);
        const isRight = rightPressed || (vueApp && vueApp.touchControls.right);
        const isBrake = brakePressed || (vueApp && vueApp.touchControls.brake);
        const isJump = jumpPressed || (vueApp && vueApp.touchControls.jump);

        if (isJump) {
            console.log("🚀 Jump (keyboard or touch) activated!");

            if (carFrame.physicsBody) {
                carFrame.physicsBody.applyImpulse(new BABYLON.Vector3(0, jumpForce / 2, 0), carFrame.getAbsolutePosition());

                const currentVel = carFrame.physicsBody.getLinearVelocity();
                carFrame.physicsBody.setLinearVelocity(new BABYLON.Vector3(currentVel.x, Math.min(currentVel.y + jumpForce / 200, jumpForce / 50), currentVel.z));
            }
        }

        // Only update control variables if manual control is not active
        if (!manualControl.active) {
            currentSteeringAngle = updateSteering(isLeft, isRight, currentSteeringAngle, maxSteeringAngle, steerAngle, CalculateWheelAngles);

            if (isBrake) {
                wheelSpeed.FL = 0;
                wheelSpeed.FR = 0;
                wheelSpeed.RL = 0;
                wheelSpeed.RR = 0;
            } else if (isForward) {
                ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                    if (wheelSpeed[wheel] < maxSpeed) wheelSpeed[wheel] += 1;
                });
            } else if (isBackward) {
                ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                    if (wheelSpeed[wheel] > -maxSpeed * 0.5) wheelSpeed[wheel] -= 1;
                });
            } else if (!isForward && !isBackward) {
                ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                    wheelSpeed[wheel] *= 0.92;
                });
            }
        }

        if (vueApp) {
            let directions = [];

            if (isForward) directions.push('↑ Forward');
            if (isBackward) directions.push('↓ Backward');
            if (isLeft) directions.push('← Left');
            if (isRight) directions.push('→ Right');
            if (isBrake) directions.push('🚗 Brake');
            if (isJump) directions.push('🚀 Jump');

            if (directions.length > 0) {
                vueApp.direction = directions.join(' + ');
            } else {
                vueApp.direction = '—';
            }
        }

        // Apply steering angles to ALL 4 wheels
        steeringJoints.FL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.FL);
        steeringJoints.FR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.FR);
        steeringJoints.RL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.RL);
        steeringJoints.RR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.RR);

        // Set brake force for all wheels
        if (isBrake) {
            motorJoints.FL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
            motorJoints.FR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
            motorJoints.RL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
            motorJoints.RR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
        } else {
            motorJoints.FL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
            motorJoints.FR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
            motorJoints.RL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
            motorJoints.RR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
        }

        // Apply motor speeds to ALL 4 wheels
        motorJoints.FL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.FL);
        motorJoints.FR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.FR);
        motorJoints.RL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.RL);
        motorJoints.RR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.RR);

        updateDebugOverlay(steerAngle, wheelSpeed, getCurrentModeName());
    });
}


async function importCustomCar() {
    try {
        console.log("🚗 Loading custom car model...");

        const importResult = await BABYLON.SceneLoader.ImportMeshAsync("", "game/models/", "car.glb", scene);

        console.log("📦 Car model loaded successfully:", importResult);

        const importRoot = importResult.meshes[0];

        if (importRoot) {
            importRoot.scaling = new BABYLON.Vector3(14, 14, 14);

            if (importRoot.rotationQuaternion) {
                importRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            importRoot.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

            importRoot.position = new BABYLON.Vector3(0, 2.3, 0);

            if (!importRoot.position) {
                importRoot.position = new BABYLON.Vector3(0, 2, 0);
            }

            importRoot.bakeCurrentTransformIntoVertices();

            const meshesToMerge = importResult.meshes.filter(mesh =>
                mesh.getClassName() === "Mesh" && mesh !== importRoot
            );

            let carBody;
            if (meshesToMerge.length > 0) {
                carBody = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
                carBody.name = "CarBody";
            } else {
                importRoot.name = "CarBody";
                carBody = importRoot;
            }

            console.log("✅ Car body created:", carBody.name);

            if (!carBody.position) {
                carBody.position = new BABYLON.Vector3(0, 0, 0);
            }

            return carBody;

        } else {
            console.error("❌ No root mesh found in car model");
            return null;
        }

    } catch (error) {
        console.error("❌ Error loading car model:", error);
        console.log("💡 Make sure the car.glb file exists in game/models/ folder");
        return null;
    }
}

