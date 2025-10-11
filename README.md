# 🏎️ Babylon.js Car Racing Game

A modern 3D car racing game built with cutting-edge web technologies, featuring realistic physics, responsive UI, and cross-platform support.

## 🚀 Modern Architecture

This project showcases **professional-grade game development** using:
- **ES6 Modules** for clean, maintainable code structure
- **Component-based architecture** with separated concerns
- **Modern CSS organization** with modular stylesheets
- **Cross-platform compatibility** (Desktop + Mobile)

## 🎮 Game Features

### 🏁 Core Gameplay
- **Realistic car physics** powered by Havok Physics Engine
- **Dynamic collision detection** with box-knockdown mechanics
- **Race timing system** with automatic start/stop
- **Reset functionality** for instant game restart
- **Free-roam driving** on expansive square track

### 🎯 Game Objectives
- 🎯 **Knock down boxes** - Find and hit all 5 orange targets
- 💥 **Avoid collisions** - Navigate around obstacle towers
- 🏎️ **Achieve top speed** - Push your vehicle to the limit
- ⏱️ **Beat your time** - Race against your personal best

### 📊 Real-time Data Tracking
- **Vehicle telemetry** (speed, position, rotation)
- **Performance metrics** (collisions, race time, top speed)
- **Progress indicators** (knocked boxes counter)
- **Interactive debug panels** with F12 toggle

## 🖥️ User Interface

### **Desktop Experience**
- **WASD Movement** with visual key feedback
- **Space Bar** for braking
- **Enter Key** for game reset
- **F12/Backtick** for debug panel toggle

### **Mobile Experience**
- **Virtual joystick** for smooth movement control
- **Touch buttons** for brake and reset actions
- **Responsive design** optimized for touch devices
- **Auto-detection** of touch capabilities

### **Debug Information**
- **Left Panel**: Vehicle data (speed, position, rotation, direction)
- **Right Panel**: Game statistics (race time, knocked boxes, collisions, top speed)
- **Glassmorphism UI** with modern gaming aesthetics

## 🏗️ Project Structure

```
📦 babylon-js-car-example/
├── 📄 index.html              # Main HTML template
├── 📄 index.js               # 🎯 Application entry point
├── 📄 vue-app.js             # 🎨 Vue.js application logic
│
├── 📁 components/            # 🔧 Vue Components
│   └── 📄 InfoPanel.js       # Debug panel component
│
├── 📁 css/                   # 🎨 Modular Stylesheets
│   ├── 📄 main.css           # Core styles & canvas
│   ├── 📄 info-panel.css     # Debug panel styling
│   ├── 📄 mobile-controls.css # Touch controls styling
│   └── 📄 desktop-controls.css # Desktop UI styling
│
└── 📁 game/                  # 🎮 Game Logic & Assets
    ├── 📄 babylon-game.js    # Babylon.js game engine
    └── 📁 textures/          # 3D texture assets
        ├── 📄 up.png
        └── 📄 amiga.jpg
```

## 🛠️ Technology Stack

### **Frontend Framework**
- **Vue.js 3** - Reactive UI framework with Composition API
- **ES6 Modules** - Modern JavaScript module system
- **Component Architecture** - Reusable, maintainable components

### **3D Graphics & Physics**
- **Babylon.js v8.31.0** - Advanced 3D rendering engine
- **Havok Physics** - Professional physics simulation
- **WebGL2** - Hardware-accelerated graphics
- **Real-time Rendering** - 60fps smooth gameplay

### **Styling & Design**
- **Modern CSS** - CSS Grid, Flexbox, Custom Properties
- **Glassmorphism** - Frosted glass UI effects
- **Responsive Design** - Desktop and mobile optimized
- **CSS Animations** - Smooth transitions and interactions

## � Controls

### **Desktop (WASD)**
| Key | Action |
|-----|--------|
| `W` | Forward |
| `A` | Turn Left |
| `S` | Backward |
| `D` | Turn Right |
| `Space` | Brake |
| `Enter` | Reset Game |
| `F12` / `` ` `` | Toggle Debug Panels |

### **Mobile (Touch)**
| Control | Action |
|---------|--------|
| Virtual Joystick | Movement (forward/backward/left/right) |
| 🚗 Button | Brake |
| � Button | Reset Game |
| F12 Key | Toggle Debug Panels |

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for ES6 module support)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/manuelhintermayr/babylon-js-car-example.git
   cd babylon-js-car-example
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### **Development**
The project uses **ES6 modules** which require a web server (not `file://` protocol) for proper functionality.

## 🎮 How to Play

1. **🏁 Start the Game**
   - Open the game in your browser
   - Use `F12` or `` ` `` to open debug panels (optional)

2. **🚗 Control Your Vehicle**
   - **Desktop**: Use WASD keys for movement
   - **Mobile**: Use the virtual joystick

3. **🎯 Complete Objectives**
   - Drive around and find the 5 orange boxes
   - Hit them to increase your "Knocked Boxes" counter
   - Avoid brown collision towers to minimize collisions

4. **⏱️ Track Performance**
   - Race time starts automatically when you press W
   - Monitor your speed, collisions, and progress
   - Use Enter to reset and try again

5. **🏆 Improve Your Skills**
   - Try to knock all boxes with minimal collisions
   - Achieve higher top speeds
   - Beat your personal best times

## 🔧 Technical Features

### **Performance Optimizations**
- **ES6 Module Loading** - Efficient code splitting
- **Component-based CSS** - Modular styling approach
- **Physics Engine Integration** - Havok for realistic simulation
- **Memory Management** - Proper disposal and cleanup

### **Cross-Platform Support**
- **Touch Device Detection** - Automatic mobile/desktop switching
- **Responsive Layout** - Adapts to different screen sizes
- **Event Handling** - Both touch and keyboard input support
- **Performance Scaling** - Optimized for various devices

### **Code Quality**
- **Clean Architecture** - Separated concerns and modularity
- **Modern JavaScript** - ES6+ features and best practices
- **Type Safety Ready** - Structured for TypeScript migration
- **Documentation** - Comprehensive code comments

## 📱 Browser Compatibility

- ✅ **Chrome** 90+ (Recommended)
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ✅ **Mobile Safari** (iOS 14+)
- ✅ **Chrome Mobile** (Android)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Babylon.js Team** - For the incredible 3D engine
- **Vue.js Team** - For the reactive framework
- **Havok Physics** - For realistic physics simulation
- **Modern Web Standards** - For enabling advanced browser capabilities

---

**🎮 Ready to race? Start your engines and hit the track!** 🏁

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
├── game.css           # Game styling and UI design
├── InfoPanel.js       # Vue component for debug panels
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
