/**
 * ControlMapper - Translates gamepad inputs to game actions based on current mode
 */

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
    return 0;
  }

  mapSteeringControl(gamepadState, mode) {
    return { FL: 0, FR: 0, RL: 0, RR: 0 };
  }

  mapUtilityButtons(gamepadState, mode) {
    return [];
  }
}
