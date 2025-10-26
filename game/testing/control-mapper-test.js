/**
 * Test helpers for ControlMapper
 * Usage: Run these tests in the browser console after the game loads
 */

import { ControlMapper } from '../controller/control-mapper.js';
import { ModeManager } from '../controller/mode-manager.js';

export function createTestHelpers() {
  const modeManager = new ModeManager();
  modeManager.loadModes();

  const controlMapper = new ControlMapper(modeManager);

  return {
    testTriggerMode() {
      console.log('🧪 Testing Task 3.2: Trigger Mode Speed Mapping');
      console.log('---');

      modeManager.currentIndex = 0;
      const mode = modeManager.getCurrentMode();
      console.log('📋 Mode:', mode.name);
      console.log('📋 Speed Config:', mode.speedControl);
      console.log('---');

      const mockGamepadState = {
        buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
        axes: Array(8).fill(0)
      };

      console.log('Test 1: Both triggers at 0 (rest position)');
      mockGamepadState.axes[6] = 0;
      mockGamepadState.axes[7] = 0;
      const result1 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0, LT=0 → speed=${result1} (expected: 0)`);
      console.assert(result1 === 0, '❌ Test 1 failed');

      console.log('---');
      console.log('Test 2: RT halfway (0.5)');
      mockGamepadState.axes[7] = 0.5;
      mockGamepadState.axes[6] = 0;
      const result2 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0.5, LT=0 → speed=${result2} (expected: ~0.5)`);
      console.assert(Math.abs(result2 - 0.5) < 0.01, '❌ Test 2 failed');

      console.log('---');
      console.log('Test 3: RT fully pressed (1.0)');
      mockGamepadState.axes[7] = 1.0;
      mockGamepadState.axes[6] = 0;
      const result3 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=1.0, LT=0 → speed=${result3} (expected: 1.0)`);
      console.assert(result3 === 1.0, '❌ Test 3 failed');

      console.log('---');
      console.log('Test 4: LT fully pressed (1.0)');
      mockGamepadState.axes[7] = 0;
      mockGamepadState.axes[6] = 1.0;
      const result4 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0, LT=1.0 → speed=${result4} (expected: -1.0)`);
      console.assert(result4 === -1.0, '❌ Test 4 failed');

      console.log('---');
      console.log('Test 5: LT halfway (0.5)');
      mockGamepadState.axes[7] = 0;
      mockGamepadState.axes[6] = 0.5;
      const result5 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0, LT=0.5 → speed=${result5} (expected: ~-0.5)`);
      console.assert(Math.abs(result5 - (-0.5)) < 0.01, '❌ Test 5 failed');

      console.log('---');
      console.log('Test 6: Dead zone test (0.1, below threshold)');
      mockGamepadState.axes[7] = 0.1;
      mockGamepadState.axes[6] = 0;
      const result6 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0.1, LT=0 → speed=${result6} (expected: 0, below deadZone=${mode.speedControl.deadZone})`);
      console.assert(result6 === 0, '❌ Test 6 failed');

      console.log('---');
      console.log('Test 7: Just above dead zone (0.2)');
      mockGamepadState.axes[7] = 0.2;
      mockGamepadState.axes[6] = 0;
      const result7 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0.2, LT=0 → speed=${result7} (expected: 0.2, above deadZone=${mode.speedControl.deadZone})`);
      console.assert(result7 === 0.2, '❌ Test 7 failed');

      console.log('---');
      console.log('Test 8: Both triggers pressed (forward should win)');
      mockGamepadState.axes[7] = 0.8;
      mockGamepadState.axes[6] = 0.3;
      const result8 = controlMapper.mapSpeedControl(mockGamepadState, mode);
      console.log(`  RT=0.8, LT=0.3 → speed=${result8} (expected: 0.8, forward priority)`);
      console.assert(result8 === 0.8, '❌ Test 8 failed');

      console.log('---');
      console.log('✅ All trigger mode tests complete!');
    },

    testWithRealController() {
      console.log('🧪 Testing with real Xbox controller');
      console.log('📋 Instructions:');
      console.log('  1. Make sure your Xbox controller is connected');
      console.log('  2. Pull RT halfway and check the console');
      console.log('  3. Pull LT fully and check the console');
      console.log('  4. Release both triggers');
      console.log('---');

      modeManager.currentIndex = 0;
      const mode = modeManager.getCurrentMode();

      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

      if (!gamepad) {
        console.error('❌ No gamepad detected! Connect an Xbox controller and try again.');
        return;
      }

      console.log('✅ Gamepad detected:', gamepad.id);

      const mockState = {
        buttons: gamepad.buttons,
        axes: gamepad.axes
      };

      const speed = controlMapper.mapSpeedControl(mockState, mode);
      console.log(`📊 Current trigger values:`);
      console.log(`  RT (axis 7): ${gamepad.axes[7]?.toFixed(3) || 0}`);
      console.log(`  LT (axis 6): ${gamepad.axes[6]?.toFixed(3) || 0}`);
      console.log(`  Calculated speed: ${speed.toFixed(3)}`);
      console.log('---');
      console.log('💡 Run this function repeatedly to see live trigger values');
    },

    getControlMapper() {
      return controlMapper;
    },

    getModeManager() {
      return modeManager;
    }
  };
}
