# Phase 3.1: Module Structure Analysis

**Date**: 2025-10-26
**File Analyzed**: `game/babylon-game.js` (1469 lines)
**Objective**: Break down monolithic file into focused modules following Single Responsibility Principle

---

## Current File Structure Analysis

### Section Breakdown (by line numbers):

1. **Global Variables & Constants** (Lines 1-23)
   - Scene, engine, havokInstance
   - Debug colors, physics filters
   - Steering mode enum (SteerMode), current mode, mode names
   - Track radius constant

2. **Main Initialization & Reset Functions** (Lines 29-255)
   - `initializeGame()` - Main entry point
   - `resetGame()` - Full game reset
   - `resetBoxes()` - Box-specific reset
   - `createScene()` - Core scene creation with render loop setup

3. **Rendering Effects** (Lines 257-278)
   - `addReflectionsToCar()` - Reflection probe setup
   - `addGlowLayer()` - Glow layer configuration

4. **Environment Creation** (Lines 280-427)
   - `createSquareRaceTrack()` - Ground/track creation
   - `createTrackWalls()` - Perimeter walls
   - `createCollisionTowers()` - Static collision obstacles
   - `createKnockableBoxes()` - Dynamic interactive boxes

5. **Collision Detection System** (Lines 429-527)
   - `setupCollisionDetection()` - Physics-based collision tracking
   - Velocity change detection
   - Box movement tracking
   - Cooldown system

6. **Bridge Creation** (Lines 529-594)
   - `createBridge()` - Ramp bridge with pillars

7. **Lighting System** (Lines 596-713)
   - `createTaillights()` - Red rear lights with shadows
   - `createHeadlights()` - Warm white front lights with shadows

8. **Car Factory** (Lines 715-830)
   - `CreateCar()` - Main car assembly function
   - Imports custom model or creates fallback
   - Creates all 4 wheels, axles, joints
   - Sets up motors and steering
   - Adds lights

9. **Car Component Factories** (Lines 832-851)
   - `CreateAxle()` - Individual axle creation
   - `CreateWheel()` - Individual wheel creation

10. **Physics Joints & Constraints** (Lines 853-951)
    - `AttachAxleToFrame()` - 6DoF suspension joints
    - `CreateWheelJoint()` - Basic wheel joint
    - `CreatePoweredWheelJoint()` - Motor-enabled wheel joint
    - `AttachSteering()` - Steering motor setup

11. **Input Handling & Steering Logic** (Lines 953-1166)
    - `InitKeyboardControls()` - Keyboard and touch input
    - Contains ALL 4 steering mode implementations (FRONT, REAR, OPPOSITE, CRAB)
    - Motor speed control
    - Brake logic
    - Vue app integration

12. **Physics Helper Functions** (Lines 1168-1232)
    - `InitTyreMaterial()` - Tire texture setup
    - `AddWheelPhysics()` - Wheel physics body
    - `AddAxlePhysics()` - Axle physics body
    - `AddDynamicPhysics()` - Generic mesh physics
    - `AddDynamicPhysicsConvex()` - ConvexHull physics
    - `FilterMeshCollisions()` - Collision filtering
    - `CalculateWheelAngles()` - Ackermann geometry

13. **Car Model Importer** (Lines 1234-1291)
    - `importCustomCar()` - Async GLB loader and processor

14. **Debug Overlay System** (Lines 1293-1374)
    - `createDebugOverlay()` - F11 overlay DOM creation
    - `toggleDebugOverlay()` - Show/hide toggle
    - `updateDebugOverlay()` - Real-time data update

15. **Test Helpers** (Lines 1376-1469)
    - `initializeTestHelpers()` - Console test API
    - Manual wheel angle/speed control
    - Motor test sequences

---

## Identified Logical Groupings

### Group A: Steering System (Lines 18-20, 953-1166)
**Responsibility**: All steering mode logic and implementations
- SteerMode enum
- steerMode variable
- modeNames array
- All 4 mode implementations (FRONT, REAR, OPPOSITE, CRAB)
- Steering angle calculations

### Group B: Physics Configuration (Lines 131-136)
**Responsibility**: Physics engine setup and configuration
- Havok physics initialization
- Timestep, velocity limits, substep configuration

### Group C: Car Factory (Lines 715-830, 832-851, 1234-1291)
**Responsibility**: Car creation and assembly
- Custom model loading
- Car body creation (fallback)
- Wheel creation
- Axle creation
- Component assembly

