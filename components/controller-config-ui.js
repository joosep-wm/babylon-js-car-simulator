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
            return manager ? [...manager.modes] : [];
        },
        activeModeIndex() {
            this.refreshKey;
            const manager = getModeManager();
            return manager ? manager.currentIndex : 0;
        },
        steeringType: {
            get() {
                if (!this.editingMode) return 'front-only';
                const config = this.editingMode.steeringControl;

                if (config.type === 'multiInput') return 'independent';
                if (config.type === 'opposing') return 'opposite';
                if (config.type === 'singleInput' && config.wheels === 'all') return 'all-wheel';
                if (config.type === 'singleInput' && config.wheels === 'opposite') return 'opposite';
                return 'front-only';
            },
            set(value) {
                if (!this.editingMode) return;

                if (value === 'front-only') {
                    this.editingMode.steeringControl.type = 'singleInput';
                    this.editingMode.steeringControl.wheels = 'front';
                } else if (value === 'all-wheel') {
                    this.editingMode.steeringControl.type = 'singleInput';
                    this.editingMode.steeringControl.wheels = 'all';
                } else if (value === 'opposite') {
                    this.editingMode.steeringControl.type = 'opposing';
                    delete this.editingMode.steeringControl.wheels;
                } else if (value === 'independent') {
                    this.editingMode.steeringControl.type = 'multiInput';
                    delete this.editingMode.steeringControl.wheels;
                }
            }
        },
        steeringMaxAngle: {
            get() {
                if (!this.editingMode) return 45;
                const config = this.editingMode.steeringControl;

                return config.maxAngle || config.frontMaxAngle || config.frontWheelsMaxAngle || 45;
            },
            set(value) {
                if (!this.editingMode) return;
                const config = this.editingMode.steeringControl;

                if (config.type === 'multiInput') {
                    config.frontMaxAngle = value;
                    config.rearMaxAngle = value;
                } else if (config.type === 'opposing') {
                    config.frontWheelsMaxAngle = value;
                    config.rearWheelsMaxAngle = value;
                } else {
                    config.maxAngle = value;
                }
            }
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
            this.migrateUtilityButtons();

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
        migrateUtilityButtons() {
            if (!this.editingMode.utilityButtons) {
                this.editingMode.utilityButtons = {};
            }

            const defaults = {
                0: { action: 'jump', type: 'press', buttonIndex: 0 },
                1: { action: 'brake', type: 'hold', holdDuration: 100, buttonIndex: 1 },
                2: { action: 'resetPosition', type: 'press', buttonIndex: 2 },
                3: { action: 'resetWheels', type: 'press', buttonIndex: 3 }
            };

            for (let i = 0; i <= 3; i++) {
                if (!this.editingMode.utilityButtons[i]) {
                    this.editingMode.utilityButtons[i] = { ...defaults[i] };
                } else if (this.editingMode.utilityButtons[i].buttonIndex === undefined) {
                    this.editingMode.utilityButtons[i].buttonIndex = i;
                }
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
        duplicateMode(index) {
            const manager = getModeManager();
            if (!manager) return;

            const originalMode = manager.modes[index];
            const modeConfig = JSON.parse(JSON.stringify(originalMode));

            modeConfig.name = `${originalMode.name} Copy`;
            modeConfig.createdAt = new Date().toISOString();
            modeConfig.modifiedAt = new Date().toISOString();

            const duplicatedMode = new Mode(modeConfig);

            manager.modes.push(duplicatedMode);
            manager.saveModes();

            this.refreshKey++;

            console.log('Mode duplicated:', duplicatedMode.name);
        },
        deleteMode(index) {
            const manager = getModeManager();
            if (!manager) return;

            if (manager.modes.length <= 1) {
                alert('Cannot delete the last mode. At least one mode must exist.');
                return;
            }

            const mode = manager.modes[index];
            if (!confirm(`Are you sure you want to delete "${mode.name}"?`)) {
                return;
            }

            if (index === manager.currentIndex) {
                manager.currentIndex = 0;
            }

            manager.modes.splice(index, 1);

            if (index < manager.currentIndex) {
                manager.currentIndex--;
            }

            manager.saveModes();
            this.refreshKey++;

            console.log(`✅ Mode "${mode.name}" deleted successfully`);
        },
        addNewMode() {
            const manager = getModeManager();
            if (!manager) return;

            const newMode = new Mode({
                name: 'New Mode',
                description: 'Custom control mode',
                speedControl: {
                    source: 'triggers',
                    type: 'triggers',
                    forwardInput: 'RT',
                    backwardInput: 'LT',
                    deadZone: 0.15,
                    maxSpeed: 100,
                    sensitivity: 1.0
                },
                steeringControl: {
                    type: 'singleInput',
                    input: 'LS-X',
                    wheels: 'front',
                    maxAngle: 45,
                    sensitivity: 1.0,
                    deadZone: 0.15
                },
                utilityButtons: {
                    0: { action: 'jump', type: 'press', buttonIndex: 0 },
                    1: { action: 'brake', type: 'hold', holdDuration: 100, buttonIndex: 1 },
                    2: { action: 'resetPosition', type: 'press', buttonIndex: 2 },
                    3: { action: 'resetWheels', type: 'press', buttonIndex: 3 }
                }
            });

            manager.modes.push(newMode);
            manager.saveModes();

            const newIndex = manager.modes.length - 1;
            this.editMode(newIndex);

            console.log('New mode created:', newMode.name);
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
        },
        exportProfiles() {
            const manager = getModeManager();
            if (!manager) {
                alert('Mode manager not available');
                return;
            }

            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                modeCount: manager.modes.length,
                modes: manager.modes.map(m => m.toJSON())
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `controller-modes-${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);

            console.log('✅ Exported', data.modeCount, 'modes to JSON file');
        },
        importProfiles(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.modes || !Array.isArray(data.modes)) {
                        alert('Invalid profile file format: missing or invalid modes array');
                        return;
                    }

                    if (data.modes.length === 0) {
                        alert('Cannot import: profile file contains no modes');
                        return;
                    }

                    const manager = getModeManager();
                    if (!manager) {
                        alert('Mode manager not available');
                        return;
                    }

                    manager.modes = data.modes.map(m => new Mode(m));
                    manager.currentIndex = 0;
                    manager.saveModes();

                    this.refreshKey++;

                    console.log(`✅ Successfully imported ${data.modes.length} modes from ${data.exportDate || 'unknown date'}`);
                    alert(`Successfully imported ${data.modes.length} modes`);
                } catch (error) {
                    console.error('❌ Import error:', error);
                    alert('Error importing profiles: ' + error.message);
                }

                event.target.value = '';
            };
            reader.readAsText(file);
        },
        triggerImport() {
            this.$refs.fileInput.click();
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
                                :key="mode.createdAt + '-' + index"
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
                                    <button class="mode-button mode-duplicate" @click="duplicateMode(index)">Duplicate</button>
                                    <button class="mode-button mode-delete" @click="deleteMode(index)">Delete</button>
                                </div>
                            </div>
                        </div>
                        <div class="add-mode-section">
                            <button class="add-mode-button" @click="addNewMode">
                                <span class="add-icon">+</span>
                                <span>Add New Mode</span>
                            </button>
                        </div>
                        <div class="profile-actions-section">
                            <button class="profile-button profile-export" @click="exportProfiles">
                                <span class="profile-icon">↓</span>
                                <span>Export Profiles</span>
                            </button>
                            <button class="profile-button profile-import" @click="triggerImport">
                                <span class="profile-icon">↑</span>
                                <span>Import Profiles</span>
                            </button>
                            <input
                                ref="fileInput"
                                type="file"
                                accept=".json"
                                @change="importProfiles"
                                style="display: none;"
                            />
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
                                <div class="steering-control-config">
                                    <div class="form-group">
                                        <label for="steering-type">Steering Type</label>
                                        <select
                                            id="steering-type"
                                            v-model="steeringType"
                                            class="form-select"
                                        >
                                            <option value="front-only">Front Only</option>
                                            <option value="all-wheel">All Wheel</option>
                                            <option value="opposite">Opposite</option>
                                            <option value="independent">Independent</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="max-angle">Max Steering Angle</label>
                                        <div class="slider-group">
                                            <input
                                                id="max-angle"
                                                type="range"
                                                min="0"
                                                max="90"
                                                step="5"
                                                v-model.number="steeringMaxAngle"
                                                class="form-slider"
                                            />
                                            <span class="slider-value">{{ steeringMaxAngle }}°</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="editor-section">
                                <h4>Utility Buttons</h4>
                                <div class="utility-buttons-config">
                                    <div class="button-mapping-row">
                                        <span class="action-label">Jump</span>
                                        <select v-model.number="editingMode.utilityButtons[0].buttonIndex" class="form-select button-select">
                                            <option :value="0">A</option>
                                            <option :value="1">B</option>
                                            <option :value="2">X</option>
                                            <option :value="3">Y</option>
                                            <option :value="4">LB</option>
                                            <option :value="5">RB</option>
                                            <option :value="6">LT</option>
                                            <option :value="7">RT</option>
                                            <option :value="8">Back</option>
                                            <option :value="9">Start</option>
                                            <option :value="10">LS</option>
                                            <option :value="11">RS</option>
                                        </select>
                                        <span class="button-badge">{{ ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS'][editingMode.utilityButtons[0].buttonIndex || 0] }}</span>
                                    </div>
                                    <div class="button-mapping-row">
                                        <span class="action-label">Brake</span>
                                        <select v-model.number="editingMode.utilityButtons[1].buttonIndex" class="form-select button-select">
                                            <option :value="0">A</option>
                                            <option :value="1">B</option>
                                            <option :value="2">X</option>
                                            <option :value="3">Y</option>
                                            <option :value="4">LB</option>
                                            <option :value="5">RB</option>
                                            <option :value="6">LT</option>
                                            <option :value="7">RT</option>
                                            <option :value="8">Back</option>
                                            <option :value="9">Start</option>
                                            <option :value="10">LS</option>
                                            <option :value="11">RS</option>
                                        </select>
                                        <span class="button-badge">{{ ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS'][editingMode.utilityButtons[1].buttonIndex || 1] }}</span>
                                    </div>
                                    <div class="button-mapping-row">
                                        <span class="action-label">Reset Position</span>
                                        <select v-model.number="editingMode.utilityButtons[2].buttonIndex" class="form-select button-select">
                                            <option :value="0">A</option>
                                            <option :value="1">B</option>
                                            <option :value="2">X</option>
                                            <option :value="3">Y</option>
                                            <option :value="4">LB</option>
                                            <option :value="5">RB</option>
                                            <option :value="6">LT</option>
                                            <option :value="7">RT</option>
                                            <option :value="8">Back</option>
                                            <option :value="9">Start</option>
                                            <option :value="10">LS</option>
                                            <option :value="11">RS</option>
                                        </select>
                                        <span class="button-badge">{{ ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS'][editingMode.utilityButtons[2].buttonIndex || 2] }}</span>
                                    </div>
                                    <div class="button-mapping-row">
                                        <span class="action-label">Reset Wheels</span>
                                        <select v-model.number="editingMode.utilityButtons[3].buttonIndex" class="form-select button-select">
                                            <option :value="0">A</option>
                                            <option :value="1">B</option>
                                            <option :value="2">X</option>
                                            <option :value="3">Y</option>
                                            <option :value="4">LB</option>
                                            <option :value="5">RB</option>
                                            <option :value="6">LT</option>
                                            <option :value="7">RT</option>
                                            <option :value="8">Back</option>
                                            <option :value="9">Start</option>
                                            <option :value="10">LS</option>
                                            <option :value="11">RS</option>
                                        </select>
                                        <span class="button-badge">{{ ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS'][editingMode.utilityButtons[3].buttonIndex || 3] }}</span>
                                    </div>
                                </div>
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
