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
            if (!this.currentMode) {
                return [];
            }

            const hints = [];

            this.addSpeedControlHints(hints);
            this.addSteeringControlHints(hints);
            this.addUtilityButtonHints(hints);

            return hints;
        }
    },
    methods: {
        addSpeedControlHints(hints) {
            const speedControl = this.currentMode.speedControl;
            if (!speedControl) return;

            if (speedControl.type === 'triggers') {
                if (speedControl.forwardInput === 'RT') {
                    hints.push({
                        button: 'RT',
                        label: 'Forward',
                        active: this.controllerButtonStates[7] || false,
                        buttonIndex: 7,
                        category: 'speed'
                    });
                }
                if (speedControl.backwardInput === 'LT') {
                    hints.push({
                        button: 'LT',
                        label: 'Reverse',
                        active: this.controllerButtonStates[6] || false,
                        buttonIndex: 6,
                        category: 'speed'
                    });
                }
            } else if (speedControl.type === 'stick') {
                const stickName = this.getStickDisplayName(speedControl.input);
                hints.push({
                    button: stickName,
                    label: 'Speed',
                    active: false,
                    buttonIndex: null,
                    category: 'speed'
                });
            }
        },

        addSteeringControlHints(hints) {
            const steeringControl = this.currentMode.steeringControl;
            if (!steeringControl) return;

            if (steeringControl.type === 'singleInput') {
                const stickName = this.getStickDisplayName(steeringControl.input);
                const wheelsDesc = steeringControl.wheels === 'front' ? 'Front' :
                                   steeringControl.wheels === 'all' ? 'All Wheel Same Side' : 'Wheels';
                hints.push({
                    button: stickName,
                    label: `Steer ${wheelsDesc}`,
                    active: false,
                    buttonIndex: null,
                    category: 'steering'
                });
            } else if (steeringControl.type === 'opposing') {
                const stickName = this.getStickDisplayName(steeringControl.input);
                hints.push({
                    button: stickName,
                    label: 'Opposing Turn',
                    active: false,
                    buttonIndex: null,
                    category: 'steering'
                });
            } else if (steeringControl.type === 'multiInput') {
                const frontStick = this.getStickDisplayName(steeringControl.frontInput);
                const rearStick = this.getStickDisplayName(steeringControl.rearInput);
                hints.push({
                    button: frontStick,
                    label: 'Front Wheels',
                    active: false,
                    buttonIndex: null,
                    category: 'steering'
                });
                hints.push({
                    button: rearStick,
                    label: 'Rear Wheels',
                    active: false,
                    buttonIndex: null,
                    category: 'steering'
                });
            }
        },

        addUtilityButtonHints(hints) {
            if (!this.currentMode.utilityButtons) return;

            const buttonMap = {
                0: 'A',
                1: 'B',
                2: 'X',
                3: 'Y'
            };

            const actionLabels = {
                jump: 'Jump',
                brake: 'Brake',
                resetPosition: 'Reset Car',
                resetWheels: 'Reset Wheels'
            };

            // Build reverse map: action -> button index
            const actionToButton = {};
            Object.entries(this.currentMode.utilityButtons).forEach(([buttonIndex, config]) => {
                const actionName = typeof config === 'string' ? config : config.action;
                // Convert string key to number (JSON.parse makes object keys strings)
                actionToButton[actionName] = parseInt(buttonIndex, 10);
            });

            // Display hints in consistent order: jump, brake, resetPosition, resetWheels
            const actionOrder = ['jump', 'brake', 'resetPosition', 'resetWheels'];
            actionOrder.forEach(actionName => {
                const buttonIndex = actionToButton[actionName];
                if (buttonIndex !== undefined) {
                    const button = buttonMap[buttonIndex];
                    const label = actionLabels[actionName];
                    if (button && label) {
                        hints.push({
                            button,
                            label,
                            active: this.controllerButtonStates[buttonIndex] || false,
                            buttonIndex,
                            category: 'utility'
                        });
                    }
                }
            });
        },

        getStickDisplayName(input) {
            const stickMap = {
                'LS-X': 'LS',
                'LS-Y': 'LS',
                'RS-X': 'RS',
                'RS-Y': 'RS'
            };
            return stickMap[input] || input;
        },

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