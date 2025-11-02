// babylon-game.js - Main Babylon.js Game Orchestrator
// This file coordinates all game systems via imported modules

// ============================================================================
// IMPORTS - Core Constants and Configuration
// ============================================================================
import { debugColours, FILTERS, trackRad } from './modules/constants.js';

// ============================================================================
// IMPORTS - Physics System
// ============================================================================
import { setupPhysics, InitTyreMaterial } from './modules/physics-config.js';

// ============================================================================
// IMPORTS - Steering and Control Systems
// ============================================================================
import {
    getCurrentModeName,
    updateSteering
} from './modules/steering-system.js';
import { InitKeyboardControls } from './modules/input-handler.js';
import { getCurrentFrontSide } from './modules/front-back-switcher.js';

// ============================================================================
// IMPORTS - Visual Systems
// ============================================================================
import { setupCamera } from './modules/camera-controller.js';
import { addReflectionsToCar, addGlowLayer } from './modules/rendering-effects.js';
import { setupHemisphericLight } from './modules/lighting-system.js';

// ============================================================================
// IMPORTS - Environment and Objects
// ============================================================================
import {
    createSquareRaceTrack,
    createTrackWalls,
    createCollisionTowers,
    createKnockableBoxes,
    createBridge
} from './modules/environment.js';

// ============================================================================
// IMPORTS - Game Mechanics
// ============================================================================
import { setupCollisionDetection } from './modules/collision-detection.js';
import { CreateCar } from './modules/car-factory.js';

// ============================================================================
// IMPORTS - Controller System
// ============================================================================
import { GamepadManager } from './controller/gamepad-manager.js';
import { ModeManager } from './controller/mode-manager.js';
import { ControlMapper } from './controller/control-mapper.js';

// ============================================================================
// IMPORTS - Debug and Testing
// ============================================================================
import { toggleDebugOverlay, updateDebugOverlay } from './modules/debug-overlay.js';
import { initializeTestHelpers } from './modules/test-helpers.js';

// ============================================================================
// GLOBAL STATE
// ============================================================================
// These variables are kept global for backward compatibility with existing code
let scene;
let engine;
let havokInstance = null;
let tyreMaterial;
// Controller instances are initialized once and preserved across resets
let gamepadManager = null;
let modeManager = null;
let controlMapper = null;

// Export for external access from Vue app and other modules
export { scene, engine };

export function getGamepadManager() {
    return gamepadManager;
}

export function getModeManager() {
    return modeManager;
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

/**
 * Initialize Babylon.js game engine and scene
 * Entry point called from index.js after Vue app is ready
 * @param {Object} vueApp - Vue application instance with reactive state
 */
export function initializeGame(vueApp) {
    const canvas = document.getElementById('renderCanvas');
    engine = new BABYLON.Engine(canvas, true);

    // Create the complete game scene (async operation)
    createScene(vueApp).then(() => {
        // Start the render loop using module-level scene variable
        // This ensures render loop always uses the current scene (important for reset functionality)
        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });

        // Handle window resize events
        window.addEventListener('resize', () => {
            engine.resize();
        });

        // Setup canvas focus handling for keyboard input
        setTimeout(() => {
            canvas.focus();
            canvas.setAttribute('tabindex', '0');

            canvas.addEventListener('click', () => {
                canvas.focus();
            });
        }, 100);

        console.log('🎮 Babylon.js scene created and render loop started');
    });
}

// ============================================================================
// RESET FUNCTIONS
// ============================================================================

/**
 * Reset the entire game scene
 * Disposes current scene and creates a fresh one
 * @param {Object} vueApp - Vue application instance with reactive state
 */
export async function resetGame(vueApp) {
    console.log("🔄 Resetting game using Babylon.js...");
    console.log("🔍 [DEBUG] GamepadManager before reset - Instance ID:", gamepadManager?._instanceId, "Connected:", gamepadManager?.connected);

    // Stop render loop before disposing scene
    engine.stopRenderLoop();

    // Dispose the current scene completely
    if (scene) {
        scene.dispose();
    }

    // Create a fresh scene (updates module-level scene variable)
    await createScene(vueApp);

    // Verify camera is set
    if (!scene || !scene.activeCamera) {
        console.error("❌ No active camera after scene creation!");
        return;
    }

    // Restart render loop with module-level scene
    engine.runRenderLoop(() => {
        if (scene) {
            scene.render();
        }
    });

    // Re-focus canvas for immediate input
    setTimeout(() => {
        const canvas = document.getElementById('renderCanvas');
        canvas.focus();
    }, 100);

    console.log("✅ Game reset complete!");
    console.log("🔍 [DEBUG] GamepadManager after reset - Instance ID:", gamepadManager?._instanceId, "Connected:", gamepadManager?.connected);
}

/**
 * Reset knockable boxes to their original positions
 * Resets physics velocities and Vue state without recreating the scene
 * @param {Object} vueApp - Vue application instance with box tracking state
 */
