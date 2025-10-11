// babylon-game.js - Babylon.js Game Logic and Functions

// Global variables for car physics system
let scene;
let engine;
let havokInstance = null;
let tyreMaterial;
const debugColours = [];
debugColours[0] = new BABYLON.Color3(1, 0, 1);
debugColours[1] = new BABYLON.Color3(1, 0, 0);
debugColours[2] = new BABYLON.Color3(0, 1, 0);
debugColours[3] = new BABYLON.Color3(1, 1, 0);
debugColours[4] = new BABYLON.Color3(0, 1, 1);
debugColours[5] = new BABYLON.Color3(0, 0, 1);
const FILTERS = { CarParts: 1, Environment: 2 };
const trackRad = 400;

// Export global variables for access from Vue app
export { scene, engine };

/**
 * Initialize Babylon.js game engine and scene
 * @param {Object} vueApp - Vue application instance
 */
export function initializeGame(vueApp) {
    const canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);
    
    // Auto-focus the canvas for immediate keyboard input
    canvas.focus();
    canvas.setAttribute('tabindex', '0');
    
    // Add click listener to focus canvas when clicked
    canvas.addEventListener('click', () => {
        canvas.focus();
    });
    
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
    
    // Re-focus canvas for immediate input
    const canvas = document.getElementById('renderCanvas');
    canvas.focus();


    
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

            // Initialize Havok Physics
            const havokPlugin = new BABYLON.HavokPlugin(true, await HavokPhysics());
            scene.enablePhysics(new BABYLON.Vector3(0, -150, 0), havokPlugin);
            scene.getPhysicsEngine().setTimeStep(1 / 500);
            scene.getPhysicsEngine().setVelocityLimits(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            scene.getPhysicsEngine().setSubTimeStep(1.8);

            const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
            camera.radius = 50;
            camera.heightOffset = 20;
            camera.rotationOffset = 180;
            camera.cameraAcceleration = 0.035;
            camera.maxCameraSpeed = 10;

            const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
            hemisphericLight.intensity = 0.7;

            InitTyreMaterial();

            const carF = CreateCar(vueApp);
            camera.lockedTarget = carF;

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

            // Setup physics-based collision detection
            setupCollisionDetection(scene, carF, vueApp);

            // Remove finish line creation
            // const checkerPlane = ... (removed)
            // const finishTrigger = ... (removed)
            // Remove finish line logic
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
                    vueApp.speed = speed * 3.6; // Convert to km/h
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

        function createSquareRaceTrack(scene, width = 800, height = 800) {
            // Create a square ground/track
            const track = BABYLON.MeshBuilder.CreateGround("SquareTrack", { 
                width: width, 
                height: height 
            }, scene);

            // Apply the same material as the original track
            const trackMaterial = new BABYLON.StandardMaterial("trackMaterial", scene);
            trackMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            trackMaterial.emissiveColor = new BABYLON.Color3(0.21, 0.3, 0.31);
            
            // Add texture from original code
            trackMaterial.diffuseTexture = new BABYLON.Texture("game/textures/up.png", scene);
            trackMaterial.diffuseTexture.uScale = 20;
            trackMaterial.diffuseTexture.vScale = 20;
            trackMaterial.diffuseTexture.wAng = BABYLON.Tools.ToRadians(250);
            
            track.material = trackMaterial;

            return track;
        }

        function createTrackWalls(scene, trackWidth = 800, trackHeight = 800) {
            const wallHeight = 5;
            const wallThickness = 2;

            // Create wall material similar to the original rail material
            const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            wallMaterial.diffuseTexture = new BABYLON.Texture("game/textures/amiga.jpg", scene);

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

            // Add some posts for decoration (similar to original rail posts)
            const postMaterial = new BABYLON.StandardMaterial("postMaterial", scene);
            postMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            postMaterial.emissiveColor = BABYLON.Color3.Teal();

            const postSpacing = 50;
            const postCount = Math.floor(trackWidth / postSpacing);

            // North posts
            for (let i = 0; i <= postCount; i++) {
                const x = -trackWidth / 2 + (i * postSpacing);
                const post = BABYLON.MeshBuilder.CreateBox("northPost", {
                    width: 1,
                    height: wallHeight + 1,
                    depth: 1
                }, scene);
                post.position.set(x, wallHeight / 2 - 19.5, trackHeight / 2 + wallThickness / 2);
                post.material = postMaterial;
            }

            // South posts
            for (let i = 0; i <= postCount; i++) {
                const x = -trackWidth / 2 + (i * postSpacing);
                const post = BABYLON.MeshBuilder.CreateBox("southPost", {
                    width: 1,
                    height: wallHeight + 1,
                    depth: 1
                }, scene);
                post.position.set(x, wallHeight / 2 - 19.5, -trackHeight / 2 - wallThickness / 2);
                post.material = postMaterial;
            }

            // East posts
            for (let i = 0; i <= postCount; i++) {
                const z = -trackHeight / 2 + (i * postSpacing);
                const post = BABYLON.MeshBuilder.CreateBox("eastPost", {
                    width: 1,
                    height: wallHeight + 1,
                    depth: 1
                }, scene);
                post.position.set(trackWidth / 2 + wallThickness / 2, wallHeight / 2 - 19.5, z);
                post.material = postMaterial;
            }

            // West posts
            for (let i = 0; i <= postCount; i++) {
                const z = -trackHeight / 2 + (i * postSpacing);
                const post = BABYLON.MeshBuilder.CreateBox("westPost", {
                    width: 1,
                    height: wallHeight + 1,
                    depth: 1
                }, scene);
                post.position.set(-trackWidth / 2 - wallThickness / 2, wallHeight / 2 - 19.5, z);
                post.material = postMaterial;
            }
        }

        function createCollisionTowers(scene) {
            const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
            towerMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1); // Brown color
            towerMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);

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

            // Create 5 boxes at different positions
            const boxPositions = [
                { x: 100, z: 100 },
                { x: -100, z: 100 },
                { x: 100, z: -100 },
                { x: -100, z: -100 },
                { x: 150, z: 0 }  // Moved from center to avoid car spawn position
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
            // Get car's physics body
            const carPhysicsBody = car.physicsBody || car._physicsBody;
            if (!carPhysicsBody) {
                console.error("Car physics body not found!");
                return;
            }

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
                                // Removed spam log - system working
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

        function createCircularRaceTrackWithSideGuardrails(scene, radius = 10, width = 3, height = 0.5, segments = 32) {
            const innerPath = [];
            const outerPath = [];

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const innerX = (radius - width / 2) * Math.cos(angle);
                const innerZ = (radius - width / 2) * Math.sin(angle);
                innerPath.push(new BABYLON.Vector3(innerX, height * 0.3, innerZ));

                const outerX = (radius + width / 2) * Math.cos(angle);
                const outerZ = (radius + width / 2) * Math.sin(angle);
                outerPath.push(new BABYLON.Vector3(outerX, height, outerZ));
            }

            const track = BABYLON.MeshBuilder.CreateRibbon("raceTrack", {
                pathArray: [innerPath, outerPath],
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                updatable: false,
                closeArray: false,
                closePath: false
            }, scene);

            const trackMaterial = new BABYLON.StandardMaterial("trackMaterial", scene);
            trackMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            trackMaterial.emissiveColor = new BABYLON.Color3(0.21, 0.3, 0.31);
            track.material = trackMaterial;
            
            // Add texture from original code
            trackMaterial.diffuseTexture = new BABYLON.Texture("game/textures/up.png", scene);
            trackMaterial.diffuseTexture.uScale = 20;
            trackMaterial.diffuseTexture.wAng = BABYLON.Tools.ToRadians(250);

            addTrackStripes(scene, radius, width, height, segments);
            addSideGuardrails(scene, radius, width, height, segments);

            return track;
        }

        function addSideGuardrails(scene, radius, width, height, segments) {
            const railHeight = 2.5;
            const railThickness = 0.4;
            const railMaterial = new BABYLON.StandardMaterial("railMaterial", scene);
            railMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
            railMaterial.diffuseTexture = new BABYLON.Texture("game/textures/amiga.jpg", scene);

            const innerRailPath = [];
            const innerRailPathTop = [];
            const outerRailPath = [];
            const outerRailPathTop = [];

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const innerX = (radius - width / 2) * Math.cos(angle);
                const innerZ = (radius - width / 2) * Math.sin(angle);

                innerRailPath.push(new BABYLON.Vector3(innerX, height * 0.3, innerZ));
                innerRailPathTop.push(new BABYLON.Vector3(innerX, height * 0.3 + railHeight, innerZ));

                const outerX = (radius + width / 2) * Math.cos(angle);
                const outerZ = (radius + width / 2) * Math.sin(angle);

                outerRailPath.push(new BABYLON.Vector3(outerX, height, outerZ));
                outerRailPathTop.push(new BABYLON.Vector3(outerX, height + railHeight, outerZ));
            }

            const innerRail = BABYLON.MeshBuilder.CreateRibbon("innerRail", {
                pathArray: [innerRailPath, innerRailPathTop],
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                closeArray: false
            }, scene);

            const outerRail = BABYLON.MeshBuilder.CreateRibbon("outerRail", {
                pathArray: [outerRailPath, outerRailPathTop],
                sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                closeArray: false
            }, scene);

            const postMaterial = new BABYLON.StandardMaterial("postMaterial", scene);
            postMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            postMaterial.emissiveColor = BABYLON.Color3.Teal();

            for (let i = 0; i < segments; i += 2) {
                const angle = (i / segments) * Math.PI * 2;
                const innerX = (radius - width / 2) * Math.cos(angle);
                const innerZ = (radius - width / 2) * Math.sin(angle);

                const innerPost = BABYLON.MeshBuilder.CreateBox("innerPost", {
                    height: railHeight,
                    width: railThickness,
                    depth: railThickness
                }, scene);

                innerPost.position.set(innerX, height * 0.3 + railHeight / 2, innerZ);
                innerPost.material = postMaterial;

                const outerX = (radius + width / 2) * Math.cos(angle);
                const outerZ = (radius + width / 2) * Math.sin(angle);

                const outerPost = BABYLON.MeshBuilder.CreateBox("outerPost", {
                    height: railHeight,
                    width: railThickness,
                    depth: railThickness
                }, scene);

                outerPost.position.set(outerX, height + railHeight / 2, outerZ);
                outerPost.material = postMaterial;
            }

            innerRail.material = railMaterial;
            outerRail.material = railMaterial;
        }

        function addTrackStripes(scene, radius, width, height, segments) {
            const stripeMaterial = new BABYLON.StandardMaterial("stripeMaterial", scene);
            stripeMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

            for (let i = 0; i < segments; i += 2) {
                const angle = (i / segments) * Math.PI * 2;
                const nextAngle = ((i + 1) / segments) * Math.PI * 2;

                const stripeWidth = width * 0.8;
                const stripePath = [];

                stripePath.push(new BABYLON.Vector3((radius - stripeWidth / 2) * Math.cos(angle), height * 0.35, (radius - stripeWidth / 2) * Math.sin(angle)));
                stripePath.push(new BABYLON.Vector3((radius + stripeWidth / 2) * Math.cos(angle), height * 0.35, (radius + stripeWidth / 2) * Math.sin(angle)));
                stripePath.push(new BABYLON.Vector3((radius + stripeWidth / 2) * Math.cos(nextAngle), height * 0.35, (radius + stripeWidth / 2) * Math.sin(nextAngle)));
                stripePath.push(new BABYLON.Vector3((radius - stripeWidth / 2) * Math.cos(nextAngle), height * 0.35, (radius - stripeWidth / 2) * Math.sin(nextAngle)));

                const stripe = BABYLON.MeshBuilder.CreateRibbon("stripe", {
                    pathArray: [stripePath],
                    sideOrientation: BABYLON.Mesh.DOUBLESIDE
                }, scene);

                stripe.material = stripeMaterial;
            }
        }

        function CreateCar(vueApp) {
            const carFrame = BABYLON.MeshBuilder.CreateBox("Frame", { height: 1, width: 12, depth: 24, faceColors: debugColours });
            carFrame.position = new BABYLON.Vector3(0, 1, 0);
            carFrame.visibility = 0.5;
            const carFrameBody = AddDynamicPhysics(carFrame, 2000, 0, 0, new BABYLON.Vector3(0, -2.5, 1));
            FilterMeshCollisions(carFrame);

            const flWheel = CreateWheel(new BABYLON.Vector3(5, 0, 8));
            const flAxle = CreateAxle(new BABYLON.Vector3(5, 0, 8));
            const frWheel = CreateWheel(new BABYLON.Vector3(-5, 0, 8));
            const frAxle = CreateAxle(new BABYLON.Vector3(-5, 0, 8));
            const rlWheel = CreateWheel(new BABYLON.Vector3(5, 0, -10));
            const rlAxle = CreateAxle(new BABYLON.Vector3(5, 0, -10));
            const rrWheel = CreateWheel(new BABYLON.Vector3(-5, 0, -10));
            const rrAxle = CreateAxle(new BABYLON.Vector3(-5, 0, -10));

            for (const mesh of [flAxle, frAxle, rlAxle, rrAxle]) {
                carFrame.addChild(mesh);
                AddAxlePhysics(mesh, 190, 0, 0);
                FilterMeshCollisions(mesh);
            }

            for (const mesh of [flWheel, frWheel, rlWheel, rrWheel]) {
                AddWheelPhysics(mesh, 150, 0, 2.5);
                FilterMeshCollisions(mesh);
            }

            const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel);
            const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel);
            CreateWheelJoint(rlAxle, rlWheel);
            CreateWheelJoint(rrAxle, rrWheel);

            const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrameBody, true);
            const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrameBody, true);
            AttachAxleToFrame(rlAxle.physicsBody, carFrameBody);
            AttachAxleToFrame(rrAxle.physicsBody, carFrameBody);

            InitKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB, vueApp);

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

        function AttachAxleToFrame(axle, frame, hasSteering) {
            const aPos = axle.transformNode.position;

            const joint = new BABYLON.Physics6DoFConstraint(
                {
                    pivotA: new BABYLON.Vector3(0, 0, 0),
                    pivotB: new BABYLON.Vector3(aPos.x, aPos.y, aPos.z),
                },
                [
                    {
                        axis: BABYLON.PhysicsConstraintAxis.LINEAR_X,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y,
                        minLimit: -0.15,
                        maxLimit: 0.15,
                        stiffness: 100000,
                        damping: 1500
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                        minLimit: -0.25,
                        maxLimit: 0.25,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                        minLimit: hasSteering ? null : 0,
                        maxLimit: hasSteering ? null : 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                        minLimit: -0.05,
                        maxLimit: 0.05,
                    },
                ],
                scene
            );

            axle.addConstraint(frame, joint);

            if (hasSteering)
                AttachSteering(joint);

            return joint;
        }

        function CreateWheelJoint(axle, wheel) {
            const motorJoint = new BABYLON.Physics6DoFConstraint(
                {},
                [
                    {
                        axis: BABYLON.PhysicsConstraintAxis.LINEAR_DISTANCE,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                    {
                        axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                        minLimit: 0,
                        maxLimit: 0,
                    },
                ],
                scene
            );

            axle.addChild(wheel);
            axle.physicsBody.addConstraint(wheel.physicsBody, motorJoint);

            return motorJoint;
        }

        function CreatePoweredWheelJoint(axle, wheel) {
            const motorJoint = CreateWheelJoint(axle, wheel);

            motorJoint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_X, BABYLON.PhysicsConstraintMotorType.VELOCITY);
            motorJoint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
            motorJoint.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 0);

            return motorJoint;
        }

        function AttachSteering(joint) {
            joint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, BABYLON.PhysicsConstraintMotorType.POSITION);
            joint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 60000000);
            joint.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 0);

            return joint;
        }

        function InitKeyboardControls(motorWheelA, motorWheelB, steerWheelA, steerWheelB, vueApp) {
            let forwardPressed = false;
            let backPressed = false;
            let leftPressed = false;
            let rightPressed = false;
            let brakePressed = false;

            let currentSpeed = 0;
            let currentSteeringAngle = 0;
            let maxSpeed = 150;
            const maxSteeringAngle = Math.PI / 6;

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
                    case " ": brakePressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
                        break;
                    case "Enter":
                        if (e.type == BABYLON.KeyboardEventTypes.KEYDOWN && vueApp) {
                            vueApp.resetGame();
                        }
                        break;
                }
            });

            scene.onBeforeRenderObservable.add(() => {
                // Combine keyboard and touch inputs
                const isForward = forwardPressed || (vueApp && vueApp.touchControls.forward);
                const isBackward = backPressed || (vueApp && vueApp.touchControls.backward);
                const isLeft = leftPressed || (vueApp && vueApp.touchControls.left);
                const isRight = rightPressed || (vueApp && vueApp.touchControls.right);
                const isBrake = brakePressed || (vueApp && vueApp.touchControls.brake);

                if (isLeft && currentSteeringAngle < maxSteeringAngle) {
                    currentSteeringAngle += 0.02;
                } else if (isRight && currentSteeringAngle > -maxSteeringAngle) {
                    currentSteeringAngle -= 0.02;
                } else if (!isLeft && !isRight) {
                    currentSteeringAngle *= 0.98;
                }

                const [innerAngle, outerAngle] = CalculateWheelAngles(currentSteeringAngle);
                steerWheelA.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, outerAngle);
                steerWheelB.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, innerAngle);

                if (isBrake) {
                    currentSpeed = 0;
                } else if (isForward && currentSpeed < maxSpeed) {
                    currentSpeed += 8;
                } else if (isBackward && currentSpeed > -maxSpeed * 0.5) {
                    currentSpeed -= 8;
                } else if (!isForward && !isBackward) {
                    currentSpeed *= 0.99;
                }

                // Update Vue.js direction data
                if (vueApp) {
                    let directions = [];
                    
                    if (isForward) directions.push('↑ Forward');
                    if (isBackward) directions.push('↓ Backward');
                    if (isLeft) directions.push('← Left');
                    if (isRight) directions.push('→ Right');
                    if (isBrake) directions.push('🚗 Brake');
                    
                    if (directions.length > 0) {
                        vueApp.direction = directions.join(' + ');
                    } else {
                        vueApp.direction = '—';
                    }
                }

                if(isBrake) {
                    motorWheelA.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
                    motorWheelB.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 1000000);
                } else {
                    motorWheelA.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
                    motorWheelB.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
                }

                motorWheelA.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, currentSpeed);
                motorWheelB.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, currentSpeed);
            });
        }

        function InitTyreMaterial() {
            tyreMaterial = new BABYLON.StandardMaterial("Tyre", scene);
            const upTexture = new BABYLON.Texture("game/textures/up.png", scene);
            upTexture.wAng = -Math.PI / 2;
            upTexture.vScale = 0.4;
            tyreMaterial.diffuseTexture = upTexture;
        }

        function AddWheelPhysics(mesh, mass, bounce, friction) {
            const physicsShape = new BABYLON.PhysicsShapeCylinder(new BABYLON.Vector3(-0.8, 0, 0), new BABYLON.Vector3(0.8, 0, 0), 2, scene);
            const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
            physicsBody.setMassProperties({ mass: mass });
            physicsShape.material = { restitution: bounce, friction: friction };
            physicsBody.shape = physicsShape;

            return physicsBody;
        }

        function AddAxlePhysics(mesh, mass, bounce, friction) {
            const physicsShape = new BABYLON.PhysicsShapeCylinder(new BABYLON.Vector3(-0.8, 0, 0), new BABYLON.Vector3(0.8, 0, 0), 1.8, scene);
            const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
            physicsBody.setMassProperties({ mass: mass });
            physicsShape.material = { restitution: bounce, friction: friction };
            physicsBody.shape = physicsShape;

            return physicsBody;
        }

        function AddDynamicPhysics(mesh, mass, bounce, friction, centerOfMass) {
            const physicsShape = new BABYLON.PhysicsShapeMesh(mesh, scene);
            const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
            physicsBody.setMassProperties({ mass: mass, centerOfMass: centerOfMass });
            physicsShape.material = { restitution: bounce, friction: friction };
            physicsBody.shape = physicsShape;

            return physicsBody;
        }

        function FilterMeshCollisions(mesh) {
            mesh.physicsBody.shape.filterMembershipMask = FILTERS.CarParts;
            mesh.physicsBody.shape.filterCollideMask = FILTERS.Environment;
        }

        function CalculateWheelAngles(averageAngle) {
            const wheelbase = 16;
            const trackWidth = 11;

            const avgRadius = wheelbase / Math.tan(averageAngle);
            const innerRadius = avgRadius - trackWidth / 2;
            const outerRadius = avgRadius + trackWidth / 2;
            const innerAngle = Math.atan(wheelbase / innerRadius);
            const outerAngle = Math.atan(wheelbase / outerRadius);

            return [innerAngle, outerAngle];
        }
