/**
 * ModeManager - Manages control modes and mode switching
 */

export class Mode {
  constructor(config = {}) {
    this.name = config.name || 'Unnamed Mode';
    this.description = config.description || '';
    this.speedControl = config.speedControl || {};
    this.steeringControl = config.steeringControl || {};
    this.utilityButtons = config.utilityButtons || {};
    this.reservedButtons = config.reservedButtons || {};
    this.createdAt = config.createdAt || Date.now();
    this.modifiedAt = config.modifiedAt || Date.now();
  }

  toJSON() {
    return { ...this };
  }
}

export class ModeManager {
  constructor() {
    this.modes = [];
    this.currentIndex = 0;
  }

  getCurrentMode() {
    return this.modes[this.currentIndex];
  }
}
