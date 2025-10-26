/**
 * Task 3.2 Test Script - Speed Mapping Trigger Mode
 * Run this with: node test-task-3.2.js
 */

import { ControlMapper } from './game/controller/control-mapper.js';
import { Mode } from './game/controller/mode-manager.js';
import { defaultModes } from './game/controller/default-modes.js';

console.log('🧪 Task 3.2: Testing Trigger Mode Speed Mapping\n');

const mode = new Mode(defaultModes[0]);

const mockModeManager = {
  getCurrentMode: () => mode
};
const controlMapper = new ControlMapper(mockModeManager);

console.log('📋 Mode:', mode.name);
console.log('📋 Speed Config:', JSON.stringify(mode.speedControl, null, 2));
console.log('---\n');


const createMockGamepadState = (rtValue, ltValue) => ({
  buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
  axes: [0, 0, 0, 0, 0, 0, ltValue, rtValue]
});

let allPassed = true;

function test(name, rtValue, ltValue, expectedSpeed, tolerance = 0.01) {
  const mockState = createMockGamepadState(rtValue, ltValue);
  const result = controlMapper.mapSpeedControl(mockState, mode);
  const passed = Math.abs(result - expectedSpeed) < tolerance;

  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  console.log(`   RT=${rtValue}, LT=${ltValue} → speed=${result.toFixed(3)} (expected: ${expectedSpeed})`);

  if (!passed) {
    allPassed = false;
    console.log(`   ERROR: Expected ${expectedSpeed}, got ${result}`);
  }
  console.log('');

  return passed;
}

console.log('Running tests...\n');

test('Test 1: Both triggers at rest', 0, 0, 0);
test('Test 2: RT halfway', 0.5, 0, 0.5);
test('Test 3: RT fully pressed', 1.0, 0, 1.0);
test('Test 4: LT fully pressed', 0, 1.0, -1.0);
test('Test 5: LT halfway', 0, 0.5, -0.5);
test('Test 6: Below dead zone (0.1)', 0.1, 0, 0);
test('Test 7: Just above dead zone (0.2)', 0.2, 0, 0.2);
test('Test 8: Both triggers pressed (forward priority)', 0.8, 0.3, 0.8);
test('Test 9: Small LT input below dead zone', 0, 0.14, 0);
test('Test 10: LT at dead zone boundary', 0, 0.15, 0);
test('Test 11: LT just above dead zone', 0, 0.16, -0.16);

console.log('---');
if (allPassed) {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('Task 3.2 implementation is correct.\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED\n');
  process.exit(1);
}
