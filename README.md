# babylon-js-car-example
Ein Babylon.js Auto-Spiel Demo mit Vue3 und responsivem UI

## Beschreibung

Dies ist ein interaktives 3D-Auto-Spiel, das in einer einzigen `index.html` Datei implementiert ist. Das Spiel nutzt:
- **Babylon.js** für die 3D-Grafik und Physik-Engine
- **Vue3** für reaktive UI-Komponenten
- **CSS** für das Styling der Benutzeroberfläche

## Features

### Gameplay
- 🚗 Steuerbares Auto mit realistischer Physik
- 🏗️ 3 Türme, die das Auto stoppen können
- 📦 5 kleine Quadrate, die vom Auto umgeworfen werden können
- 🎮 Einfache WASD-Steuerung

### UI-Elemente
**Linkes Panel - Fahrzeug Daten:**
- Aktuelle Geschwindigkeit (km/h)
- Position (X und Z Koordinaten)
- Rotation (in Grad)
- Beschleunigungsstatus
- Steuerungsanleitung

**Rechtes Panel - Spielstatistik:**
- Anzahl umgeworfener Quadrate
- Kollisionen mit Türmen
- Höchstgeschwindigkeit
- Status jedes einzelnen Quadrats

## Installation

1. Repository klonen:
```bash
git clone https://github.com/manuelhintermayr/babylon-js-car-example.git
cd babylon-js-car-example
```

2. Abhängigkeiten installieren:
```bash
npm install
```

## Verwendung

1. Starten Sie einen lokalen Webserver:
```bash
npm run serve
# oder
python3 -m http.server 8080
# oder
npx serve
```

2. Öffnen Sie Ihren Browser und navigieren Sie zu:
```
http://localhost:8080
```

3. Steuern Sie das Auto mit den folgenden Tasten:
- **W** - Vorwärts fahren
- **S** - Rückwärts fahren / Bremsen
- **A** - Links lenken
- **D** - Rechts lenken

## Spielziel

- Fahren Sie durch die Welt und versuchen Sie, alle 5 gelben Quadrate umzuwerfen
- Vermeiden Sie Kollisionen mit den grauen Türmen
- Erreichen Sie die höchste Geschwindigkeit!

## Technische Details

Das Spiel basiert auf dem Babylon.js Playground Beispiel: https://www.babylonjs-playground.com/#ANV5OM#139

**Verwendete Technologien:**
- Babylon.js v8.31.0 (3D-Engine)
- Cannon.js (Physik-Engine)
- Vue.js 3 (Reaktive UI)
- Vanilla CSS (Styling)

## Entwicklung

Die gesamte Anwendung ist in einer einzigen `index.html` Datei enthalten, was die Wartung und das Deployment vereinfacht.

## Lizenz

ISC
