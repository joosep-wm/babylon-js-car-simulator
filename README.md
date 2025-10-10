# 🏎️ Babylon.js Car Racing Game

A professional 3D car racing game with modern UI, realistic physics, and interactive gameplay elements.

## 🎮 Description

A fully functional 3D racing game implemented with cutting-edge web technologies:
- **Babylon.js** for 3D graphics and Havok physics engine
- **Vue.js 3** for reactive user interface
- **Modern CSS** with glassmorphism and gaming aesthetics
- **Real-time data tracking** for all vehicle parameters

## ⚡ Features

### 🏁 Gameplay Mechanics
- **Free driving** on an 800x800 unit square track
- **Realistic vehicle physics** with Ackermann steering geometry
- **8 collision towers** strategically placed on the track
- **5 knockable boxes** for collection challenges
- **Collision detection** with cooldown system
- **Complete reset** with Enter key

### 🎯 Game Objectives
- 🎯 Knock down all 5 orange boxes
- 💥 Minimize collisions with brown towers
- 🏎️ Reach maximum speed
- ⏱️ Set personal best times

### 🖥️ User Interface

**📊 Left Panel - Vehicle Telemetry:**
- **Speed** (km/h) with real-time updates
- **3D Position** (X, Y, Z coordinates)
- **Rotation** (degree display)
- **Direction indicator** with all active inputs
- **Control overview** with key combinations

**📈 Right Panel - Game Statistics:**
- **Race time** with start/stop functionality
- **Knocked boxes** (0/5 progress indicator)
- **Collision counter** for performance tracking
- **Top speed** as personal record
- **Game objectives** and information

### 🎨 Design Features
- **Futuristic gaming UI** with neon accents
- **Glassmorphism effects** with backdrop filter
- **Gradient textures** for professional look
- **Hover animations** and smooth transitions
- **Responsive design** for various screen sizes

## 🚀 Installation

1. **Clone repository:**
```bash
git clone https://github.com/manuelhintermayr/babylon-js-car-example.git
cd babylon-js-car-example
```

2. **Install dependencies:**
```bash
npm install
```

## 🎯 Usage

1. **Start development server:**
```bash
npm run serve
```

2. **Open browser:**
```
http://localhost:8080
```

## 🎮 Controls

| Key | Function |
|-----|----------|
| **W** | ⬆️ Drive forward |
| **S** | ⬇️ Drive backward |
| **A** | ⬅️ Steer left |
| **D** | ➡️ Steer right |
| **Space** | 🚗 Brake |
| **Enter** | 🔄 Reset game |

## 🛠️ Technical Details

### 🏗️ Architecture
- **Single-Page Application** in one `index.html` file
- **CDN-based dependencies** for easy deployment
- **Modular JavaScript functions** for clean code
- **Vue.js Composition API** for reactive data handling

### 🎨 3D Assets
- **Procedural geometry** (no external 3D models required)
- **Texture assets** in `textures/` folder:
  - `up.png` - Asphalt texture for road and tires
  - `amiga.jpg` - Checkerboard texture for walls and finish line

### ⚙️ Physics Engine
- **Havok Physics** for realistic vehicle dynamics
- **6DOF constraints** for wheel suspension and steering
- **Collision detection** with filter system
- **Ackermann steering geometry** for authentic driving behavior

### 📱 Performance
- **60 FPS** target framerate
- **Optimized render pipeline** with Babylon.js
- **Efficient memory management** through dispose pattern
- **Responsive design** for various screen sizes

## 🎯 Gameplay Mechanics

### 🏆 Scoring System
- **Knock down boxes**: +1 per knocked box (max. 5)
- **Collisions**: Tracking for performance analysis
- **Speed**: Record personal best times
- **Time**: Stopwatch for laps and challenges

### 🎮 Game States
- **START**: Ready to drive
- **RACING**: Active gameplay with time measurement
- **RESET**: Complete restart possible

## 🔧 Development

### 📁 Project Structure
```
babylon-js-car-example/
├── index.html          # Main game file
├── textures/           # 3D textures
│   ├── up.png         # Asphalt texture
│   └── amiga.jpg      # Checkerboard texture
├── package.json       # NPM configuration
└── README.md         # Project documentation
```

### 🚀 Future Version Features
- [ ] Multiple race track layouts
- [ ] Multiplayer functionality
- [ ] Sound effects and music
- [ ] Vehicle customization
- [ ] Leaderboards and achievements
- [ ] Mobile touch controls

## 📄 License

This project is under the MIT License. See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 📞 Contact

**Developer**: Manuel Hintermayr  
**GitHub**: [@manuelhintermayr](https://github.com/manuelhintermayr)

---

*Created with ❤️ and cutting-edge web technologies*

## Technical Details

The game is based on the Babylon.js Playground example: https://www.babylonjs-playground.com/#ANV5OM#139

**Technologies used:**
- Babylon.js v8.31.0 (3D Engine)
- Havok Physics (Physics Engine)
- Vue.js 3 (Reactive UI)
- Vanilla CSS (Styling)

## Development

The entire application is contained in a single `index.html` file, which simplifies maintenance and deployment.

## License

MIT
