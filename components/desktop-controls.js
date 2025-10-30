// desktop-controls.js - Desktop Controls Display Component

import { getGamepadManager, getModeManager } from '../game/babylon-game.js';

export const DesktopControls = {
    name: 'DesktopControls',
    props: {
        isTouchDevice: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            keyStates: {
                w: false,
                a: false,
                s: false,
                d: false,
                space: false,
                b: false,
                enter: false
            },
            controllerConnected: false,
            currentMode: null,
            controllerButtonStates: {}
        }
    },
    mounted() {
        if (!this.isTouchDevice) {
            this.setupKeyboardListeners();
            this.setupControllerListeners();
        }
    },
    beforeUnmount() {
        if (!this.isTouchDevice) {
            this.removeKeyboardListeners();
            this.removeControllerListeners();
        }
    },
    computed: {
        showKeyboardHints() {
            return !this.controllerConnected;
        },
        showControllerHints() {
            return this.controllerConnected && this.currentMode;
        },
        controllerHints() {
            if (!this.currentMode || !this.currentMode.utilityButtons) {
                return [];
            }

            const hints = [];
            const buttonMap = {
                0: 'A',
                1: 'B',
                2: 'X',
                3: 'Y',
                6: 'LT',
                7: 'RT'
            };

            const actionLabels = {
                jump: 'Jump',
                brake: 'Brake',
                resetPosition: 'Reset Car',
                resetWheels: 'Reset Wheels'
            };

            Object.entries(this.currentMode.utilityButtons).forEach(([buttonIndex, config]) => {
                const button = buttonMap[buttonIndex];
                const actionName = typeof config === 'string' ? config : config.action;
                const label = actionLabels[actionName];
                if (button && label) {
                    hints.push({
                        button,
                        label,
                        active: this.controllerButtonStates[buttonIndex] || false,
                        buttonIndex
                    });
                }
            });

            return hints;
        }
    },
    methods: {
        setupKeyboardListeners() {
            this.handleKeyDown = (e) => {
                this.updateKeyState(e.key, true);
            };

            this.handleKeyUp = (e) => {
                this.updateKeyState(e.key, false);
            };

            window.addEventListener('keydown', this.handleKeyDown);
            window.addEventListener('keyup', this.handleKeyUp);
        },

        removeKeyboardListeners() {
            if (this.handleKeyDown) {
                window.removeEventListener('keydown', this.handleKeyDown);
            }
            if (this.handleKeyUp) {
                window.removeEventListener('keyup', this.handleKeyUp);
            }
        },

        setupControllerListeners() {
            const checkController = () => {
                const gamepadManager = getGamepadManager();
                if (gamepadManager) {
                    const wasConnected = this.controllerConnected;
                    this.controllerConnected = gamepadManager.connected;

                    if (this.controllerConnected) {
                        if (!wasConnected || !this.currentMode) {
                            this.updateCurrentMode();
                        }
                        this.updateControllerButtonStates();
                    }
                }
            };

            checkController();
            this.controllerCheckInterval = setInterval(checkController, 100);

            window.addEventListener('gamepadconnected', () => {
                console.log('🎮 Desktop controls: Controller connected');
                this.controllerConnected = true;
                this.updateCurrentMode();
            });

            window.addEventListener('gamepaddisconnected', () => {
                console.log('🎮 Desktop controls: Controller disconnected');
                this.controllerConnected = false;
                this.currentMode = null;
                this.controllerButtonStates = {};
            });

            const gamepadManager = getGamepadManager();
            if (gamepadManager) {
                this.modeChangeHandler = (data) => {
                    console.log('🎮 Desktop controls: Mode changed to', data.mode.name);
                    this.updateCurrentMode();
                };
                gamepadManager.addEventListener('modechange', this.modeChangeHandler);
            }
        },

        removeControllerListeners() {
            if (this.controllerCheckInterval) {
                clearInterval(this.controllerCheckInterval);
            }

            const gamepadManager = getGamepadManager();
            if (gamepadManager && this.modeChangeHandler) {
                gamepadManager.removeEventListener('modechange', this.modeChangeHandler);
            }
        },

        updateCurrentMode() {
            const modeManager = getModeManager();
            if (modeManager) {
                this.currentMode = modeManager.getCurrentMode();
                console.log('🎮 Desktop controls: Updated to mode', this.currentMode?.name);
            }
        },

        updateControllerButtonStates() {
            const gamepadManager = getGamepadManager();
            if (!gamepadManager || !gamepadManager.connected) {
                return;
            }

            const state = gamepadManager.getGamepadState();
            if (state && state.connected && state.buttons) {
                const newStates = {};
                Object.entries(state.buttons).forEach(([buttonName, buttonState]) => {
                    const buttonIndex = this.getButtonIndexFromName(buttonName);
                    if (buttonIndex !== -1) {
                        newStates[buttonIndex] = buttonState.pressed;
                    }
                });
                this.controllerButtonStates = newStates;
            }
        },

        getButtonIndexFromName(name) {
            const buttonIndices = {
                'A': 0, 'B': 1, 'X': 2, 'Y': 3,
                'LT': 6, 'RT': 7
            };
            return buttonIndices[name] !== undefined ? buttonIndices[name] : -1;
        },

        updateKeyState(key, isPressed) {
            switch (key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keyStates.w = isPressed;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keyStates.a = isPressed;
                    break;
                case 's':
                case 'arrowdown':
                    this.keyStates.s = isPressed;
                    break;
                case 'd':
                case 'arrowright':
                    this.keyStates.d = isPressed;
                    break;
                case ' ':
                    this.keyStates.space = isPressed;
                    break;
                case 'b':
                    this.keyStates.b = isPressed;
                    break;
                case 'enter':
                    this.keyStates.enter = isPressed;
                    if (isPressed) {
                        setTimeout(() => {
                            this.keyStates.enter = false;
                        }, 200);
                    }
                    break;
            }
        }
    },
    template: `
        <!-- Desktop Controls Display -->
        <div class="desktop-controls" :class="{ visible: !isTouchDevice }">
            <!-- Keyboard Hints (shown when no controller) -->
            <template v-if="showKeyboardHints">
                <div class="control-group">
                    <div class="key-display wasd" :class="{ active: keyStates.w }">W</div>
                    <div class="key-display wasd" :class="{ active: keyStates.a }">A</div>
                    <div class="key-display wasd" :class="{ active: keyStates.s }">S</div>
                    <div class="key-display wasd" :class="{ active: keyStates.d }">D</div>
                    <span class="control-label">Move</span>
                </div>

                <div class="control-separator"></div>

                <div class="control-group">
                    <div class="key-display space" :class="{ active: keyStates.space }">SPACE</div>
                    <span class="control-label">Jump</span>
                </div>

                <div class="control-separator"></div>

                <div class="control-group">
                    <div class="key-display b" :class="{ active: keyStates.b }">B</div>
                    <span class="control-label">Brake</span>
                </div>

                <div class="control-separator"></div>

                <div class="control-group">
                    <div class="key-display enter" :class="{ active: keyStates.enter }">ENTER</div>
                    <span class="control-label">Reset</span>
                </div>
            </template>

            <!-- Controller Hints (shown when controller connected) -->
            <template v-if="showControllerHints">
                <template v-for="(hint, index) in controllerHints" :key="hint.buttonIndex">
                    <div class="control-separator" v-if="index > 0"></div>
                    <div class="control-group">
                        <div class="key-display controller-button"
                             :class="{ active: hint.active, [hint.button.toLowerCase()]: true }">
                            {{ hint.button }}
                        </div>
                        <span class="control-label">{{ hint.label }}</span>
                    </div>
                </template>
            </template>
        </div>
    `
};