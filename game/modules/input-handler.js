// input-handler.js - Keyboard and touch controls

import { updateSteering, cycleSteerMode, getCurrentModeName } from './steering-system.js';
import { toggleDebugOverlay, updateDebugOverlay } from './debug-overlay.js';
import { initializeTestHelpers } from './test-helpers.js';
import { CalculateWheelAngles } from './physics-config.js';

export function InitKeyboardControls(motorWheelA, motorWheelB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints, scene, gamepadManager, controlMapper) {
    let forwardPressed = false;
    let backPressed = false;
    let leftPressed = false;
    let rightPressed = false;
    let brakePressed = false;
    let jumpPressed = false;

    let currentSteeringAngle = 0;
    let maxSpeed = 10;
    const maxSteeringAngle = Math.PI / 4;
    const jumpForce = 3000;

    let steerAngle = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let wheelSpeed = { FL: 0, FR: 0, RL: 0, RR: 0 };
    let manualControl = { active: false };
    let controllerJumpPrev = false;
    let keyboardJumpPrev = false;

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

        if (!manualControl.active) {
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
                    wheelSpeed.FL = controllerSpeed;
                    wheelSpeed.FR = controllerSpeed;
                    wheelSpeed.RL = controllerSpeed;
                    wheelSpeed.RR = controllerSpeed;
                }
            } else {
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
        }

        if (controllerResetWheels) {
            steerAngle.FL = 0;
            steerAngle.FR = 0;
            steerAngle.RL = 0;
            steerAngle.RR = 0;
        }

        if (vueApp) {
            let directions = [];

            if (controllerConnected) {
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

        steeringJoints.FL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.FL);
        steeringJoints.FR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.FR);
        steeringJoints.RL.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.RL);
        steeringJoints.RR.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, steerAngle.RR);

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

        updateDebugOverlay(steerAngle, wheelSpeed, getCurrentModeName());
    });
}
