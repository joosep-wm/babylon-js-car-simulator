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
    return { FL: 0, FR: 0, RL: 0, RR: 0 };
  }

  mapUtilityButtons(gamepadState, mode) {
    return [];
  }
}
