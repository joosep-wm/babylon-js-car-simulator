export const ModeIndicator = {
    name: 'ModeIndicator',
    props: {
        modeName: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="mode-indicator">
            <div class="mode-label">Mode (F10 to edit)</div>
            <div class="mode-name">{{ modeName }}</div>
        </div>
    `
};
