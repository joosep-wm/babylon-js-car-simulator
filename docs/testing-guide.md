# Testing Guide for AI Agents

This guide provides essential testing knowledge for AI agents validating changes to the Babylon.js car simulator.

## Critical Testing Principles

- **Test after EVERY meaningful change** - Never skip testing or defer it
- **Never commit untested code** - All changes must be validated
- **Never proceed if tests fail** - Fix issues immediately
- **Document unexpected behavior** - Record anomalies for investigation

## Testing Infrastructure

### Debug Overlay (F11)

Press **F11** to toggle real-time debug overlay showing:
- Wheel angles (FL, FR, RL, RR) in degrees
- Wheel speeds (FL, FR, RL, RR)
- Current steering mode
- Appears in top-right corner with green terminal-style text

### Console Test Helpers

Available via `window.testHelpers` in browser console.

**Quick Start:**
```javascript
testHelpers.help()  // Show all 20 available commands
```

**Verify All Loaded:**
```javascript
Object.keys(testHelpers).length  // Should return 20
```

#### Wheel Control

```javascript
// Get current wheel state
testHelpers.getWheelStates()
// Returns: {angles: {FL, FR, RL, RR}, speeds: {FL, FR, RL, RR}, manualControlActive: bool}

// Manual wheel angle control (degrees)
testHelpers.setWheelAngle('FL', 45)

// Manual wheel speed control
testHelpers.setWheelSpeed('FR', 30)

// Set all wheels at once
testHelpers.setAllWheels(45, 30)

// Disable manual control (re-enable keyboard)
testHelpers.disableManualControl()

// Automated motor test sequence (~4 seconds)
testHelpers.testMotors()
```

**Important**: Setting wheels manually activates manual control mode, disabling keyboard input. Use `disableManualControl()` to restore keyboard controls.

#### Mode Management

```javascript
// Get current steering mode
testHelpers.getMode()
// Returns: {index: 0, name: 'Front-Wheel', config: {...}}

// Set mode by name or index
testHelpers.setMode('crab')    // By name: 'front', 'rear', 'opposite', 'crab'
testHelpers.setMode(3)         // By index: 0-3

// List all available modes
testHelpers.listModes()
```

#### Performance Metrics

```javascript
// Get current FPS
testHelpers.getFPS()
// Returns: "60.0"

// Get detailed performance metrics
testHelpers.getPerformanceMetrics()
// Returns: {fps, frameTime, drawCalls, physicsTimeStep, physicsSubStep, ...}
```

#### Car State

```javascript
// Get complete car state
testHelpers.getCarState()
// Returns: {position, linearVelocity, angularVelocity, rotation, speed}

// Get car velocity
testHelpers.getCarVelocity()
// Returns: {linear: {x, y, z}, speed}

// Get car rotation
testHelpers.getCarRotation()
// Returns: {radians: {x, y, z}, degrees: {x, y, z}, yaw}

// Reset car position
testHelpers.resetCarPosition()
```

#### Scene State

```javascript
// Get all knockable box states
testHelpers.getBoxStates()
// Returns: [{name, position, velocity, originalPosition}, ...]

// Get scene statistics
testHelpers.getSceneInfo()
// Returns: {totalMeshes, activeMeshes, totalVertices, materials, textures}
```

#### Gamepad Testing

```javascript
// Get controller state
testHelpers.getControllerState()
// Returns: {connected, id, buttons: [...], axes: [...]}

// Show current controller button mapping
testHelpers.listControllerMapping()
```

#### Help System

```javascript
// Show all available commands
testHelpers.help()

// Get help for specific command
testHelpers.help('setMode')
```

### Wheel Naming Convention

- **FL**: Front-Left
- **FR**: Front-Right
- **RL**: Rear-Left
- **RR**: Rear-Right

## Troubleshooting

### Verifying Test Helpers Are Loaded

If test helpers don't work or seem incomplete, verify they loaded correctly:

```javascript
// Check number of available functions (should be 20)
Object.keys(window.testHelpers).length

// List all available functions
Object.keys(window.testHelpers).sort()
```

**Expected output:** 20 functions including:
- Wheel control: `getWheelStates`, `setWheelAngle`, `setWheelSpeed`, `setAllWheels`, `disableManualControl`, `resetCarPosition`, `testMotors`
- Mode management: `getMode`, `setMode`, `listModes`
- Performance: `getFPS`, `getPerformanceMetrics`
- Car state: `getCarState`, `getCarVelocity`, `getCarRotation`
- Scene state: `getBoxStates`, `getSceneInfo`
- Gamepad: `getControllerState`, `listControllerMapping`
- Help: `help`

**If fewer than 20 functions appear:** Browser may have cached old code. See Cache Issues below.

### Cache Issues

