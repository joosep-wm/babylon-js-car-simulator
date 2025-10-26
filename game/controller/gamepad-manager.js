/**
 * GamepadManager - Handles Xbox controller input detection and polling
 */

export class GamepadManager {
  constructor() {
    this.gamepad = null;
    this.connected = false;
  }

  init() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('🎮 Controller connected:', e.gamepad.id);
      this.gamepad = e.gamepad;
      this.connected = true;
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('🎮 Controller disconnected');
      this.gamepad = null;
      this.connected = false;
    });
  }

  pollGamepads() {
    // Will implement polling in Task 1.3
  }
}