### Group D: Camera Controller (Lines 137-163)
**Responsibility**: Camera setup and mouse controls
- FollowCamera configuration
- Mouse-drag rotation
- Camera acceleration/speed

### Group E: Lighting System (Lines 596-713, 165-166)
**Responsibility**: All light creation and configuration
- Hemispheric light
- Headlights with shadows
- Taillights with shadows
- Glow layer

### Group F: Environment Builder (Lines 280-427, 529-594)
**Responsibility**: Scene objects and world creation
- Track creation
- Walls
- Towers
- Boxes
- Bridge with pillars

### Group G: Rendering Effects (Lines 257-278)
**Responsibility**: Visual enhancements
- Reflection probes
- Glow layer

### Group H: Debug Overlay (Lines 1293-1374)
**Responsibility**: F11 debug overlay UI
- DOM element creation
- Toggle functionality
- Real-time data display

### Group I: Input Handler (Lines 953-1166)
**Responsibility**: Keyboard and touch controls
- Key event listeners
- Touch control merging
- Jump, brake, reset handling
- M key mode switching

### Group J: Test Helpers (Lines 1376-1469)
**Responsibility**: Console testing API
- window.testHelpers initialization
- Manual control functions
- Test sequences

### Group K: Physics Helpers (Lines 1168-1232, 853-951)
**Responsibility**: Physics body/joint creation utilities
- Material setup
- Physics body factories
- Joint/constraint factories
- Ackermann geometry calculation

### Group L: Collision Detection (Lines 429-527)
**Responsibility**: Physics-based collision tracking
- Velocity change detection
- Box movement tracking
- Cooldown management

---

## Proposed Module Structure

### Module 1: `game/modules/steering-system.js`
**Lines to Extract**: 18-20, portions of 953-1166 (steering logic only)
**Size Estimate**: ~150 lines
**Exports**:
```javascript
export const SteerMode = { FRONT: 0, REAR: 1, OPPOSITE: 2, CRAB: 3 };
export const modeNames = ['Front-Wheel', 'Rear-Wheel', '4W-Opposite', '4W-Crab'];
export let steerMode = SteerMode.FRONT;
export function setSteerMode(mode) { steerMode = mode; }
export function getSteerMode() { return steerMode; }
export function cycleSteerMode() { steerMode = (steerMode + 1) % 4; }
export function getCurrentModeName() { return modeNames[steerMode]; }
export function updateSteering(isLeft, isRight, currentAngle, maxAngle, steerAngle) {
    // Contains all 4 mode implementations
    // Returns updated currentAngle and steerAngle object
}
```
**Dependencies**: BABYLON (for Math.PI), CalculateWheelAngles (from physics-helpers)

---

### Module 2: `game/modules/physics-config.js`
**Lines to Extract**: 131-136, 1168-1232, 853-951
**Size Estimate**: ~250 lines
**Exports**:
```javascript
export async function setupPhysics(scene) {
    // Havok initialization and configuration
}
export function InitTyreMaterial(scene) { ... }
export function AddWheelPhysics(mesh, mass, bounce, friction, scene) { ... }
export function AddAxlePhysics(mesh, mass, bounce, friction, scene) { ... }
export function AddDynamicPhysics(mesh, mass, bounce, friction, centerOfMass, scene) { ... }
export function AddDynamicPhysicsConvex(mesh, mass, bounce, friction, centerOfMass, scene) { ... }
export function FilterMeshCollisions(mesh, FILTERS) { ... }
export function AttachAxleToFrame(axle, frame, hasSteering, scene) { ... }
export function CreateWheelJoint(axle, wheel, scene) { ... }
export function CreatePoweredWheelJoint(axle, wheel, scene) { ... }
export function AttachSteering(joint) { ... }
export function CalculateWheelAngles(averageAngle) { ... }
```
**Dependencies**: BABYLON, HavokPhysics

---

### Module 3: `game/modules/debug-overlay.js`
**Lines to Extract**: 1293-1374
**Size Estimate**: ~85 lines
**Exports**:
```javascript
export function createDebugOverlay() { ... }
export function toggleDebugOverlay() { ... }
export function updateDebugOverlay(steerAngle, wheelSpeed, currentMode) { ... }
```
**Dependencies**: None (pure DOM manipulation)

---

