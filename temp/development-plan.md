# Development Plan: 4-Wheel Independent Steering Implementation

**Project**: UGV Simulation - 4-Wheel Independent Control
**Current Status**: Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phase 3 Ready
**Related Docs**:
- Full Technical Design: `temp/4-wheel-independent-steering-plan.md`
- Testing Strategy: `temp/testing-strategy.md`
- Testing Tools: `docs/testing-tools.md`
- Phase 1 Archive: `temp/development-plan-phase1-archive.md`
- Phase 1 Completion: `temp/PHASE-1-COMPLETE.md`
- Phase 2 Completion: `temp/PHASE-2-COMPLETE.md`

---

## Phase 1 Summary ✅

**Status**: COMPLETE (7 commits: 83199e2 → 4085d35)

All 4 wheels now have:
- Independent steering capability
- Independent motor control
- Per-wheel data structures
- Console test helpers (`window.testHelpers`)
- Debug overlay (F11 toggle)
- 4-wheel drive default behavior

**QA Result**: PASS - Ready for Phase 2 (95% confidence)

---

## Phase 2 Summary ✅

**Status**: COMPLETE (7 commits: 18e1baa → 815b93b)

Implemented 4-mode steering system with mode switching and debug visualization:
- **Mode 0 (Front-Wheel)**: Traditional car steering with Ackermann geometry
- **Mode 1 (Rear-Wheel)**: Forklift-style rear steering
- **Mode 2 (Opposite)**: Front and rear turn opposite for tight turns
- **Mode 3 (Crab)**: All wheels same direction for lateral movement (up to 90°)

**Key Features**:
- M key cycles through modes
- F11 debug overlay shows current mode
- Smooth mode transitions (bug fixed)
- All modes maintain consistent patterns

**QA Result**: PASS with critical bug fix (85% confidence)
**babylon-game.js**: Now 1469 lines (needs refactoring)

---

## Phase 2 Details (Archived)

All Phase 2 planning details have been archived to:
- **Planning Archive**: `temp/development-plan-phase2-archive.md` (step-by-step plans)
- **Completion Report**: `temp/PHASE-2-COMPLETE.md` (implementation summary and results)

---

## Phase 3: Code Refactoring

**Priority**: HIGH
**Reason**: `babylon-game.js` is 1469 lines (too long, violates Clean Code principles)
**Constraint**: NO functionality changes - pure refactoring only

### DONE: Phase 3.1 - Analyze and Plan Module Structure
**Status**: ✅ COMPLETE
**Estimated Time**: 1 hour
**Files**: `temp/phase3-module-analysis.md` (created)
**Prerequisites**: Phase 2 complete

**Objective**: Analyze babylon-game.js and design clean module structure

**Analysis Tasks**:
1. Read entire babylon-game.js file
2. Identify logical groupings of functions/responsibilities
3. Map dependencies between sections
4. Design module structure following Single Responsibility Principle

**Expected Modules** (based on Clean Code):
- `game/modules/steering-system.js` - All steering mode logic
- `game/modules/physics-config.js` - Physics engine setup and configuration
- `game/modules/car-factory.js` - Car creation (body, wheels, axles)
- `game/modules/camera-controller.js` - Camera setup and controls
- `game/modules/lighting-system.js` - Lights configuration
- `game/modules/environment.js` - Scene objects (track, walls, boxes)
- `game/modules/debug-overlay.js` - F11 debug overlay
- `game/modules/input-handler.js` - Keyboard/touch controls
- `game/modules/test-helpers.js` - window.testHelpers functions

**Deliverable**: Document with module breakdown and dependencies

---

### DONE: Phase 3.2 - Extract Steering System Module
**Status**: ✅ COMPLETE
**Estimated Time**: 2 hours
**Files**: Created `game/modules/steering-system.js` (88 lines), modified `game/babylon-game.js` (-58 lines)
**Prerequisites**: Phase 3.1 complete

**Objective**: Extract all steering mode logic into separate module

**Implementation Tasks**:
1. Create `game/modules/steering-system.js`
2. Move SteerMode enum, steerMode variable, modeNames array
3. Move all 4 mode implementations (FRONT, REAR, OPPOSITE, CRAB)
4. Export: `{ SteerMode, updateSteering, getCurrentMode, switchMode }`
5. Update babylon-game.js to import and use module
6. Test all 4 modes still work identically

**Testing Checklist**:
- [ ] All 4 modes work exactly as before
- [ ] M key switches modes
- [ ] F11 overlay shows correct mode
- [ ] No functionality changes

**Git Commit Message**: "Refactor: Extract steering system to separate module"

---

### TODO: Phase 3.3 - Extract Remaining Modules
**Status**: ⬜ TODO
**Estimated Time**: 4-6 hours
**Files**: Create multiple module files, modify `game/babylon-game.js`
**Prerequisites**: Phase 3.2 complete

**Objective**: Extract remaining modules to achieve clean separation of concerns

