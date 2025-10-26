/**
 * GamepadManager - Handles Xbox controller input detection and polling
 */

export class GamepadManager {
  static BUTTON_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'DUp', 'DDown', 'DLeft', 'DRight'];
  static AXIS_NAMES = ['LS-X', 'LS-Y', 'RS-X', 'RS-Y', '', '', 'LT', 'RT'];

  constructor() {
    this.gamepad = null;
    this.connected = false;
    this.previousButtonState = [];
    this.previousAxisState = [];
    this.buttonHeldStartTime = [];
    this.eventListeners = {};
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

    Object.defineProperty(window, 'controllerState', {
      get: () => this.getGamepadState()
    });
  }

  addEventListener(type, callback) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(callback);
  }

  removeEventListener(type, callback) {
    if (!this.eventListeners[type]) {
      return;
    }
    const index = this.eventListeners[type].indexOf(callback);
    if (index !== -1) {
      this.eventListeners[type].splice(index, 1);
    }
  }

  _emit(type, data) {
    if (!this.eventListeners[type]) {
      return;
    }
    this.eventListeners[type].forEach(callback => {
      callback(data);
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
          const buttonName = GamepadManager.BUTTON_NAMES[i] || `Button-${i}`;
          this._emit('buttonpress', { buttonIndex: i, buttonName: buttonName });
        } else if (this.buttonHeldStartTime[i]) {
          heldDuration = currentTime - this.buttonHeldStartTime[i];
        }
      } else if (justReleased) {
        const totalHeldDuration = this.buttonHeldStartTime[i]
          ? currentTime - this.buttonHeldStartTime[i]
          : 0;
        console.log(`🎮 Button ${i} justReleased (held for: ${totalHeldDuration.toFixed(0)}ms)`);
        this.buttonHeldStartTime[i] = null;
        const buttonName = GamepadManager.BUTTON_NAMES[i] || `Button-${i}`;
        this._emit('buttonrelease', { buttonIndex: i, buttonName: buttonName });
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
    const deadZone = 0.05;

    for (let i = 0; i < gamepad.axes.length; i++) {
      const currentValue = gamepad.axes[i];
      const previousValue = this.previousAxisState[i] || 0;

      const changed = Math.abs(currentValue - previousValue) > deadZone;

      if (changed) {
        const axisName = GamepadManager.AXIS_NAMES[i] || `Axis-${i}`;
        console.log(`🎮 ${axisName}: ${currentValue.toFixed(3)}`);
        this._emit('axischange', { axisIndex: i, axisName: axisName, value: currentValue });
      }

      this.previousAxisState[i] = currentValue;
    }
  }

  getGamepadState() {
    if (!this.connected || !this.gamepad) {
      return {
        connected: false,
        gamepadId: null,
        buttons: {},
        axes: {}
      };
    }

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepad.index];

    if (!gamepad) {
      return {
        connected: false,
        gamepadId: null,
        buttons: {},
        axes: {}
      };
    }

    const buttons = {};
    const currentTime = performance.now();

    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const buttonName = GamepadManager.BUTTON_NAMES[i] || `Button-${i}`;
      const buttonState = {
        pressed: button.pressed,
        value: button.value
      };

      if (button.pressed && this.buttonHeldStartTime[i]) {
        buttonState.heldDuration = Math.round(currentTime - this.buttonHeldStartTime[i]);
      }

      buttons[buttonName] = buttonState;
    }

    const axes = {};

    for (let i = 0; i < gamepad.axes.length; i++) {
      const axisName = GamepadManager.AXIS_NAMES[i] || `Axis-${i}`;
      if (axisName) {
        axes[axisName] = parseFloat(gamepad.axes[i].toFixed(3));
      }
    }

    return {
      connected: true,
      gamepadId: gamepad.id,
      buttons: buttons,
      axes: axes
    };
  }
}