### Module 4: `game/modules/input-handler.js`
**Lines to Extract**: Portions of 953-1166 (input handling only, not steering logic)
**Size Estimate**: ~120 lines
**Exports**:
```javascript
export function InitKeyboardControls(motorJoints, steeringJoints, carFrame, vueApp, scene, steerAngle, wheelSpeed, manualControl) {
    // Sets up keyboard/touch listeners
    // Calls steering-system.updateSteering()
    // Updates motors and joints
}
```
**Dependencies**: BABYLON, steering-system, debug-overlay

---

### Module 5: `game/modules/car-factory.js`
**Lines to Extract**: 715-830, 832-851, 1234-1291
**Size Estimate**: ~200 lines
**Exports**:
```javascript
export async function CreateCar(vueApp, scene, tyreMaterial, FILTERS) { ... }
export function CreateAxle(position, scene) { ... }
export function CreateWheel(position, tyreMaterial, scene) { ... }
async function importCustomCar(scene) { ... } // Internal
```
**Dependencies**: BABYLON, physics-config, lighting-system

---

### Module 6: `game/modules/camera-controller.js`
**Lines to Extract**: 137-163
**Size Estimate**: ~30 lines
**Exports**:
```javascript
export function setupCamera(scene, car) {
    // Creates and configures FollowCamera
    // Sets up mouse controls
    // Returns camera
}
```
**Dependencies**: BABYLON

---

### Module 7: `game/modules/lighting-system.js`
**Lines to Extract**: 165-166, 596-713
**Size Estimate**: ~120 lines
**Exports**:
```javascript
export function setupHemisphericLight(scene) { ... }
export function createTaillights(carFrame, scene) { ... }
export function createHeadlights(carFrame, scene) { ... }
export function addGlowLayer(scene) { ... }
```
**Dependencies**: BABYLON

---

### Module 8: `game/modules/environment.js`
**Lines to Extract**: 280-427, 529-594
**Size Estimate**: ~250 lines
**Exports**:
```javascript
export function createSquareRaceTrack(scene, width, height) { ... }
export function createTrackWalls(scene, trackWidth, trackHeight) { ... }
export function createCollisionTowers(scene) { ... }
export function createKnockableBoxes(scene, vueApp) { ... }
export function createBridge(scene) { ... }
```
**Dependencies**: BABYLON

---

### Module 9: `game/modules/rendering-effects.js`
**Lines to Extract**: 257-278
**Size Estimate**: ~25 lines
**Exports**:
```javascript
export function addReflectionsToCar(scene) { ... }
```
**Dependencies**: BABYLON (Note: addGlowLayer moved to lighting-system)

---

### Module 10: `game/modules/test-helpers.js`
**Lines to Extract**: 1376-1469
**Size Estimate**: ~95 lines
**Exports**:
```javascript
export function initializeTestHelpers(steerAngle, wheelSpeed, carFrame, manualControl) {
    // Sets up window.testHelpers
}
```
**Dependencies**: BABYLON

---

### Module 11: `game/modules/collision-detection.js`
**Lines to Extract**: 429-527
**Size Estimate**: ~100 lines
**Exports**:
```javascript
export function setupCollisionDetection(scene, car, vueApp) { ... }
```
**Dependencies**: BABYLON

---

### Module 12: `game/modules/constants.js`
**Lines to Extract**: 3-16
**Size Estimate**: ~15 lines
**Exports**:
```javascript
export const debugColours = [
    new BABYLON.Color3(1, 0, 1),
    new BABYLON.Color3(1, 0, 0),
    // ... rest
];
export const FILTERS = { CarParts: 1, Environment: 2 };
export const trackRad = 400;
```
**Dependencies**: BABYLON

---

## Dependency Graph

```
babylon-game.js (main orchestrator)
├── constants.js (no dependencies)
├── physics-config.js
│   └── constants.js (FILTERS)
├── steering-system.js
│   └── physics-config.js (CalculateWheelAngles)
├── debug-overlay.js (no dependencies)
├── test-helpers.js
│   └── BABYLON
├── input-handler.js
│   ├── steering-system.js
│   ├── debug-overlay.js
│   └── BABYLON
├── car-factory.js
│   ├── physics-config.js
│   ├── lighting-system.js
│   ├── constants.js
│   └── BABYLON
├── camera-controller.js
│   └── BABYLON
├── lighting-system.js
│   └── BABYLON
├── environment.js
│   └── BABYLON
├── rendering-effects.js
│   └── BABYLON
└── collision-detection.js
    └── BABYLON
```

---

