/**
 * Default controller modes - predefined configurations
 */

const maxSpeed = 20;

export const defaultModes = [
  {
    name: 'Traditional Driving',
    description: 'Standard car controls with front-wheel steering',
    speedControl: {
      type: 'triggers',
      forwardInput: 'RT',  // axis 7
      backwardInput: 'LT', // axis 6
      deadZone: 0.15,
      maxSpeed: maxSpeed,
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
      3: { action: 'resetWheels', type: 'press' },
      14: { action: 'spinTurnCounterClockwise', type: 'hold' },
      15: { action: 'spinTurnClockwise', type: 'hold' }
    }
  },
  {
    name: 'Crab Walk',
    description: 'All wheels steer together for sideways movement',
    speedControl: {
      type: 'triggers',
      forwardInput: 'RT',  // axis 7
      backwardInput: 'LT', // axis 6
      deadZone: 0.15,
      maxSpeed: maxSpeed,
      sensitivity: 1.0
    },
    steeringControl: {
      type: 'singleInput',
      input: 'LS-X',  // axis 0 - Left Stick X (same as Traditional)
      wheels: 'all',  // All 4 wheels turn together
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
  },
  {
    name: 'Opposing Turn',
    description: 'Front and rear wheels turn in opposite directions',
    speedControl: {
      type: 'triggers',
      forwardInput: 'RT',  // axis 7
      backwardInput: 'LT', // axis 6
      deadZone: 0.15,
      maxSpeed: maxSpeed,
      sensitivity: 1.0
    },
    steeringControl: {
      type: 'opposing',
      input: 'LS-X',  // axis 0
      frontWheelsMaxAngle: 45,
      rearWheelsMaxAngle: 45,
      sensitivity: 1.0,
      deadZone: 0.15
    },
    utilityButtons: {
      0: { action: 'jump', type: 'press' },
      1: { action: 'brake', type: 'hold', holdDuration: 100 },
      2: { action: 'resetPosition', type: 'press' },
      3: { action: 'resetWheels', type: 'press' }
    }
  },
  {
    name: '4-Wheel Independent',
    description: 'Front and rear wheels controlled independently',
    speedControl: {
      type: 'triggers',
      forwardInput: 'RT',  // axis 7
      backwardInput: 'LT', // axis 6
      deadZone: 0.15,
      maxSpeed: maxSpeed,
      sensitivity: 1.0
    },
    steeringControl: {
      type: 'multiInput',
      frontInput: 'RS-Y',  // axis 3
      rearInput: 'LS-Y',   // axis 1
      frontMaxAngle: 45,
      rearMaxAngle: 45,
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
