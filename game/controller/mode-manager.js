/**
 * ModeManager - Manages control modes and mode switching
 */

import { defaultModes } from './default-modes.js';

export class Mode {
  constructor(config = {}) {
    this.name = config.name || 'Unnamed Mode';
    this.description = config.description || '';
    this.speedControl = config.speedControl || {};
    this.steeringControl = config.steeringControl || {};
    this.utilityButtons = config.utilityButtons || {};
    this.reservedButtons = {
      4: 'previousMode',
      5: 'nextMode',
      8: 'toggleHUD',
      9: 'openMenu'
    };
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

  loadModes() {
    const saved = localStorage.getItem('controllerModes');
    if (saved) {
      this.modes = JSON.parse(saved).map(m => new Mode(m));
    } else {
      this.modes = defaultModes.map(m => new Mode(m));
    }
  }

  saveModes() {
    const json = this.modes.map(m => m.toJSON());
    localStorage.setItem('controllerModes', JSON.stringify(json));
  }

  getCurrentMode() {
    return this.modes[this.currentIndex];
  }

  nextMode() {
    this.currentIndex = (this.currentIndex + 1) % this.modes.length;
    console.log('🎮 Switched to:', this.getCurrentMode().name);
    return this.getCurrentMode();
  }

  previousMode() {
    this.currentIndex = (this.currentIndex - 1 + this.modes.length) % this.modes.length;
    console.log('🎮 Switched to:', this.getCurrentMode().name);
    return this.getCurrentMode();
  }
}
