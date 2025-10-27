// rendering-effects.js - Reflection probes and glow effects

export function addReflectionsToCar(scene) {
    // COMMENTED OUT: Causing WebGL feedback loop warning
    // The ReflectionProbe renders CarBody into a texture, then applies that texture
    // back to CarBody's material, creating a feedback loop where the texture reads
    // from and writes to itself simultaneously.

    // const carProbe = new BABYLON.ReflectionProbe("reflections", 256, scene, false, false);

    // for (const mesh of scene.meshes) {
    //     carProbe.renderList.push(mesh);
    // }

    // const reflection = carProbe.cubeTexture;
    // reflection.coordinatesMode = 6;
    // reflection.level = 5;
    // scene.getMaterialByName("material0").reflectionTexture = reflection;
    // carProbe.attachToMesh(scene.getMeshByName("CarBody"));
}

export function addGlowLayer(scene) {
    // COMMENTED OUT: Causing WebGL feedback loop warning
    // GlowLayer creates internal render targets that can cause feedback loops
    // when combined with reflection textures on the same mesh.

    // const glowLayer = new BABYLON.GlowLayer("Glow", scene, {
    //     mainTextureSamples: 4
    // });

    // glowLayer.intensity = 4;
    // glowLayer.blurKernelSize = 64;
}
