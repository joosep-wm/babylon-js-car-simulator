import { Mode } from '../game/controller/mode-manager.js';

// Helper function to get ModeManager - tries multiple approaches
function getModeManager() {
    // Try window global first
    if (window.getModeManager) {
        return window.getModeManager();
    }

    // Try importing dynamically (handles cache issues)
    if (window.getGamepadManager) {
        const gamepadManager = window.getGamepadManager();
        return gamepadManager?.modeManager || null;
    }

    return null;
}

export const ControllerConfigUI = {
    name: 'ControllerConfigUI',
    data() {
        return {
            visible: false,
            refreshKey: 0,
            draggedIndex: null,
            dragOverIndex: null,
            editingModeIndex: null,
            editingMode: null
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
            const manager = getModeManager();
            if (!manager) return;

            this.editingModeIndex = index;
            this.editingMode = JSON.parse(JSON.stringify(manager.modes[index]));

            this.migrateSpeedControlSource();
            this.ensureDefaultMaxSpeed();

            console.log('Editing mode:', this.editingMode.name);
        },
        migrateSpeedControlSource() {
            if (!this.editingMode.speedControl.source) {
                if (this.editingMode.speedControl.type === 'triggers') {
                    this.editingMode.speedControl.source = 'triggers';
                } else if (this.editingMode.speedControl.type === 'analog') {
                    this.editingMode.speedControl.source = 'rightStickY';
                } else {
                    this.editingMode.speedControl.source = 'triggers';
                }
            }
        },
        ensureDefaultMaxSpeed() {
            if (!this.editingMode.speedControl.maxSpeed) {
                this.editingMode.speedControl.maxSpeed = 100;
            }
        },
        saveMode() {
            const manager = getModeManager();
            if (!manager || this.editingModeIndex === null) return;

            const reconstructedMode = new Mode(this.editingMode);
            reconstructedMode.modifiedAt = Date.now();

            manager.modes[this.editingModeIndex] = reconstructedMode;
            manager.saveModes();

            this.refreshKey++;
            this.editingModeIndex = null;
            this.editingMode = null;

            console.log('Mode saved successfully');
        },
        cancelEdit() {
            this.editingModeIndex = null;
            this.editingMode = null;
            console.log('Edit cancelled');
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
                    <h2>{{ editingModeIndex !== null ? 'Edit Mode' : 'Controller Configuration' }}</h2>
                    <button class="close-button" @click="closeOverlay">✕</button>
                </div>
                <div class="controller-config-content">
                    <!-- Mode List View -->
                    <div v-if="editingModeIndex === null" class="mode-list-section">
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

                    <!-- Mode Editor View -->
                    <div v-else-if="editingMode" class="mode-editor-section">
                        <div class="editor-navigation">
                            <button class="back-button" @click="cancelEdit">← Back to Modes</button>
                        </div>

                        <div class="editor-form">
                            <div class="form-group">
                                <label for="mode-name">Mode Name</label>
                                <input
                                    id="mode-name"
                                    type="text"
                                    v-model="editingMode.name"
                                    class="form-input"
                                    placeholder="Enter mode name"
                                />
                            </div>

                            <div class="form-group">
                                <label for="mode-description">Description</label>
                                <textarea
                                    id="mode-description"
                                    v-model="editingMode.description"
                                    class="form-textarea"
                                    placeholder="Enter mode description"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="editor-section">
                                <h4>Speed Control</h4>
                                <div class="speed-control-config">
                                    <div class="form-group">
                                        <label for="speed-source">Speed Input Source</label>
                                        <select
                                            id="speed-source"
                                            v-model="editingMode.speedControl.source"
                                            class="form-select"
                                        >
                                            <option value="triggers">RT/LT (Triggers)</option>
                                            <option value="rightStickY">Right Stick Y</option>
                                            <option value="leftStickY">Left Stick Y</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="max-speed">Max Speed</label>
                                        <div class="slider-group">
                                            <input
                                                id="max-speed"
                                                type="range"
                                                min="0"
                                                max="200"
                                                step="5"
                                                v-model.number="editingMode.speedControl.maxSpeed"
                                                class="form-slider"
                                            />
                                            <span class="slider-value">{{ editingMode.speedControl.maxSpeed }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="editor-section">
                                <h4>Steering Control</h4>
                                <p class="placeholder-text">Configuration coming in Task 4.6</p>
                            </div>

                            <div class="editor-section">
                                <h4>Utility Buttons</h4>
                                <p class="placeholder-text">Configuration coming in Task 4.7</p>
                            </div>

                            <div class="editor-actions">
                                <button class="action-button action-cancel" @click="cancelEdit">Cancel</button>
                                <button class="action-button action-save" @click="saveMode">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
