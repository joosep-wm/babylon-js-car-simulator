/**
 * Task 3.3 Test Script - Speed Mapping Stick Mode
 * Run this with: node test-task-3.3.js
 */

import { ControlMapper } from './game/controller/control-mapper.js';
import { Mode } from './game/controller/mode-manager.js';
import { defaultModes } from './game/controller/default-modes.js';

console.log('🧪 Task 3.3: Testing Stick Mode Speed Mapping\n');

const mode = new Mode(defaultModes[1]);

const mockModeManager = {
  getCurrentMode: () => mode
};
const controlMapper = new ControlMapper(mockModeManager);

console.log('📋 Mode:', mode.name);
console.log('📋 Speed Config:', JSON.stringify(mode.speedControl, null, 2));
console.log('---\n');

const createMockGamepadState = (rsYValue) => ({
  buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
  axes: [0, 0, 0, rsYValue, 0, 0, 0, 0]
});

let allPassed = true;

function test(name, rsYValue, expectedSpeed, tolerance = 0.01) {
  const mockState = createMockGamepadState(rsYValue);
  const result = controlMapper.mapSpeedControl(mockState, mode);
  const passed = Math.abs(result - expectedSpeed) < tolerance;

  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  console.log(`   RS-Y=${rsYValue.toFixed(2)} → speed=${result.toFixed(3)} (expected: ${expectedSpeed.toFixed(3)})`);

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
test('Test 8: Just above dead zone (+0.2, inverted to -0.2)', 0.2, -0.2);
test('Test 9: Just above dead zone (-0.2, inverted to +0.2)', -0.2, 0.2);
test('Test 10: At dead zone boundary (+0.15, inverted to -0.15)', 0.15, -0.15);
test('Test 11: At dead zone boundary (-0.15, inverted to +0.15)', -0.15, 0.15);
test('Test 12: Just above dead zone (+0.16, inverted to -0.16)', 0.16, -0.16);
test('Test 13: Just above dead zone (-0.16, inverted to +0.16)', -0.16, 0.16);

console.log('---');
if (allPassed) {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Task 3.3 implementation is correct.\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED\n');
  process.exit(1);
}