export function resetBoxes(vueApp) {
    // Reset box count and status in Vue reactive state
    vueApp.knockedBoxes = 0;
    vueApp.boxesStatus.forEach(box => {
        box.knocked = false;
    });

    // Reset physics and position for each box
    if (scene) {
        scene.meshes.forEach(mesh => {
            if (mesh.name.includes("knockableBox")) {
                mesh.knocked = false;
                mesh.positionSettled = false;
                if (mesh.physicsBody) {
                    mesh.position.copyFrom(mesh.originalPosition);
                    mesh.rotation.copyFrom(mesh.originalRotation);
                    mesh.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
                    mesh.physicsBody.setAngularVelocity(BABYLON.Vector3.Zero());
                }
            }
        });
    }
}

// ============================================================================
// SCENE CREATION ORCHESTRATOR
// ============================================================================

/**
 * Create and setup the complete game scene
 * Orchestrates all subsystems: physics, car, environment, lighting, controls
 * @param {Object} vueApp - Vue application instance for state synchronization
 * @returns {Promise<BABYLON.Scene>} Fully initialized Babylon.js scene
 */
async function createScene(vueApp) {
    // Create base scene with studio lighting background
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.95, 0.95, 0.95);

    // Initialize Havok Physics engine
    await setupPhysics(scene);

    // Initialize controller system ONCE - preserve instances across resets
    // This ensures gamepad connection state and event listeners are maintained
    if (!gamepadManager) {
        console.log('🎮 [INIT] Creating controller system for first time');
        modeManager = new ModeManager();
        modeManager.loadModes();

        gamepadManager = new GamepadManager(modeManager);
        gamepadManager.init();

        controlMapper = new ControlMapper(modeManager);

        // Set up mode change listener to update Vue app when mode changes
        gamepadManager.addEventListener('modechange', (data) => {
            vueApp.currentModeName = data.mode.name;
            console.log('🎮 Mode indicator updated:', data.mode.name);
        });
    } else {
        console.log('🎮 [RESET] Reusing existing controller system - Instance ID:', gamepadManager._instanceId);
    }

    // Always sync current mode to Vue (in case mode changed during gameplay)
    const currentMode = modeManager.getCurrentMode();
    vueApp.currentModeName = currentMode.name;
    console.log('🎮 Current mode:', currentMode.name);

    // Setup ambient lighting
    setupHemisphericLight(scene);

    // Initialize tire material for wheels
    tyreMaterial = InitTyreMaterial(scene);

    // Create car with all components (body, wheels, physics)
    const carF = await CreateCar(vueApp, scene, tyreMaterial, InitKeyboardControls, gamepadManager, controlMapper, modeManager);

    // Setup follow camera attached to car
    const camera = setupCamera(scene, carF);

    // Create race track environment
    const track = createSquareRaceTrack(scene, 800, 800);
    track.position.y = -20;
    new BABYLON.PhysicsAggregate(track, BABYLON.PhysicsShapeType.MESH, { mass: 0, friction: 2 }, scene);

    createTrackWalls(scene, 800, 800);
    createCollisionTowers(scene);
    createKnockableBoxes(scene, vueApp);
    createBridge(scene);

    // Add visual effects
    // COMMENTED OUT: Causing WebGL feedback loop warning - see rendering-effects.js
    // addReflectionsToCar(scene);
    // addGlowLayer(scene);

    // Setup collision detection with delay for physics initialization
    setTimeout(() => {
        setupCollisionDetection(scene, carF, vueApp);
    }, 200);

    // Setup render loop to sync game state with Vue reactive data
    setupRenderLoop(carF, vueApp);

    return scene;
}

/**
 * Setup per-frame updates in the render loop
 * Synchronizes physics state with Vue reactive data for UI updates
 * @param {BABYLON.Mesh} carF - Car mesh reference
 * @param {Object} vueApp - Vue application instance
 */
function setupRenderLoop(carF, vueApp) {
    let alreadyTriggered = false;
    let raceTime = 0;
    let raceStarted = false;
    const velocity = new BABYLON.Vector3();
    let speed;
    let fCounter = 0;

    scene.onBeforeRenderObservable.add(() => {
        // Poll controller input every frame
        if (gamepadManager) {
            gamepadManager.pollGamepads();
        }

        // Calculate current speed
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

        // Update Vue reactive state for UI
        if (vueApp) {
            vueApp.speed = speed;
            vueApp.position.x = carF.position.x;
            vueApp.position.y = carF.position.y;
            vueApp.position.z = carF.position.z;

            // Calculate rotation from quaternion or euler angles
            let rotationY = 0;
            if (carF.rotationQuaternion) {
                rotationY = carF.rotationQuaternion.toEulerAngles().y;
            } else {
                rotationY = carF.rotation.y;
            }
            vueApp.rotation = (rotationY * 180 / Math.PI) % 360;

            vueApp.maxSpeed = Math.max(vueApp.maxSpeed, vueApp.speed);

            vueApp.currentFrontSide = getCurrentFrontSide();

            // Update race time
            if (vueApp.isRacing && raceStarted && !alreadyTriggered && fCounter < 1) {
                vueApp.raceTime = ((Date.now() - raceTime) / 1000);
            }
        }
    });
}

