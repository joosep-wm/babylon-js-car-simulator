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

    testFrontWheelSteering() {
      console.log('🧪 Testing Task 3.4: Front Wheel Steering Mapping');
      console.log('---');

      modeManager.currentIndex = 0;
      const mode = modeManager.getCurrentMode();
      console.log('📋 Mode:', mode.name);
      console.log('📋 Steering Config:', mode.steeringControl);
      console.log('---');

      const mockGamepadState = {
        buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
        axes: Array(8).fill(0)
      };

      console.log('Test 1: Stick centered (0)');
      mockGamepadState.axes[0] = 0;
      const result1 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0 → FL=${result1.FL}, FR=${result1.FR}, RL=${result1.RL}, RR=${result1.RR}`);
      console.log(`  Expected: FL=0, FR=0, RL=0, RR=0`);
      console.assert(result1.FL === 0 && result1.FR === 0 && result1.RL === 0 && result1.RR === 0, '❌ Test 1 failed');

      console.log('---');
      console.log('Test 2: Stick pushed left (-0.5)');
      mockGamepadState.axes[0] = -0.5;
      const result2 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-0.5 → FL=${result2.FL.toFixed(2)}, FR=${result2.FR.toFixed(2)}, RL=${result2.RL}, RR=${result2.RR}`);
      console.log(`  Expected: FL≈-22.5, FR≈-22.5, RL=0, RR=0`);
      console.assert(Math.abs(result2.FL - (-22.5)) < 0.1 && result2.RL === 0 && result2.RR === 0, '❌ Test 2 failed');

      console.log('---');
      console.log('Test 3: Stick pushed right (0.5)');
      mockGamepadState.axes[0] = 0.5;
      const result3 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.5 → FL=${result3.FL.toFixed(2)}, FR=${result3.FR.toFixed(2)}, RL=${result3.RL}, RR=${result3.RR}`);
      console.log(`  Expected: FL≈22.5, FR≈22.5, RL=0, RR=0`);
      console.assert(Math.abs(result3.FL - 22.5) < 0.1 && result3.RL === 0 && result3.RR === 0, '❌ Test 3 failed');

      console.log('---');
      console.log('Test 4: Full left (-1.0)');
      mockGamepadState.axes[0] = -1.0;
      const result4 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-1.0 → FL=${result4.FL.toFixed(2)}, FR=${result4.FR.toFixed(2)}, RL=${result4.RL}, RR=${result4.RR}`);
      console.log(`  Expected: FL=-45, FR=-45, RL=0, RR=0`);
      console.assert(result4.FL === -45 && result4.FR === -45 && result4.RL === 0 && result4.RR === 0, '❌ Test 4 failed');

      console.log('---');
      console.log('Test 5: Full right (1.0)');
      mockGamepadState.axes[0] = 1.0;
      const result5 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=1.0 → FL=${result5.FL.toFixed(2)}, FR=${result5.FR.toFixed(2)}, RL=${result5.RL}, RR=${result5.RR}`);
      console.log(`  Expected: FL=45, FR=45, RL=0, RR=0`);
      console.assert(result5.FL === 45 && result5.FR === 45 && result5.RL === 0 && result5.RR === 0, '❌ Test 5 failed');

      console.log('---');
      console.log('Test 6: Dead zone test (0.1, below threshold)');
      mockGamepadState.axes[0] = 0.1;
      const result6 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.1 → FL=${result6.FL}, FR=${result6.FR}, RL=${result6.RL}, RR=${result6.RR}`);
      console.log(`  Expected: All=0 (below deadZone=${mode.steeringControl.deadZone})`);
      console.assert(result6.FL === 0 && result6.FR === 0 && result6.RL === 0 && result6.RR === 0, '❌ Test 6 failed');

      console.log('---');
      console.log('Test 7: Just above dead zone (0.2)');
      mockGamepadState.axes[0] = 0.2;
      const result7 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.2 → FL=${result7.FL.toFixed(2)}, FR=${result7.FR.toFixed(2)}, RL=${result7.RL}, RR=${result7.RR}`);
      console.log(`  Expected: FL=9, FR=9, RL=0, RR=0 (above deadZone)`);
      console.assert(result7.FL === 9 && result7.FR === 9 && result7.RL === 0 && result7.RR === 0, '❌ Test 7 failed');

      console.log('---');
      console.log('Test 8: FL and FR equal check');
      mockGamepadState.axes[0] = 0.75;
      const result8 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.75 → FL=${result8.FL.toFixed(2)}, FR=${result8.FR.toFixed(2)}`);
      console.log(`  Expected: FL=FR (both wheels steer together)`);
      console.assert(result8.FL === result8.FR, '❌ Test 8 failed');

      console.log('---');
      console.log('Test 9: Rear wheels always 0');
      mockGamepadState.axes[0] = -0.8;
      const result9 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-0.8 → RL=${result9.RL}, RR=${result9.RR}`);
      console.log(`  Expected: RL=0, RR=0 (rear wheels locked)`);
      console.assert(result9.RL === 0 && result9.RR === 0, '❌ Test 9 failed');

      console.log('---');
      console.log('✅ All front-wheel steering tests complete!');
    },

    testSteeringWithRealController() {
      console.log('🧪 Testing steering with real Xbox controller');
      console.log('📋 Instructions:');
      console.log('  1. Make sure your Xbox controller is connected');
      console.log('  2. Move Left Stick (LS) left and right');
      console.log('  3. Watch the steering angles update');
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

      const steering = controlMapper.mapSteeringControl(mockState, mode);
      console.log(`📊 Current steering values:`);
      console.log(`  LS-X (axis 0): ${gamepad.axes[0]?.toFixed(3) || 0}`);
      console.log(`  FL angle: ${steering.FL.toFixed(2)}°`);
      console.log(`  FR angle: ${steering.FR.toFixed(2)}°`);
      console.log(`  RL angle: ${steering.RL.toFixed(2)}°`);
      console.log(`  RR angle: ${steering.RR.toFixed(2)}°`);
      console.log('---');
      console.log('💡 Run this function repeatedly to see live steering values');
    },

    getControlMapper() {
      return controlMapper;
    },

    getModeManager() {
      return modeManager;
    },

    testAllWheelSteering() {
      console.log('🧪 Testing Task 3.5: All-Wheel Steering Mapping');
      console.log('---');

      modeManager.currentIndex = 1;
      const mode = modeManager.getCurrentMode();
      console.log('📋 Mode:', mode.name);
      console.log('📋 Steering Config:', mode.steeringControl);
      console.log('---');

      const mockGamepadState = {
        buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
        axes: Array(8).fill(0)
      };

      console.log('Test 1: RS-X centered (0)');
      mockGamepadState.axes[2] = 0;
      const result1 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=0 → FL=${result1.FL}, FR=${result1.FR}, RL=${result1.RL}, RR=${result1.RR}`);
      console.log(`  Expected: All wheels = 0`);
      console.assert(result1.FL === 0 && result1.FR === 0 && result1.RL === 0 && result1.RR === 0, '❌ Test 1 failed');

      console.log('---');
      console.log('Test 2: RS-X pushed left (-0.8)');
      mockGamepadState.axes[2] = -0.8;
      const result2 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=-0.8 → FL=${result2.FL.toFixed(2)}, FR=${result2.FR.toFixed(2)}, RL=${result2.RL.toFixed(2)}, RR=${result2.RR.toFixed(2)}`);
      console.log(`  Expected: All wheels ≈ -36 (all turn left together)`);
      console.assert(Math.abs(result2.FL - (-36)) < 0.1 && result2.FL === result2.FR && result2.FR === result2.RL && result2.RL === result2.RR, '❌ Test 2 failed');

      console.log('---');
      console.log('Test 3: RS-X pushed right (0.8)');
      mockGamepadState.axes[2] = 0.8;
      const result3 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=0.8 → FL=${result3.FL.toFixed(2)}, FR=${result3.FR.toFixed(2)}, RL=${result3.RL.toFixed(2)}, RR=${result3.RR.toFixed(2)}`);
      console.log(`  Expected: All wheels ≈ 36 (all turn right together)`);
      console.assert(Math.abs(result3.FL - 36) < 0.1 && result3.FL === result3.FR && result3.FR === result3.RL && result3.RL === result3.RR, '❌ Test 3 failed');

      console.log('---');
      console.log('Test 4: Full left (-1.0)');
      mockGamepadState.axes[2] = -1.0;
      const result4 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=-1.0 → FL=${result4.FL}, FR=${result4.FR}, RL=${result4.RL}, RR=${result4.RR}`);
      console.log(`  Expected: All wheels = -45 (max angle)`);
      console.assert(result4.FL === -45 && result4.FR === -45 && result4.RL === -45 && result4.RR === -45, '❌ Test 4 failed');

      console.log('---');
      console.log('Test 5: Full right (1.0)');
      mockGamepadState.axes[2] = 1.0;
      const result5 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=1.0 → FL=${result5.FL}, FR=${result5.FR}, RL=${result5.RL}, RR=${result5.RR}`);
      console.log(`  Expected: All wheels = 45 (max angle)`);
      console.assert(result5.FL === 45 && result5.FR === 45 && result5.RL === 45 && result5.RR === 45, '❌ Test 5 failed');

      console.log('---');
      console.log('Test 6: Dead zone test (0.1, below threshold)');
      mockGamepadState.axes[2] = 0.1;
      const result6 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=0.1 → FL=${result6.FL}, FR=${result6.FR}, RL=${result6.RL}, RR=${result6.RR}`);
      console.log(`  Expected: All=0 (below deadZone=${mode.steeringControl.deadZone})`);
      console.assert(result6.FL === 0 && result6.FR === 0 && result6.RL === 0 && result6.RR === 0, '❌ Test 6 failed');

      console.log('---');
      console.log('Test 7: Wrong axis test (LS-X should be ignored)');
      mockGamepadState.axes[0] = 0.8;
      mockGamepadState.axes[2] = 0;
      const result7 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.8, RS-X=0 → FL=${result7.FL}, FR=${result7.FR}, RL=${result7.RL}, RR=${result7.RR}`);
      console.log(`  Expected: All=0 (LS-X ignored in Crab Walk mode)`);
      console.assert(result7.FL === 0 && result7.FR === 0 && result7.RL === 0 && result7.RR === 0, '❌ Test 7 failed');

      console.log('---');
      console.log('Test 8: All wheels equal check');
      mockGamepadState.axes[0] = 0;
      mockGamepadState.axes[2] = 0.5;
      const result8 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=0.5 → FL=${result8.FL.toFixed(2)}, FR=${result8.FR.toFixed(2)}, RL=${result8.RL.toFixed(2)}, RR=${result8.RR.toFixed(2)}`);
      console.log(`  Expected: FL=FR=RL=RR (all wheels identical)`);
      console.assert(result8.FL === result8.FR && result8.FR === result8.RL && result8.RL === result8.RR, '❌ Test 8 failed');

      console.log('---');
      console.log('Test 9: Rear wheels NOT 0 (different from front-only mode)');
      mockGamepadState.axes[2] = 0.6;
      const result9 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  RS-X=0.6 → RL=${result9.RL.toFixed(2)}, RR=${result9.RR.toFixed(2)}`);
      console.log(`  Expected: RL≠0, RR≠0 (rear wheels actively steering)`);
      console.assert(result9.RL !== 0 && result9.RR !== 0, '❌ Test 9 failed');

      console.log('---');
      console.log('Test 10: Regression check - Traditional mode still works');
      modeManager.currentIndex = 0;
      const traditionalMode = modeManager.getCurrentMode();
      mockGamepadState.axes[0] = 0.8;
      mockGamepadState.axes[2] = 0;
      const result10 = controlMapper.mapSteeringControl(mockGamepadState, traditionalMode);
      console.log(`  Traditional Mode: LS-X=0.8 → FL=${result10.FL.toFixed(2)}, RL=${result10.RL}, RR=${result10.RR}`);
      console.log(`  Expected: FL≈36, RL=0, RR=0 (front wheels only)`);
      console.assert(Math.abs(result10.FL - 36) < 0.1 && result10.RL === 0 && result10.RR === 0, '❌ Test 10 failed');

      console.log('---');
      console.log('✅ All all-wheel steering tests complete!');
    },

    testAllWheelSteeringWithRealController() {
      console.log('🧪 Testing all-wheel steering with real Xbox controller');
      console.log('📋 Instructions:');
      console.log('  1. Make sure your Xbox controller is connected');
      console.log('  2. Switch to Crab Walk mode (RB button until you see it)');
      console.log('  3. Move Right Stick (RS) left and right on X axis');
      console.log('  4. Watch ALL 4 wheels turn together');
      console.log('---');

      modeManager.currentIndex = 1;
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

      const steering = controlMapper.mapSteeringControl(mockState, mode);
      console.log(`📊 Current Crab Walk steering values:`);
      console.log(`  RS-X (axis 2): ${gamepad.axes[2]?.toFixed(3) || 0}`);
      console.log(`  FL angle: ${steering.FL.toFixed(2)}°`);
      console.log(`  FR angle: ${steering.FR.toFixed(2)}°`);
      console.log(`  RL angle: ${steering.RL.toFixed(2)}°`);
      console.log(`  RR angle: ${steering.RR.toFixed(2)}°`);
      console.log(`  All equal? ${steering.FL === steering.FR && steering.FR === steering.RL && steering.RL === steering.RR ? '✅ YES' : '❌ NO'}`);
      console.log('---');
      console.log('💡 Run this function repeatedly to see live all-wheel steering values');
    },

    testOppositeSteering() {
      console.log('🧪 Testing Task 3.6: Opposite Steering Mapping');
      console.log('---');

      modeManager.currentIndex = 2;
      const mode = modeManager.getCurrentMode();
      console.log('📋 Mode:', mode.name);
      console.log('📋 Steering Config:', mode.steeringControl);
      console.log('---');

      const mockGamepadState = {
        buttons: Array(16).fill().map(() => ({ pressed: false, value: 0 })),
        axes: Array(8).fill(0)
      };

      console.log('Test 1: LS-X centered (0)');
      mockGamepadState.axes[0] = 0;
      const result1 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0 → FL=${result1.FL}, FR=${result1.FR}, RL=${result1.RL}, RR=${result1.RR}`);
      console.log(`  Expected: All wheels = 0`);
      console.assert(result1.FL === 0 && result1.FR === 0 && result1.RL === 0 && result1.RR === 0, '❌ Test 1 failed');

      console.log('---');
      console.log('Test 2: LS-X pushed left (-1.0) - Front and rear OPPOSITE');
      mockGamepadState.axes[0] = -1.0;
      const result2 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-1.0 → FL=${result2.FL}, FR=${result2.FR}, RL=${result2.RL}, RR=${result2.RR}`);
      console.log(`  Expected: FL=-45, FR=-45 (front left), RL=+45, RR=+45 (rear RIGHT opposite)`);
      console.assert(result2.FL === -45 && result2.FR === -45 && result2.RL === 45 && result2.RR === 45, '❌ Test 2 failed');

      console.log('---');
      console.log('Test 3: LS-X pushed right (+1.0) - Front and rear OPPOSITE');
      mockGamepadState.axes[0] = 1.0;
      const result3 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=1.0 → FL=${result3.FL}, FR=${result3.FR}, RL=${result3.RL}, RR=${result3.RR}`);
      console.log(`  Expected: FL=+45, FR=+45 (front right), RL=-45, RR=-45 (rear LEFT opposite)`);
      console.assert(result3.FL === 45 && result3.FR === 45 && result3.RL === -45 && result3.RR === -45, '❌ Test 3 failed');

      console.log('---');
      console.log('Test 4: Half left (-0.5) - Proportional opposite angles');
      mockGamepadState.axes[0] = -0.5;
      const result4 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-0.5 → FL=${result4.FL.toFixed(2)}, FR=${result4.FR.toFixed(2)}, RL=${result4.RL.toFixed(2)}, RR=${result4.RR.toFixed(2)}`);
      console.log(`  Expected: FL≈-18.53, FR≈-18.53, RL≈+18.53, RR≈+18.53 (after dead zone)`);
      console.assert(Math.abs(result4.FL - (-18.53)) < 0.1 && Math.abs(result4.RL - 18.53) < 0.1, '❌ Test 4 failed');

      console.log('---');
      console.log('Test 5: Half right (+0.5) - Proportional opposite angles');
      mockGamepadState.axes[0] = 0.5;
      const result5 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.5 → FL=${result5.FL.toFixed(2)}, FR=${result5.FR.toFixed(2)}, RL=${result5.RL.toFixed(2)}, RR=${result5.RR.toFixed(2)}`);
      console.log(`  Expected: FL≈+18.53, FR≈+18.53, RL≈-18.53, RR≈-18.53 (after dead zone)`);
      console.assert(Math.abs(result5.FL - 18.53) < 0.1 && Math.abs(result5.RL - (-18.53)) < 0.1, '❌ Test 5 failed');

      console.log('---');
      console.log('Test 6: Dead zone test (0.1, below threshold)');
      mockGamepadState.axes[0] = 0.1;
      const result6 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.1 → FL=${result6.FL}, FR=${result6.FR}, RL=${result6.RL}, RR=${result6.RR}`);
      console.log(`  Expected: All=0 (below deadZone=${mode.steeringControl.deadZone})`);
      console.assert(result6.FL === 0 && result6.FR === 0 && result6.RL === 0 && result6.RR === 0, '❌ Test 6 failed');

      console.log('---');
      console.log('Test 7: Front wheels equal check');
      mockGamepadState.axes[0] = 0.75;
      const result7 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.75 → FL=${result7.FL.toFixed(2)}, FR=${result7.FR.toFixed(2)}`);
      console.log(`  Expected: FL=FR (both front wheels steer together)`);
      console.assert(result7.FL === result7.FR, '❌ Test 7 failed');

      console.log('---');
      console.log('Test 8: Rear wheels equal check');
      mockGamepadState.axes[0] = -0.75;
      const result8 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-0.75 → RL=${result8.RL.toFixed(2)}, RR=${result8.RR.toFixed(2)}`);
      console.log(`  Expected: RL=RR (both rear wheels steer together)`);
      console.assert(result8.RL === result8.RR, '❌ Test 8 failed');

      console.log('---');
      console.log('Test 9: Opposite sign verification');
      mockGamepadState.axes[0] = 0.6;
      const result9 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=0.6 → FL=${result9.FL.toFixed(2)}, RL=${result9.RL.toFixed(2)}`);
      console.log(`  Expected: FL and RL have OPPOSITE signs (FL positive, RL negative)`);
      console.assert((result9.FL > 0 && result9.RL < 0) || (result9.FL < 0 && result9.RL > 0), '❌ Test 9 failed');

      console.log('---');
      console.log('Test 10: Magnitude equality check');
      mockGamepadState.axes[0] = -0.8;
      const result10 = controlMapper.mapSteeringControl(mockGamepadState, mode);
      console.log(`  LS-X=-0.8 → |FL|=${Math.abs(result10.FL).toFixed(2)}, |RL|=${Math.abs(result10.RL).toFixed(2)}`);
      console.log(`  Expected: |FL| = |RL| (same magnitude, opposite direction)`);
      console.assert(Math.abs(Math.abs(result10.FL) - Math.abs(result10.RL)) < 0.1, '❌ Test 10 failed');

      console.log('---');
      console.log('Test 11: Regression - Traditional mode still front-only');
      modeManager.currentIndex = 0;
      const traditionalMode = modeManager.getCurrentMode();
      mockGamepadState.axes[0] = 0.8;
      const result11 = controlMapper.mapSteeringControl(mockGamepadState, traditionalMode);
      console.log(`  Traditional Mode: LS-X=0.8 → FL=${result11.FL.toFixed(2)}, RL=${result11.RL}, RR=${result11.RR}`);
      console.log(`  Expected: FL≈36, RL=0, RR=0 (front wheels only)`);
      console.assert(Math.abs(result11.FL - 36) < 0.1 && result11.RL === 0 && result11.RR === 0, '❌ Test 11 failed');

      console.log('---');
      console.log('Test 12: Regression - Crab Walk still all equal');
      modeManager.currentIndex = 1;
      const crabMode = modeManager.getCurrentMode();
      mockGamepadState.axes[0] = 0;
      mockGamepadState.axes[2] = 0.6;
      const result12 = controlMapper.mapSteeringControl(mockGamepadState, crabMode);
      console.log(`  Crab Mode: RS-X=0.6 → FL=${result12.FL.toFixed(2)}, RL=${result12.RL.toFixed(2)}`);
      console.log(`  Expected: FL=RL (all wheels equal)`);
      console.assert(result12.FL === result12.RL, '❌ Test 12 failed');

      console.log('---');
      console.log('✅ All opposite steering tests complete!');
    },

    testOppositeSteeringWithRealController() {
      console.log('🧪 Testing opposite steering with real Xbox controller');
      console.log('📋 Instructions:');
      console.log('  1. Make sure your Xbox controller is connected');
      console.log('  2. Switch to Opposing Turn mode (RB button until you see it)');
      console.log('  3. Move Left Stick (LS) left and right on X axis');
      console.log('  4. Watch front and rear wheels turn OPPOSITE directions');
      console.log('---');

      modeManager.currentIndex = 2;
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

      const steering = controlMapper.mapSteeringControl(mockState, mode);
      console.log(`📊 Current Opposing Turn steering values:`);
      console.log(`  LS-X (axis 0): ${gamepad.axes[0]?.toFixed(3) || 0}`);
      console.log(`  FL angle: ${steering.FL.toFixed(2)}°`);
      console.log(`  FR angle: ${steering.FR.toFixed(2)}°`);
      console.log(`  RL angle: ${steering.RL.toFixed(2)}°`);
      console.log(`  RR angle: ${steering.RR.toFixed(2)}°`);
      console.log(`  Opposite? ${(steering.FL > 0 && steering.RL < 0) || (steering.FL < 0 && steering.RL > 0) || (steering.FL === 0 && steering.RL === 0) ? '✅ YES' : '❌ NO'}`);
      console.log('---');
      console.log('💡 Run this function repeatedly to see live opposite steering values');
    }
  };
}
