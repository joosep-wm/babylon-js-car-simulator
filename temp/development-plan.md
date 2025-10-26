# Milestone 2 (M2) - Xbox Controller Implementation - Development Plan

**Source Document:** temp/xbox-controller-design.md v3.0
**Strategy:** Minimal testable increments, test after EVERY change
**Current Phase:** Phase 3 - Control Mapping

---

## Phase Summaries

### PHASE 1: FOUNDATION ✅ COMPLETE
**Status:** Complete (2025-10-26)
**Goal:** Get controller inputs reading and displayed

**Key Achievements:**
- ✅ GamepadManager fully implemented with connection detection, button/axis tracking, event system
- ✅ Console test display via `window.controllerState`
- ✅ Integrated into game loop (60fps polling)
- ✅ All 8 tasks completed and validated
- ✅ 4 git commits: e774697, 6d1fdb8, f70472f, a767daa

**Documents:**
- Archive: `temp/M2-phase1-archive.md`
- Completion Report: `temp/M2-PHASE-1-COMPLETE.md`

---

### PHASE 2: MODE SYSTEM ✅ COMPLETE
**Status:** Complete (2025-10-26)
**Goal:** Mode data structure, switching, and persistence

**Key Achievements:**
- ✅ Mode class with JSON serialization (speed/steering/utility configs)
- ✅ 4 default driving modes (Traditional/Crab/Opposing/Independent)
- ✅ ModeManager with localStorage persistence
- ✅ Mode switching via LB/RB buttons
- ✅ Analog processing utilities (dead zone, sensitivity, range mapping)
- ✅ HUD mode indicator component (top-center display)
- ✅ All 8 tasks completed and validated
- ✅ 11 git commits: 3edb08d → f1cc57f

**Documents:**
- Archive: `temp/M2-phase2-archive.md`
- Completion Report: `temp/M2-PHASE-2-COMPLETE.md`

> **Note:** Phase 1-2 detailed planning has been archived. See archive documents for full task details.

---

## PHASE 3: CONTROL MAPPING (Week 2)
**Goal:** Translate controller inputs to game actions

### Task 3.1: Create ControlMapper Class
**Deliverable:** Basic control mapper structure

**Implementation:**
```javascript
// game/controller/control-mapper.js
export class ControlMapper {
  constructor(modeManager) {
    this.modeManager = modeManager;
  }

  processFrame(gamepadState) {
    const mode = this.modeManager.getCurrentMode();

    return {
      speed: this.mapSpeedControl(gamepadState, mode),
      steering: this.mapSteeringControl(gamepadState, mode),
      actions: this.mapUtilityButtons(gamepadState, mode)
    };
  }
}
```

**Test:**
1. Create ControlMapper with ModeManager
2. Create mock gamepadState
3. Call processFrame()
4. Verify returns object with speed, steering, actions

---

### Task 3.2: Implement Speed Mapping - Trigger Mode
**Deliverable:** RT/LT controls forward/backward speed

**Implementation:**
```javascript
mapSpeedControl(gamepadState, mode) {
  const config = mode.speedControl;

  if (config.type === 'triggers') {
    const forward = gamepadState.axes[7] || 0;  // RT
    const backward = gamepadState.axes[6] || 0; // LT

    let speed = 0;
    if (forward > config.deadZone) {
      speed = forward * config.maxSpeed * config.sensitivity;
    } else if (backward > config.deadZone) {
      speed = -backward * config.maxSpeed * config.sensitivity;
    }

    return speed;
  }

  return 0;
}
```

**Test:**
1. Set mode to "Traditional Driving"
2. Pull RT halfway
3. Verify speed output ~0.5
4. Pull LT fully
5. Verify speed output ~-1.0
6. Release both
7. Verify speed output 0

---

### Task 3.3: Implement Speed Mapping - Stick Mode
**Deliverable:** Stick Y-axis controls speed

**Implementation:**
```javascript
if (config.type === 'stickY') {
  const axisIndex = config.input === 'LS-Y' ? 1 : 3;
  let value = gamepadState.axes[axisIndex] || 0;
  value = applyDeadZone(value, config.deadZone);
  value = applySensitivity(value, config.sensitivity);
  return -value * config.maxSpeed; // Invert Y axis
}
```

**Test:**
1. Set mode to "Crab Walk"
2. Push Right Stick Y up
3. Verify speed output positive
4. Push Right Stick Y down
5. Verify speed output negative

