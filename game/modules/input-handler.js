// input-handler.js - Keyboard and touch controls

import { updateSteering, getCurrentModeName } from './steering-system.js';
import { toggleDebugOverlay, updateDebugOverlay } from './debug-overlay.js';
import { initializeTestHelpers } from './test-helpers.js';
import { CalculateWheelAngles } from './physics-config.js';
import { CalibrationStateMachine } from './wheel-calibration.js';
import { getSpeedMultiplier, getSteeringMultiplier, toggleFrontBack, getCurrentFrontSide, setFrontSide } from './front-back-switcher.js';
import { rotateCameraByOffset } from './camera-controller.js';

export function InitKeyboardControls(motorWheelA, motorWheelB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints, scene, gamepadManager, controlMapper, modeManager) {
    let forwardPressed = false;
    let backPressed = false;
    let leftPressed = false;
    let rightPressed = false;
    let brakePressed = false;
    let jumpPressed = false;

    let currentSteeringAngle = 0;
    let maxSpeed = 20;
    const maxSteeringAngle = Math.PI / 4;
    const jumpForce = 3000;

    let steerAngle = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let wheelSpeed = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let manualControl = { active: false };
    let controllerJumpPrev = false;
    let keyboardJumpPrev = false;

    let spinTurnState = {
        active: false,
        direction: 'none',
        wheelAnimationProgress: { FL: 0, FR: 0, RL: 0, RR: 0 },
        targetAngles: { FL: 0, FR: 0, RL: 0, RR: 0 },
        animationComplete: false
    };
    const spinSpeed = 5;  // Motor force for rotation (balance between speed and control)
    const wheelAnimationSpeed = 0.05;  // Smooth interpolation (20 frames to full angle at 60fps)

    const calibrationMachine = new CalibrationStateMachine(10000);
    let calibrationPrevActive = false;

    function getSpecialModeStatus() {
        if (calibrationMachine.isActive()) {
            const state = calibrationMachine.getState();
            if (state === 'turningOut') {
                return 'Calibrating (Turning Out)';
            } else if (state === 'turningBack') {
                return 'Calibrating (Turning Back)';
            }
        } else if (spinTurnState.active) {
            if (spinTurnState.direction === 'clockwise') {
                return 'Spin Turn Clockwise';
            } else if (spinTurnState.direction === 'counterClockwise') {
                return 'Spin Turn Counter-Clockwise';
            }
        }
        return 'None';
    }

    initializeTestHelpers(steerAngle, wheelSpeed, carFrame, manualControl, scene, modeManager, gamepadManager);

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
                jumpPressed = e.type == BABYLON.KeyboardEventTypes.KEYDOWN ? true : false;
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
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        function isCarOnGround() {
            const rayStart = carFrame.getAbsolutePosition();
            const ray = new BABYLON.Ray(rayStart, new BABYLON.Vector3(0, -1, 0), 10);
            const hit = scene.pickWithRay(ray, (mesh) => {
                return mesh !== carFrame &&
                       !mesh.name.includes('wheel') &&
                       !mesh.name.includes('axle');
            });
            return hit && hit.hit;
        }

        let controllerSpeed = 0;
        let controllerSteering = { FL: 0, FR: 0, RL: 0, RR: 0 };
        let controllerActions = [];
        let controllerConnected = false;
        let controllerBrake = null;
        let controllerSpinTurn = { direction: 'none' };
        let controllerCalibration = { active: false };

        if (gamepadManager && controlMapper) {
            gamepadManager.pollGamepads();
            const gamepadState = gamepadManager.getGamepadState();
            if (gamepadState.connected) {
                controllerConnected = true;
                const mappedOutput = controlMapper.processFrame(gamepadState);
                controllerSpeed = mappedOutput.speed;
                controllerSteering = mappedOutput.steering;
                controllerActions = mappedOutput.actions;
                controllerBrake = controllerActions.find(a => a.action === 'brake');
                controllerSpinTurn = mappedOutput.spinTurn || { direction: 'none' };
                controllerCalibration = mappedOutput.calibration || { active: false };
            }
        }

        const isForward = forwardPressed || (vueApp && vueApp.touchControls.forward);
        const isBackward = backPressed || (vueApp && vueApp.touchControls.backward);
        const isLeft = leftPressed || (vueApp && vueApp.touchControls.left);
        const isRight = rightPressed || (vueApp && vueApp.touchControls.right);
        const isBrake = brakePressed || (vueApp && vueApp.touchControls.brake);
        const isJump = jumpPressed || (vueApp && vueApp.touchControls.jump);

        const controllerJump = controllerActions.find(a => a.action === 'jump');
        const controllerJumpJustPressed = !!controllerJump && !controllerJumpPrev;
        const keyboardJumpJustPressed = isJump && !keyboardJumpPrev;

        if (keyboardJumpJustPressed && carFrame.physicsBody && isCarOnGround()) {
            console.log("Jump (keyboard) activated!");
            carFrame.physicsBody.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), carFrame.getAbsolutePosition());
            const currentVel = carFrame.physicsBody.getLinearVelocity();
            carFrame.physicsBody.setLinearVelocity(new BABYLON.Vector3(currentVel.x, jumpForce / 100, currentVel.z));
        }

        if (controllerJumpJustPressed && carFrame.physicsBody && isCarOnGround()) {
            console.log("Jump (controller) activated!");
            carFrame.physicsBody.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), carFrame.getAbsolutePosition());
            const currentVel = carFrame.physicsBody.getLinearVelocity();
            carFrame.physicsBody.setLinearVelocity(new BABYLON.Vector3(currentVel.x, jumpForce / 100, currentVel.z));
        }

        keyboardJumpPrev = isJump;
        controllerJumpPrev = !!controllerJump;

        const controllerResetPosition = controllerActions.find(a => a.action === 'resetPosition');
        if (controllerResetPosition && vueApp) {
            console.log("Reset position (controller) activated!");
            vueApp.resetGame();
        }

        const controllerResetWheels = controllerActions.find(a => a.action === 'resetWheels');

        const controllerSwitchFrontBack = controllerActions.find(a => a.action === 'switchFrontBack');
        if (controllerSwitchFrontBack) {
            console.log("🔄 Switch front/back (controller) activated!");
            toggleFrontBack();
            rotateCameraByOffset(scene.activeCamera, 180);
        }

        const controllerSetFrontSideA = controllerActions.find(a => a.action === 'setFrontSideA');
        if (controllerSetFrontSideA) {
            const currentSide = getCurrentFrontSide();
            if (currentSide !== 'A') {
                console.log("🔄 Set front side A (controller) activated!");
                setFrontSide('A');
                rotateCameraByOffset(scene.activeCamera, 180);
            }
        }

        const controllerSetFrontSideB = controllerActions.find(a => a.action === 'setFrontSideB');
        if (controllerSetFrontSideB) {
            const currentSide = getCurrentFrontSide();
            if (currentSide !== 'B') {
                console.log("🔄 Set front side B (controller) activated!");
                setFrontSide('B');
                rotateCameraByOffset(scene.activeCamera, 180);
            }
        }

        const currentMode = modeManager?.getCurrentMode();
        // Mode config stores maxAngle in degrees, but we need radians for physics
        const currentMaxAngle = currentMode?.steeringControl?.maxAngle
            ? currentMode.steeringControl.maxAngle * (Math.PI / 180)
            : maxSteeringAngle;

        const hasNormalInput = controllerConnected ? (Math.abs(controllerSpeed) > 0.1 || Math.abs(controllerSteering.FL) > 0.1) : (isLeft || isRight || isForward || isBackward);

        if (controllerSpinTurn.direction !== 'none' && !hasNormalInput) {
            if (!spinTurnState.active || spinTurnState.direction !== controllerSpinTurn.direction) {
                console.log('🔄 Spin turn activated:', controllerSpinTurn.direction);
                spinTurnState.active = true;
                spinTurnState.direction = controllerSpinTurn.direction;
                spinTurnState.animationComplete = false;

                spinTurnState.targetAngles.FL = currentMaxAngle;
                spinTurnState.targetAngles.FR = -currentMaxAngle;
                spinTurnState.targetAngles.RL = -currentMaxAngle;
                spinTurnState.targetAngles.RR = currentMaxAngle;
            }

            ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                const currentAngle = steerAngle[wheel];
                const targetAngle = spinTurnState.targetAngles[wheel];
                const diff = targetAngle - currentAngle;

                if (Math.abs(diff) > 0.01) {
                    steerAngle[wheel] += diff * wheelAnimationSpeed;
                } else {
                    steerAngle[wheel] = targetAngle;
                    spinTurnState.wheelAnimationProgress[wheel] = 1;
                }
            });

            const allWheelsAtTarget = Object.values(spinTurnState.wheelAnimationProgress).every(p => p === 1);
            if (allWheelsAtTarget) {
                spinTurnState.animationComplete = true;
            }

            if (spinTurnState.animationComplete) {
                const speedMult = getSpeedMultiplier();
                if (controllerSpinTurn.direction === 'clockwise') {
                    wheelSpeed.FL = -spinSpeed * speedMult;
                    wheelSpeed.FR = spinSpeed * speedMult;
                    wheelSpeed.RL = -spinSpeed * speedMult;
                    wheelSpeed.RR = spinSpeed * speedMult;
                } else if (controllerSpinTurn.direction === 'counterClockwise') {
                    wheelSpeed.FL = spinSpeed * speedMult;
                    wheelSpeed.FR = -spinSpeed * speedMult;
                    wheelSpeed.RL = spinSpeed * speedMult;
                    wheelSpeed.RR = -spinSpeed * speedMult;
                }
            } else {
                wheelSpeed.FL = 0;
                wheelSpeed.FR = 0;
                wheelSpeed.RL = 0;
                wheelSpeed.RR = 0;
            }
        } else {
            if (spinTurnState.active) {
                console.log('🔄 Spin turn deactivated');
                spinTurnState.active = false;
                spinTurnState.direction = 'none';
                spinTurnState.animationComplete = false;
                spinTurnState.wheelAnimationProgress = { FL: 0, FR: 0, RL: 0, RR: 0 };

                // Stop motor force immediately
                wheelSpeed.FL = 0;
                wheelSpeed.FR = 0;
                wheelSpeed.RL = 0;
                wheelSpeed.RR = 0;

                // Note: Wheel angles are NOT locked at their spin turn positions.
                // Normal steering logic (line 206+) will resume immediately, allowing
                // the driver to regain control without manually resetting wheel angles.
                // This provides better UX than the original plan specification.
            }
        }

        if (controllerCalibration.active) {
            if (!calibrationPrevActive) {
                calibrationMachine.start();
            }
            calibrationPrevActive = true;

            const calibrationState = calibrationMachine.update(performance.now());

            if (calibrationState.active) {
                const angle = calibrationState.normalizedAngle * currentMaxAngle;

                steerAngle.FL = angle;
                steerAngle.FR = angle;
                steerAngle.RL = angle;
                steerAngle.RR = angle;

                // Boost steering motor force for faster calibration movement
                steeringJoints.FL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 1000000);
                steeringJoints.FR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 1000000);
                steeringJoints.RL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 1000000);
                steeringJoints.RR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 1000000);

                wheelSpeed.FL = 0;
                wheelSpeed.FR = 0;
                wheelSpeed.RL = 0;
                wheelSpeed.RR = 0;
            }
        } else {
            if (calibrationPrevActive) {
                calibrationMachine.stop();

                // Reset steering motor force to normal after calibration
                steeringJoints.FL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 280000);
                steeringJoints.FR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 280000);
                steeringJoints.RL.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 280000);
                steeringJoints.RR.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 280000);
            }
            calibrationPrevActive = false;
        }

        if (!manualControl.active && !spinTurnState.active && !calibrationMachine.isActive()) {
            if (controllerConnected && !controllerResetWheels) {
                steerAngle.FL = controllerSteering.FL * (Math.PI / 180);
                steerAngle.FR = controllerSteering.FR * (Math.PI / 180);
                steerAngle.RL = controllerSteering.RL * (Math.PI / 180);
                steerAngle.RR = controllerSteering.RR * (Math.PI / 180);

                if (controllerBrake) {
                    wheelSpeed.FL = 0;
                    wheelSpeed.FR = 0;
                    wheelSpeed.RL = 0;
                    wheelSpeed.RR = 0;
                } else {
                    const speedMult = getSpeedMultiplier();
                    wheelSpeed.FL = controllerSpeed * speedMult;
                    wheelSpeed.FR = controllerSpeed * speedMult;
                    wheelSpeed.RL = controllerSpeed * speedMult;
                    wheelSpeed.RR = controllerSpeed * speedMult;
                }
            } else {
                currentSteeringAngle = updateSteering(isLeft, isRight, currentSteeringAngle, maxSteeringAngle, steerAngle, CalculateWheelAngles);

                const speedMult = getSpeedMultiplier();

                if (isBrake) {
                    wheelSpeed.FL = 0;
                    wheelSpeed.FR = 0;
                    wheelSpeed.RL = 0;
                    wheelSpeed.RR = 0;
                } else if (isForward) {
                    ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                        const targetSpeed = maxSpeed * speedMult;
                        if (speedMult > 0 && wheelSpeed[wheel] < targetSpeed) {
                            wheelSpeed[wheel] += 1;
                        } else if (speedMult < 0 && wheelSpeed[wheel] > targetSpeed) {
                            wheelSpeed[wheel] -= 1;
                        }
                    });
                } else if (isBackward) {
                    ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                        const targetSpeed = -maxSpeed * 0.5 * speedMult;
                        if (speedMult > 0 && wheelSpeed[wheel] > targetSpeed) {
                            wheelSpeed[wheel] -= 1;
                        } else if (speedMult < 0 && wheelSpeed[wheel] < targetSpeed) {
                            wheelSpeed[wheel] += 1;
                        }
                    });
                } else if (!isForward && !isBackward) {
                    ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                        wheelSpeed[wheel] *= 0.92;
                    });
                }
            }
        }

        if (controllerResetWheels) {
            steerAngle.FL = 0;
            steerAngle.FR = 0;
            steerAngle.RL = 0;
            steerAngle.RR = 0;
        }

        if (vueApp) {
            let directions = [];

            if (calibrationMachine.isActive()) {
                const state = calibrationMachine.getState();
                if (state === 'turningOut') {
                    directions.push('Calibrating (Turning Out)');
                } else if (state === 'turningBack') {
                    directions.push('Calibrating (Turning Back)');
                }
            } else if (spinTurnState.active) {
                if (spinTurnState.direction === 'clockwise') {
                    directions.push('Spin Turn Clockwise');
                } else if (spinTurnState.direction === 'counterClockwise') {
                    directions.push('Spin Turn Counter-Clockwise');
                }
            } else if (controllerConnected) {
                if (controllerSpeed > 0) directions.push('Forward (Controller)');
                if (controllerSpeed < 0) directions.push('Backward (Controller)');
                if (Math.abs(controllerSteering.FL) > 0.1) {
                    directions.push(controllerSteering.FL > 0 ? 'Right (Controller)' : 'Left (Controller)');
                }
                if (controllerBrake) directions.push('Brake (Controller)');
                if (controllerJump) directions.push('Jump (Controller)');
                if (controllerResetWheels) directions.push('Reset Wheels (Controller)');
            } else {
                if (isForward) directions.push('Forward');
                if (isBackward) directions.push('Backward');
                if (isLeft) directions.push('Left');
                if (isRight) directions.push('Right');
                if (isBrake) directions.push('Brake');
                if (isJump) directions.push('Jump');
            }

            if (directions.length > 0) {
                vueApp.direction = directions.join(' + ');
            } else {
                vueApp.direction = '—';
            }
        }

        let finalSteerAngle = { FL: steerAngle.FL, FR: steerAngle.FR, RL: steerAngle.RL, RR: steerAngle.RR };

        if (getCurrentFrontSide() === 'B') {
            finalSteerAngle = {
                FL: steerAngle.RL,
                FR: steerAngle.RR,
                RL: steerAngle.FL,
                RR: steerAngle.FR
            };
        }

        steeringJoints.FL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, finalSteerAngle.FL);
        steeringJoints.FR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, finalSteerAngle.FR);
        steeringJoints.RL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, finalSteerAngle.RL);
        steeringJoints.RR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, finalSteerAngle.RR);

        if (isBrake || controllerBrake) {
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

        motorJoints.FL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.FL);
        motorJoints.FR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.FR);
        motorJoints.RL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.RL);
        motorJoints.RR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, wheelSpeed.RR);

        const modeName = modeManager?.getCurrentMode()?.name || getCurrentModeName();
        const specialModeStatus = getSpecialModeStatus();
        updateDebugOverlay(finalSteerAngle, wheelSpeed, modeName, specialModeStatus);
    });
}
