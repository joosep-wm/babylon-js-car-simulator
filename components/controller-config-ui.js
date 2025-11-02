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
            editingMode: null,
            isCreatingNewMode: false,
            availableActions: [
                { value: 'jump', label: 'Jump', defaultType: 'press' },
                { value: 'brake', label: 'Brake', defaultType: 'hold' },
                { value: 'resetPosition', label: 'Reset Car Position', defaultType: 'press' },
                { value: 'resetWheels', label: 'Reset Wheels to Center', defaultType: 'press' },
                { value: 'spinTurnClockwise', label: 'Spin Clockwise', defaultType: 'hold' },
                { value: 'spinTurnCounterClockwise', label: 'Spin Counterclockwise', defaultType: 'hold' },
                { value: 'calibrateWheels', label: 'Calibrate Wheels', defaultType: 'hold' }
            ],
            buttonNames: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'D-Up', 'D-Down', 'D-Left', 'D-Right']
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
        wheelGroupValidationError() {
            if (!this.editingMode || !this.editingMode.steeringControl.wheelGroups) return null;

            const groups = this.editingMode.steeringControl.wheelGroups;
            const frontOrBack = groups.front.enabled || groups.back.enabled;
            const allSame = groups.allSame.enabled;
            const allOpposite = groups.allOpposite.enabled;

            // Check for no groups enabled
            if (!frontOrBack && !allSame && !allOpposite) {
                return 'At least one wheel group must be enabled';
            }

            // Check for invalid combinations
            if (frontOrBack && allSame) {
                return 'Cannot combine Front/Back with All Same Direction';
            }
            if (frontOrBack && allOpposite) {
                return 'Cannot combine Front/Back with All Opposite Direction';
            }
            if (allSame && allOpposite) {
                return 'Cannot combine All Same with All Opposite Direction';
            }

            return null;
        },
        utilityButtonList() {
            if (!this.editingMode || !this.editingMode.utilityButtons) return [];

            const buttons = [];
            for (const [slotIndex, config] of Object.entries(this.editingMode.utilityButtons)) {
                const actionDef = this.availableActions.find(a => a.value === config.action);
                buttons.push({
                    slotIndex: parseInt(slotIndex),
                    config: config,
                    label: actionDef ? actionDef.label : config.action
                });
            }

            buttons.sort((a, b) => a.slotIndex - b.slotIndex);
            return buttons;
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
            this.migrateSteeringWheelGroups();

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
        migrateSteeringWheelGroups() {
            const config = this.editingMode.steeringControl;

            // Initialize globalParams if not present
            if (!config.globalParams) {
                config.globalParams = {
                    maxAngle: config.maxAngle || config.frontMaxAngle || config.frontWheelsMaxAngle || 45,
                    sensitivity: config.sensitivity || 1.0,
                    deadZone: config.deadZone || 0.15
                };
            }

            // Initialize wheelGroups if not present - migrate from old structure
            if (!config.wheelGroups) {
                config.wheelGroups = {
                    front: { enabled: false, axis: 'LS-X' },
                    back: { enabled: false, axis: 'LS-X' },
                    allSame: { enabled: false, axis: 'LS-X' },
                    allOpposite: { enabled: false, axis: 'LS-X' }
                };

                // Migrate old structure to new wheelGroups
                if (config.type === 'singleInput' && config.wheels === 'front') {
                    config.wheelGroups.front.enabled = true;
                    config.wheelGroups.front.axis = config.input || 'LS-X';
                } else if (config.type === 'singleInput' && config.wheels === 'back') {
                    config.wheelGroups.back.enabled = true;
                    config.wheelGroups.back.axis = config.input || 'LS-X';
                } else if (config.type === 'singleInput' && config.wheels === 'all') {
                    config.wheelGroups.allSame.enabled = true;
                    config.wheelGroups.allSame.axis = config.input || 'LS-X';
                } else if (config.type === 'singleInput' && config.wheels === 'opposite') {
                    config.wheelGroups.allOpposite.enabled = true;
                    config.wheelGroups.allOpposite.axis = config.input || 'LS-X';
                } else if (config.type === 'opposing') {
                    config.wheelGroups.allOpposite.enabled = true;
                    config.wheelGroups.allOpposite.axis = config.input || 'LS-X';
                } else if (config.type === 'multiInput') {
                    config.wheelGroups.front.enabled = true;
                    config.wheelGroups.back.enabled = true;
                    config.wheelGroups.front.axis = config.frontInput || 'LS-X';
                    config.wheelGroups.back.axis = config.rearInput || 'RS-X';
                }
            }
        },
        saveMode() {
            const manager = getModeManager();
            if (!manager || this.editingModeIndex === null) return;

            // Validate wheel groups before saving
            if (this.wheelGroupValidationError) {
                alert('Cannot save: ' + this.wheelGroupValidationError);
                return;
            }

            // Sync speed control source to type field for backward compatibility
            this.syncSpeedControlToOldStructure();

            // Sync wheelGroups back to old data structure for backward compatibility
            this.syncWheelGroupsToOldStructure();

            const reconstructedMode = new Mode(this.editingMode);
            reconstructedMode.modifiedAt = Date.now();

            manager.modes[this.editingModeIndex] = reconstructedMode;
            manager.saveModes();

            // Notify desktop-controls that mode configuration changed
            // Fire event if this is the currently active mode
            if (window.getGamepadManager) {
                const gamepadManager = window.getGamepadManager();
                if (gamepadManager && this.editingModeIndex === manager.currentIndex) {
                    // Fire modechange event to trigger hint updates
                    gamepadManager._emit('modechange', {
                        mode: reconstructedMode,
                        direction: 'update'
                    });
                    console.log('🎮 Fired modechange event for updated mode:', reconstructedMode.name);
                }
            }

            this.refreshKey++;
            this.isCreatingNewMode = false;
            this.editingModeIndex = null;
            this.editingMode = null;

            console.log('Mode saved successfully');
        },
        syncSpeedControlToOldStructure() {
            const config = this.editingMode.speedControl;

            // Map source to type for control-mapper compatibility
            if (config.source === 'triggers') {
                config.type = 'triggers';
            } else if (config.source === 'rightStickY' || config.source === 'leftStickY') {
                config.type = 'stick';
                config.input = config.source === 'rightStickY' ? 'RS-Y' : 'LS-Y';
            }
        },
        syncWheelGroupsToOldStructure() {
            const config = this.editingMode.steeringControl;
            const groups = config.wheelGroups;
            const globalParams = config.globalParams;

            // Update old structure from wheelGroups
            config.maxAngle = globalParams.maxAngle;
            config.sensitivity = globalParams.sensitivity;
            config.deadZone = globalParams.deadZone;

            if (groups.front.enabled && groups.back.enabled) {
                // Independent mode
                config.type = 'multiInput';
                config.frontInput = groups.front.axis;
                config.rearInput = groups.back.axis;
                config.frontMaxAngle = globalParams.maxAngle;
                config.rearMaxAngle = globalParams.maxAngle;
                delete config.wheels;
                delete config.input;
            } else if (groups.allOpposite.enabled) {
                // Opposite mode
                config.type = 'opposing';
                config.input = groups.allOpposite.axis;
                config.frontWheelsMaxAngle = globalParams.maxAngle;
                config.rearWheelsMaxAngle = globalParams.maxAngle;
                delete config.wheels;
            } else if (groups.allSame.enabled) {
                // All wheel same direction
                config.type = 'singleInput';
                config.wheels = 'all';
                config.input = groups.allSame.axis;
            } else if (groups.front.enabled) {
                // Front only
                config.type = 'singleInput';
                config.wheels = 'front';
                config.input = groups.front.axis;
            } else if (groups.back.enabled) {
                // Back only
                config.type = 'singleInput';
                config.wheels = 'back';
                config.input = groups.back.axis;
            }
        },
        cancelEdit() {
            const manager = getModeManager();

            if (this.isCreatingNewMode && this.editingModeIndex !== null && manager) {
                manager.modes.splice(this.editingModeIndex, 1);
                console.log('Cancelled new mode creation - mode discarded');
            }

            this.isCreatingNewMode = false;
            this.editingModeIndex = null;
            this.editingMode = null;
            this.refreshKey++;
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
                    maxAngle: 25,
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

            this.isCreatingNewMode = true;
            this.editingModeIndex = manager.modes.length - 1;
            this.editingMode = JSON.parse(JSON.stringify(newMode));

            this.migrateSpeedControlSource();
            this.ensureDefaultMaxSpeed();
            this.migrateUtilityButtons();
            this.migrateSteeringWheelGroups();

            console.log('Creating new mode (unsaved draft):', newMode.name);
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

            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
            const a = document.createElement('a');
            a.href = url;
            a.download = `controller-modes-${timestamp}.json`;
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
        },
        resetToDefaults() {
            if (!confirm('Are you sure you want to reset all modes to factory defaults? This will delete all custom modes and configuration.')) {
                return;
            }

            const manager = getModeManager();
            if (!manager) {
                alert('Mode manager not available');
                return;
            }

            manager.resetToDefaults();
            this.refreshKey++;

            console.log('✅ Reset to factory defaults');
            alert('Successfully reset to factory defaults');
        },
        addUtilityButton() {
            if (!this.editingMode || !this.editingMode.utilityButtons) return;

            const usedSlots = Object.keys(this.editingMode.utilityButtons).map(k => parseInt(k));
            let nextSlot = 0;
            while (usedSlots.includes(nextSlot)) {
                nextSlot++;
            }

            this.editingMode.utilityButtons[nextSlot] = {
                action: 'jump',
                type: 'press',
                buttonIndex: nextSlot
            };
        },
        removeUtilityButton(slotIndex) {
            if (!this.editingMode || !this.editingMode.utilityButtons) return;
            delete this.editingMode.utilityButtons[slotIndex];
        },
        updateUtilityButtonAction(slotIndex, actionValue) {
            if (!this.editingMode || !this.editingMode.utilityButtons) return;

            const actionDef = this.availableActions.find(a => a.value === actionValue);
            if (actionDef) {
                this.editingMode.utilityButtons[slotIndex].action = actionValue;
                this.editingMode.utilityButtons[slotIndex].type = actionDef.defaultType;

                if (actionDef.defaultType === 'hold' && !this.editingMode.utilityButtons[slotIndex].holdDuration) {
                    this.editingMode.utilityButtons[slotIndex].holdDuration = 100;
                }
            }
        },
        getActionLabel(actionValue) {
            const actionDef = this.availableActions.find(a => a.value === actionValue);
            return actionDef ? actionDef.label : actionValue;
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
                            <button class="profile-button profile-reset" @click="resetToDefaults">
                                <span class="profile-icon">↻</span>
                                <span>Reset to Defaults</span>
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
                                    <!-- Global Parameters -->
                                    <div class="steering-subsection">
                                        <h5 class="subsection-title">Global Parameters</h5>
                                        <div class="form-group">
                                            <label for="global-max-angle">Max Angle</label>
                                            <div class="slider-group">
                                                <input
                                                    id="global-max-angle"
                                                    type="range"
                                                    min="0"
                                                    max="90"
                                                    step="5"
                                                    v-model.number="editingMode.steeringControl.globalParams.maxAngle"
                                                    class="form-slider"
                                                />
                                                <span class="slider-value">{{ editingMode.steeringControl.globalParams.maxAngle }}°</span>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="global-sensitivity">Sensitivity</label>
                                            <div class="slider-group">
                                                <input
                                                    id="global-sensitivity"
                                                    type="range"
                                                    min="0.1"
                                                    max="3.0"
                                                    step="0.1"
                                                    v-model.number="editingMode.steeringControl.globalParams.sensitivity"
                                                    class="form-slider"
                                                />
                                                <span class="slider-value">{{ editingMode.steeringControl.globalParams.sensitivity.toFixed(1) }}</span>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label for="global-deadzone">Dead Zone</label>
                                            <div class="slider-group">
                                                <input
                                                    id="global-deadzone"
                                                    type="range"
                                                    min="0"
                                                    max="0.5"
                                                    step="0.05"
                                                    v-model.number="editingMode.steeringControl.globalParams.deadZone"
                                                    class="form-slider"
                                                />
                                                <span class="slider-value">{{ editingMode.steeringControl.globalParams.deadZone.toFixed(2) }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Wheel Groups -->
                                    <div class="steering-subsection">
                                        <h5 class="subsection-title">Wheel Groups</h5>

                                        <!-- Front Wheels -->
                                        <div class="wheel-group-row">
                                            <label class="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    v-model="editingMode.steeringControl.wheelGroups.front.enabled"
                                                    class="checkbox-input"
                                                />
                                                <span>FRONT WHEELS</span>
                                            </label>
                                            <select
                                                v-model="editingMode.steeringControl.wheelGroups.front.axis"
                                                :disabled="!editingMode.steeringControl.wheelGroups.front.enabled"
                                                class="form-select axis-select"
                                            >
                                                <option value="LS-X">LS-X (Left Stick X)</option>
                                                <option value="LS-Y">LS-Y (Left Stick Y)</option>
                                                <option value="RS-X">RS-X (Right Stick X)</option>
                                                <option value="RS-Y">RS-Y (Right Stick Y)</option>
                                                <option value="LT+RT">LT+RT (Triggers)</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>

                                        <!-- Back Wheels -->
                                        <div class="wheel-group-row">
                                            <label class="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    v-model="editingMode.steeringControl.wheelGroups.back.enabled"
                                                    class="checkbox-input"
                                                />
                                                <span>BACK WHEELS</span>
                                            </label>
                                            <select
                                                v-model="editingMode.steeringControl.wheelGroups.back.axis"
                                                :disabled="!editingMode.steeringControl.wheelGroups.back.enabled"
                                                class="form-select axis-select"
                                            >
                                                <option value="LS-X">LS-X (Left Stick X)</option>
                                                <option value="LS-Y">LS-Y (Left Stick Y)</option>
                                                <option value="RS-X">RS-X (Right Stick X)</option>
                                                <option value="RS-Y">RS-Y (Right Stick Y)</option>
                                                <option value="LT+RT">LT+RT (Triggers)</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>

                                        <!-- All Same Direction -->
                                        <div class="wheel-group-row">
                                            <label class="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    v-model="editingMode.steeringControl.wheelGroups.allSame.enabled"
                                                    class="checkbox-input"
                                                />
                                                <span>ALL SAME DIRECTION</span>
                                            </label>
                                            <select
                                                v-model="editingMode.steeringControl.wheelGroups.allSame.axis"
                                                :disabled="!editingMode.steeringControl.wheelGroups.allSame.enabled"
                                                class="form-select axis-select"
                                            >
                                                <option value="LS-X">LS-X (Left Stick X)</option>
                                                <option value="LS-Y">LS-Y (Left Stick Y)</option>
                                                <option value="RS-X">RS-X (Right Stick X)</option>
                                                <option value="RS-Y">RS-Y (Right Stick Y)</option>
                                                <option value="LT+RT">LT+RT (Triggers)</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>

                                        <!-- All Opposite Direction -->
                                        <div class="wheel-group-row">
                                            <label class="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    v-model="editingMode.steeringControl.wheelGroups.allOpposite.enabled"
                                                    class="checkbox-input"
                                                />
                                                <span>ALL OPPOSITE DIRECTION</span>
                                            </label>
                                            <select
                                                v-model="editingMode.steeringControl.wheelGroups.allOpposite.axis"
                                                :disabled="!editingMode.steeringControl.wheelGroups.allOpposite.enabled"
                                                class="form-select axis-select"
                                            >
                                                <option value="LS-X">LS-X (Left Stick X)</option>
                                                <option value="LS-Y">LS-Y (Left Stick Y)</option>
                                                <option value="RS-X">RS-X (Right Stick X)</option>
                                                <option value="RS-Y">RS-Y (Right Stick Y)</option>
                                                <option value="LT+RT">LT+RT (Triggers)</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>

                                        <!-- Validation Error -->
                                        <div v-if="wheelGroupValidationError" class="validation-error">
                                            {{ wheelGroupValidationError }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="editor-section">
                                <h4>Utility Buttons</h4>
                                <div class="utility-buttons-config">
                                    <div v-for="button in utilityButtonList" :key="button.slotIndex" class="button-mapping-row">
                                        <select
                                            :value="button.config.action"
                                            @change="updateUtilityButtonAction(button.slotIndex, $event.target.value)"
                                            class="form-select action-select"
                                        >
                                            <option v-for="action in availableActions" :key="action.value" :value="action.value">
                                                {{ action.label }}
                                            </option>
                                        </select>
                                        <select v-model.number="button.config.buttonIndex" class="form-select button-select">
                                            <option v-for="(name, index) in buttonNames" :key="index" :value="index">
                                                {{ name }}
                                            </option>
                                        </select>
                                        <span class="button-badge">{{ buttonNames[button.config.buttonIndex] || 'N/A' }}</span>
                                        <button class="remove-button" @click="removeUtilityButton(button.slotIndex)" title="Remove">✕</button>
                                    </div>
                                    <div class="add-button-row">
                                        <button class="add-utility-button" @click="addUtilityButton">
                                            <span class="add-icon">+</span>
                                            <span>Add Utility Button</span>
                                        </button>
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
