// test-helpers.js - Console testing API for manual wheel control

import { engine } from '../babylon-game.js';

export function initializeTestHelpers(steerAngle, wheelSpeed, carFrame, manualControl, scene, modeManager, gamepadManager) {
    window.testHelpers = {
        getWheelStates: () => {
            return {
                angles: { ...steerAngle },
                speeds: { ...wheelSpeed },
                manualControlActive: manualControl.active
            };
        },

        setWheelAngle: (wheel, angleDegrees) => {
            const angleRadians = angleDegrees * Math.PI / 180;
            if (steerAngle.hasOwnProperty(wheel)) {
                steerAngle[wheel] = angleRadians;
                manualControl.active = true;
                console.log(`🔧 Set ${wheel} angle to ${angleDegrees}° (${angleRadians.toFixed(3)} rad)`);
                console.log(`   ⚠️  Manual control active - keyboard steering disabled`);
            } else {
                console.error(`❌ Invalid wheel: ${wheel}. Use FL, FR, RL, or RR`);
            }
        },

        setWheelSpeed: (wheel, speed) => {
            if (wheelSpeed.hasOwnProperty(wheel)) {
                wheelSpeed[wheel] = speed;
                manualControl.active = true;
                console.log(`🔧 Set ${wheel} speed to ${speed}`);
                console.log(`   ⚠️  Manual control active - keyboard throttle disabled`);
            } else {
                console.error(`❌ Invalid wheel: ${wheel}. Use FL, FR, RL, or RR`);
            }
        },

        setAllWheels: (angleDegrees, speed) => {
            const angleRadians = angleDegrees * Math.PI / 180;
            ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                steerAngle[wheel] = angleRadians;
                wheelSpeed[wheel] = speed;
            });
            manualControl.active = true;
            console.log(`🔧 Set all wheels to ${angleDegrees}° and speed ${speed}`);
            console.log(`   ⚠️  Manual control active - keyboard controls disabled`);
        },

        disableManualControl: () => {
            manualControl.active = false;
            console.log(`✅ Manual control disabled - keyboard controls re-enabled`);
        },

        resetCarPosition: () => {
            if (carFrame && carFrame.physicsBody) {
                carFrame.position = new BABYLON.Vector3(0, 5, 0);
                carFrame.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
                carFrame.physicsBody.setAngularVelocity(BABYLON.Vector3.Zero());
                console.log("🔧 Car position reset to origin");
            } else {
                console.error("❌ Car frame or physics body not available");
            }
        },

        testMotors: async () => {
            console.log("🔧 Starting motor test sequence...");
            const testSequence = [
                { wheel: 'FL', speed: 30 },
                { wheel: 'FR', speed: 30 },
                { wheel: 'RL', speed: 30 },
                { wheel: 'RR', speed: 30 }
            ];

            for (const test of testSequence) {
                console.log(`Testing ${test.wheel} at speed ${test.speed}...`);

                ['FL', 'FR', 'RL', 'RR'].forEach(w => wheelSpeed[w] = 0);

                wheelSpeed[test.wheel] = test.speed;

                await new Promise(resolve => setTimeout(resolve, 1000));

                wheelSpeed[test.wheel] = 0;
            }

            console.log("✅ Motor test sequence complete");
        },

        // ====================================================================
        // MODE MANAGEMENT
        // ====================================================================

        getMode: () => {
            if (!modeManager) {
                console.error("❌ ModeManager not available");
                return null;
            }
            const currentMode = modeManager.getCurrentMode();
            const modeName = modeManager.getCurrentModeName();
            return {
                index: currentMode,
                name: modeName,
                config: modeManager.getModeConfig(currentMode)
            };
        },

        setMode: (modeIdentifier) => {
            if (!modeManager) {
                console.error("❌ ModeManager not available");
                return;
            }

            let modeIndex;
            if (typeof modeIdentifier === 'string') {
                // Map mode names to indices
                const modeMap = {
                    'front': 0, 'front-wheel': 0,
                    'rear': 1, 'rear-wheel': 1,
                    'opposite': 2, '4w-opposite': 2,
                    'crab': 3, '4w-crab': 3
                };
                modeIndex = modeMap[modeIdentifier.toLowerCase()];
                if (modeIndex === undefined) {
                    console.error(`❌ Invalid mode name: ${modeIdentifier}`);
                    console.log(`   Valid names: front, rear, opposite, crab`);
                    return;
                }
            } else if (typeof modeIdentifier === 'number') {
                modeIndex = modeIdentifier;
            } else {
                console.error("❌ Mode must be a string (name) or number (index)");
                return;
            }

            if (modeIndex < 0 || modeIndex > 3) {
                console.error(`❌ Mode index must be 0-3, got ${modeIndex}`);
                return;
            }

            modeManager.setMode(modeIndex);
            console.log(`🔧 Mode set to: ${modeManager.getCurrentModeName()} (${modeIndex})`);
        },

        listModes: () => {
            if (!modeManager) {
                console.error("❌ ModeManager not available");
                return;
            }
            console.log("🔧 Available steering modes:");
            console.log("   0: Front-Wheel");
            console.log("   1: Rear-Wheel");
            console.log("   2: 4W-Opposite");
            console.log("   3: 4W-Crab");
            console.log(`   Current: ${modeManager.getCurrentModeName()} (${modeManager.getCurrentMode()})`);
        },

        // ====================================================================
        // PERFORMANCE METRICS
        // ====================================================================

        getFPS: () => {
            if (!engine) {
                console.error("❌ Engine not available");
                return null;
            }
            return engine.getFps().toFixed(1);
        },

        getPerformanceMetrics: () => {
            if (!engine) {
                console.error("❌ Engine not available");
                return null;
            }
            const fps = engine.getFps();
            const frameTime = 1000 / fps;

            const metrics = {
                fps: fps.toFixed(1),
                frameTime: frameTime.toFixed(2) + ' ms',
                drawCalls: engine.drawCalls,
                textureCollisions: engine.textureCollisions
            };

            if (scene && scene.getPhysicsEngine()) {
                const physicsEngine = scene.getPhysicsEngine();
                metrics.physicsTimeStep = physicsEngine.getTimeStep();
                metrics.physicsSubStep = physicsEngine.getSubTimeStep();
            }

            return metrics;
        },

        // ====================================================================
        // CAR STATE
        // ====================================================================

        getCarState: () => {
            if (!carFrame || !carFrame.physicsBody) {
                console.error("❌ Car frame or physics body not available");
                return null;
            }

            const pos = carFrame.position;
            const linVel = carFrame.physicsBody.getLinearVelocity();
            const angVel = carFrame.physicsBody.getAngularVelocity();
            const rotation = carFrame.rotation;

            return {
                position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) },
                linearVelocity: { x: linVel.x.toFixed(2), y: linVel.y.toFixed(2), z: linVel.z.toFixed(2) },
                angularVelocity: { x: angVel.x.toFixed(2), y: angVel.y.toFixed(2), z: angVel.z.toFixed(2) },
                rotation: { x: rotation.x.toFixed(2), y: rotation.y.toFixed(2), z: rotation.z.toFixed(2) },
                speed: Math.sqrt(linVel.x ** 2 + linVel.y ** 2 + linVel.z ** 2).toFixed(2)
            };
        },

        getCarVelocity: () => {
            if (!carFrame || !carFrame.physicsBody) {
                console.error("❌ Car frame or physics body not available");
                return null;
            }
            const linVel = carFrame.physicsBody.getLinearVelocity();
            const speed = Math.sqrt(linVel.x ** 2 + linVel.y ** 2 + linVel.z ** 2);
            return {
                linear: { x: linVel.x.toFixed(2), y: linVel.y.toFixed(2), z: linVel.z.toFixed(2) },
                speed: speed.toFixed(2)
            };
        },

        getCarRotation: () => {
            if (!carFrame) {
                console.error("❌ Car frame not available");
                return null;
            }
            const rot = carFrame.rotation;
            const yawDegrees = (rot.y * 180 / Math.PI).toFixed(1);
            return {
                radians: { x: rot.x.toFixed(3), y: rot.y.toFixed(3), z: rot.z.toFixed(3) },
                degrees: { x: (rot.x * 180 / Math.PI).toFixed(1), y: yawDegrees, z: (rot.z * 180 / Math.PI).toFixed(1) },
                yaw: yawDegrees + '°'
            };
        },

        // ====================================================================
        // SCENE STATE
        // ====================================================================

        getBoxStates: () => {
            if (!scene) {
                console.error("❌ Scene not available");
                return null;
            }

            const boxes = scene.meshes.filter(m => m.name.startsWith('knockableBox_'));
            return boxes.map(box => {
                const pos = box.position;
                let velocity = { x: 0, y: 0, z: 0 };
                if (box.physicsBody) {
                    const vel = box.physicsBody.getLinearVelocity();
                    velocity = { x: vel.x.toFixed(2), y: vel.y.toFixed(2), z: vel.z.toFixed(2) };
                }
                return {
                    name: box.name,
                    position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) },
                    velocity,
                    originalPosition: box.originalPosition ?
                        { x: box.originalPosition.x.toFixed(2), y: box.originalPosition.y.toFixed(2), z: box.originalPosition.z.toFixed(2) } :
                        null
                };
            });
        },

        getSceneInfo: () => {
            if (!scene) {
                console.error("❌ Scene not available");
                return null;
            }
            return {
                totalMeshes: scene.meshes.length,
                activeMeshes: scene.getActiveMeshes().length,
                totalVertices: scene.getTotalVertices(),
                materials: scene.materials.length,
                textures: scene.textures.length
            };
        },

        // ====================================================================
        // GAMEPAD STATE
        // ====================================================================

        getControllerState: () => {
            if (!gamepadManager) {
                console.error("❌ GamepadManager not available");
                return null;
            }

            const gamepad = gamepadManager.getGamepad();
            if (!gamepad) {
                return { connected: false };
            }

            return {
                connected: true,
                id: gamepad.id,
                buttons: gamepad.buttons.map((btn, i) => ({
                    index: i,
                    pressed: btn.pressed,
                    value: btn.value.toFixed(2)
                })).filter(btn => btn.pressed || btn.value > 0),
                axes: gamepad.axes.map((val, i) => ({
                    index: i,
                    value: val.toFixed(2)
                })).filter(axis => Math.abs(axis.value) > 0.1)
            };
        },

        listControllerMapping: () => {
            if (!modeManager) {
                console.error("❌ ModeManager not available");
                return;
            }

            const currentMode = modeManager.getCurrentMode();
            const config = modeManager.getModeConfig(currentMode);

            console.log(`🎮 Controller Mapping - ${modeManager.getCurrentModeName()}`);
            console.log("Utility Buttons:");
            Object.entries(config.utilityButtons || {}).forEach(([key, cfg]) => {
                const buttonIndex = cfg.buttonIndex !== undefined ? cfg.buttonIndex : parseInt(key, 10);
                const buttonNames = ['A', 'B', 'X', 'Y'];
                console.log(`   ${buttonNames[buttonIndex]}: ${cfg.action} (${cfg.type})`);
            });
        },

        // ====================================================================
        // HELP SYSTEM
        // ====================================================================

        help: (functionName) => {
            const helpText = {
                getWheelStates: "Get current wheel angles and speeds",
                setWheelAngle: "Set wheel angle in degrees. Usage: setWheelAngle('FL', 45)",
                setWheelSpeed: "Set wheel speed. Usage: setWheelSpeed('FR', 30)",
                setAllWheels: "Set all wheels to same angle and speed. Usage: setAllWheels(45, 30)",
                disableManualControl: "Re-enable keyboard controls after manual wheel control",
                resetCarPosition: "Reset car to origin (0, 5, 0) with zero velocity",
                testMotors: "Test each wheel motor sequentially (async, ~4 seconds)",

                getMode: "Get current steering mode (returns {index, name, config})",
                setMode: "Set steering mode. Usage: setMode('front') or setMode(0)",
                listModes: "List all available steering modes",

                getFPS: "Get current frames per second",
                getPerformanceMetrics: "Get detailed performance metrics",

                getCarState: "Get complete car state (position, velocity, rotation, speed)",
                getCarVelocity: "Get car linear velocity and speed",
                getCarRotation: "Get car rotation in radians and degrees",

                getBoxStates: "Get all knockable box positions and velocities",
                getSceneInfo: "Get scene statistics (meshes, vertices, etc.)",

                getControllerState: "Get gamepad state (buttons and axes)",
                listControllerMapping: "Show current controller button mapping",

                help: "Show help for all commands or specific command"
            };

            if (functionName) {
                if (helpText[functionName]) {
                    console.log(`📖 ${functionName}: ${helpText[functionName]}`);
                } else {
                    console.error(`❌ No help available for '${functionName}'`);
                }
            } else {
                console.log("📖 Available Test Helpers:");
                console.log("");
                console.log("WHEEL CONTROL:");
                console.log("  • getWheelStates()");
                console.log("  • setWheelAngle(wheel, angle)");
                console.log("  • setWheelSpeed(wheel, speed)");
                console.log("  • setAllWheels(angle, speed)");
                console.log("  • disableManualControl()");
                console.log("  • testMotors()");
                console.log("");
                console.log("MODE MANAGEMENT:");
                console.log("  • getMode()");
                console.log("  • setMode(name_or_index)");
                console.log("  • listModes()");
                console.log("");
                console.log("PERFORMANCE:");
                console.log("  • getFPS()");
                console.log("  • getPerformanceMetrics()");
                console.log("");
                console.log("CAR STATE:");
                console.log("  • getCarState()");
                console.log("  • getCarVelocity()");
                console.log("  • getCarRotation()");
                console.log("  • resetCarPosition()");
                console.log("");
                console.log("SCENE:");
                console.log("  • getBoxStates()");
                console.log("  • getSceneInfo()");
                console.log("");
                console.log("GAMEPAD:");
                console.log("  • getControllerState()");
                console.log("  • listControllerMapping()");
                console.log("");
                console.log("Use testHelpers.help('functionName') for details");
            }
        }
    };

    console.log("🔧 Test helpers initialized. Access via window.testHelpers");
    console.log("   Type testHelpers.help() to see all available commands");
}
