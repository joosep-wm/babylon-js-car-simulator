/**
 * ControlMapper - Translates gamepad inputs to game actions based on current mode
 */

import { applyDeadZone, applySensitivity } from './analog-processor.js';

export class ControlMapper {
  constructor(modeManager) {
    this.modeManager = modeManager;
  }

  processFrame(gamepadState) {
    const mode = this.modeManager.getCurrentMode();

    return {
      speed: this.mapSpeedControl(gamepadState, mode),
      steering: this.mapSteeringControl(gamepadState, mode),
      actions: this.mapUtilityButtons(gamepadState, mode)
    };
  }

  mapSpeedControl(gamepadState, mode) {
    const config = mode.speedControl;

    if (config.type === 'triggers') {
      // Handle triggers as buttons (some browsers/systems) or axes (others)
      // RT = button 7 or axis 7, LT = button 6 or axis 6
      let rawForward = -1;
      let rawBackward = -1;

      // Try buttons first (button.value gives 0-1)
      if (gamepadState.buttons['RT']) {
        rawForward = gamepadState.buttons['RT'].value * 2 - 1; // Convert 0-1 to -1 to 1
      } else if (gamepadState.axes[7] !== undefined) {
        rawForward = gamepadState.axes[7];
      }

      if (gamepadState.buttons['LT']) {
        rawBackward = gamepadState.buttons['LT'].value * 2 - 1; // Convert 0-1 to -1 to 1
      } else if (gamepadState.axes[6] !== undefined) {
        rawBackward = gamepadState.axes[6];
      }

      const forward = (rawForward + 1) / 2;
      const backward = (rawBackward + 1) / 2;

      let speed = 0;
      if (forward > config.deadZone) {
        speed = forward * config.maxSpeed * config.sensitivity;
      } else if (backward > config.deadZone) {
        speed = -backward * config.maxSpeed * config.sensitivity;
      }

      return speed;
    }

    if (config.type === 'stick') {
      const axisIndex = config.input === 'LS-Y' ? 1 : 3;
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);
      return -value * config.maxSpeed;
    }

    return 0;
  }

  mapSteeringControl(gamepadState, mode) {
    const config = mode.steeringControl;

    if (config.type === 'singleInput' && config.wheels === 'front') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const angle = -value * config.maxAngle;  // Inverted for natural steering

      return {
        FL: angle,
        FR: angle,
        RL: 0,
        RR: 0
      };
    }

    if (config.type === 'singleInput' && config.wheels === 'back') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const angle = -value * config.maxAngle;  // Inverted for natural steering

      return {
        FL: 0,
        FR: 0,
        RL: angle,
        RR: angle
      };
    }

    if (config.type === 'singleInput' && config.wheels === 'all') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const angle = -value * config.maxAngle;  // Inverted for natural steering

      return {
        FL: angle,
        FR: angle,
        RL: angle,
        RR: angle
      };
    }

    if (config.type === 'singleInput' && config.wheels === 'opposite') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const angle = value * config.maxAngle;

      return {
        FL: angle,
        FR: angle,
        RL: -angle,
        RR: -angle
      };
    }

    if (config.type === 'opposing') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const frontAngle = -value * (config.frontWheelsMaxAngle || config.maxAngle || 45);  // Inverted
      const rearAngle = -value * (config.rearWheelsMaxAngle || config.maxAngle || 45);    // Inverted

      return {
        FL: frontAngle,
        FR: frontAngle,
        RL: -rearAngle,  // Still opposite to front
        RR: -rearAngle   // Still opposite to front
      };
    }

    if (config.type === 'multiInput') {
      const axisMap = {
        'LS-X': 0,
        'LS-Y': 1,
        'RS-X': 2,
        'RS-Y': 3
      };

      const frontAxisIndex = axisMap[config.frontInput];
      const rearAxisIndex = axisMap[config.rearInput];

      if (frontAxisIndex === undefined || rearAxisIndex === undefined) {
        console.error('🎮 Invalid multiInput config:', config);
        return { FL: 0, FR: 0, RL: 0, RR: 0 };
      }

      let frontValue = gamepadState.axes[frontAxisIndex] || 0;
      let rearValue = gamepadState.axes[rearAxisIndex] || 0;

      frontValue = applyDeadZone(frontValue, config.deadZone);
      frontValue = applySensitivity(frontValue, config.sensitivity);

      rearValue = applyDeadZone(rearValue, config.deadZone);
      rearValue = applySensitivity(rearValue, config.sensitivity);

      const frontAngle = frontValue * config.frontMaxAngle;
      const rearAngle = rearValue * config.rearMaxAngle;

      return {
        FL: frontAngle,
        FR: frontAngle,
        RL: rearAngle,
        RR: rearAngle
      };
    }

    return { FL: 0, FR: 0, RL: 0, RR: 0 };
  }

  mapUtilityButtons(gamepadState, mode) {
    const actions = [];

    const BUTTON_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'DUp', 'DDown', 'DLeft', 'DRight'];

    for (const [key, config] of Object.entries(mode.utilityButtons)) {
      const actualButtonIndex = config.buttonIndex !== undefined ? config.buttonIndex : parseInt(key);
      const buttonName = BUTTON_NAMES[actualButtonIndex];
      const button = gamepadState.buttons[buttonName];

      if (!button) continue;

      if (config.type === 'press' && button.justPressed) {
        actions.push({ action: config.action, type: 'instant' });
      } else if (config.type === 'hold' && button.heldDuration > config.holdDuration) {
        actions.push({ action: config.action, type: 'hold', duration: button.heldDuration });
      }
    }

    return actions;
  }
}