---

### Task 3.4: Implement Steering Mapping - Front Wheels Only
**Deliverable:** LS-X controls front wheel angles

**Implementation:**
```javascript
mapSteeringControl(gamepadState, mode) {
  const config = mode.steeringControl;

  if (config.type === 'singleInput' && config.wheels === 'front') {
    const axisIndex = 0; // LS-X
    let value = gamepadState.axes[axisIndex] || 0;
    value = applyDeadZone(value, config.deadZone);
    value = applySensitivity(value, config.sensitivity);

    const angle = value * config.maxAngle;

    return {
      FL: angle,
      FR: angle,
      RL: 0,
      RR: 0
    };
  }

  return { FL: 0, FR: 0, RL: 0, RR: 0 };
}
```

**Test:**
1. Set mode to "Traditional Driving"
2. Push LS-X left
3. Verify FL and FR angles negative
4. Push LS-X right
5. Verify FL and FR angles positive
6. Verify RL and RR remain 0

---

### Task 3.5: Implement Steering Mapping - All Wheels
**Deliverable:** Single input controls all 4 wheels

**Implementation:**
```javascript
if (config.type === 'singleInput' && config.wheels === 'all') {
  // Same as front, but apply to all wheels
  return {
    FL: angle,
    FR: angle,
    RL: angle,
    RR: angle
  };
}
```

**Test:**
1. Set mode to "Crab Walk"
2. Push RS-X left
3. Verify all 4 wheels turn left equally

---

### Task 3.6: Implement Steering Mapping - Opposite Steering
**Deliverable:** Front and rear wheels turn opposite directions

**Implementation:**
```javascript
if (config.type === 'singleInput' && config.wheels === 'opposite') {
  return {
    FL: angle,
    FR: angle,
    RL: -angle,
    RR: -angle
  };
}
```

**Test:**
1. Set mode to "Opposing Turn"
2. Push LS-X left
3. Verify front wheels turn left
4. Verify rear wheels turn right (opposite)

---

### Task 3.7: Implement Steering Mapping - Independent Wheels
**Deliverable:** Two sticks control front/rear independently

**Implementation:**
```javascript
if (config.type === 'multiInput') {
  const frontAxis = gamepadState.axes[3]; // RS-Y
  const rearAxis = gamepadState.axes[1];  // LS-Y

  const frontAngle = applyDeadZone(frontAxis) * config.frontMaxAngle;
  const rearAngle = applyDeadZone(rearAxis) * config.rearMaxAngle;

  return {
    FL: frontAngle,
    FR: frontAngle,
    RL: rearAngle,
    RR: rearAngle
  };
}
```

**Test:**
1. Set mode to "4-Wheel Independent"
2. Push RS-Y up
3. Verify only front wheels change
4. Push LS-Y down
5. Verify only rear wheels change

---

### Task 3.8: Implement Utility Button Mapping
**Deliverable:** A/B/X/Y buttons trigger actions

**Implementation:**
```javascript
mapUtilityButtons(gamepadState, mode) {
  const actions = [];

  for (const [buttonIndex, config] of Object.entries(mode.utilityButtons)) {
    const button = gamepadState.buttons[buttonIndex];

    if (config.type === 'press' && button.justPressed) {
      actions.push({ action: config.action, type: 'instant' });
    } else if (config.type === 'hold' && button.heldDuration > config.holdDuration) {
      actions.push({ action: config.action, type: 'hold', duration: button.heldDuration });
    }
  }

  return actions;
}
```

**Test:**
1. Press A button
2. Verify 'jump' action emitted
3. Hold B button for 200ms
4. Verify 'brake' action emitted after 100ms

---

### Task 3.9: Integrate ControlMapper with babylon-game.js
**Deliverable:** Controller actually controls the car

**Implementation:**
- Import ControlMapper
- Call processFrame() each render loop
- Apply speed output to wheel motor forces
- Apply steering angles to wheel joints

**Test:**
1. Connect controller
2. Pull RT trigger
3. Verify car moves forward
4. Push LS-X left
5. Verify car turns left
6. Press A button
7. Verify car jumps

---

### Task 3.10: Implement Jump Action
**Deliverable:** A button makes car jump

**Implementation:**
```javascript
// In babylon-game.js
if (actions.find(a => a.action === 'jump')) {
  carBody.physicsBody.applyForce(
    new BABYLON.Vector3(0, jumpForce, 0),
    carBody.getAbsolutePosition()
  );
}
```

