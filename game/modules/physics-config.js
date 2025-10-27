// physics-config.js - Physics engine setup and helper functions

import { FILTERS } from './constants.js';

export async function setupPhysics(scene) {
    const havokPlugin = new BABYLON.HavokPlugin(true, await HavokPhysics());
    scene.enablePhysics(new BABYLON.Vector3(0, -150, 0), havokPlugin);
    scene.getPhysicsEngine().setTimeStep(1 / 500);
    scene.getPhysicsEngine().setVelocityLimits(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    scene.getPhysicsEngine().setSubTimeStep(1.8);
}

export function InitTyreMaterial(scene) {
    const tyreMaterial = new BABYLON.StandardMaterial("Tyre", scene);
    const tireTexture = new BABYLON.Texture("game/textures/tire.png", scene);
    tireTexture.wAng = -Math.PI / 2;
    tireTexture.vScale = 0.4;
    tyreMaterial.diffuseTexture = tireTexture;
    return tyreMaterial;
}

export function AddWheelPhysics(mesh, mass, bounce, friction, scene) {
    const physicsShape = new BABYLON.PhysicsShapeCylinder(new BABYLON.Vector3(-0.8, 0, 0), new BABYLON.Vector3(0.8, 0, 0), 2, scene);
    const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

export function AddAxlePhysics(mesh, mass, bounce, friction, scene) {
    const physicsShape = new BABYLON.PhysicsShapeCylinder(new BABYLON.Vector3(-0.8, 0, 0), new BABYLON.Vector3(0.8, 0, 0), 1.8, scene);
    const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

export function AddDynamicPhysics(mesh, mass, bounce, friction, centerOfMass, scene) {
    const physicsShape = new BABYLON.PhysicsShapeMesh(mesh, scene);
    const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass, centerOfMass: centerOfMass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

export function AddDynamicPhysicsConvex(mesh, mass, bounce, friction, centerOfMass, scene) {
    const physicsShape = new BABYLON.PhysicsShapeConvexHull(mesh, scene);
    const physicsBody = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
    physicsBody.setMassProperties({ mass: mass, centerOfMass: centerOfMass });
    physicsShape.material = { restitution: bounce, friction: friction };
    physicsBody.shape = physicsShape;

    return physicsBody;
}

export function FilterMeshCollisions(mesh) {
    mesh.physicsBody.shape.filterMembershipMask = FILTERS.CarParts;
    mesh.physicsBody.shape.filterCollideMask = FILTERS.Environment;
}

export function AttachAxleToFrame(axle, frame, hasSteering, scene) {
    const aPos = axle.transformNode.position;

    const joint = new BABYLON.Physics6DoFConstraint(
        {
            pivotA: new BABYLON.Vector3(0, 0, 0),
            pivotB: new BABYLON.Vector3(aPos.x, aPos.y, aPos.z),
        },
        [
            {
                axis: BABYLON.PhysicsConstraintAxis.LINEAR_X,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y,
                minLimit: -0.15,
                maxLimit: 0.15,
                stiffness: 400000,
                damping: 7000
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                minLimit: -0.25,
                maxLimit: 0.25,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: hasSteering ? null : 0,
                maxLimit: hasSteering ? null : 0,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: -0.05,
                maxLimit: 0.05,
            },
        ],
        scene
    );

    axle.addConstraint(frame, joint);

    if (hasSteering)
        AttachSteering(joint);

    return joint;
}

export function CreateWheelJoint(axle, wheel, scene) {
    const motorJoint = new BABYLON.Physics6DoFConstraint(
        {},
        [
            {
                axis: BABYLON.PhysicsConstraintAxis.LINEAR_DISTANCE,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
        ],
        scene
    );

    axle.addChild(wheel);
    axle.physicsBody.addConstraint(wheel.physicsBody, motorJoint);

    return motorJoint;
}

export function CreatePoweredWheelJoint(axle, wheel, scene) {
    const motorJoint = CreateWheelJoint(axle, wheel, scene);

    motorJoint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_X, BABYLON.PhysicsConstraintMotorType.VELOCITY);
    motorJoint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 330000);
    motorJoint.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_X, 0);

    return motorJoint;
}

export function AttachSteering(joint) {
    joint.setAxisMotorType(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, BABYLON.PhysicsConstraintMotorType.POSITION);
    joint.setAxisMotorMaxForce(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 280000);
    joint.setAxisMotorTarget(BABYLON.PhysicsConstraintAxis.ANGULAR_Y, 0);

    return joint;
}

export function CalculateWheelAngles(averageAngle) {
    const wheelbase = 16;
    const trackWidth = 11;

    const avgRadius = wheelbase / Math.tan(averageAngle);
    const innerRadius = avgRadius - trackWidth / 2;
    const outerRadius = avgRadius + trackWidth / 2;
    const innerAngle = Math.atan(wheelbase / innerRadius);
    const outerAngle = Math.atan(wheelbase / outerRadius);

    return [innerAngle, outerAngle];
}
