// lighting-system.js - Lights configuration for the game

export function setupHemisphericLight(scene) {
    const hemisphericLight = new BABYLON.HemisphericLight("Hemispheric Light", new BABYLON.Vector3(1, 1, 0), scene);
    hemisphericLight.intensity = 0.5;
    return hemisphericLight;
}

export function createTaillights(carFrame, scene) {
    const leftTaillight = BABYLON.MeshBuilder.CreateSphere("leftTaillight", { diameter: 1 }, scene);
    leftTaillight.position = new BABYLON.Vector3(5.2, 1.65, -13.5);
    leftTaillight.parent = carFrame;

    const rightTaillight = BABYLON.MeshBuilder.CreateSphere("rightTaillight", { diameter: 1 }, scene);
    rightTaillight.position = new BABYLON.Vector3(-5.2, 1.65, -13.5);
    rightTaillight.parent = carFrame;

    const taillightMaterial = new BABYLON.StandardMaterial("taillightMaterial", scene);
    taillightMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    taillightMaterial.emissiveColor = new BABYLON.Color3(0.8, 0, 0);
    taillightMaterial.specularColor = new BABYLON.Color3(0.2, 0, 0);

    leftTaillight.material = taillightMaterial;
    rightTaillight.material = taillightMaterial;

    const centralTaillightPosition = new BABYLON.Vector3(0, 1.65, -13.5);
    const taillightSpot = new BABYLON.SpotLight("taillightSpot",
        centralTaillightPosition,
        new BABYLON.Vector3(0, 0, -1),
        Math.PI / 1.2,
        2,
        scene);
    taillightSpot.diffuse = new BABYLON.Color3(1, 0, 0);
    taillightSpot.specular = new BABYLON.Color3(0.3, 0, 0);
    taillightSpot.intensity = 1.5;
    taillightSpot.range = 25;
    taillightSpot.parent = carFrame;

    carFrame.receiveShadows = true;

    const groundMesh = scene.getMeshByName("SquareTrack");
    if (groundMesh) {
        groundMesh.receiveShadows = true;
    }

    if (carFrame.material) {
        carFrame.material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        carFrame.material.specularPower = 16;
    }

    console.log("Red taillights with ESM shadows and focused beams created");
}

export function createHeadlights(carFrame, scene) {
    const leftHeadlight = BABYLON.MeshBuilder.CreateCylinder("leftHeadlight", {
        diameter: 2.1,
        height: 0.8
    }, scene);
    leftHeadlight.position = new BABYLON.Vector3(5.1, 1.65, 13.5);
    leftHeadlight.rotation.x = Math.PI / 2;
    leftHeadlight.parent = carFrame;

    const rightHeadlight = BABYLON.MeshBuilder.CreateCylinder("rightHeadlight", {
        diameter: 2.1,
        height: 0.8
    }, scene);
    rightHeadlight.position = new BABYLON.Vector3(-5.1, 1.65, 13.5);
    rightHeadlight.rotation.x = Math.PI / 2;
    rightHeadlight.parent = carFrame;

    const headlightMaterial = new BABYLON.StandardMaterial("headlightMaterial", scene);
    headlightMaterial.diffuseColor = new BABYLON.Color3(0.867, 0.773, 0.518);
    headlightMaterial.emissiveColor = new BABYLON.Color3(0.867, 0.773, 0.518);
    headlightMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    leftHeadlight.material = headlightMaterial;
    rightHeadlight.material = headlightMaterial;

    const centralHeadlightPosition = new BABYLON.Vector3(0, 1.65, 13.5);
    const headlightSpot = new BABYLON.SpotLight("headlightSpot",
        centralHeadlightPosition,
        new BABYLON.Vector3(0, -0.3, 1),
        Math.PI / 2,
        2,
        scene);
    headlightSpot.diffuse = new BABYLON.Color3(0.867, 0.773, 0.518);
    headlightSpot.specular = new BABYLON.Color3(0.8, 0.7, 0.5);
    headlightSpot.intensity = 3.0;
    headlightSpot.range = 60;
    headlightSpot.parent = carFrame;

    const headlightShadowGenerator = new BABYLON.ShadowGenerator(1024, headlightSpot);
    headlightShadowGenerator.useBlurExponentialShadowMap = true;
    headlightShadowGenerator.blurBoxOffset = 2.0;
    headlightShadowGenerator.bias = 0.00001;

    const groundMesh = scene.getMeshByName("SquareTrack");
    if (groundMesh) {
        headlightShadowGenerator.getShadowMap().renderList.push(carFrame);

        const wheels = scene.meshes.filter(mesh => mesh.name.includes("Wheel"));
        wheels.forEach(wheel => {
            headlightShadowGenerator.getShadowMap().renderList.push(wheel);
        });
    }

    console.log("Warm white headlights with shadows created");
}

export function addGlowLayer(scene) {
    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 4;
    glowLayer.blurKernelSize = 64;
    return glowLayer;
}
