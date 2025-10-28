export const ControllerConfigUI = {
    name: 'ControllerConfigUI',
    data() {
        return {
            visible: false
        };
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown);
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
                    <p>Configuration UI content will go here...</p>
                </div>
            </div>
        </div>
    `
};