**Implementation Tasks** (in order):
1. Extract `physics-config.js` - Physics engine setup
2. Extract `debug-overlay.js` - F11 overlay functions
3. Extract `input-handler.js` - Keyboard controls
4. Extract `car-factory.js` - Car creation
5. Extract `camera-controller.js` - Camera setup
6. Extract `lighting-system.js` - Lights
7. Extract `environment.js` - Scene objects
8. Extract `test-helpers.js` - Test helper functions

**For Each Module**:
- Create new file in `game/modules/`
- Move relevant functions/data
- Define clear exports
- Update imports in babylon-game.js
- Test functionality unchanged

**Testing Checklist** (after each extraction):
- [ ] Game loads without errors
- [ ] All features work as before
- [ ] No console errors
- [ ] Visual inspection passes

**Git Commit Strategy**: One commit per module extraction

---

### TODO: Phase 3.4 - Final babylon-game.js Cleanup
**Status**: ⬜ TODO
**Estimated Time**: 1 hour
**Files**: `game/babylon-game.js`
**Prerequisites**: Phase 3.3 complete

**Objective**: Clean up main file after all extractions

**Implementation Tasks**:
1. Remove all extracted code
2. Add clear imports at top
3. Simplify initializeGame() function
4. Add comments explaining flow
5. Verify file is ~200-300 lines (down from 1469)

**Final babylon-game.js Structure**:
```javascript
// Imports
import { SteerMode, updateSteering, ... } from './modules/steering-system.js';
import { setupPhysics } from './modules/physics-config.js';
// ... other imports

// Main initialization
export async function initializeGame(vueApp) {
    // Create scene
    // Setup physics
    // Create car
    // Setup camera
    // Setup lighting
    // Create environment
    // Setup input handlers
    // Setup debug overlay
    // Start render loop
}

// Export global state for compatibility
export { scene, engine, havokInstance };
```

**Testing Checklist**:
- [ ] Full game works end-to-end
- [ ] All 4 steering modes functional
- [ ] F11 overlay works
- [ ] M key switches modes
- [ ] All physics correct
- [ ] No regressions

**Git Commit Message**: "Refactor: Complete babylon-game.js modularization"

---

### Phase 3 Success Criteria:
- ✅ babylon-game.js reduced to ~200-300 lines
- ✅ 8-10 focused modules created
- ✅ Each module has single responsibility
- ✅ NO functionality changes
- ✅ All tests pass
- ✅ Clean imports/exports
- ✅ Improved maintainability

---

## ~~Phase 4: Visual Enhancements~~ (COMPLETED)

**Status**: ✅ COMPLETED via Phase 2 work
**Note**: Originally planned as separate phase, but already implemented during Phase 2.

**Completed Features**:
- ✅ Steering mode display added to F11 debug overlay (commit 815b93b)
- ✅ Per-wheel telemetry already in F11 overlay (wheel angles and speeds)

All visual enhancements are complete. F11 debug overlay provides:
- Current steering mode (in yellow)
- All 4 wheel angles in real-time
- All 4 wheel speeds in real-time

No additional work needed.

---

## Success Criteria

### Phase 2 Success:
- ✅ 4 steering modes functional
- ✅ Mode switching with M key
- ✅ Each mode produces distinct behavior
- ✅ All modes stable and usable

### Phase 3 Success:
- ✅ babylon-game.js reduced to ~200-300 lines
- ✅ 8-10 focused modules created
- ✅ Each module has single responsibility
- ✅ NO functionality changes
- ✅ All tests pass
- ✅ Clean imports/exports

### Phase 4 Success:
- ✅ Current mode visible in UI (F11 debug overlay)
- ✅ Per-wheel telemetry displayed (F11 debug overlay)
- ✅ Debug information helpful for tuning

### Overall Success:
- ✅ Meets PRD Milestone 1 requirements
- ✅ Foundation for future Xbox controller integration
- ✅ Clean, maintainable code
- ✅ Comprehensive test coverage

---

## Notes for Agents

### For frontend-coder Agent:
- Follow testing strategy strictly: test after EVERY change
- Use test helpers via browser console for validation
- Check F11 debug overlay for real-time data
- Don't skip tests even if "it looks right"
- Commit only when ALL tests pass

### For implementation-validator Agent:
- Compare against testing-strategy.md test checklists
- Check git diff for scope creep (only implement what's specified)
- Verify test infrastructure is used
- Look for missing test cases
- Ensure tests actually pass (not just claimed to pass)

### Common Pitfalls to Avoid:
1. ❌ Implementing multiple steps without testing each
2. ❌ Trusting console output alone (need visual confirmation)
3. ❌ Proceeding when tests fail "just to see what happens"
4. ❌ Skipping regression tests (check old features still work)
5. ❌ Adding features not in the plan (scope creep)

---

## Future Phases (Not Yet Planned)

### Phase 5: 360° In-Place Rotation
- T key for spin mode
- Gradual wheel angle transitions to 90°
- Opposite motor speeds for rotation
- Physics tuning for stability

### Phase 6: Xbox Controller Integration
- Gamepad API integration
- Button/axis mapping system
- Multiple control profiles
- Live input display

### Phase 7: On-Screen Lever Controls
- 8 draggable levers (4 drive + 4 steering)
- Direct per-actuator control
- Lock groups feature
