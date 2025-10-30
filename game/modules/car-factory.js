// car-factory.js - Car creation and assembly

import { debugColours } from './constants.js';
import {
    AddWheelPhysics,
    AddAxlePhysics,
    AddDynamicPhysics,
    AddDynamicPhysicsConvex,
    FilterMeshCollisions,
    AttachAxleToFrame,
    CreatePoweredWheelJoint
} from './physics-config.js';
import { createTaillights, createHeadlights } from './lighting-system.js';

export async function CreateCar(vueApp, scene, tyreMaterial, initKeyboardControls, gamepadManager, controlMapper, modeManager) {
    const customCarBody = await importCustomCar(scene);

    let carFrame;
    if (customCarBody) {
        carFrame = customCarBody;
    } else {
        console.error("Custom car loading failed! Using fallback box.");
        carFrame = BABYLON.MeshBuilder.CreateBox("CarBody", { height: 1, width: 12, depth: 24, faceColors: debugColours });
        carFrame.position = new BABYLON.Vector3(0, 1, 0);
        carFrame.visibility = 0.5;
        const carFrameBody = AddDynamicPhysics(carFrame, 2000, 0, 0, new BABYLON.Vector3(0, -2.5, 1), scene);
        FilterMeshCollisions(carFrame);

        const flWheel = CreateWheel(new BABYLON.Vector3(5, 0, 8), tyreMaterial, scene);
        const flAxle = CreateAxle(new BABYLON.Vector3(5, 0, 8), scene);
        const frWheel = CreateWheel(new BABYLON.Vector3(-5, 0, 8), tyreMaterial, scene);
        const frAxle = CreateAxle(new BABYLON.Vector3(-5, 0, 8), scene);
        const rlWheel = CreateWheel(new BABYLON.Vector3(5, 0, -10), tyreMaterial, scene);
        const rlAxle = CreateAxle(new BABYLON.Vector3(5, 0, -10), scene);
        const rrWheel = CreateWheel(new BABYLON.Vector3(-5, 0, -10), tyreMaterial, scene);
        const rrAxle = CreateAxle(new BABYLON.Vector3(-5, 0, -10), scene);

        const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel, scene);
        const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel, scene);
        const poweredWheelMotorC = CreatePoweredWheelJoint(rlAxle, rlWheel, scene);
        const poweredWheelMotorD = CreatePoweredWheelJoint(rrAxle, rrWheel, scene);

        const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelC = AttachAxleToFrame(rlAxle.physicsBody, carFrame.physicsBody, true, scene);
        const steerWheelD = AttachAxleToFrame(rrAxle.physicsBody, carFrame.physicsBody, true, scene);

        const wheels = { FL: flWheel, FR: frWheel, RL: rlWheel, RR: rrWheel };
        const axles = { FL: flAxle, FR: frAxle, RL: rlAxle, RR: rrAxle };
        const steeringJoints = { FL: steerWheelA, FR: steerWheelB, RL: steerWheelC, RR: steerWheelD };
        const motorJoints = { FL: poweredWheelMotorA, FR: poweredWheelMotorB, RL: poweredWheelMotorC, RR: poweredWheelMotorD };

        console.log('Wheels:', wheels);
        console.log('Axles:', axles);
        console.log('Steering joints:', steeringJoints);
        console.log('Motor joints:', motorJoints);

        initKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints, scene, gamepadManager, controlMapper, modeManager);

        return carFrame;
    }

    carFrame.position = new BABYLON.Vector3(0, 5, 0);

    const carFrameBody = AddDynamicPhysicsConvex(carFrame, 5000, 0, 0.8, new BABYLON.Vector3(0, -2.5, 1), scene);
    FilterMeshCollisions(carFrame);

    const flWheel = CreateWheel(new BABYLON.Vector3(5, 0, 8), tyreMaterial, scene);
    const flAxle = CreateAxle(new BABYLON.Vector3(5, 0, 8), scene);
    const frWheel = CreateWheel(new BABYLON.Vector3(-5, 0, 8), tyreMaterial, scene);
    const frAxle = CreateAxle(new BABYLON.Vector3(-5, 0, 8), scene);
    const rlWheel = CreateWheel(new BABYLON.Vector3(5, 0, -8), tyreMaterial, scene);
    const rlAxle = CreateAxle(new BABYLON.Vector3(5, 0, -8), scene);
    const rrWheel = CreateWheel(new BABYLON.Vector3(-5, 0, -8), tyreMaterial, scene);
    const rrAxle = CreateAxle(new BABYLON.Vector3(-5, 0, -8), scene);

    for (const mesh of [flAxle, frAxle, rlAxle, rrAxle]) {
        carFrame.addChild(mesh);
        AddAxlePhysics(mesh, 190, 0, 0, scene);
        FilterMeshCollisions(mesh);
    }

    for (const mesh of [flWheel, frWheel, rlWheel, rrWheel]) {
        AddWheelPhysics(mesh, 150, 0, 2.5, scene);
        FilterMeshCollisions(mesh);
    }

    const poweredWheelMotorA = CreatePoweredWheelJoint(flAxle, flWheel, scene);
    const poweredWheelMotorB = CreatePoweredWheelJoint(frAxle, frWheel, scene);
    const poweredWheelMotorC = CreatePoweredWheelJoint(rlAxle, rlWheel, scene);
    const poweredWheelMotorD = CreatePoweredWheelJoint(rrAxle, rrWheel, scene);

    const steerWheelA = AttachAxleToFrame(flAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelB = AttachAxleToFrame(frAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelC = AttachAxleToFrame(rlAxle.physicsBody, carFrameBody, true, scene);
    const steerWheelD = AttachAxleToFrame(rrAxle.physicsBody, carFrameBody, true, scene);

    const wheels = { FL: flWheel, FR: frWheel, RL: rlWheel, RR: rrWheel };
    const axles = { FL: flAxle, FR: frAxle, RL: rlAxle, RR: rrAxle };
    const steeringJoints = { FL: steerWheelA, FR: steerWheelB, RL: steerWheelC, RR: steerWheelD };
    const motorJoints = { FL: poweredWheelMotorA, FR: poweredWheelMotorB, RL: poweredWheelMotorC, RR: poweredWheelMotorD };

    console.log('Wheels:', wheels);
    console.log('Axles:', axles);
    console.log('Steering joints:', steeringJoints);
    console.log('Motor joints:', motorJoints);

    initKeyboardControls(poweredWheelMotorA, poweredWheelMotorB, steerWheelA, steerWheelB, carFrame, vueApp, steeringJoints, motorJoints, scene, gamepadManager, controlMapper, modeManager);

    createTaillights(carFrame, scene);
    createHeadlights(carFrame, scene);

    return carFrame;
}

export function CreateAxle(position, scene) {
    const axleMesh = BABYLON.MeshBuilder.CreateBox("Axle", { height: 1, width: 2.5, depth: 1, faceColors: debugColours });
    axleMesh.position = position;
    return axleMesh;
}

export function CreateWheel(position, tyreMaterial, scene) {
    const faceUVforArrowTexture = [
        new BABYLON.Vector4(0, 0, 0, 0),
        new BABYLON.Vector4(0, 1, 1, 0),
        new BABYLON.Vector4(0, 0, 0, 0),
    ];

    const wheelMesh = BABYLON.MeshBuilder.CreateCylinder("Wheel", { height: 1.6, diameter: 4, faceUV: faceUVforArrowTexture });
    wheelMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
    wheelMesh.bakeCurrentTransformIntoVertices();
    wheelMesh.position = position;
    wheelMesh.material = tyreMaterial;
    return wheelMesh;
}

async function importCustomCar(scene) {
    try {
        console.log("Loading custom car model...");

        const importResult = await BABYLON.SceneLoader.ImportMeshAsync("", "game/models/", "car.glb", scene);

        console.log("Car model loaded successfully:", importResult);

        const importRoot = importResult.meshes[0];

        if (importRoot) {
            importRoot.scaling = new BABYLON.Vector3(14, 14, 14);

            if (importRoot.rotationQuaternion) {
                importRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            importRoot.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

            importRoot.position = new BABYLON.Vector3(0, 2.3, 0);

            if (!importRoot.position) {
                importRoot.position = new BABYLON.Vector3(0, 2, 0);
            }

            importRoot.bakeCurrentTransformIntoVertices();

            const meshesToMerge = importResult.meshes.filter(mesh =>
                mesh.getClassName() === "Mesh" && mesh !== importRoot
            );

            let carBody;
            if (meshesToMerge.length > 0) {
                carBody = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
                carBody.name = "CarBody";
            } else {
                importRoot.name = "CarBody";
                carBody = importRoot;
            }

            console.log("Car body created:", carBody.name);

            if (!carBody.position) {
                carBody.position = new BABYLON.Vector3(0, 0, 0);
            }

            return carBody;

        } else {
            console.error("No root mesh found in car model");
            return null;
        }

    } catch (error) {
        console.error("Error loading car model:", error);
        console.log("Make sure the car.glb file exists in game/models/ folder");
        return null;
    }
}