**Test:**
1. Press A button
2. Verify car jumps into air
3. Verify can't double-jump (ground check)

---

### Task 3.11: Implement Brake Action
**Deliverable:** B button slows car down

**Implementation:**
```javascript
if (actions.find(a => a.action === 'brake')) {
  // Reduce motor forces to 0
  // Apply friction
}
```

**Test:**
1. Drive car at full speed
2. Hold B button
3. Verify car slows down quickly

---

### Task 3.12: Implement Reset Position Action
**Deliverable:** X button resets car to spawn

**Test:**
1. Drive car far away
2. Press X button
3. Verify car teleports to spawn position

---

### Task 3.13: Implement Reset Wheels Action
**Deliverable:** Y button resets wheel angles to 0

**Test:**
1. Turn wheels fully left
2. Press Y button
3. Verify all wheels snap to straight

---

### Task 3.14: Test All 4 Default Modes End-to-End
**Deliverable:** Every mode works correctly

**Test Checklist:**
- [ ] Mode 1: RT forward, LT backward, LS-X front steering
- [ ] Mode 2: RS-Y speed, RS-X all-wheel steering
- [ ] Mode 3: RT/LT speed, LS-X opposite steering
- [ ] Mode 4: RT/LT speed, both sticks independent steering
- [ ] Mode switching with LB/RB works
- [ ] All utility buttons work in all modes

---

## PHASE 4: CONFIGURATION UI (Week 2-3)
**Goal:** Visual mode editor

### Task 4.1: Create Controller Config UI Component Shell
**Deliverable:** Empty Vue overlay component

**Implementation:**
- Create `components/controller-config-ui.js`
- Create `css/controller-config.css`
- F10 hotkey to toggle overlay
- Basic modal layout

**Test:**
1. Press F10
2. Verify overlay appears
3. Press F10 again
4. Verify overlay closes

---

### Task 4.2: Create Mode List View
**Deliverable:** Display all modes in list

**Implementation:**
- Show mode name and description
- Active mode highlighted
- Edit button per mode
- Delete button per mode

**Test:**
1. Open config UI
2. Verify 4 default modes listed
3. Verify "Traditional Driving" highlighted as active

---

### Task 4.3: Implement Mode Reordering
**Deliverable:** Drag-to-reorder modes

**Test:**
1. Drag "Crab Walk" to position 1
2. Switch modes with RB
3. Verify cycle order changed

---

### Task 4.4: Create Mode Editor Component
**Deliverable:** Detailed mode configuration screen

**Test:**
1. Click "Edit" on a mode
2. Verify editor screen opens
3. Verify all mode properties shown

---

### Task 4.5: Implement Speed Control Editor
**Deliverable:** Dropdown + sliders for speed config

**Test:**
1. Change speed input from "RT/LT" to "Right Stick Y"
2. Adjust max speed slider
3. Save and test in-game
4. Verify speed source changed

---

### Task 4.6: Implement Steering Control Editor
**Deliverable:** Configure steering mappings

**Test:**
1. Change steering type
2. Adjust max angle slider
3. Save and test
4. Verify wheels use new angle limit

---

### Task 4.7: Implement Utility Button Editor
**Deliverable:** Remap buttons to actions

**Test:**
1. Change A button from "jump" to "brake"
2. Save
3. Press A button in-game
4. Verify car brakes instead of jumping

---

### Task 4.8: Create Input Binding Dialog
**Deliverable:** "Press button" widget

**Test:**
1. Click "Change Input" for speed control
2. Verify dialog appears
3. Press RT trigger
4. Verify RT assigned

---

### Task 4.9: Implement Add New Mode
**Deliverable:** Create custom mode from scratch

**Test:**
1. Click "Add New Mode"
2. Configure all settings
3. Save
4. Switch to new mode
5. Verify works as configured

---

### Task 4.10: Implement Duplicate Mode
**Deliverable:** Copy existing mode

**Test:**
1. Duplicate "Traditional Driving"
2. Modify duplicate
3. Verify original unchanged

---

### Task 4.11: Implement Delete Mode
**Deliverable:** Remove mode from list

**Test:**
1. Create extra mode
2. Delete it
3. Verify removed from list
4. Verify can't delete if only 1 mode remains

---

### Task 4.12: Implement Export/Import Profiles
**Deliverable:** Save config to JSON file

