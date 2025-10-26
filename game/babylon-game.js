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
import { addReflectionsToCar, addGlowLayer } from './modules/rendering-effects.js';
import { setupCollisionDetection } from './modules/collision-detection.js';
import {
    createSquareRaceTrack,
    createTrackWalls,
    createCollisionTowers,
    createKnockableBoxes,
    createBridge
} from './modules/environment.js';
import {
    setupHemisphericLight,
    createTaillights,
    createHeadlights
} from './modules/lighting-system.js';

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

    setupHemisphericLight(scene);

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

    addReflectionsToCar(scene);

    addGlowLayer(scene);

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

