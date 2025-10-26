# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D car racing game built with Babylon.js and Vue.js 3, featuring realistic physics powered by Havok Physics Engine, custom 3D car models (GLB/GLTF), dynamic lighting system, and cross-platform support (desktop + mobile).

## Development Commands

### Running the Game
```bash
# Using Python (default)
npm run start
# or
npm run serve

# Using Node.js
npm run serve-node

# Using PHP
npm run serve-php
```

**Important**: The project uses ES6 modules which require a local web server. Never use `file://` protocol. After starting the server, open `http://localhost:8080` in a browser.

## Architecture

## Available MCP Servers

* `playwright-mcp`: Browser access for debugging and manual validation
* `context7`: For fetching examples of 3rd party libraries

## Notable Files and Directories

* `temp/`: Temporary files, plans, and development notes
* `temp/xbox-controller-design.md`: Design plan for Xbox controller support
* `temp/development-plan.md`: Current development plan focused on active and next tasks
* `temp/M1-phase1-archive.md`: M1 phase 1 archive
* `temp/M1-phase2-archive.md`: M1 phase 2 archive
* `temp/M1-phase3-archive.md`: M1 phase 3 archive
* `temp/testing-strategy.md`: Comprehensive incremental testing strategy for validating changes
* `docs/prd.md`: Product Requirements Document with full specifications
* `docs/testing-tools.md`: Debug overlay (F11) and console test helpers (`window.testHelpers`) reference

### Entry Point Flow
1. `index.html` - Loads Babylon.js, Vue.js, Havok Physics, and module scripts
2. `index.js` - Main entry point that initializes Vue app and Babylon.js game
3. `vue-app.js` - Creates Vue.js app with device detection and state management
4. `game/babylon-game.js` - Core game engine with physics, rendering, and controls

### Component-Based UI Architecture
- **Vue.js 3 Composition API** for reactive components
- **Event-driven communication** between components via Vue events
- **Props-based data flow** from parent to child components
- **Modular CSS** - each component has its own stylesheet in `css/`

Components:
- `components/info-panel.js` - Debug/telemetry panel (F12 toggle)
- `components/desktop-controls.js` - Keyboard controls display
- `components/mobile-controls.js` - Touch joystick and buttons

### Babylon.js Game Architecture

**Global State** (exported from `babylon-game.js`):
- `scene` - Main Babylon.js scene instance
- `engine` - Babylon.js rendering engine
- `havokInstance` - Havok physics instance

**Key Systems**:
1. **Physics System** - Havok Physics with custom car dynamics
   - 6DoF (Degrees of Freedom) constraints for wheel suspension
   - ConvexHull collision detection for custom 3D car models
   - Physics-based collision detection via velocity changes
   - Collision cooldowns to prevent spam detection

2. **Car System** - Modular vehicle with separate components
   - CarBody (custom GLB model or fallback box)
   - 4 Wheels (cylinders with tire textures)
   - 4 Axles (steering and suspension joints)
   - Front wheels have steering, rear wheels fixed
   - Physics constraints: 6DoF joints connect axles to car frame

