/**
 * VirtualGamepad - Mock Gamepad API for testing without physical controller
 */

export class VirtualGamepad {
  constructor() {
    this.buttons = Array(16).fill().map(() => ({ pressed: false, value: 0 }));
    this.axes = Array(8).fill(0);
    this.id = 'Virtual Xbox Controller';
    this.index = 0;
    this.connected = true;
  }

  pressButton(index) {
    // Will implement in Phase 5
  }

  releaseButton(index) {
    // Will implement in Phase 5
  }

  setAxis(index, value) {
    // Will implement in Phase 5
  }

  inject() {
    // Will implement in Phase 5
  }
}
