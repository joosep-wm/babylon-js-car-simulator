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

### Task 4.1: Create Controller Config UI Component Shell ✅ COMPLETE
**Deliverable:** Empty Vue overlay component

**Implementation:**
- Create `components/controller-config-ui.js`
- Create `css/controller-config.css`
- F10 hotkey to toggle overlay
- Basic modal layout

**Status:** Completed 2025-10-28 | Commit: fa22bad

---

### Task 4.2: Create Mode List View ✅ COMPLETE
**Deliverable:** Display all modes in list with reactive updates

**Implementation:**
- Show mode name and description
- Active mode highlighted
- Edit button per mode
- Delete button per mode
- Vue reactivity using refreshKey + 100ms polling (technical debt for Phase 6)

**Status:** Completed 2025-10-28 | Commit: b9e2094

---

### Task 4.3: Implement Mode Reordering ✅ COMPLETE
**Deliverable:** Drag-to-reorder modes

**Implementation:**
- Full drag-and-drop with visual feedback
- ModeManager.reorderModes() method
- Active mode tracking during reorder
- localStorage persistence

**Status:** Completed 2025-10-28 | Commit: a41f541

---

### Task 4.4: Create Mode Editor Component ✅ COMPLETE
**Deliverable:** Detailed mode configuration screen with working Save

**Implementation:**
- Editor UI with editable name and description fields
- Placeholder sections for speed/steering/utility (content in Tasks 4.5-4.7)
- Working Save functionality:
  - Import Mode class for object reconstruction
  - Update mode in ModeManager.modes array
  - Call ModeManager.saveModes() to persist to localStorage
  - Refresh UI after save
- Cancel button discards changes and returns to list

**Status:** Completed 2025-10-28 | Commit: b625060

---

### Task 4.5: Implement Speed Control Editor ✅ COMPLETE
**Deliverable:** Dropdown + sliders for speed config

**Implementation:**
- Added Speed Control section with dropdown for speed input source (triggers/rightStickY/leftStickY)
- Added max speed slider (0-200 range) with live numeric display
- Implemented backward compatibility migration (type → source)
- Default maxSpeed to 100 for modes without maxSpeed
- Full CSS styling for select dropdown and range slider

**Test Results:**
✓ Dropdown changes speed source correctly
✓ Slider adjusts max speed with live value display
✓ Save persists changes to localStorage
✓ Backward compatibility works (triggers → triggers, analog → rightStickY)
✓ No console errors (except known favicon issue)

**Status:** Completed 2025-10-30

---

### Task 4.6: Implement Steering Control Editor ✅ COMPLETE
**Deliverable:** Configure steering mappings

**Implementation:**
- Added Steering Control section in Mode Editor Component
- Created dropdown for steering type selection: Front Only, All Wheel, Opposite, Independent
- Added max angle slider (0-90 degrees) with live numeric display
- Implemented computed properties for bidirectional mapping between UI and mode structure
- Correctly handles all steering types: singleInput (front/all), opposing, multiInput
- Save functionality updates steeringControl.type and maxAngle (or frontMaxAngle/rearMaxAngle)
- Added CSS styling matching Speed Control section

**Test Results:**
✓ Dropdown correctly displays current steering type for all mode structures
✓ Slider adjusts max angle with live value display (45° → 60° → 70°)
✓ Save persists changes to localStorage correctly
✓ All Wheel mode: type=singleInput, wheels=all, maxAngle=60
✓ Independent mode: type=multiInput, frontMaxAngle=70, rearMaxAngle=70
✓ Opposite mode: type=opposing correctly detected
✓ No console errors (except known favicon issue)

**Status:** Completed 2025-10-30

---

### Task 4.7: Implement Utility Button Editor ✅ COMPLETE
**Deliverable:** Remap buttons to actions

