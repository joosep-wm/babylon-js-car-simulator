/**
 * Task 3.3 Test Script - Speed Mapping Stick Mode (Left Stick)
 * Test with a custom mode using LS-Y instead of RS-Y
 * Run this with: node test-task-3.3-ls.js
 */

import { ControlMapper } from './game/controller/control-mapper.js';
import { Mode } from './game/controller/mode-manager.js';

console.log('🧪 Task 3.3: Testing Stick Mode Speed Mapping (Left Stick)\n');

const customModeConfig = {
  name: 'Test Mode (LS-Y)',
  description: 'Custom mode for testing LS-Y speed control',
  speedControl: {
    type: 'stick',
    input: 'LS-Y',
    deadZone: 0.15,
    maxSpeed: 1.0,
    sensitivity: 1.0
  },
  steeringControl: {
    type: 'singleInput',
    input: 'LS-X',
    wheels: 'front',
    maxAngle: 45,
    sensitivity: 1.0,
    deadZone: 0.15
  },
  utilityButtons: {}
};

const mode = new Mode(customModeConfig);

const mockModeManager = {
  getCurrentMode: () => mode
};
const controlMapper = new ControlMapper(mockModeManager);

console.log('📋 Mode:', mode.name);
console.log('📋 Speed Config:', JSON.stringify(mode.speedControl, null, 2));
console.log('---\n');

const createMockGamepadState = (lsYValue) => ({
  buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
  axes: [0, lsYValue, 0, 0, 0, 0, 0, 0]
});

let allPassed = true;

function test(name, lsYValue, expectedSpeed, tolerance = 0.01) {
  const mockState = createMockGamepadState(lsYValue);
  const result = controlMapper.mapSpeedControl(mockState, mode);
  const passed = Math.abs(result - expectedSpeed) < tolerance;

  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  console.log(`   LS-Y=${lsYValue.toFixed(2)} → speed=${result.toFixed(3)} (expected: ${expectedSpeed.toFixed(3)})`);

  if (!passed) {
    allPassed = false;
    console.log(`   ERROR: Expected ${expectedSpeed}, got ${result}`);
  }
  console.log('');

  return passed;
}

console.log('Running tests...\n');

test('Test 1: Stick at rest (0)', 0, 0);
test('Test 2: Stick up halfway (-0.5, inverted to +0.5)', -0.5, 0.5);
test('Test 3: Stick fully up (-1.0, inverted to +1.0)', -1.0, 1.0);
test('Test 4: Stick fully down (+1.0, inverted to -1.0)', 1.0, -1.0);
test('Test 5: Stick down halfway (+0.5, inverted to -0.5)', 0.5, -0.5);
test('Test 6: Below dead zone (+0.1)', 0.1, 0);
test('Test 7: Below dead zone (-0.1)', -0.1, 0);

console.log('---');
if (allPassed) {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Task 3.3 LS-Y mapping is correct.\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED\n');
  process.exit(1);
}
