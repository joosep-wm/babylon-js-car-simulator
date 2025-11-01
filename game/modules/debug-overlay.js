// debug-overlay.js - F11 debug overlay system

let debugOverlayElement = null;

export function createDebugOverlay() {
    if (debugOverlayElement) return;

    debugOverlayElement = document.createElement('div');
    debugOverlayElement.id = 'debug-overlay';
    debugOverlayElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.85);
        color: #00ff00;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        border: 2px solid #00ff00;
        border-radius: 5px;
        z-index: 10000;
        min-width: 300px;
        display: none;
    `;

    debugOverlayElement.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #00ff00; padding-bottom: 5px;">
            DEBUG OVERLAY (F11 to toggle)
        </div>
        <div id="debug-content">
            <div><strong>Wheel Angles (degrees):</strong></div>
            <div id="wheel-angles" style="margin-left: 10px;">
                FL: <span id="angle-fl">0.0</span>°<br>
                FR: <span id="angle-fr">0.0</span>°<br>
                RL: <span id="angle-rl">0.0</span>°<br>
                RR: <span id="angle-rr">0.0</span>°
            </div>
            <div style="margin-top: 10px;"><strong>Wheel Speeds:</strong></div>
            <div id="wheel-speeds" style="margin-left: 10px;">
                FL: <span id="speed-fl">0.0</span><br>
                FR: <span id="speed-fr">0.0</span><br>
                RL: <span id="speed-rl">0.0</span><br>
                RR: <span id="speed-rr">0.0</span>
            </div>
            <div style="margin-top: 10px;"><strong>Steering Mode:</strong></div>
            <div id="steering-mode" style="margin-left: 10px; color: #ffff00;">--</div>
            <div style="margin-top: 10px;"><strong>Special Mode:</strong></div>
            <div id="special-mode" style="margin-left: 10px; color: #ff8800;">--</div>
        </div>
    `;

    document.body.appendChild(debugOverlayElement);
    console.log("🔧 Debug overlay created");
}

export function toggleDebugOverlay() {
    if (!debugOverlayElement) {
        createDebugOverlay();
    }

    if (debugOverlayElement.style.display === 'none') {
        debugOverlayElement.style.display = 'block';
        console.log("🔧 Debug overlay enabled");
    } else {
        debugOverlayElement.style.display = 'none';
        console.log("🔧 Debug overlay disabled");
    }
}

export function updateDebugOverlay(steerAngle, wheelSpeed, currentMode, specialMode = 'None') {
    if (!debugOverlayElement || debugOverlayElement.style.display === 'none') return;

    const radToDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);

    document.getElementById('angle-fl').textContent = radToDeg(steerAngle.FL);
    document.getElementById('angle-fr').textContent = radToDeg(steerAngle.FR);
    document.getElementById('angle-rl').textContent = radToDeg(steerAngle.RL);
    document.getElementById('angle-rr').textContent = radToDeg(steerAngle.RR);

    document.getElementById('speed-fl').textContent = wheelSpeed.FL.toFixed(1);
    document.getElementById('speed-fr').textContent = wheelSpeed.FR.toFixed(1);
    document.getElementById('speed-rl').textContent = wheelSpeed.RL.toFixed(1);
    document.getElementById('speed-rr').textContent = wheelSpeed.RR.toFixed(1);

    document.getElementById('steering-mode').textContent = currentMode;
    document.getElementById('special-mode').textContent = specialMode;
}
