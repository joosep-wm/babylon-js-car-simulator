// vue-app.js - Vue Application Logic and Components

import { resetGame, resetBoxes } from './game/babylon-game.js';
import { InfoPanel } from './components/InfoPanel.js';

/**
 * Create and mount the Vue application
 * @returns {Object} Vue application instance
 */
export function createVueApp() {
    const { createApp } = Vue;
    
    const app = createApp({
        components: {
            'info-panel': InfoPanel
        },
        data() {
            return {
                isTouchDevice: false,
                keyStates: {
                    w: false,
                    a: false,
                    s: false,
                    d: false,
                    space: false,
                    enter: false
                },
                joystickActive: false,
                joystickPosition: { x: 0, y: 0 },
                touchControls: {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false,
                    brake: false
                },
                speed: 0,
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
                direction: '—',
                collisions: 0,
                knockedBoxes: 0,
                maxSpeed: 0,
                raceTime: 0,
                finishTime: null,
                isRacing: false,
                boxesStatus: [
                    { knocked: false },
                    { knocked: false },
                    { knocked: false },
                    { knocked: false },
                    { knocked: false }
                ]
            }
        },
        mounted() {
            this.detectTouchDevice();
            this.setupKeyboardListeners();
            if (this.isTouchDevice) {
                this.initTouchControls();
            }
        },
        methods: {
            async resetGame() {
                // Reset Vue data
                this.speed = 0;
                this.position = { x: 0, y: 0, z: 0 };
                this.rotation = 0;
                this.direction = '—';
                this.collisions = 0;
                this.knockedBoxes = 0;
                this.maxSpeed = 0;
                this.raceTime = 0;
                this.finishTime = null;
                this.isRacing = false;
                this.boxesStatus = [
                    { knocked: false },
                    { knocked: false },
                    { knocked: false },
                    { knocked: false },
                    { knocked: false }
                ];
                
                // Reset Babylon.js scene
                await resetGame(this);
            },
            
            resetBoxes() {
                resetBoxes(this);
            },
            
            setupKeyboardListeners() {
                // Add key state tracking for visual feedback
                window.addEventListener('keydown', (e) => {
                    this.updateKeyState(e.key, true);
                });
                
                window.addEventListener('keyup', (e) => {
                    this.updateKeyState(e.key, false);
                });
            },
            
            detectTouchDevice() {
                // Simple and elegant: true touch-only devices
                const touchOnly = window.matchMedia('(pointer: coarse)').matches &&
                                !window.matchMedia('(any-pointer: fine)').matches;
                
                this.isTouchDevice = touchOnly;
                console.log('📱 Touch device detected:', this.isTouchDevice);
            },

            initTouchControls() {
                const joystick = this.$refs.joystick;
                const joystickInner = this.$refs.joystickInner;
                
                if (!joystick || !joystickInner) return;

                let isDragging = false;
                let startPos = { x: 0, y: 0 };
                let joystickCenter = { x: 0, y: 0 };

                const updateJoystickCenter = () => {
                    const rect = joystick.getBoundingClientRect();
                    joystickCenter = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                };

                const handleStart = (e) => {
                    e.preventDefault();
                    isDragging = true;
                    updateJoystickCenter();
                    
                    const touch = e.touches ? e.touches[0] : e;
                    startPos = { x: touch.clientX, y: touch.clientY };
                    this.joystickActive = true;
                };

                const handleMove = (e) => {
                    if (!isDragging) return;
                    e.preventDefault();

                    const touch = e.touches ? e.touches[0] : e;
                    const deltaX = touch.clientX - joystickCenter.x;
                    const deltaY = touch.clientY - joystickCenter.y;

                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const maxDistance = 35; // Half of joystick outer radius minus inner radius

                    let x = deltaX;
                    let y = deltaY;

                    if (distance > maxDistance) {
                        x = (deltaX / distance) * maxDistance;
                        y = (deltaY / distance) * maxDistance;
                    }

                    joystickInner.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

                    // Update touch controls based on joystick position
                    const threshold = 15;
                    this.touchControls.forward = y < -threshold;
                    this.touchControls.backward = y > threshold;
                    this.touchControls.left = x < -threshold;
                    this.touchControls.right = x > threshold;

                    this.joystickPosition = { x: x / maxDistance, y: y / maxDistance };
                };

                const handleEnd = (e) => {
                    e.preventDefault();
                    isDragging = false;
                    this.joystickActive = false;
                    
                    joystickInner.style.transform = 'translate(-50%, -50%)';
                    
                    // Reset all directional controls
                    this.touchControls.forward = false;
                    this.touchControls.backward = false;
                    this.touchControls.left = false;
                    this.touchControls.right = false;
                    
                    this.joystickPosition = { x: 0, y: 0 };
                };

                // Touch events
                joystick.addEventListener('touchstart', handleStart, { passive: false });
                document.addEventListener('touchmove', handleMove, { passive: false });
                document.addEventListener('touchend', handleEnd, { passive: false });

                // Mouse events for testing on desktop
                joystick.addEventListener('mousedown', handleStart);
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleEnd);
            },

            onBrakeStart(e) {
                e.preventDefault();
                this.touchControls.brake = true;
            },

            onBrakeEnd(e) {
                e.preventDefault();
                this.touchControls.brake = false;
            },

            onResetTouch(e) {
                e.preventDefault();
                this.resetGame();
            },

            updateKeyState(key, isPressed) {
                switch(key.toLowerCase()) {
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
                    case 'enter':
                        this.keyStates.enter = isPressed;
                        // Reset after short delay for visual feedback
                        if (isPressed) {
                            setTimeout(() => {
                                this.keyStates.enter = false;
                            }, 200);
                        }
                        break;
                }
            }
        }
    });
    
    // Mount the app and return the instance
    const mountedApp = app.mount('#app');
    console.log('🎨 Vue app mounted successfully');
    
    return mountedApp;
}