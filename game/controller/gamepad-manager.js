/**
 * GamepadManager - Handles Xbox controller input detection and polling
 */

export class GamepadManager {
  constructor() {
    this.gamepad = null;
    this.connected = false;
    this.previousButtonState = [];
    this.previousAxisState = [];
    this.buttonHeldStartTime = [];
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
      this.buttonHeldStartTime = [];
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
    const currentTime = performance.now();

    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const wasPressed = this.previousButtonState[i]?.pressed || false;
      const isPressed = button.pressed;

      const justPressed = isPressed && !wasPressed;
      const justReleased = !isPressed && wasPressed;

      let heldDuration = 0;
      if (isPressed) {
        if (justPressed) {
          this.buttonHeldStartTime[i] = currentTime;
          console.log(`🎮 Button ${i} justPressed (value: ${button.value})`);
        } else if (this.buttonHeldStartTime[i]) {
          heldDuration = currentTime - this.buttonHeldStartTime[i];
        }
      } else if (justReleased) {
        const totalHeldDuration = this.buttonHeldStartTime[i]
          ? currentTime - this.buttonHeldStartTime[i]
          : 0;
        console.log(`🎮 Button ${i} justReleased (held for: ${totalHeldDuration.toFixed(0)}ms)`);
        this.buttonHeldStartTime[i] = null;
      }

      this.previousButtonState[i] = {
        pressed: button.pressed,
        value: button.value,
        justPressed: justPressed,
        justReleased: justReleased,
        heldDuration: heldDuration
      };
    }
  }

  _checkAxisChanges(gamepad) {
    const axisNames = ['LS-X', 'LS-Y', 'RS-X', 'RS-Y', '', '', 'LT', 'RT'];
    const deadZone = 0.05;

    for (let i = 0; i < gamepad.axes.length; i++) {
      const currentValue = gamepad.axes[i];
      const previousValue = this.previousAxisState[i] || 0;

      const changed = Math.abs(currentValue - previousValue) > deadZone;

      if (changed) {
        const axisName = axisNames[i] || `Axis-${i}`;
        console.log(`🎮 ${axisName}: ${currentValue.toFixed(3)}`);
      }

      this.previousAxisState[i] = currentValue;
    }
  }
}