**Problem:** Browser caches old JavaScript modules, causing outdated test helpers or missing functions.

**Solution:** The app uses Import Maps for automatic cache-busting. Each page load gets a unique timestamp parameter (e.g., `?v=1234567890`).

**Verification:**
1. Check console for: `📦 Cache-busting enabled for all modules: v=...`
2. In DevTools Network tab: All `.js` files should have `?v=` parameter
3. No files should show "304 Not Modified" or "(disk cache)"

**Manual Cache Clear (if needed):**
- Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard reload
- Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
- All browsers: Open DevTools → Network tab → Check "Disable cache"

**For Persistent Issues:**
- Open in incognito/private browsing mode
- Clear browser cache completely
- Check console for Import Map injection message

## Core Validation Tests

### Basic Functionality Test

Run after every change:

1. **Start game** → No console errors → ✅
2. **Drive forward 10 seconds (W)** → Stable movement → ✅
3. **Cycle through modes (M key)** → All modes accessible → ✅
4. **F11 debug overlay** → Shows correct values → ✅
5. **FPS check** → 60 FPS maintained → ✅
6. **Reset (Enter)** → Restarts cleanly → ✅

### Steering Mode Validation

Test all modes cycle correctly (LB/RB buttons on controller, or use `testHelpers.setMode()`):

**Available Modes** (names may vary based on configuration):
- Use `testHelpers.listModes()` to see actual mode names
- Default modes may include: Traditional Driving, Crab Walk, Opposing Turn, etc.

**Mode Testing Steps:**
1. `testHelpers.listModes()` - View all modes and current active mode
2. `testHelpers.setMode(0)` - Switch to mode 0
3. Drive and test steering behavior
4. `testHelpers.setMode(1)` - Switch to next mode
5. Repeat for all modes

**Example Mode Behaviors:**
- **Front-Wheel Steering**: Front wheels turn with A/D, rear wheels stay straight (RL=0°, RR=0°)
- **Rear-Wheel Steering**: Rear wheels turn with A/D, front wheels stay straight (FL=0°, FR=0°)
- **Opposing Turn**: Front and rear turn opposite directions (very tight turning)
- **Crab Walk**: All wheels turn same direction (sideways/diagonal movement)

### Control System Validation

**Keyboard Controls**:
- W/S: Forward/backward → All 4 wheels respond → ✅
- A/D: Steering → Appropriate wheels turn based on mode → ✅
- Space: Jump → Car leaves ground briefly → ✅
- B: Brake → All wheels stop quickly → ✅
- Enter: Reset game → Scene recreates cleanly → ✅


### Motor Test Sequence

Run `testHelpers.testMotors()` to verify all motors work:
1. FL spins alone for 1 sec → Car moves → ✅
2. FR spins alone for 1 sec → Car moves → ✅
3. RL spins alone for 1 sec → Car moves → ✅
4. RR spins alone for 1 sec → Car moves → ✅

**If any wheel doesn't move**: That motor is broken!

### Physics Validation

**Collision Detection**:
- Drive into orange boxes → Boxes move → Collision detected → ✅
- Drive into brown towers → Collision detected → ✅
- Collision cooldown prevents spam detection

**Physics Stability**:
- No jittering or shaking at rest
- No unexpected flipping or flying
- Smooth acceleration/deceleration
- Stable at high speeds

## Controller System (Xbox/Gamepad)

### Critical Implementation Detail: buttonIndex Property

Controller button mappings use a `buttonIndex` property for remapping. Understanding this is critical for debugging hint displays and button mappings.

**Physical Buttons**: A=0, B=1, X=2, Y=3

**Default Configuration** (no remapping):
```javascript
utilityButtons: {
  0: { action: 'jump', type: 'press' },    // Storage key 0 → Button A
  1: { action: 'brake', type: 'hold' },    // Storage key 1 → Button B
  2: { action: 'reset', type: 'press' },   // Storage key 2 → Button X
  3: { action: 'resetWheels', type: 'press' }  // Storage key 3 → Button Y
}
```

**Remapped Configuration**:
```javascript
utilityButtons: {
  0: { action: 'jump', buttonIndex: 2 },      // Jump on X button (not A)
  1: { action: 'brake', buttonIndex: 0 },     // Brake on A button (not B)
  2: { action: 'reset', buttonIndex: 1 },     // Reset on B button (not X)
  3: { action: 'resetWheels', buttonIndex: 3 } // Reset wheels on Y button
}
```

**CRITICAL**: Always use `config.buttonIndex` property if present:

```javascript
// CORRECT
const buttonIndexNum = config.buttonIndex !== undefined
    ? config.buttonIndex
    : parseInt(storageKey, 10);

// WRONG - ignores remapping
const buttonIndexNum = parseInt(storageKey, 10);
```

