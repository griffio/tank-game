Created by JetBrains Junie

```text
Create a single player tank battle game using Javascript/Html/Css and 2d canvas 

The game has the following features
Top down 2d
Single Player
Different terrains - desert , cactus, water

Two different ammo types - armor piercing and high explosive
Use Particle effects for bullets
Graphic style is 8 bit graphics

The tank has to avoid being destroyed by automated turrets that will target the tank if within a diameter
```

# Tank Battle

A top-down 2D single-player tank battle game with retro 8-bit graphics.

## Game Description

Tank Battle is an action-packed tank combat game where you control a tank and battle against enemy turrets and tanks.
Navigate through a terrain of desert, cactus, and water while collecting ammo power-ups and destroying enemy targets.

## Features

- Top-down 2D gameplay with retro 8-bit graphics
- 5 progressively challenging levels
- Different terrain types (desert, cactus, water)
- Two ammo types: Armor Piercing (AP) and High Explosive (HE)
- Wave-based enemy tank system
- Fixed position enemy turrets
- Particle effects for bullets and explosions
- Power-up system for ammo replenishment
- Scrolling camera to navigate a large game world
- Sound effects for different weapons and actions

## Controls

- **W, A, S, D**: Move the tank
- **Mouse**: Aim the tank's turret
- **Left Click**: Fire Armor Piercing (AP) ammo
- **Right Click**: Fire High Explosive (HE) ammo

## Gameplay

### Objective
Your mission is to destroy all enemy turrets in each level to progress. The game consists of 5 levels, with each level increasing in difficulty.

### Enemies
- **Stationary Turrets**: These are fixed position turrets that will target and fire at your tank if you come within their detection radius. Each level increases their size, range, and damage by 10%.
- **Enemy Tanks**: These appear in waves (starting with one, then two, then three) and move across the map. They will target and fire at your tank if you're within range.

### Ammo Types
- **Armor Piercing (AP)**: Standard ammo, effective against all targets.
- **High Explosive (HE)**: Special ammo with explosive effects, creating more particles on impact.

### Power-ups
Ammo power-ups will spawn when your ammo levels reach half capacity:
- **AP Power-up**: Replenishes 5 Armor Piercing ammo
- **HE Power-up**: Replenishes 3 High Explosive ammo

### Terrain
- **Desert**: Basic terrain, fully traversable
- **Cactus**: Decorative terrain on desert, fully traversable
- **Water**: Obstacle terrain, cannot be traversed

## Technical Details

The game is built using:
- HTML5 Canvas for rendering
- JavaScript for game logic
- CSS for styling

The game features:
- Collision detection system
- Particle system for visual effects
- Wave-based enemy spawning
- Level progression system
- Camera/viewport system for a larger game world

## Installation and Running

1. Clone the repository:
```
git clone https://github.com/yourusername/tank-game.git
```

2. Navigate to the project directory:
```
cd tank-game
```

3. Open `index.html` in your web browser to play the game.

No additional dependencies or build steps are required.

## Development

The game's code is organized as follows:
- `index.html`: Main HTML file
- `styles.css`: CSS styling
- `index.js`: Game logic and rendering
- `assets/`: Directory containing sound effects

## Credits

- Game Design & Development: [Your Name]
- Sound Effects: 
  - tank-shot.wav
  - tank-shot-he.wav
  - turret-shot.wav
  - explosion.wav

## License

This project is licensed under the MIT License - see the LICENSE file for details.
