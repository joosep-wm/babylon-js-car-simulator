// camera-controller.js - Camera setup and mouse controls

export function setupCamera(scene, car) {
    const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
    camera.radius = 50;
    camera.heightOffset = 20;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.035;
    camera.maxCameraSpeed = 10;

    let isMouseDown = false;
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                isMouseDown = true;
                break;

            case BABYLON.PointerEventTypes.POINTERUP:
                isMouseDown = false;
                break;

            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (isMouseDown) {
                    camera.rotationOffset += pointerInfo.event.movementX * 0.5;
                }
                break;
        }
    });

    if (car && car.position) {
        camera.lockedTarget = car;
        console.log("✅ Camera locked to car:", car.name);
    } else {
        console.error("❌ Car not properly created for camera targeting");
    }

    return camera;
}
