/**
 * AnalogProcessor - Helper functions for processing analog inputs
 */

export function applyDeadZone(value, deadZone = 0.15) {
  if (Math.abs(value) < deadZone) return 0;
  return value;
}

export function applySensitivity(value, sensitivity = 1.0) {
  return Math.max(-1, Math.min(1, value * sensitivity));
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
