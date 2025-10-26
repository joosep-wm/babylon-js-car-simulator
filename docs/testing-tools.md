# Testing Tools

## Debug Overlay (F11)

Press **F11** to toggle a real-time debug overlay showing:
- Wheel angles (FL, FR, RL, RR) in degrees
- Wheel speeds (FL, FR, RL, RR)
- Steering mode (currently "N/A", will show mode in Phase 2)

The overlay appears in the top-right corner with green terminal-style text.

## Console Test Helpers

Access via `window.testHelpers` in browser console (F12).

### Query State

```javascript
testHelpers.getWheelStates()
// Returns: { angles: {FL, FR, RL, RR}, speeds: {FL, FR, RL, RR}, manualControlActive: boolean }
```

### Manual Control

```javascript
// Set individual wheel angle (degrees)
testHelpers.setWheelAngle('FL', 45)

// Set individual wheel speed
testHelpers.setWheelSpeed('RL', 30)

// Set all wheels at once
testHelpers.setAllWheels(90, 20)  // angle, speed

// Re-enable keyboard controls
testHelpers.disableManualControl()
```

**Important**: Manual control commands disable keyboard input until you call `disableManualControl()`.

### Utility Functions

```javascript
// Reset car position to origin
testHelpers.resetCarPosition()

// Run automated motor test (4 seconds)
await testHelpers.testMotors()
```

## Quick Testing Examples

**Test rear-wheel steering:**
```javascript
testHelpers.setWheelAngle('RL', 30)
testHelpers.setWheelSpeed('RL', 20)
// Car moves in curved path using rear-left wheel
```

**Test differential drive (tank steering):**
```javascript
testHelpers.setWheelSpeed('FL', 20)   // Left forward
testHelpers.setWheelSpeed('RL', 20)
testHelpers.setWheelSpeed('FR', -20)  // Right backward
testHelpers.setWheelSpeed('RR', -20)
// Car rotates in place
```

**Test all wheels sideways (crab):**
```javascript
testHelpers.setAllWheels(90, 20)
// All wheels turn 90°, car moves sideways
```

**Reset to keyboard control:**
```javascript
testHelpers.disableManualControl()
// Now W/A/S/D keys work again
```

## Wheel Naming Convention

- **FL**: Front-Left
- **FR**: Front-Right
- **RL**: Rear-Left
- **RR**: Rear-Right

## Implementation

- Test helpers: `game/babylon-game.js` lines 1319-1412
- Debug overlay: `game/babylon-game.js` lines 1238-1317
- Manual control flag prevents keyboard override when test helpers are active
