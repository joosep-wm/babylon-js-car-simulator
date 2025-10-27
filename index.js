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

    console.log('✅ Game initialization complete!');

    // Expose test helpers for Task 3.2 validation
    window.controlMapperTests = createTestHelpers();
    console.log('🧪 Test helpers available: window.controlMapperTests.testTriggerMode()');

    // Expose getGamepadManager for testing
    window.getGamepadManager = getGamepadManager;
});