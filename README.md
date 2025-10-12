# Get It Across - Chicken Crossing Game

A fun 2D arcade-style browser game where you help a chicken cross increasingly challenging roads. Built with vanilla JavaScript and optimized for both desktop and mobile devices.

## 🎮 Game Features

### Core Gameplay
- **5 Unique Levels**: Progress through Dirt Roads, City Streets, Golden Highway, Diamond Boulevard, and Obsidian Expressway
- **Progressive Difficulty**: Each level introduces faster and denser traffic
- **Infinite Scaling**: After completing all 5 levels, the difficulty continues to increase
- **Lives System**: Start with 5 lives, lose one for each collision
- **Scoring**: Earn points for successful crossings with time bonuses for speed

### Controls
- **Desktop**: Arrow keys or WASD for movement
- **Mobile**:
  - Touch D-pad for directional movement
  - Large "GO" button for forward movement
  - Swipe gestures for quick movement in any direction

### Visual Themes
Each level features unique visual themes and road textures:
1. **Dirt Roads** - Country setting with trees and houses
2. **City Streets** - Urban environment with buildings and streetlights
3. **Golden Highway** - Luxurious roads with golden statues and pillars
4. **Diamond Boulevard** - Crystalline theme with sparkling effects
5. **Obsidian Expressway** - Dark volcanic theme with spires and void effects

### Audio
- **Sound Effects**: Movement, collisions, vehicle horns, level completion
- **Procedural Audio**: Web Audio API generated sounds for cross-platform compatibility
- **Mute Toggle**: Easy audio on/off control
- **Volume Settings**: Separate controls for SFX and music

### Progressive Web App (PWA)
- **Installable**: Add to homescreen on mobile and desktop
- **Custom Icon**: Cute chicken logo for app icon
- **Offline Play**: Works without internet after first load
- **Fast Loading**: Service worker caching for instant startup
- **Native Feel**: Full-screen experience when installed

## 🚀 Quick Start

### Play Online
The game is deployed and ready to play at your Vercel URL after deployment.

### Install as App
Once deployed, you can install the game as a native app:

**On Mobile (iOS/Android):**
1. Open the game in Safari (iOS) or Chrome (Android)
2. Tap the share button
3. Select "Add to Home Screen"
4. The chicken icon will appear on your homescreen!

**On Desktop (Chrome/Edge):**
1. Open the game in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install Get It Across"
4. The game will open as a standalone app

**Features when installed:**
- Works offline after first load
- Fast startup with cached resources
- Full-screen gaming experience
- Native app icon with chicken logo

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd GetItAcross
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000` or the port shown in terminal

## 📦 Deployment to Vercel

### Option 1: Deploy via Vercel CLI
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow prompts** and your game will be live!

### Option 2: Deploy via GitHub Integration
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial game commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the static site and deploy

### Option 3: Manual Upload
1. **Build the project** (optional, it's already static)
   ```bash
   npm run build
   ```

2. **Upload files** directly to Vercel dashboard

## 🎨 Customization Guide

### Adding New Levels

1. **Update Level Themes** in `src/levels.js`:
   ```javascript
   this.levelThemes = {
       6: {
           name: 'Your Level Name',
           type: 'your_type',
           backgroundColor: '#your_color',
           roadColor: '#road_color',
           grassColor: '#grass_color',
           description: 'Your level description'
       }
   };
   ```

2. **Add Road Texture** in `src/graphics.js`:
   ```javascript
   drawYourTypeTexture(x, y, width, height) {
       // Your custom road texture implementation
   }
   ```

3. **Update Max Levels** in `src/game.js`:
   ```javascript
   this.maxLevel = 6; // Increase from 5
   ```

### Adjusting Difficulty

**Vehicle Spawn Settings** in `src/vehicles.js`:
```javascript
this.difficultySettings = {
    1: {
        spawnRate: 2500,      // Lower = more frequent spawning
        speedMultiplier: 0.8, // Vehicle speed multiplier
        density: 0.3          // Spawn probability per update
    }
};
```

**Player Movement** in `src/player.js`:
```javascript
this.speed = 150;           // Player movement speed
this.moveDelay = 100;       // Delay between moves (ms)
```

### Customizing Visuals

**Colors and Themes** in `src/levels.js`:
- Modify `backgroundColor`, `roadColor`, `grassColor` in level themes
- Adjust particle colors in `getParticleColor()`

**Vehicle Appearance** in `src/graphics.js`:
- Customize vehicle colors in `vehicleColors` array
- Modify vehicle shapes in `drawCar()`, `drawTruck()`, etc.

**Player Character** in `src/graphics.js`:
- Customize chicken appearance in `drawChicken()`
- Adjust size, colors, and animation in `src/player.js`

### Adding Sound Effects

**Custom Sounds** in `src/audio.js`:
```javascript
// Add to createSounds() method
this.sounds.yourSound = this.createTone(frequency, duration, waveType, volume);