**Test:**
1. Click "Export"
2. Verify JSON file downloads
3. Delete all modes
4. Click "Import"
5. Verify modes restored from file

---

## PHASE 5: TESTING INFRASTRUCTURE (Week 3)
**Goal:** AI-testable mock controller

### Task 5.1: Create VirtualGamepad Class
**Deliverable:** Mock Gamepad API

**Implementation:**
```javascript
// game/testing/virtual-gamepad.js
export class VirtualGamepad {
  constructor() {
    this.buttons = Array(16).fill().map(() => ({ pressed: false, value: 0 }));
    this.axes = Array(8).fill(0);
    this.id = 'Virtual Xbox Controller';
    this.index = 0;
    this.connected = true;
  }

  pressButton(index) {
    this.buttons[index].pressed = true;
    this.buttons[index].value = 1.0;
  }

  releaseButton(index) {
    this.buttons[index].pressed = false;
    this.buttons[index].value = 0;
  }

  setAxis(index, value) {
    this.axes[index] = Math.max(-1, Math.min(1, value));
  }

  inject() {
    // Override navigator.getGamepads()
    const original = navigator.getGamepads.bind(navigator);
    navigator.getGamepads = () => {
      const gamepads = original();
      gamepads[this.index] = this;
      return gamepads;
    };
  }
}
```

**Test:**
1. Create VirtualGamepad
2. Call inject()
3. Call navigator.getGamepads()
4. Verify virtual controller in array

---

### Task 5.2: Create Test Harness
**Deliverable:** Automated test runner

**Test:**
1. Run test harness
2. Verify can execute test steps
3. Verify can validate expectations

---

### Task 5.3: Create Test Scenarios for Mode 1
**Deliverable:** Automated tests for Traditional Driving

**Test:**
1. Run scenario
2. Verify car drives forward
3. Verify car turns left/right
4. Verify jump works

---

### Task 5.4: Create Test Scenarios for Modes 2-4
**Deliverable:** Full mode coverage

---

### Task 5.5: Create Visual Test Mode UI
**Deliverable:** In-game test overlay

**Test:**
1. Open test mode
2. See real-time input display
3. See wheel status
4. See action log

---

## PHASE 6: POLISH (Week 4)
**Goal:** Production ready

### Task 6.1: Add Conflict Detection
**Deliverable:** Warn on duplicate button mappings

---

### Task 6.2: Performance Profiling
**Deliverable:** Ensure <1ms per frame

---

### Task 6.3: Write User Documentation
**Deliverable:** docs/controller-user-guide.md

---

### Task 6.4: Write Architecture Documentation
**Deliverable:** docs/controller-architecture.md

---

## TESTING CHECKLIST TEMPLATE

After each task, run relevant tests:

```
□ Visual Test: Does it look right?
□ Console Test: Any errors logged?
□ Functional Test: Does it do what it should?
□ Edge Cases: What if I do something weird?
□ Performance: Still 60fps?
□ Regression: Did I break something else?
```

**CRITICAL RULE:** Git commit only when ALL tests pass for that task!

---

## CURRENT STATUS

**Phase 2 Complete! ✅**
All Phase 2 tasks (2.1-2.8) completed successfully:
- ✅ Mode class with JSON serialization
- ✅ 4 default driving modes (Traditional/Crab/Opposing/Independent)
- ✅ ModeManager with localStorage persistence
- ✅ Mode switching via LB/RB buttons
- ✅ Analog processing utilities
- ✅ HUD mode indicator component

**Active Tasks:**
- [ ] Task 3.1: Create ControlMapper Class (Phase 3 ready to start)

**Next Tasks:**
- [ ] Task 3.2: Implement Speed Mapping - Trigger Mode
- [ ] Task 3.3: Implement Speed Mapping - Stick Mode
- [ ] Task 3.4: Implement Steering Mapping - Front Wheels Only

**Blocked:** None

**Completed Phases:**
- ✅ Phase 1: Foundation (GamepadManager, events, polling)
- ✅ Phase 2: Mode System (mode data, switching, persistence, HUD)

**Testing:**
- Mode switching functional with physical Xbox controller (LB/RB buttons)
- Mode indicator displays current mode in real-time
- All modes persist across page reloads via localStorage
- Test via: http://localhost:8080 + browser console (F12)
- Type `window.controllerState` to see real-time controller data
