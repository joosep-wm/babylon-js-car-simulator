/**
 * ControlMapper - Translates gamepad inputs to game actions based on current mode
 */

export class ControlMapper {
  constructor(modeManager) {
    this.modeManager = modeManager;
  }

  processFrame(gamepadState) {
    // Will implement in Phase 3
    return {
      speed: 0,
      steering: { FL: 0, FR: 0, RL: 0, RR: 0 },
      actions: []
    };
  }
}
