// index.js - Main Entry Point
import { initializeGame, getGamepadManager } from './game/babylon-game.js';
import { createVueApp } from './vue-app.js';
import { createTestHelpers } from './game/testing/control-mapper-test.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Starting Babylon.js Car Game...');

    // Create and mount Vue app
    const vueApp = createVueApp();

    // Initialize Babylon.js game with Vue app reference
    initializeGame(vueApp);

    // Set up mode change listener after a short delay to ensure gamepadManager is initialized
    setTimeout(() => {
        const gamepadManager = getGamepadManager();
        if (gamepadManager) {
            // Set initial mode name
            const initialMode = gamepadManager.modeManager.getCurrentMode();
            vueApp.currentModeName = initialMode.name;
            console.log('🎮 Initial mode set:', initialMode.name);

            // Listen for mode changes
            gamepadManager.addEventListener('modechange', (data) => {
                vueApp.currentModeName = data.mode.name;
                console.log('🎮 Mode indicator updated:', data.mode.name);
            });
        }
    }, 500);

    console.log('✅ Game initialization complete!');

    // Expose test helpers for Task 3.2 validation
    window.controlMapperTests = createTestHelpers();
    console.log('🧪 Test helpers available: window.controlMapperTests.testTriggerMode()');
});