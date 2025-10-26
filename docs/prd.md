# Product Requirements Document (PRD)

## Project: UGV Simulation Web App

### Goal

Simulate UGV movement and control behavior to test and benchmark Xbox controller layouts.

---

## 1. Overview

A standalone browser-based simulator replicating the kinematic and approximate dynamic behavior of a 4-wheel UGV. Each wheel has independent drive torque and steering actuators. The simulator visualizes movement, applies physical constraints (inertia, friction, collisions), and allows control via both on-screen levers and an Xbox controller.

Used internally to evaluate and compare control schemes before applying them to real hardware.

---

## 2. Objectives

* Enable realistic-enough vehicle physics to expose control logic issues (e.g., wheel slip, inertia).
* Support flexible Xbox controller mapping and live reconfiguration.
* Display motor telemetry and UGV internal state.
* Operate entirely in the browser, with no external dependencies.

---

## 3. Functional Requirements

### 3.1 Vehicle Model

| Parameter | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Drive     | 4 independent motors, torque range −100% to +100%.                                                 |
| Steering  | 4 independent actuators, inward limit ±45°, outward limit ±35°. Controlled by duty cycle −1 to +1. |
| Geometry  | Width 100 cm, length 150 cm, wheel diameter 60 cm, height 110 cm.                                  |
| Dynamics  | Include inertia, acceleration, deceleration, and frictional slip.                                  |
| Collision | Detect and respond to collisions with fixed obstacles.                                             |

### 3.2 Environment

* Simple 3D scene.
* Contains a track with checkpoints and static obstacles.
* Checkpoints optional; lap tracking deferred to later milestones.

### 3.3 Controls

**Low-level mode:**

* On-screen draggable levers for 8 actuators (4 drive, 4 steering).
* Possible to lock front wheel together to move together. Same for back wheels. 

**High-level mode (Xbox controller):**

1. Turn both front wheels equally.
2. Turn both rear wheels equally.
3. Swap A and X sides (change front/back).
4. Global torque control (forward/back).
5. Front or rear Ackermann steering.
6. Combined Ackermann front/back steering (opposite directions).
7. Torque adjustment relative to steering angle toggle.
8. Future mappings extendable.

### 3.4 Xbox Input & Mapping

* Support standard browser Gamepad API.
* Allow mapping of controller axes/buttons to simulator actions via on-screen configuration panel.
* Display live raw input (axis and button states).
* Save and load multiple layouts (JSON format).

### 3.5 Visualization & Telemetry

* Display vehicle orientation, wheel angles, torques, and velocity numerically.
* Log internal states for short debugging sessions (no persistent storage).

---

## 4. Non-Functional Requirements

| Category      | Requirement                                               |
| ------------- |-----------------------------------------------------------|
| Platform      | Runs as a single-page web app, desktop browsers only.     |
| Performance   | 24 fps minimum on MacBook Pro-class hardware.             |
| Physics       | Realism using friction and inertia.                       |
| Usability     | Simple layout, minimal configuration to start simulation. |
| Extensibility | Modular design for future physics, maps, or controllers.  |
| Deployment    | Local browser launch; no backend server needed.           |
| Licensing     | Internal use only, no external distribution.              |

---

## 5. Suggested Technology Stacks

* *Framework:* Babylon.js Havok.js
* *Controller:* Browser Gamepad API

---

## 6. Milestones

| Phase                            | Description                                                                                                                | Deliverables                                            |
| -------------------------------- |----------------------------------------------------------------------------------------------------------------------------| ------------------------------------------------------- |
| **M1 – Proof of Concept**        | Implement minimal vehicle body with 4 wheel units, torque/steering inputs, and inertia model. Test friction realism in 3D. | Simple UI, on-screen levers, wheel angle visualization. |
| **M2 – Xbox Integration**        | Integrate Xbox controller via Gamepad API. Add live input display and mapping screen.                                      | Working control bindings and telemetry display.         |
| **M3 – Physics Refinement**      | Introduce collision handling and improved friction simulation.                                                             | Obstacle map, stability under combined torque/steering. |
| **M4 – Track & Checkpoints**     | Add course with checkpoints and progress tracking.                                                                         | Lap time and speed metrics.                             |
| **M5 – Extensibility Framework** | Modularize control logic and physics layers for new features.                                                              | Plugin hooks and configuration loader.                  |

---

## 7. Success Criteria

* Simulator responds smoothly to torque and steering inputs with visible inertia and slip.
* Xbox controller layouts can be reconfigured and compared.
* Real-time telemetry visible on screen.
* Runs consistently at or above 24 fps on target hardware.
