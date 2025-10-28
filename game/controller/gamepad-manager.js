/**
 * GamepadManager - Handles Xbox controller input detection and polling
 */

import { ModeManager } from './mode-manager.js';

export class GamepadManager {
  static BUTTON_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'DUp', 'DDown', 'DLeft', 'DRight'];
  static AXIS_NAMES = ['LS-X', 'LS-Y', 'RS-X', 'RS-Y', '', '', 'LT', 'RT'];

  constructor(modeManager = null) {
    this.gamepad = null;
    this.connected = false;
    this.previousButtonState = [];
    this.previousAxisState = [];
    this.buttonHeldStartTime = [];
    this.currentFrameButtonFlags = {}; // Store justPressed/justReleased for current frame
    this.eventListeners = {};
    this.modeManager = modeManager || new ModeManager();
    this.cachedGamepadState = { connected: false, gamepadId: null, buttons: {}, axes: [] };
  }

  init() {
    console.log('🎮 GamepadManager initialized. Current mode:', this.modeManager.getCurrentMode().name);

    this.addEventListener('buttonpress', (data) => {
      this._handleModeSwitch(data.buttonIndex);
    });

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
      this.currentFrameButtonFlags = {};
      this.cachedGamepadState = { connected: false, gamepadId: null, buttons: {}, axes: [] };
    });

    // Only define controllerState if it doesn't exist yet (prevents error on scene reset)
    if (!window.hasOwnProperty('controllerState')) {
      Object.defineProperty(window, 'controllerState', {
        get: () => this.getGamepadState(),
        configurable: true  // Allow redefinition if needed
      });
    }
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
      this.cachedGamepadState = { connected: false, gamepadId: null, buttons: {}, axes: [] };
      return;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) {
      this.cachedGamepadState = { connected: false, gamepadId: null, buttons: {}, axes: [] };
      return;
    }

    const gamepad = gamepads[this.gamepad?.index];
    if (!gamepad) {
      this.cachedGamepadState = { connected: false, gamepadId: null, buttons: {}, axes: [] };
      return;
    }

    this._checkButtonChanges(gamepad);
    this._checkAxisChanges(gamepad);

    // Build and cache the complete gamepad state
    this.cachedGamepadState = this._buildGamepadState(gamepad);
  }

  _checkButtonChanges(gamepad) {
    const currentTime = performance.now();
    this.currentFrameButtonFlags = {}; // Reset for this frame

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

      // Store flags for this frame BEFORE updating previousButtonState
      this.currentFrameButtonFlags[i] = {
        justPressed: justPressed,
        justReleased: justReleased,
        heldDuration: heldDuration
      };

      this.previousButtonState[i] = {
        pressed: button.pressed,
        value: button.value
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

  _buildGamepadState(gamepad) {
    const buttons = {};

    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      const buttonName = GamepadManager.BUTTON_NAMES[i] || `Button-${i}`;

      // Use the flags computed by _checkButtonChanges
      const flags = this.currentFrameButtonFlags[i] || {
        justPressed: false,
        justReleased: false,
        heldDuration: 0
      };

      const buttonState = {
        pressed: button.pressed,
        value: button.value,
        justPressed: flags.justPressed,
        justReleased: flags.justReleased
      };

      if (flags.heldDuration > 0) {
        buttonState.heldDuration = flags.heldDuration;
      }

      buttons[buttonName] = buttonState;
    }

    const axes = [];
    for (let i = 0; i < gamepad.axes.length; i++) {
      axes[i] = parseFloat(gamepad.axes[i].toFixed(3));
    }

    return {
      connected: true,
      gamepadId: gamepad.id,
      buttons: buttons,
      axes: axes
    };
  }

  getGamepadState() {
    return this.cachedGamepadState;
  }

  _handleModeSwitch(buttonIndex) {
    if (buttonIndex === 4) {
      const mode = this.modeManager.previousMode();
      this._emit('modechange', { mode: mode, direction: 'previous' });
    } else if (buttonIndex === 5) {
      const mode = this.modeManager.nextMode();
      this._emit('modechange', { mode: mode, direction: 'next' });
    }
  }
}
