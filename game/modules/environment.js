// environment.js - Track, walls, towers, boxes, and bridge creation

export function createSquareRaceTrack(scene, width = 800, height = 800) {
    const track = BABYLON.MeshBuilder.CreateGround("SquareTrack", {
        width: width,
        height: height
    }, scene);

    const trackMaterial = new BABYLON.StandardMaterial("trackMaterial", scene);
    trackMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    trackMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    track.material = trackMaterial;
    track.receiveShadows = true;

    return track;
}

export function createTrackWalls(scene, trackWidth = 800, trackHeight = 800) {
    const wallHeight = 20;
    const wallThickness = 2;

    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const northWall = BABYLON.MeshBuilder.CreateBox("northWall", {
        width: trackWidth + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness
    }, scene);
    northWall.position.set(0, wallHeight / 2 - 20, trackHeight / 2 + wallThickness / 2);
    northWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(northWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    const southWall = BABYLON.MeshBuilder.CreateBox("southWall", {
        width: trackWidth + wallThickness * 2,
        height: wallHeight,
        depth: wallThickness
    }, scene);
    southWall.position.set(0, wallHeight / 2 - 20, -trackHeight / 2 - wallThickness / 2);
    southWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(southWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    const eastWall = BABYLON.MeshBuilder.CreateBox("eastWall", {
        width: wallThickness,
        height: wallHeight,
        depth: trackHeight
    }, scene);
    eastWall.position.set(trackWidth / 2 + wallThickness / 2, wallHeight / 2 - 20, 0);
    eastWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(eastWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);

    const westWall = BABYLON.MeshBuilder.CreateBox("westWall", {
        width: wallThickness,
        height: wallHeight,
        depth: trackHeight
    }, scene);
    westWall.position.set(-trackWidth / 2 - wallThickness / 2, wallHeight / 2 - 20, 0);
    westWall.material = wallMaterial;
    new BABYLON.PhysicsAggregate(westWall, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.1 }, scene);
}

export function createCollisionTowers(scene) {
    const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
    towerMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);

    const towerPositions = [
        { x: 200, z: 200 },
        { x: -200, z: 200 },
        { x: 200, z: -200 },
        { x: -200, z: -200 },
        { x: 0, z: 300 },
        { x: 300, z: 0 },
        { x: -300, z: 0 },
        { x: 0, z: -300 }
    ];

    towerPositions.forEach((pos, index) => {
        const tower = BABYLON.MeshBuilder.CreateBox(`tower_${index}`, {
            width: 15,
            height: 25,
            depth: 15
        }, scene);

        tower.position.set(pos.x, 12.5 - 20, pos.z);
        tower.material = towerMaterial;

        new BABYLON.PhysicsAggregate(tower, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.5 }, scene);
    });
}

export function createKnockableBoxes(scene, vueApp) {
    const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    boxMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0);

    const boxPositions = [
        { x: 250, z: 100 },
        { x: -200, z: 100 },
        { x: 250, z: -250 },
        { x: -200, z: -250 },
        { x: 300, z: 0 }
    ];

    const boxes = [];

    boxPositions.forEach((pos, index) => {
        const box = BABYLON.MeshBuilder.CreateBox(`knockableBox_${index}`, {
            width: 8,
            height: 8,
            depth: 8
        }, scene);

        box.position.set(pos.x, 4, pos.z);
        box.material = boxMaterial;

        const boxAggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, {
            mass: 20,
            friction: 0.4,
            restitution: 0.5
        }, scene);

        box.originalPosition = box.position.clone();
        box.originalRotation = box.rotation.clone();
        box.knocked = false;
        box.boxIndex = index;
        box.positionSettled = false;

        boxes.push(box);
    });

    console.log(`Created ${boxes.length} knockable boxes - position settling in 2 seconds`);

    return boxes;
}

export function createBridge(scene) {
    const bridgeStartX = 185;
    const bridgeEndX = -75;
    const bridgeWidth = bridgeStartX - bridgeEndX;
    const bridgeCenterX = (bridgeStartX + bridgeEndX) / 2;
    const bridgeZ = 0;
    const bridgeHeight = 25;

    const bridgeMaterial = new BABYLON.StandardMaterial("bridgeMaterial", scene);
    bridgeMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    bridgeMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const stepCount = 12;
    const stepWidth = 12;
    const stepHeight = 2;
    const stepDepth = 30;

    const maxStepHeight = stepHeight * stepCount;
    const bridgePlatformWidth = 80;
    const bridgePlatform = BABYLON.MeshBuilder.CreateBox("bridgePlatform", {
        width: bridgePlatformWidth,
        height: 4,
        depth: 30
    }, scene);
    bridgePlatform.position = new BABYLON.Vector3(bridgeCenterX, maxStepHeight - 20 + 2, bridgeZ);
    bridgePlatform.material = bridgeMaterial;

    const bridgeLeftEdge = bridgeCenterX - (bridgePlatformWidth / 2);
    const bridgeRightEdge = bridgeCenterX + (bridgePlatformWidth / 2);

    new BABYLON.PhysicsAggregate(bridgePlatform, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 2 }, scene);
    bridgePlatform.receiveShadows = true;

    const pillarHeight = bridgeHeight;
    const pillarPositions = [
        { x: bridgeCenterX - 30, z: bridgeZ - 10 },
        { x: bridgeCenterX - 30, z: bridgeZ + 10 },
        { x: bridgeCenterX, z: bridgeZ - 10 },
        { x: bridgeCenterX, z: bridgeZ + 10 },
        { x: bridgeCenterX + 30, z: bridgeZ - 10 },
        { x: bridgeCenterX + 30, z: bridgeZ + 10 }
    ];

    pillarPositions.forEach((pos, index) => {
        const pillar = BABYLON.MeshBuilder.CreateBox(`bridgePillar${index}`, {
            width: 6,
            height: pillarHeight,
            depth: 6
        }, scene);
        pillar.position = new BABYLON.Vector3(pos.x, pillarHeight / 2 - 20, pos.z);
        pillar.material = bridgeMaterial;
        new BABYLON.PhysicsAggregate(pillar, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 1 }, scene);
        pillar.receiveShadows = true;
    });

    console.log(`Bridge created from X=${bridgeStartX} to X=${bridgeEndX} at height ${bridgeHeight}`);
}