**Implementation:**
- Added Utility Buttons section in Mode Editor Component
- Display all 4 utility button mappings: Jump, Brake, Reset Position, Reset Wheels
- Each action shows dropdown select with all 12 Xbox buttons (A, B, X, Y, LB, RB, LT, RT, Back, Start, LS, RS)
- Button badge displays currently selected button with purple theme styling
- Added migrateUtilityButtons() method for backward compatibility
- Updated ControlMapper to read from buttonIndex property with fallback

**Test Results:**
✓ UI displays all actions with dropdowns and badges
✓ Dropdown changes update badge immediately
✓ Save persists changes to localStorage
✓ Configuration loads correctly after save
✓ Successfully remapped Jump to B and Brake to A
✓ Migration adds buttonIndex property to existing modes
✓ No console errors (except known favicon issue)

**Status:** Completed 2025-10-30 | Commit: 76f771f

---

### Task 4.8: Create Input Binding Dialog ⏭️ SKIPPED
**Deliverable:** "Press button" widget

**Reason for Skip:** Task 4.7 implemented dropdown selects for button remapping, which provides simpler and more intuitive UX than a "press button" dialog. The dropdown approach is already functional and meets all requirements.

**Test:**
1. ~~Click "Change Input" for speed control~~
2. ~~Verify dialog appears~~
3. ~~Press RT trigger~~
4. ~~Verify RT assigned~~

**Status:** Skipped 2025-10-30 - Functionality already implemented via dropdowns in Task 4.7

---

### Task 4.9: Implement Add New Mode ✅ COMPLETE
**Deliverable:** Create custom mode from scratch

**Implementation:**
- Added "Add New Mode" button at bottom of mode list with purple theme styling
- Created addNewMode() method that:
  - Creates new Mode instance with default values (triggers, front-only steering, maxSpeed 100)
  - Adds to ModeManager.modes array and saves to localStorage
  - Automatically opens mode editor for configuration
- Added CSS styling with hover effects and transitions

**Test Results:**
✓ "Add New Mode" button displays at bottom of mode list
✓ Click button creates new mode with name "New Mode"
✓ Mode editor opens automatically with all default values
✓ Can configure name, description, speed control, steering, and utility buttons
✓ Save persists new mode to localStorage
✓ New mode appears in mode list
✓ Can switch to new mode using LB/RB buttons
✓ All configurations work as expected

**Status:** Completed 2025-10-30

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

**Phase 4 In Progress - 8/12 tasks complete** 🚧

**Completed Tasks:**
- ✅ Task 4.1: Controller Config UI Component Shell (fa22bad) - 2025-10-28
- ✅ Task 4.2: Mode List View with reactive updates (b9e2094) - 2025-10-28
- ✅ Task 4.3: Mode Reordering with drag-and-drop (a41f541) - 2025-10-28
- ✅ Task 4.4: Mode Editor Component with working Save (b625060) - 2025-10-28
- ✅ Task 4.5: Speed Control Editor (dropdown + slider) - 2025-10-30
- ✅ Task 4.6: Steering Control Editor (dropdown + slider) - 2025-10-30
- ✅ Task 4.7: Utility Button Editor (76f771f) - 2025-10-30
- ✅ Task 4.9: Add New Mode functionality - 2025-10-30

**In Progress:**
- 🔄 Phase 4: Configuration UI (8/12 tasks done)

**Next Up:**
- 📝 Task 4.10: Implement Duplicate Mode
- 📝 Task 4.11: Implement Delete Mode
- 📝 Task 4.12: Implement Export/Import Profiles

**Completed Phases:**
- ✅ Phase 1: Foundation (GamepadManager, events, polling)
- ✅ Phase 2: Mode System (mode data, switching, persistence, HUD)
- ✅ Phase 3: Control Mapping (ControlMapper, integration, actions)

**Known Issues:**
- 🟡 WebGL feedback loop warning (deferred to Phase 6 - no functional impact)
- 🟡 Missing favicon.ico (low priority cosmetic issue)
- 🟡 Polling vs events in mode list (Task 4.2 technical debt - deferred to Phase 6)
