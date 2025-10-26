/**
 * Default controller modes - predefined configurations
 */

export const defaultModes = [
  {
    name: 'Traditional Driving',
    description: 'Standard car controls with front-wheel steering',
    speedControl: {
      type: 'triggers',
      forwardInput: 'RT',  // axis 7
      backwardInput: 'LT', // axis 6
      deadZone: 0.15,
      maxSpeed: 1.0,
      sensitivity: 1.0
    },
    steeringControl: {
      type: 'singleInput',
      input: 'LS-X',  // axis 0
      wheels: 'front',
      maxAngle: 45,
      sensitivity: 1.0,
      deadZone: 0.15
    },
    utilityButtons: {
      0: { action: 'jump', type: 'press' },
      1: { action: 'brake', type: 'hold', holdDuration: 100 },
      2: { action: 'resetPosition', type: 'press' },
      3: { action: 'resetWheels', type: 'press' }
    }
  }
];
