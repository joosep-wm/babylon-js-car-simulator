// test-helpers.js - Console testing API for manual wheel control

export function initializeTestHelpers(steerAngle, wheelSpeed, carFrame, manualControl) {
    window.testHelpers = {
        getWheelStates: () => {
            return {
                angles: { ...steerAngle },
                speeds: { ...wheelSpeed },
                manualControlActive: manualControl.active
            };
        },

        setWheelAngle: (wheel, angleDegrees) => {
            const angleRadians = angleDegrees * Math.PI / 180;
            if (steerAngle.hasOwnProperty(wheel)) {
                steerAngle[wheel] = angleRadians;
                manualControl.active = true;
                console.log(`🔧 Set ${wheel} angle to ${angleDegrees}° (${angleRadians.toFixed(3)} rad)`);
                console.log(`   ⚠️  Manual control active - keyboard steering disabled`);
            } else {
                console.error(`❌ Invalid wheel: ${wheel}. Use FL, FR, RL, or RR`);
            }
        },

        setWheelSpeed: (wheel, speed) => {
            if (wheelSpeed.hasOwnProperty(wheel)) {
                wheelSpeed[wheel] = speed;
                manualControl.active = true;
                console.log(`🔧 Set ${wheel} speed to ${speed}`);
                console.log(`   ⚠️  Manual control active - keyboard throttle disabled`);
            } else {
                console.error(`❌ Invalid wheel: ${wheel}. Use FL, FR, RL, or RR`);
            }
        },

        setAllWheels: (angleDegrees, speed) => {
            const angleRadians = angleDegrees * Math.PI / 180;
            ['FL', 'FR', 'RL', 'RR'].forEach(wheel => {
                steerAngle[wheel] = angleRadians;
                wheelSpeed[wheel] = speed;
            });
            manualControl.active = true;
            console.log(`🔧 Set all wheels to ${angleDegrees}° and speed ${speed}`);
            console.log(`   ⚠️  Manual control active - keyboard controls disabled`);
        },

        disableManualControl: () => {
            manualControl.active = false;
            console.log(`✅ Manual control disabled - keyboard controls re-enabled`);
        },

        resetCarPosition: () => {
            if (carFrame && carFrame.physicsBody) {
                carFrame.position = new BABYLON.Vector3(0, 5, 0);
                carFrame.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
                carFrame.physicsBody.setAngularVelocity(BABYLON.Vector3.Zero());
                console.log("🔧 Car position reset to origin");
            } else {
                console.error("❌ Car frame or physics body not available");
            }
        },

        testMotors: async () => {
            console.log("🔧 Starting motor test sequence...");
            const testSequence = [
                { wheel: 'FL', speed: 30 },
                { wheel: 'FR', speed: 30 },
                { wheel: 'RL', speed: 30 },
                { wheel: 'RR', speed: 30 }
            ];

            for (const test of testSequence) {
                console.log(`Testing ${test.wheel} at speed ${test.speed}...`);

                ['FL', 'FR', 'RL', 'RR'].forEach(w => wheelSpeed[w] = 0);

                wheelSpeed[test.wheel] = test.speed;

                await new Promise(resolve => setTimeout(resolve, 1000));

                wheelSpeed[test.wheel] = 0;
            }

            console.log("✅ Motor test sequence complete");
        }
    };

    console.log("🔧 Test helpers initialized. Access via window.testHelpers");
    console.log("   - getWheelStates()");
    console.log("   - setWheelAngle(wheel, angle)");
    console.log("   - setWheelSpeed(wheel, speed)");
    console.log("   - setAllWheels(angle, speed)");
    console.log("   - disableManualControl()");
    console.log("   - resetCarPosition()");
    console.log("   - testMotors()");
}
