# 🏎️ Babylon.js Car Racing Game

A modern 3D car racing game built with cutting-edge web technologies (babylon.js), featuring realistic physics, intelligent device detection, custom 3D car models, dynamic lighting, and modular component architecture.

## 🚀 Modern Architecture

This project showcases **advanced game development** using:

### **ES6 Module System**
- **Clean imports/exports** for maintainable code structure
- **Separated concerns** with dedicated modules for each feature
- **Modern JavaScript** with async/await and arrow functions

### **Component-Based Architecture**
- **Vue.js 3** with Composition API for reactive UI
- **Modular components** (`info-panel`, `desktop-controls`, `mobile-controls`)
- **Event-driven communication** between components
- **Props-based data flow** for clean component interaction

### **CSS Organization**
- **Modular stylesheets** for each component and feature
- **Responsive design** with device-specific optimizations
- **Glassmorphism effects** for modern UI aesthetics
- **Cross-platform styling** for desktop and mobile

### **Intelligent Device Detection**
- **CSS media queries** for accurate touch device detection
- **Automatic UI adaptation** based on input capabilities
- **Cross-platform compatibility** (Desktop + Mobile + Tablets)

## 🎮 Advanced Game Features

### 🏁 Core Gameplay
- **Realistic car physics** powered by Havok Physics Engine
- **Custom 3D car model** support with GLB/GLTF loading
- **ConvexHull physics** for complex 3D model collision detection
- **Dynamic camera system** with mouse controls and smooth following
- **Jump mechanics** with Space key for aerial stunts
- **Advanced braking system** with B key for precision control
- **Enhanced steering** with optimized responsiveness (4x faster turning)

### 🎯 Game Objectives & Environment
- 🎯 **Knock down boxes** - Hit all 5 orange physics-enabled targets
- 💥 **Navigate obstacles** - Avoid brown collision towers strategically placed around track
- � **Bridge challenges** - Drive over elevated bridge platforms for bonus points
- 🏎️ **Speed challenges** - Test vehicle performance on varied terrain
- 🎨 **Studio environment** - Race in professional white-walled studio setting

### � Dynamic Lighting System
- **Realistic car lighting** with front headlights and rear taillights
- **Warm white headlights** (#ddc584) with cylindrical lens design
- **Red taillights** with Point Light technology for authentic illumination
- **ESM shadow mapping** for realistic light casting and ground reflections
- **Dark ambient lighting** for dramatic racing atmosphere
- **Dynamic light-surface interaction** with proper material reflections

### 📊 Advanced Telemetry
- **Vehicle telemetry** (speed in km/h, 3D position, rotation)
- **Performance metrics** (total collisions, race time, maximum speed)
- **Physics monitoring** (wheel physics, suspension dynamics)
- **Progress tracking** (knocked boxes counter with physics detection)
- **Interactive debug panels** with F12 toggle and auto-hide on mobile

## 🖥️ Cross-Platform Controls

### **Desktop Experience**
- **WASD/Arrow Keys** for movement with real-time visual feedback
- **Space Bar** for braking with force indication
- **Enter Key** for instant game reset
- **F12/Backtick** for debug panel toggle
- **Key state visualization** with active/inactive indicators

### **Mobile Experience**
- **Virtual joystick** for precise movement control with visual feedback
- **Touch brake button** (🚗) for braking actions
- **Touch reset button** (🔄) for game restart
- **Responsive touch areas** optimized for finger interaction
- **Auto-hiding desktop controls** on touch devices

### **Intelligent UI Adaptation**
- **Automatic device detection** using CSS media queries
- **Dynamic component visibility** based on input capabilities
- **Optimized layouts** for different screen sizes and orientations
- **Touch-first design** for mobile devices
- **Glassmorphism UI** with modern gaming aesthetics

## 🏗️ Project Structure

```
📦 babylon-js-car-example/
├── 📄 index.html              # Clean HTML template with module imports
├── 📄 index.js               # 🎯 Application entry point
├── 📄 vue-app.js             # 🎨 Main Vue app with device detection
│
├── 📁 components/            # 🔧 Modular Vue Components
│   ├── 📄 info-panel.js      # Debug panel with glassmorphism UI
│   ├── 📄 desktop-controls.js # Keyboard controls with visual feedback
│   └── 📄 mobile-controls.js  # Touch controls with joystick
│
├── 📁 css/                   # 🎨 Modular Stylesheets
│   ├── 📄 main.css           # Core styles, HTML, body, canvas
│   ├── 📄 info-panel.css     # Debug panel glassmorphism styling
│   ├── 📄 mobile-controls.css # Virtual joystick & touch buttons
│   └── 📄 desktop-controls.css # Key displays with active states
│
└── 📁 game/                  # 🎮 Game Engine & Assets
    ├── 📄 babylon-game.js    # Complete Babylon.js game logic
    └── 📁 textures/          # 3D texture assets
        ├── 📄 up.png         # Track and wheel textures
        └── 📄 amiga.jpg      # Wall and post textures
```

## 🛠️ Technology Stack

### **Frontend Architecture**
- **Vue.js 3** - Reactive UI framework with Composition API and ES6 modules
- **Component-Based Design** - Separated concerns with reusable components
- **Event-Driven Architecture** - Clean component communication via Vue events

### **3D Graphics & Physics**
- **Babylon.js v8.31.0** - Professional 3D rendering engine with WebGL2
- **Havok Physics** - Realistic car dynamics and collision detection
- **Real-time Rendering** - 60fps smooth gameplay with dynamic objects

### **Device Detection & Adaptation**
- **CSS Media Queries** - Intelligent touch device detection
- **Responsive Components** - Auto-adapting UI based on input capabilities
- **Cross-Platform Support** - Desktop, mobile, and tablet optimized

### **Styling & Design**
- **Modular CSS** - Component-specific stylesheets for maintainability
- **Glassmorphism Effects** - Modern frosted glass UI aesthetics
- **Responsive Design** - Optimized layouts for all screen sizes

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser with ES6 module support
- Local web server (required for ES6 modules)  
- WebGL2 compatible graphics (most modern devices)

### **Quick Start**

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

4. **🏆 Master the Physics**
   - Experiment with realistic car physics and momentum
   - Learn to control the vehicle through corners and obstacles
   - Try to knock all boxes with minimal collisions for the perfect run

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

*Created with ❤️ and cutting-edge web technologies*