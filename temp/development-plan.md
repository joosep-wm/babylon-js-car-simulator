# Milestone 2 (M2) - Xbox Controller Implementation - Development Plan

**Source Document:** temp/xbox-controller-design.md v3.0
**Strategy:** Minimal testable increments, test after EVERY change
**Current Phase:** Phase 4 - Configuration UI

---

## Phase Summaries

### PHASE 3: CONTROL MAPPING ✅ COMPLETE
**Status:** Complete (2025-10-28)
**Goal:** Translate controller inputs to game actions

**Key Achievements:**
- ✅ ControlMapper class with mode-aware input processing (217 lines)
- ✅ Speed control: triggers + sticks with proper Xbox trigger normalization
- ✅ Steering control: 4 types (front-only, all-wheel, opposite, independent)
- ✅ Utility buttons: jump (ground check), brake (physics-based), reset position, reset wheels
- ✅ Full integration with babylon-game.js and car physics
- ✅ All 4 default driving modes functional end-to-end
- ✅ 4 critical bugs fixed (mode switching, speed control, camera error, reset handling)
- ✅ 14/14 tasks completed, 24 git commits: 0c7cbea → ba22718
- ✅ Extensive testing: visual, console, edge cases, performance (60fps maintained)

**Documents:**
- Archive: `temp/M2-phase3-archive.md`
- Completion Report: `temp/M2-PHASE-3-COMPLETE.md`

---

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

> **Note:** Phase 3 detailed planning has been archived. See `temp/M2-phase3-archive.md` for full task details.

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

**Phase 3 Complete! ✅**
All Phase 3 tasks (3.1-3.14) completed successfully:
- ✅ ControlMapper class with mode-aware input processing
- ✅ Speed control: triggers + sticks (Xbox trigger normalization)
- ✅ Steering control: 4 types (front-only, all-wheel, opposite, independent)
- ✅ Utility buttons: jump, brake, reset position, reset wheels
- ✅ Full integration with babylon-game.js
- ✅ All 4 default driving modes functional end-to-end
- ✅ 4 critical bugs fixed
- ✅ Extensive testing completed

**Completed Phases:**
- ✅ Phase 1: Foundation (GamepadManager, events, polling)
- ✅ Phase 2: Mode System (mode data, switching, persistence, HUD)
- ✅ Phase 3: Control Mapping (ControlMapper, integration, actions)

**Next Phase:**
- Phase 4: Configuration UI (F10 overlay, mode editor, customization)

**Known Issues:**
- 🟡 WebGL feedback loop warning (deferred to Phase 6 - no functional impact)
- 🟡 Missing favicon.ico (low priority cosmetic issue)