**Why This Matters**:
- Default modes: no `buttonIndex` property → storage keys match button positions
- Edited modes: has `buttonIndex` property → allows custom button mapping
- Using storage keys directly breaks hints and mappings for customized configurations
- Bug is hidden with default configs (storage keys = button indices)
- Only appears when users customize button mappings

**Testing Controller Hints**:
1. Check default configuration → Hints show A/B/X/Y correctly → ✅
2. Create custom mapping (via config UI) → Hints update to match → ✅
3. Verify `buttonIndex` property used, not storage key → ✅

## Red Flags (Stop and Fix Immediately)

- ❌ Console errors (especially physics warnings)
- ❌ FPS drops below 50
- ❌ Vehicle flips or flies away unexpectedly
- ❌ Wheels jitter rapidly
- ❌ NaN values in debug overlay
- ❌ Controls become unresponsive
- ❌ Physics solver warnings in console
- ❌ Memory leaks (check after 5+ minutes)

## Practical Testing Examples

### Mode Testing Workflow

```javascript
// Quick mode verification
testHelpers.listModes()           // See all available modes
testHelpers.setMode('crab')       // Switch to crab mode
testHelpers.getMode()             // Verify mode changed

// Test mode while driving
testHelpers.setMode(0)            // Front-wheel mode
// Drive forward and turn left with W+A
testHelpers.setMode(3)            // Switch to crab while moving
// Observe smooth transition
```

### Performance Monitoring

```javascript
// Quick FPS check
testHelpers.getFPS()              // Should return "60.0"

// Detailed performance analysis
const metrics = testHelpers.getPerformanceMetrics()
console.log(metrics)
// Check: fps > 55, frameTime < 20ms
```

### Physics Validation

```javascript
// Check car is stable at rest
testHelpers.getCarState()
// velocity should be near zero

// Verify collision detection
const boxes = testHelpers.getBoxStates()
// Drive into a box, check again
const boxesAfter = testHelpers.getBoxStates()
// Compare positions - moved boxes should have different positions
```

### Controller Testing

```javascript
// Check if controller is connected
const controller = testHelpers.getControllerState()
if (controller.connected) {
    console.log('Controller:', controller.id)
    // Press buttons and check they appear
}

// Verify button mappings
testHelpers.listControllerMapping()
// Should match what's shown in UI hints
```

### Automated Test Sequence

```javascript
// Complete validation sequence
async function fullTest() {
    console.log('=== Starting Full Test ===')

    // 1. Performance check
    const fps = testHelpers.getFPS()
    console.log('FPS:', fps)

    // 2. Mode cycling
    for (let i = 0; i < 4; i++) {
        testHelpers.setMode(i)
        await new Promise(r => setTimeout(r, 500))
        console.log('Mode', i, ':', testHelpers.getMode().name)
    }

    // 3. Motor test
    await testHelpers.testMotors()

    // 4. State check
    const carState = testHelpers.getCarState()
    console.log('Speed:', carState.speed)

    console.log('=== Test Complete ===')
}

fullTest()
```

## Technical Notes

### Cache-Busting Implementation

The application uses **ES6 Import Maps** to prevent module caching issues:

**How It Works:**
1. `index.html` generates a unique timestamp on each page load
2. All 31 JavaScript modules are mapped with `?v=timestamp` parameter
3. Browser treats each load as a fresh module, bypassing cache
4. Works for both top-level and nested static imports

**Implementation Location:**
- **index.html**: Import Map injection script
- **index.js**: Cache-busting verification

**Console Verification:**
```
📦 Cache-busting enabled for all modules: v=1234567890
📦 Cache-busting active: v=1234567890
```

**Network Verification:**
All `.js` files load with `?v=` parameter:
```
/index.js?v=1234567890
/game/modules/test-helpers.js?v=1234567890
/game/babylon-game.js?v=1234567890
...
```

**Why This Matters:**
- ES6 modules are aggressively cached by browsers
- Without cache-busting, code updates may not load
- Nested imports (static `import` statements) also need cache-busting
- Import Maps solve this by rewriting all module specifiers

**Troubleshooting:**
- If test helpers are incomplete (< 20 functions): cache issue
- Check Network tab for `?v=` parameters on all modules
- Verify no "304 Not Modified" responses
- test-helpers.js should be ~17KB (not ~4KB cached version)

## Testing Best Practices

1. **Visual Confirmation** - Don't trust console alone, watch the wheels
2. **Use Test Helpers Liberally** - Interactive testing catches more bugs
3. **Test Mode Transitions** - Switch modes while moving to catch edge cases
4. **Check Edge Cases** - Test at max speed, full lock, zero speed
5. **Verify Controller Hints** - Especially after config changes
6. **Check Mobile & Desktop** - Both input methods must work

**Key Principle**: If you're not confident a test passed, it FAILED. Investigate and fix!
