// collision-detection.js - Physics-based collision tracking

export function setupCollisionDetection(scene, car, vueApp) {
    let carPhysicsBody = null;

    if (car) {
        carPhysicsBody = car.physicsBody || car._physicsBody;

        if (!carPhysicsBody) {
            console.log("⏳ Physics body not ready, retrying in 100ms...");
            setTimeout(() => {
                setupCollisionDetection(scene, car, vueApp);
            }, 100);
            return;
        }
    }

    if (!carPhysicsBody) {
        console.error("❌ Car physics body not found after retries!");
        return;
    }

    console.log("✅ Car physics body found, setting up collision detection");

    const collisionCooldowns = new Map();
    let lastVelocity = { x: 0, y: 0, z: 0 };
    let debugCounter = 0;
    let startTime = Date.now();

    console.log("Collision detection system started, box detection active after 2 seconds...");

    scene.onBeforeRenderObservable.add(() => {
        debugCounter++;

        const velocity = carPhysicsBody.getLinearVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);

        const lastSpeed = Math.sqrt(lastVelocity.x * lastVelocity.x + lastVelocity.y * lastVelocity.y + lastVelocity.z * lastVelocity.z);
        const speedDifference = Math.abs(speed - lastSpeed);

        if (speedDifference > 5 && speed < lastSpeed && lastSpeed > 2) {
            const now = Date.now();
            if (!collisionCooldowns.has('general') || now - collisionCooldowns.get('general') > 500) {
                if (vueApp) {
                    vueApp.collisions++;
                    console.log(`Collision detected! Speed change: ${speedDifference.toFixed(2)}, Total collisions: ${vueApp.collisions}`);
                }
                collisionCooldowns.set('general', now);
            }
        }

        if (debugCounter % 300 === 0) {
            const boxCount = scene.meshes.filter(m => m.name.includes("knockableBox_")).length;
            console.log(`Debug: Car at (${car.position.x.toFixed(1)}, ${car.position.y.toFixed(1)}, ${car.position.z.toFixed(1)}), Found ${boxCount} boxes`);
        }

        if (Date.now() - startTime > 2000) {
            scene.meshes.forEach(mesh => {
                if (mesh.name.includes("knockableBox_")) {
                    if (!mesh.positionSettled) {
                        mesh.initialPosition = mesh.position.clone();
                        mesh.positionSettled = true;
                        return;
                    }

                    const movementDistance = BABYLON.Vector3.Distance(mesh.position, mesh.initialPosition);
                    const now = Date.now();

                    if (movementDistance > 3) {
                        if (!collisionCooldowns.has(mesh.name) || now - collisionCooldowns.get(mesh.name) > 1000) {
                            if (vueApp) {
                                vueApp.knockedBoxes++;
                                console.log(`Box ${mesh.name} moved ${movementDistance.toFixed(2)} units from settled position! Total: ${vueApp.knockedBoxes}`);
                                mesh.initialPosition = mesh.position.clone();
                            }
                            collisionCooldowns.set(mesh.name, now);
                        }
                    }
                }
            });
        }

        lastVelocity = { x: velocity.x, y: velocity.y, z: velocity.z };
    });
}
