// steering-system.js - 4-Wheel Independent Steering System

export const SteerMode = { FRONT: 0, REAR: 1, OPPOSITE: 2, CRAB: 3 };
export const modeNames = ['Front-Wheel', 'Rear-Wheel', '4W-Opposite', '4W-Crab'];

const steeringSpeed = 0.001;

let steerMode = SteerMode.FRONT;

export function getSteerMode() {
    return steerMode;
}

export function setSteerMode(mode) {
    steerMode = mode;
}

export function cycleSteerMode() {
    steerMode = (steerMode + 1) % 4;
    return steerMode;
}

export function getCurrentModeName() {
    return modeNames[steerMode];
}

export function updateSteering(isLeft, isRight, currentSteeringAngle, maxSteeringAngle, steerAngle, CalculateWheelAngles) {
    let updatedAngle = currentSteeringAngle;

    if (steerMode === SteerMode.FRONT) {
        if (isLeft && currentSteeringAngle < maxSteeringAngle) {
            updatedAngle += steeringSpeed;
        } else if (isRight && currentSteeringAngle > -maxSteeringAngle) {
            updatedAngle -= steeringSpeed;
        } else if (!isLeft && !isRight) {
            updatedAngle *= 0.85;
        }

        const [innerAngle, outerAngle] = CalculateWheelAngles(updatedAngle);

        steerAngle.FL = outerAngle;
        steerAngle.FR = innerAngle;
        steerAngle.RL = 0;
        steerAngle.RR = 0;
    } else if (steerMode === SteerMode.REAR) {
        steerAngle.FL = 0;
        steerAngle.FR = 0;

        if (isLeft && currentSteeringAngle < maxSteeringAngle) {
            updatedAngle += steeringSpeed;
        } else if (isRight && currentSteeringAngle > -maxSteeringAngle) {
            updatedAngle -= steeringSpeed;
        } else if (!isLeft && !isRight) {
            updatedAngle *= 0.85;
        }

        steerAngle.RL = -updatedAngle;
        steerAngle.RR = -updatedAngle;
    } else if (steerMode === SteerMode.OPPOSITE) {
        if (isLeft && currentSteeringAngle < maxSteeringAngle) {
            updatedAngle += steeringSpeed;
        } else if (isRight && currentSteeringAngle > -maxSteeringAngle) {
            updatedAngle -= steeringSpeed;
        } else if (!isLeft && !isRight) {
            updatedAngle *= 0.85;
        }

        steerAngle.FL = updatedAngle;
        steerAngle.FR = updatedAngle;
        steerAngle.RL = -updatedAngle;
        steerAngle.RR = -updatedAngle;
    } else if (steerMode === SteerMode.CRAB) {
        const crabMaxAngle = Math.PI / 2;

        if (isLeft && currentSteeringAngle < crabMaxAngle) {
            updatedAngle += steeringSpeed;
        } else if (isRight && currentSteeringAngle > -crabMaxAngle) {
            updatedAngle -= steeringSpeed;
        } else if (!isLeft && !isRight) {
            updatedAngle *= 0.85;
        }

        steerAngle.FL = updatedAngle;
        steerAngle.FR = updatedAngle;
        steerAngle.RL = updatedAngle;
        steerAngle.RR = updatedAngle;
    }

    return updatedAngle;
}
