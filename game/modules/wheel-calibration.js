/**
 * CalibrationStateMachine - Manages wheel calibration sequence
 *
 * States: 'idle' | 'turningOut' | 'turningBack'
 * Sequence: idle → turningOut → turningBack → idle
 * Duration: Configurable (default 10 seconds: 5s out, 5s back)
 */

const easeInOut = (t) => {
  return t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
};

export class CalibrationStateMachine {
  constructor(totalDuration = 10000) {
    this.totalDuration = totalDuration;
    this.phaseDuration = totalDuration / 2;
    this.state = 'idle';
    this.startTime = 0;
    this.phaseStartTime = 0;
  }

  start() {
    if (this.state === 'idle') {
      console.log('🔧 Calibration started');
      this.state = 'turningOut';
      this.startTime = performance.now();
      this.phaseStartTime = this.startTime;
    } else {
      console.log('🔧 Calibration restarted');
      this.state = 'turningOut';
      this.startTime = performance.now();
      this.phaseStartTime = this.startTime;
    }
  }

  stop() {
    if (this.state !== 'idle') {
      console.log('🔧 Calibration stopped early at state:', this.state);
      this.state = 'idle';
      this.startTime = 0;
      this.phaseStartTime = 0;
    }
  }

  update(currentTime) {
    if (this.state === 'idle') {
      return {
        active: false,
        state: 'idle',
        progress: 0,
        angle: 0
      };
    }

    const elapsedInPhase = currentTime - this.phaseStartTime;
    const phaseProgress = Math.min(elapsedInPhase / this.phaseDuration, 1.0);

    if (this.state === 'turningOut') {
      if (phaseProgress >= 1.0) {
        console.log('🔧 Calibration phase: turningOut → turningBack');
        this.state = 'turningBack';
        this.phaseStartTime = currentTime;
        return this.update(currentTime);
      }

      const easedProgress = easeInOut(phaseProgress);
      return {
        active: true,
        state: 'turningOut',
        progress: phaseProgress,
        normalizedAngle: easedProgress
      };
    }

    if (this.state === 'turningBack') {
      if (phaseProgress >= 1.0) {
        console.log('🔧 Calibration complete');
        this.state = 'idle';
        this.startTime = 0;
        this.phaseStartTime = 0;
        return {
          active: false,
          state: 'idle',
          progress: 1.0,
          normalizedAngle: 0
        };
      }

      const easedProgress = easeInOut(phaseProgress);
      return {
        active: true,
        state: 'turningBack',
        progress: phaseProgress,
        normalizedAngle: 1.0 - easedProgress
      };
    }

    return {
      active: false,
      state: 'idle',
      progress: 0,
      normalizedAngle: 0
    };
  }

  isActive() {
    return this.state !== 'idle';
  }

  getState() {
    return this.state;
  }
}
