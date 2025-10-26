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
      const forward = gamepadState.axes[7] || 0;
      const backward = gamepadState.axes[6] || 0;

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

      const angle = value * config.maxAngle;

      return {
        FL: angle,
        FR: angle,
        RL: 0,
        RR: 0
      };
    }

    if (config.type === 'singleInput' && config.wheels === 'all') {
      const axisIndex = config.input === 'RS-X' ? 2 : 0;  // RS-X → axis 2, LS-X → axis 0
      let value = gamepadState.axes[axisIndex] || 0;
      value = applyDeadZone(value, config.deadZone);
      value = applySensitivity(value, config.sensitivity);

      const angle = value * config.maxAngle;

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

      const frontAngle = value * (config.frontWheelsMaxAngle || config.maxAngle || 45);
      const rearAngle = value * (config.rearWheelsMaxAngle || config.maxAngle || 45);

      return {
        FL: frontAngle,
        FR: frontAngle,
        RL: -rearAngle,
        RR: -rearAngle
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
    return [];
  }
}
