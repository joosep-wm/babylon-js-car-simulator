/**
 * Front/Back Switcher Module
 * Manages which side of the car (A or B) is currently the "front"
 * Affects wheel speed and steering multipliers
 */

const SIDES = {
    A: 'A',
    B: 'B'
};

let currentFrontSide = SIDES.A;

/**
 * Toggles between A and B sides
 */
export function toggleFrontBack() {
    const previousSide = currentFrontSide;
    currentFrontSide = currentFrontSide === SIDES.A ? SIDES.B : SIDES.A;
    console.log(`🔄 Front/back toggled: ${previousSide} → ${currentFrontSide}`);
}

/**
 * Sets specific side as front (idempotent)
 */
export function setFrontSide(side) {
    if (side !== SIDES.A && side !== SIDES.B) {
        console.error(`🔄 Invalid side: ${side}. Must be 'A' or 'B'`);
        return;
    }

    if (currentFrontSide !== side) {
        const previousSide = currentFrontSide;
        currentFrontSide = side;
        console.log(`🔄 Front side set: ${previousSide} → ${currentFrontSide}`);
    }
}

/**
 * Returns current front side ('A' or 'B')
 */
export function getCurrentFrontSide() {
    return currentFrontSide;
}

/**
 * Returns speed multiplier for wheel motors
 */
export function getSpeedMultiplier() {
    return currentFrontSide === SIDES.A ? 1 : -1;
}

/**
 * Returns steering multiplier for wheel rotation
 */
export function getSteeringMultiplier() {
    return currentFrontSide === SIDES.A ? 1 : -1;
}
