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
import { CreateCar } from './modules/car-factory.js';
import { InitKeyboardControls } from './modules/input-handler.js';

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

    const carF = await CreateCar(vueApp, scene, tyreMaterial, InitKeyboardControls);

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