## Main File (babylon-game.js) After Refactoring

**Estimated Size**: ~200-250 lines

**Structure**:
```javascript
// Imports
import { debugColours, FILTERS, trackRad } from './modules/constants.js';
import { setupPhysics, InitTyreMaterial } from './modules/physics-config.js';
import { SteerMode, modeNames, setSteerMode, getCurrentModeName } from './modules/steering-system.js';
import { createDebugOverlay, toggleDebugOverlay, updateDebugOverlay } from './modules/debug-overlay.js';
import { initializeTestHelpers } from './modules/test-helpers.js';
import { InitKeyboardControls } from './modules/input-handler.js';
import { CreateCar } from './modules/car-factory.js';
import { setupCamera } from './modules/camera-controller.js';
import { setupHemisphericLight, addGlowLayer } from './modules/lighting-system.js';
import { createSquareRaceTrack, createTrackWalls, createCollisionTowers, createKnockableBoxes, createBridge } from './modules/environment.js';
import { addReflectionsToCar } from './modules/rendering-effects.js';
import { setupCollisionDetection } from './modules/collision-detection.js';

// Global variables (kept for compatibility)
let scene;
let engine;
let havokInstance = null;
let tyreMaterial;

// Export for external access
export { scene, engine };

// Main initialization
export function initializeGame(vueApp) {
    // Canvas and engine setup
    // Call createScene(vueApp)
    // Setup render loop
    // Setup resize handler
    // Setup focus/click handlers
}

// Reset functions
export async function resetGame(vueApp) { ... }
export function resetBoxes(vueApp) { ... }

// Scene creation orchestrator
async function createScene(vueApp) {
    // Create scene
    // Setup physics (via physics-config)
    // Setup camera (via camera-controller)
    // Setup lighting (via lighting-system)
    // Initialize tyre material (via physics-config)
    // Create car (via car-factory)
    // Create environment (via environment)
    // Add rendering effects (via rendering-effects)
    // Setup collision detection (via collision-detection)
    // Setup render loop observables
    // Return scene
}
```

---

## Extraction Order (For Implementation)

1. **constants.js** - No dependencies, safe to extract first
2. **debug-overlay.js** - No dependencies, pure DOM
3. **test-helpers.js** - Minimal dependencies
4. **physics-config.js** - Many other modules depend on this
5. **steering-system.js** - Depends on physics-config
6. **camera-controller.js** - Simple, no internal dependencies
7. **lighting-system.js** - Simple, no internal dependencies
8. **environment.js** - Simple, no internal dependencies
9. **rendering-effects.js** - Simple, no internal dependencies
10. **collision-detection.js** - Simple, no internal dependencies
11. **car-factory.js** - Depends on physics-config and lighting-system
12. **input-handler.js** - Depends on steering-system and debug-overlay

---

## Key Refactoring Principles

1. **Single Responsibility**: Each module has ONE clear purpose
2. **Pure Functions**: Where possible, functions take explicit parameters instead of relying on globals
3. **Clear Exports**: Each module exports only what's needed
4. **Dependency Injection**: Pass `scene`, `BABYLON`, etc. as parameters
5. **Backwards Compatibility**: Global `scene` and `engine` exports remain for Vue app
6. **No Functionality Changes**: Pure refactoring, zero behavior changes

---

## Validation Strategy

After each module extraction:
1. Game loads without errors
2. All 4 steering modes work identically
3. M key switches modes
4. F11 overlay displays correct data
5. Car physics unchanged
6. Visual appearance unchanged
7. No console errors

---

## Success Metrics

- babylon-game.js: 1469 lines → ~200-250 lines (83% reduction)
- 12 focused modules created
- Each module < 250 lines
- Clear separation of concerns
- Improved maintainability
- NO functionality changes
- All tests pass

---

## Notes

- **Global Variables**: `scene`, `engine`, and `havokInstance` will remain in main file for backwards compatibility with Vue app
- **tyreMaterial**: Will be created in main file via physics-config.InitTyreMaterial() and passed to car-factory
- **SteerMode Enum**: Will live in steering-system.js but be imported by main file for M key handler
- **Manual Control Flag**: Will be managed in input-handler.js and passed to test-helpers

---

## Next Steps

**Phase 3.2**: Extract steering-system.js module (pilot extraction to validate approach)
**Phase 3.3**: Extract remaining modules in dependency order
**Phase 3.4**: Final cleanup of babylon-game.js
