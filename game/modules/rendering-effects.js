// rendering-effects.js - Reflection probes and glow effects

export function addReflectionsToCar(scene) {
    const carProbe = new BABYLON.ReflectionProbe("reflections", 256, scene, false, false);

    for (const mesh of scene.meshes) {
        carProbe.renderList.push(mesh);
    }

    const reflection = carProbe.cubeTexture;
    reflection.coordinatesMode = 6;
    reflection.level = 5;
    scene.getMaterialByName("material0").reflectionTexture = reflection;
    carProbe.attachToMesh(scene.getMeshByName("CarBody"));
}

export function addGlowLayer(scene) {
    const glowLayer = new BABYLON.GlowLayer("Glow", scene, {
        mainTextureSamples: 4
    });

    glowLayer.intensity = 4;
    glowLayer.blurKernelSize = 64;
}
