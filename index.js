// index.js - Main Entry Point
// Cache-busting is handled by Import Maps in index.html

import { initializeGame, getGamepadManager, getModeManager } from './game/babylon-game.js';
import { createVueApp } from './vue-app.js';
import { createTestHelpers } from './game/testing/control-mapper-test.js';

// Main initialization function
function initialize() {
    console.log('🎮 Starting Babylon.js Car Game...');
    console.log(`📦 Cache-busting active: v=${window.__cacheBuster}`);

    try {
        // Create and mount Vue app
        const vueApp = createVueApp();

        // Initialize Babylon.js game with Vue app reference
        initializeGame(vueApp);

        console.log('✅ Game initialization complete!');

        // Expose test helpers for Task 3.2 validation
        window.controlMapperTests = createTestHelpers();
        console.log('🧪 Test helpers available: window.controlMapperTests.testTriggerMode()');

        // Expose getGamepadManager and getModeManager for testing
        window.getGamepadManager = getGamepadManager;
        window.getModeManager = getModeManager;
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
    }
}

// Initialize when DOM is ready, handling both cases:
// 1. Script loads before DOMContentLoaded fires
// 2. Script loads after DOMContentLoaded already fired (dynamically injected scripts)
if (document.readyState === 'loading') {
    // DOM hasn't loaded yet, wait for it
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    // DOM is already loaded (common with dynamically injected scripts)
    initialize();
}