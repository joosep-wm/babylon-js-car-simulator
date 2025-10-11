// vue-app.js - Vue Application Logic and Components

import { resetGame, resetBoxes } from './game/babylon-game.js';
import { InfoPanel } from './components/info-panel.js';
import { DesktopControls } from './components/desktop-controls.js';
import { MobileControls } from './components/mobile-controls.js';

/**
 * Create and mount the Vue application
 * @returns {Object} Vue application instance
 */
export function createVueApp() {
    const { createApp } = Vue;
    
    const app = createApp({
        components: {
            'info-panel': InfoPanel,
            'desktop-controls': DesktopControls,
            'mobile-controls': MobileControls
        },
        data() {
            return {
                isTouchDevice: false,
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
            
            detectTouchDevice() {
                // Simple and elegant: true touch-only devices
                const touchOnly = window.matchMedia('(pointer: coarse)').matches &&
                                !window.matchMedia('(any-pointer: fine)').matches;
                
                this.isTouchDevice = touchOnly;
                console.log('📱 Touch device detected:', this.isTouchDevice);
            },

            onTouchControlsUpdate(newTouchControls) {
                this.touchControls = newTouchControls;
            },

            onMobileReset() {
                this.resetGame();
            }
        }
    });
    
    // Mount the app and return the instance
    const mountedApp = app.mount('#app');
    console.log('🎨 Vue app mounted successfully');
    
    return mountedApp;
}