/**
 * GamepadManager - Handles Xbox controller input detection and polling
 */

export class GamepadManager {
  constructor() {
    this.gamepad = null;
    this.connected = false;
    this.previousButtonState = [];
    this.previousAxisState = [];
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
      this.previousButtonState = [];
      this.previousAxisState = [];
    });
  }

  pollGamepads() {
    if (!this.connected) {
      return;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) {
      return;
    }

    const gamepad = gamepads[this.gamepad?.index];
    if (!gamepad) {
      return;
    }

    this._checkButtonChanges(gamepad);
    this._checkAxisChanges(gamepad);
  }

  _checkButtonChanges(gamepad) {
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const wasPressed = this.previousButtonState[i]?.pressed || false;
      const isPressed = button.pressed;

      if (isPressed !== wasPressed) {
        if (isPressed) {
          console.log(`🎮 Button ${i} pressed (value: ${button.value})`);
        } else {
          console.log(`🎮 Button ${i} released`);
        }
      }

      this.previousButtonState[i] = {
        pressed: button.pressed,
        value: button.value
      };
    }
  }

  _checkAxisChanges(gamepad) {
    for (let i = 0; i < gamepad.axes.length; i++) {
      const currentValue = gamepad.axes[i];
      const previousValue = this.previousAxisState[i] || 0;

      const changed = Math.abs(currentValue - previousValue) > 0.01;

      if (changed) {
        console.log(`🎮 Axis ${i} changed: ${currentValue.toFixed(3)}`);
      }

      this.previousAxisState[i] = currentValue;
    }
  }
}
