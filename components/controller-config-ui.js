import { getModeManager } from '../game/babylon-game.js';

export const ControllerConfigUI = {
    name: 'ControllerConfigUI',
    data() {
        return {
            visible: false,
            refreshKey: 0,
            draggedIndex: null,
            dragOverIndex: null
        };
    },
    computed: {
        modes() {
            this.refreshKey;
            const manager = getModeManager();
            return manager ? manager.modes : [];
        },
        activeModeIndex() {
            this.refreshKey;
            const manager = getModeManager();
            return manager ? manager.currentIndex : 0;
        }
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown);
        this.startPolling();
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown);
        this.stopPolling();
    },
    methods: {
        handleKeydown(e) {
            if (e.key === 'F10') {
                e.preventDefault();
                this.toggleOverlay();
            }
        },
        toggleOverlay() {
            this.visible = !this.visible;
        },
        closeOverlay() {
            this.visible = false;
        },
        startPolling() {
            this.pollingInterval = setInterval(() => {
                if (this.visible) {
                    this.refreshKey++;
                }
            }, 100);
        },
        stopPolling() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        },
        editMode(index) {
            console.log('Edit mode:', index);
        },
        deleteMode(index) {
            console.log('Delete mode:', index);
        },
        handleDragStart(e, index) {
            this.draggedIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            e.target.style.opacity = '0.4';
        },
        handleDragEnd(e) {
            e.target.style.opacity = '1';
            this.draggedIndex = null;
            this.dragOverIndex = null;
        },
        handleDragOver(e, index) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.dragOverIndex = index;
        },
        handleDragEnter(e, index) {
            e.preventDefault();
            this.dragOverIndex = index;
        },
        handleDragLeave() {
            this.dragOverIndex = null;
        },
        handleDrop(e, toIndex) {
            e.preventDefault();
            const fromIndex = this.draggedIndex;

            if (fromIndex !== null && fromIndex !== toIndex) {
                const manager = getModeManager();
                if (manager) {
                    manager.reorderModes(fromIndex, toIndex);
                    this.refreshKey++;
                }
            }

            this.draggedIndex = null;
            this.dragOverIndex = null;
        }
    },
    template: `
        <div class="controller-config-overlay" v-if="visible" @click.self="closeOverlay">
            <div class="controller-config-modal">
                <div class="controller-config-header">
                    <h2>Controller Configuration</h2>
                    <button class="close-button" @click="closeOverlay">✕</button>
                </div>
                <div class="controller-config-content">
                    <div class="mode-list-section">
                        <h3>Control Modes</h3>
                        <div class="mode-list">
                            <div
                                v-for="(mode, index) in modes"
                                :key="index"
                                :class="[
                                    'mode-item',
                                    { 'mode-active': index === activeModeIndex },
                                    { 'mode-dragging': draggedIndex === index },
                                    { 'mode-drag-over': dragOverIndex === index }
                                ]"
                                draggable="true"
                                @dragstart="handleDragStart($event, index)"
                                @dragend="handleDragEnd"
                                @dragover="handleDragOver($event, index)"
                                @dragenter="handleDragEnter($event, index)"
                                @dragleave="handleDragLeave"
                                @drop="handleDrop($event, index)"
                            >
                                <div class="mode-info">
                                    <div class="mode-name">{{ mode.name }}</div>
                                    <div class="mode-description">{{ mode.description }}</div>
                                </div>
                                <div class="mode-actions">
                                    <button class="mode-button mode-edit" @click="editMode(index)">Edit</button>
                                    <button class="mode-button mode-delete" @click="deleteMode(index)">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