// Use in game
this.audio.playSound('yourSound');
```

**Audio Files** (optional):
```javascript
// Preload actual audio files
await this.audio.preloadSound('name', 'path/to/file.mp3');
```

### Performance Tuning

**Mobile Optimization** in various files:
- Particle counts: Adjust in `levels.js` `getMaxParticles()`
- Frame rates: Modify in `game.js` `gameLoop()`
- Vehicle density: Change mobile multipliers in `vehicles.js`

**Quality Settings**:
- Canvas resolution scaling
- Particle system limits
- Animation frame rates

## 🛠 Technical Architecture

### File Structure
```
src/
├── audio.js          # Web Audio API sound system
├── collision.js      # Collision detection and effects
├── game.js          # Main game engine and loop
├── graphics.js      # Canvas rendering and visual effects
├── input.js         # Keyboard, touch, and swipe handling
├── levels.js        # Level management and themes
├── player.js        # Player character and movement
├── ui.js           # User interface and menus
├── utils.js        # Utility functions and helpers
├── vehicles.js     # Vehicle spawning and management
└── styles.css      # Responsive styling
```

### Key Classes
- **Game**: Main game engine, state management, game loop
- **Graphics**: Canvas rendering, textures, visual effects
- **Input**: Cross-platform input handling
- **Player**: Character movement, animation, collision bounds
- **VehicleManager**: Traffic spawning, movement, difficulty scaling
- **LevelManager**: Theme management, backgrounds, progression
- **UI**: Menus, HUD, notifications, responsive design
- **Audio**: Procedural sound generation, settings

### Performance Features
- **Mobile Detection**: Automatic optimization for mobile devices
- **Adaptive Frame Rate**: 60fps desktop, 30fps mobile
- **Efficient Rendering**: Canvas optimization and transform management
- **Memory Management**: Object pooling and cleanup
- **Touch Optimization**: Responsive touch controls with haptic feedback

## 🎯 Game Mechanics

### Scoring System
- **Base Score**: 100 points × level number per crossing
- **Time Bonus**: Up to 300 extra points for fast crossings
- **Difficulty Multiplier**: Increases after completing all levels

### Level Progression
1. Complete level by reaching right edge safely
2. Automatic progression through levels 1-5
3. After level 5, return to level 1 with increased difficulty
4. Infinite scaling for endless gameplay

### Collision System
- **Circle-Rectangle**: Player (circle) vs Vehicles (rectangles)
- **Collision Effects**: Particle explosions, screen shake
- **Invincibility Frames**: Brief protection after collision
- **Warning System**: Visual alerts for nearby vehicles

## 🐛 Troubleshooting

### Common Issues

**Game Won't Load**:
- Check browser console for errors
- Ensure all files are properly uploaded
- Verify file paths in `index.html`

**Touch Controls Not Working**:
- Confirm device touch support
- Check CSS touch-action properties
- Verify event listeners in `input.js`

**Audio Not Playing**:
- Browser autoplay restrictions
- User interaction required for audio
- Check audio context initialization

**Performance Issues**:
- Reduce particle counts in `levels.js`
- Lower frame rate in `game.js`
- Disable effects on older devices

### Browser Compatibility
- **Recommended**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Canvas Support**: Required for all graphics
- **Web Audio**: Required for sound effects
- **Touch Events**: Required for mobile controls

## 📱 Mobile Optimization

### Features
- **Responsive Design**: Adapts to any screen size
- **Touch Controls**: Native touch and swipe support
- **Performance**: Optimized for mobile CPUs and GPUs
- **Battery Friendly**: Adaptive frame rates and reduced effects

### Testing Mobile
1. **Local Testing**: Use browser dev tools device simulation
2. **Network Testing**: Test on actual mobile devices
3. **Performance**: Monitor frame rates and battery usage

## 🤝 Contributing

### Adding Features
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit: `git commit -m "Add feature description"`
5. Push: `git push origin feature-name`
6. Create pull request

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing naming conventions
- Test on multiple devices/browsers

## 📄 License

MIT License - Feel free to use, modify, and distribute!

## 🎊 Credits

Built with love using:
- **Canvas API** for graphics rendering
- **Web Audio API** for procedural sound generation
- **Touch Events** for mobile input handling
- **Vanilla JavaScript** for performance and compatibility

---

**Happy Crossing! 🐔🚗**