3. **Lighting System**
   - Warm white headlights (#ddc584) with SpotLight
   - Red taillights with SpotLight
   - ESM (Exponential Shadow Map) shadow mapping
   - Reduced ambient lighting (0.5 intensity) for dramatic effect

4. **Control System**
   - Keyboard: WASD/Arrows (movement), Space (jump), B (brake), Enter (reset)
   - Touch: Virtual joystick + touch buttons
   - Controls are merged in `InitKeyboardControls()` - both keyboard and touch inputs combined

5. **Camera System**
   - FollowCamera that tracks the car
   - Mouse-drag rotation around car (only when mouse is down)
   - Smooth camera acceleration and max speed limits

### Device Detection

Uses **CSS media queries** for accurate touch device detection:
```javascript
// Primary detection: (hover: none) & (pointer: coarse) & !(any-hover: hover)
this._mqCoarseNoHover = window.matchMedia('(hover: none) and (pointer: coarse)');
this._mqAnyHover = window.matchMedia('(any-hover: hover)');
```

Fallback: Touch event listeners + navigator.maxTouchPoints for older browsers.

## Game Scene Structure

**Environment**:
- Square race track (800x800 units, gray ground at y=-20)
- White studio walls around track perimeter
- 8 collision towers (brown boxes, static physics)
- Bridge with ramps (spans X=185 to X=-75, height=25)

**Interactive Objects**:
- 5 knockable boxes (orange, dynamic physics, mass=20)
- Box movement detection: triggers when moved >3 units from settled position
- 2-second settling period after scene creation before detection starts

**Car Position**:
- Starts at (0, 5, 0) for custom model
- Default spawn is center of track

## Physics Configuration

```javascript
// Physics engine settings
scene.getPhysicsEngine().setTimeStep(1 / 500);
scene.getPhysicsEngine().setVelocityLimits(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
scene.getPhysicsEngine().setSubTimeStep(1.8);

// Car physics
carFrame: mass=5000, restitution=0, friction=0.8
wheels: mass=150, restitution=0, friction=2.5
axles: mass=190, restitution=0, friction=0
```

## Custom Car Model Loading

The game loads `game/models/car.glb`:
- Mesh scaling: 14x (to cover wheels)
- Rotation: 90° around Y-axis
- Position: (0, 2.3, 0)
- Physics: ConvexHull shape for complex collision
- Fallback: Box mesh if GLB loading fails

When adding new car models:
1. Place GLB file in `game/models/car.glb`
2. Model automatically loads via `importCustomCar()`
3. Ensure proper scaling/rotation in code if needed

## Important Implementation Details

### Collision Detection System
- Uses **physics velocity changes** rather than mesh intersections
- Tracks velocity delta per frame: `speedDifference > 5` triggers collision
- Cooldown system: 500ms for general collisions, 1000ms per box
- Box settling: 2-second delay after scene creation before detection activates

### Reset System
Two types:
1. **Full Game Reset** (`resetGame()`): Disposes entire scene and recreates it
2. **Box Reset** (`resetBoxes()`): Resets box positions/velocities only

### Vue-Babylon Communication
- Vue app instance passed to `initializeGame(vueApp)`
- Game updates Vue reactive data each frame via `scene.onBeforeRenderObservable`
- Vue components emit events that update `vueApp.touchControls` object
- Touch controls merged with keyboard in `InitKeyboardControls()`

### Materials and Reflections
- ReflectionProbe on car for environment reflections
- GlowLayer for lighting effects (intensity=4, blur=64)
- Car material receives reflection texture from probe

## Common Development Tasks

### Adding New Game Objects
1. Create mesh with `BABYLON.MeshBuilder`
2. Set position and material
3. Add physics with `new BABYLON.PhysicsAggregate(mesh, shapeType, options, scene)`
4. For dynamic objects, store `originalPosition` and `originalRotation` for reset

### Modifying Car Physics
- Wheel motor force: `motorJoint.setAxisMotorMaxForce()` in `CreatePoweredWheelJoint()`
- Steering limits: `maxSteeringAngle` in `InitKeyboardControls()`
- Speed limits: `maxSpeed` variable
- Jump force: `jumpForce` variable (currently 3000)

### Adding New Controls
1. Add key handling in `InitKeyboardControls()` keyboard observable
2. Add touch button in `components/mobile-controls.js`
3. Merge inputs in `scene.onBeforeRenderObservable` (check both keyboard and touch)
4. Update `vueApp.direction` string for UI display

## Dependencies

**CDN Libraries** (loaded in index.html):
- Babylon.js v8.31.0 (core + loaders + Havok physics + GUI)
- Vue.js 3 (global build)

**Assets**:
- `game/models/car.glb` - Custom 3D car model
- `game/textures/tire.png` - Wheel texture
- `game/textures/up.png` - Environment texture

## Browser Requirements

- WebGL2 support (most modern browsers)
- ES6 module support
- GLB/GLTF loader support
- Minimum: Chrome 90, Firefox 85, Safari 14, Edge 90

## Code Style Notes

- Physics filters: `FILTERS.CarParts` (value: 1) for car components, `FILTERS.Environment` (value: 2) for world
- Debug colors: Array of `BABYLON.Color3` for visualizing different car faces
- Console logging: Extensive use of emoji prefixes for categorization (🚗, 🎮, ✅, ❌, etc.)
- Async/await for model loading and scene creation

## Testing Methodology

**Critical Rule**: Test after EVERY meaningful change, not just at the end!

See `temp/testing-strategy.md` for comprehensive testing approach including:

### Testing Infrastructure
- **Console Test Helpers** (`window.testHelpers`) - Interactive testing via browser console
- **Visual Debug Overlay** (F11 toggle) - Real-time wheel data on screen
- **Test Checklist Template** - Track validation status

### Testing Types
1. **Visual Tests** - Watch wheels and observe behavior
2. **Console Tests** - Programmatic validation via testHelpers
3. **Overlay Tests** - Check numeric values in debug display
4. **Stress Tests** - Full speed, extreme angles, edge cases
5. **Regression Tests** - Ensure old features still work

### Git Workflow for Changes
1. Make small, focused change
2. Run relevant tests from testing-strategy.md
3. Visual confirmation (don't trust console alone)
4. Git commit only if ALL tests pass
5. If test fails: fix immediately or rollback

### Test Helpers (when implemented)
```javascript
// Available in browser console after implementation
window.testHelpers.getWheelStates()           // Check current state
window.testHelpers.setWheelAngle('FL', 45)    // Manual wheel angle control
window.testHelpers.setWheelSpeed('FR', 30)    // Manual wheel speed control
window.testHelpers.testMotors()               // Automated motor sequence test
window.testHelpers.resetCarPosition()         // Quick position reset
```

### Key Testing Principles
- ❌ Never skip a test - "I'll test it later" = disaster
- ❌ Never commit untested code
- ❌ Never proceed if test fails
- ✅ Test immediately after change
- ✅ Document unexpected behavior
