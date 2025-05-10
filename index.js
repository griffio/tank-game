// Game Constants and Configuration
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_WIDTH = CANVAS_WIDTH * 2;  // Map is 2x wider than canvas
const GAME_HEIGHT = CANVAS_HEIGHT * 2; // Map is 2x taller than canvas
const TANK_SPEED = 3;
const BULLET_SPEED = 5;
const TURRET_DETECTION_RADIUS = 220;
const TURRET_FIRE_RATE = 2000; // ms between shots
const ENEMY_TANK_SPEED = 1.5;
const ENEMY_TANK_FIRE_RATE = 3000; // ms between shots
const WAVE_DELAY = 10000; // ms between waves
const POWERUP_SIZE = 20;
const POWERUP_LIFETIME = 10000; // ms

// Terrain types
const TERRAIN_TYPES = {
    DESERT: 0,
    CACTUS: 1,
    WATER: 2
};

// Ammo types
const AMMO_TYPES = {
    ARMOR_PIERCING: 0,
    HIGH_EXPLOSIVE: 1
};

// Power-up types
const POWERUP_TYPES = {
    ARMOR_PIERCING: 0,
    HIGH_EXPLOSIVE: 1
};

// Game state
let gameState = {
    running: false,
    gameOver: false,
    levelComplete: false,
    score: 0,
    currentWave: 0,
    nextWaveTime: 0,
    waveInProgress: false,
    level: 1
};

// Player state
let player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: 32,
    height: 32,
    angle: 0,
    speed: TANK_SPEED,
    health: 100,
    ammo: {
        [AMMO_TYPES.ARMOR_PIERCING]: 10,
        [AMMO_TYPES.HIGH_EXPLOSIVE]: 5
    },
    currentAmmoType: AMMO_TYPES.ARMOR_PIERCING
};

// Input state
let keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Game objects
let bullets = [];
let turrets = [];
let enemyTanks = [];
let particles = [];
let powerups = [];

// Map and terrain
let map = {
    width: 100,
    height: 100,
    tileSize: 32,
    terrain: []
};

// Camera/viewport
let camera = {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
};

// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game assets
const sounds = {
    tankShot: new Audio('assets/tank-shot.wav'),
    tankShotHE: new Audio('assets/tank-shot-he.wav'),
    turretShot: new Audio('assets/turret-shot.wav')
};

// Function to play sound effects
function playSound(sound) {
    // Create a new audio element each time to allow overlapping sounds
    const audio = new Audio(sound.src);
    audio.volume = 0.5; // Set volume to 50%
    audio.play();
}

// Initialize the game
function init() {
    // Generate map
    generateMap();

    // Create turrets based on the current level (2 + level)
    createTurrets(2 + gameState.level);

    // Set up event listeners
    setupEventListeners();

    // Start game directly (asset loading removed as it's not used)
    startGame();
}

// Asset loading functions removed as they are not used

// Generate the game map
function generateMap() {
    // Initialize terrain array
    map.terrain = new Array(map.height);
    for (let y = 0; y < map.height; y++) {
        map.terrain[y] = new Array(map.width);
        for (let x = 0; x < map.width; x++) {
            // Generate random terrain (mostly desert with some cactus and very little water)
            const rand = Math.random();
            if (rand < 0.88) {
                map.terrain[y][x] = TERRAIN_TYPES.DESERT;
            } else if (rand < 0.98) {
                map.terrain[y][x] = TERRAIN_TYPES.CACTUS;
            } else {
                map.terrain[y][x] = TERRAIN_TYPES.WATER;
            }
        }
    }
}

// Create turrets on the map
function createTurrets(count) {
    // Scale turret size based on level (10% increase per level)
    const sizeScale = 1 + (gameState.level - 1) * 0.1;
    const baseSize = 32;

    for (let i = 0; i < count; i++) {
        // Place turrets randomly, but not too close to the player start position
        let x, y, distToPlayer;
        do {
            x = Math.random() * (GAME_WIDTH - 64) + 32;
            y = Math.random() * (GAME_HEIGHT - 64) + 32;
            distToPlayer = Math.sqrt(
                Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
            );
        } while (distToPlayer < 200);

        turrets.push({
            x,
            y,
            width: baseSize * sizeScale,
            height: baseSize * sizeScale,
            angle: 0,
            lastFired: 0,
            health: 50,
            level: gameState.level // Store the level for reference
        });
    }
}

// Spawn a new wave of enemy tanks
function spawnEnemyWave() {
    gameState.currentWave++;
    gameState.waveInProgress = true;

    // Number of tanks in this wave (1 for first wave, 2 for second, 3 for third and beyond)
    const tankCount = Math.min(3, gameState.currentWave);

    for (let i = 0; i < tankCount; i++) {
        spawnEnemyTank();
    }
}

// Spawn a single enemy tank
function spawnEnemyTank() {
    // Determine spawn edge (0: top, 1: right, 2: bottom, 3: left)
    const spawnEdge = Math.floor(Math.random() * 4);

    let x, y, targetX, targetY, angle;

    // Calculate viewport edges based on camera position
    const viewportLeft = camera.x;
    const viewportRight = camera.x + camera.width;
    const viewportTop = camera.y;
    const viewportBottom = camera.y + camera.height;

    // Set spawn position and target position based on spawn edge
    switch (spawnEdge) {
        case 0: // Top
            x = viewportLeft + Math.random() * camera.width;
            y = viewportTop - 50;
            targetX = viewportLeft + Math.random() * camera.width;
            targetY = viewportBottom + 50;
            angle = Math.PI / 2; // Pointing down
            break;
        case 1: // Right
            x = viewportRight + 50;
            y = viewportTop + Math.random() * camera.height;
            targetX = viewportLeft - 50;
            targetY = viewportTop + Math.random() * camera.height;
            angle = Math.PI; // Pointing left
            break;
        case 2: // Bottom
            x = viewportLeft + Math.random() * camera.width;
            y = viewportBottom + 50;
            targetX = viewportLeft + Math.random() * camera.width;
            targetY = viewportTop - 50;
            angle = -Math.PI / 2; // Pointing up
            break;
        case 3: // Left
            x = viewportLeft - 50;
            y = viewportTop + Math.random() * camera.height;
            targetX = viewportRight + 50;
            targetY = viewportTop + Math.random() * camera.height;
            angle = 0; // Pointing right
            break;
    }

    // Calculate direction vector
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Create enemy tank object
    enemyTanks.push({
        x,
        y,
        width: 32,
        height: 32,
        angle,
        turretAngle: angle,
        speed: ENEMY_TANK_SPEED,
        health: 40,
        lastFired: 0,
        vx: (dx / distance) * ENEMY_TANK_SPEED,
        vy: (dy / distance) * ENEMY_TANK_SPEED,
        targetX,
        targetY
    });
}

// Check if wave is complete (all enemy tanks destroyed or left the screen)
function checkWaveComplete() {
    if (gameState.waveInProgress && enemyTanks.length === 0) {
        gameState.waveInProgress = false;
        gameState.nextWaveTime = Date.now() + WAVE_DELAY;
    }
}

// Set up event listeners for keyboard and mouse
function setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
        }
    });

    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + camera.x;
        const mouseY = e.clientY - rect.top + camera.y;

        // Calculate angle between player and mouse
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        player.angle = Math.atan2(dy, dx);
    });

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();

        // Left click - fire armor piercing
        if (e.button === 0 && player.ammo[AMMO_TYPES.ARMOR_PIERCING] > 0) {
            fireBullet(AMMO_TYPES.ARMOR_PIERCING);
            player.ammo[AMMO_TYPES.ARMOR_PIERCING]--;
            updateAmmoDisplay();
        }
        // Right click - fire high explosive
        else if (e.button === 2 && player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE] > 0) {
            fireBullet(AMMO_TYPES.HIGH_EXPLOSIVE);
            player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE]--;
            updateAmmoDisplay();
        }
    });

    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Fire a bullet from the player's tank
function fireBullet(ammoType) {
    const bulletSpeed = BULLET_SPEED;
    const bulletSize = ammoType === AMMO_TYPES.HIGH_EXPLOSIVE ? 8 : 4;

    // Play tank shot sound based on ammo type
    if (ammoType === AMMO_TYPES.HIGH_EXPLOSIVE) {
        playSound(sounds.tankShotHE);
    } else {
        playSound(sounds.tankShot);
    }

    bullets.push({
        x: player.x + Math.cos(player.angle) * 30,
        y: player.y + Math.sin(player.angle) * 30,
        vx: Math.cos(player.angle) * bulletSpeed,
        vy: Math.sin(player.angle) * bulletSpeed,
        width: bulletSize,
        height: bulletSize,
        type: ammoType,
        damage: ammoType === AMMO_TYPES.ARMOR_PIERCING ? 30 : 20,
        lifetime: 60 // frames
    });

    // Create muzzle flash particles
    createParticles(
        player.x + Math.cos(player.angle) * 30,
        player.y + Math.sin(player.angle) * 30,
        10,
        ammoType === AMMO_TYPES.ARMOR_PIERCING ? '#ffaa00' : '#ff5500'
    );
}

// Create particles at a position
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 5 + 2,
            color,
            lifetime: Math.random() * 20 + 10
        });
    }
}

// Update ammo display in the UI
function updateAmmoDisplay() {
    document.getElementById('ap-ammo').textContent = player.ammo[AMMO_TYPES.ARMOR_PIERCING];
    document.getElementById('he-ammo').textContent = player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE];
}

// Update health display in the UI
function updateHealthDisplay() {
    document.getElementById('health').textContent = player.health;
}

// Start the game
function startGame() {
    gameState.running = true;
    gameState.gameOver = false;
    gameState.levelComplete = false;
    gameState.level = 1;
    gameState.currentWave = 0;
    gameState.nextWaveTime = Date.now() + 3000; // First wave starts after 3 seconds
    gameState.waveInProgress = false;
    enemyTanks = [];
    powerups = [];
    gameLoop();
}

// Main game loop
function gameLoop() {
    if (!gameState.running) return;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    if (gameState.gameOver || gameState.levelComplete) return;

    // Check if it's time to spawn a new wave
    const currentTime = Date.now();
    if (!gameState.waveInProgress && currentTime >= gameState.nextWaveTime) {
        spawnEnemyWave();
    }

    // Update player position based on input
    updatePlayerPosition();

    // Update camera to follow player
    updateCamera();

    // Update bullets
    updateBullets();

    // Update turrets
    updateTurrets();

    // Update enemy tanks
    updateEnemyTanks();

    // Update particles
    updateParticles();

    // Update power-ups
    updatePowerups();

    // Check ammo levels and spawn power-ups if needed
    checkAmmoLevels();

    // Check collisions
    checkCollisions();

    // Check if wave is complete
    checkWaveComplete();

    // Check game over condition
    if (player.health <= 0) {
        gameState.gameOver = true;
    }

    // Check level complete condition
    if (turrets.length === 0 && !gameState.gameOver && !gameState.levelComplete) {
        gameState.levelComplete = true;
    }
}

// Update camera position to follow player
function updateCamera() {
    // Center camera on player
    camera.x = player.x - camera.width / 2;
    camera.y = player.y - camera.height / 2;

    // Clamp camera to game boundaries
    camera.x = Math.max(0, Math.min(GAME_WIDTH - camera.width, camera.x));
    camera.y = Math.max(0, Math.min(GAME_HEIGHT - camera.height, camera.y));
}

// Update enemy tanks
function updateEnemyTanks() {
    const currentTime = Date.now();

    for (let i = enemyTanks.length - 1; i >= 0; i--) {
        const tank = enemyTanks[i];

        // Update position
        tank.x += tank.vx;
        tank.y += tank.vy;

        // Check if tank has reached its target (left the screen)
        const dx = tank.targetX - tank.x;
        const dy = tank.targetY - tank.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distToTarget < 50) {
            // Tank has left the screen, remove it
            enemyTanks.splice(i, 1);
            continue;
        }

        // Calculate distance to player
        const dxPlayer = player.x - tank.x;
        const dyPlayer = player.y - tank.y;
        const distToPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

        // If player is within detection radius, aim turret at player
        if (distToPlayer < TURRET_DETECTION_RADIUS) {
            tank.turretAngle = Math.atan2(dyPlayer, dxPlayer);

            // Fire at player if cooldown has elapsed
            if (currentTime - tank.lastFired > ENEMY_TANK_FIRE_RATE) {
                // Play turret shot sound
                playSound(sounds.turretShot);

                // Create tank bullet
                bullets.push({
                    x: tank.x + Math.cos(tank.turretAngle) * 20,
                    y: tank.y + Math.sin(tank.turretAngle) * 20,
                    vx: Math.cos(tank.turretAngle) * BULLET_SPEED * 0.7,
                    vy: Math.sin(tank.turretAngle) * BULLET_SPEED * 0.7,
                    width: 4,
                    height: 4,
                    type: AMMO_TYPES.ARMOR_PIERCING,
                    damage: 10,
                    lifetime: 60,
                    fromTurret: true
                });

                // Create muzzle flash particles
                createParticles(
                    tank.x + Math.cos(tank.turretAngle) * 20,
                    tank.y + Math.sin(tank.turretAngle) * 20,
                    5,
                    '#ffaa00'
                );

                tank.lastFired = currentTime;
            }
        } else {
            // Otherwise, turret points in the direction of movement
            tank.turretAngle = tank.angle;
        }
    }
}

// Update player position based on keyboard input
function updatePlayerPosition() {
    let dx = 0;
    let dy = 0;

    if (keys.w) dy -= player.speed;
    if (keys.s) dy += player.speed;
    if (keys.a) dx -= player.speed;
    if (keys.d) dx += player.speed;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
    }

    // Calculate new position
    let newX = player.x + dx;
    let newY = player.y + dy;

    // Check terrain collision
    const tileX = Math.floor(newX / map.tileSize);
    const tileY = Math.floor(newY / map.tileSize);

    // Keep player within game bounds
    newX = Math.max(player.width / 2, Math.min(GAME_WIDTH - player.width / 2, newX));
    newY = Math.max(player.height / 2, Math.min(GAME_HEIGHT - player.height / 2, newY));

    // Check if new position is in water (can't move into water)
    if (tileX >= 0 && tileX < map.width && tileY >= 0 && tileY < map.height) {
        if (map.terrain[tileY][tileX] !== TERRAIN_TYPES.WATER) {
            player.x = newX;
            player.y = newY;
        }
    } else {
        player.x = newX;
        player.y = newY;
    }
}

// Update bullets position and lifetime
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Update position
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Decrease lifetime
        bullet.lifetime--;

        // Remove bullets that are out of bounds or expired
        if (
            bullet.x < 0 ||
            bullet.x > GAME_WIDTH ||
            bullet.y < 0 ||
            bullet.y > GAME_HEIGHT ||
            bullet.lifetime <= 0
        ) {
            // Create impact particles for high explosive rounds
            if (bullet.type === AMMO_TYPES.HIGH_EXPLOSIVE) {
                createParticles(bullet.x, bullet.y, 15, '#ff5500');
            }
            bullets.splice(i, 1);
        }
    }
}

// Update turrets behavior
function updateTurrets() {
    const currentTime = Date.now();

    turrets.forEach(turret => {
        // Calculate distance to player
        const dx = player.x - turret.x;
        const dy = player.y - turret.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);

        // Scale detection radius based on turret level (10% increase per level)
        const detectionScale = 1 + (turret.level - 1) * 0.1;
        const scaledDetectionRadius = TURRET_DETECTION_RADIUS * detectionScale;

        // If player is within detection radius
        if (distToPlayer < scaledDetectionRadius) {
            // Update turret angle to face player
            turret.angle = Math.atan2(dy, dx);

            // Fire at player if cooldown has elapsed
            if (currentTime - turret.lastFired > TURRET_FIRE_RATE) {
                // Scale damage based on turret level (10% increase per level)
                const damageScale = 1 + (turret.level - 1) * 0.1;
                const baseDamage = 10;
                const scaledDamage = Math.floor(baseDamage * damageScale);

                // Play turret shot sound
                playSound(sounds.turretShot);

                // Create turret bullet
                bullets.push({
                    x: turret.x + Math.cos(turret.angle) * 20,
                    y: turret.y + Math.sin(turret.angle) * 20,
                    vx: Math.cos(turret.angle) * BULLET_SPEED * 0.7,
                    vy: Math.sin(turret.angle) * BULLET_SPEED * 0.7,
                    width: 4,
                    height: 4,
                    type: AMMO_TYPES.ARMOR_PIERCING,
                    damage: scaledDamage,
                    lifetime: 60,
                    fromTurret: true
                });

                // Create muzzle flash particles
                createParticles(
                    turret.x + Math.cos(turret.angle) * 20,
                    turret.y + Math.sin(turret.angle) * 20,
                    5,
                    '#ffaa00'
                );

                turret.lastFired = currentTime;
            }
        }
    });
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Decrease lifetime
        particle.lifetime--;

        // Remove expired particles
        if (particle.lifetime <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Update power-ups
function updatePowerups() {
    const currentTime = Date.now();

    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];

        // Remove expired power-ups
        if (currentTime > powerup.expiryTime) {
            // Create disappearing particles
            createParticles(powerup.x, powerup.y, 10, powerup.type === POWERUP_TYPES.ARMOR_PIERCING ? '#5af' : '#fa5');
            powerups.splice(i, 1);
        }
    }
}

// Check ammo levels and spawn power-ups if needed
function checkAmmoLevels() {
    // Initial ammo amounts
    const initialAP = 10;
    const initialHE = 5;

    // Current ammo amounts
    const currentAP = player.ammo[AMMO_TYPES.ARMOR_PIERCING];
    const currentHE = player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE];

    // Check if AP ammo is at half level and no AP power-up exists
    if (currentAP <= initialAP / 2 && !powerups.some(p => p.type === POWERUP_TYPES.ARMOR_PIERCING)) {
        spawnPowerup(POWERUP_TYPES.ARMOR_PIERCING);
    }

    // Check if HE ammo is at half level and no HE power-up exists
    if (currentHE <= initialHE / 2 && !powerups.some(p => p.type === POWERUP_TYPES.HIGH_EXPLOSIVE)) {
        spawnPowerup(POWERUP_TYPES.HIGH_EXPLOSIVE);
    }
}

// Spawn a power-up of the specified type
function spawnPowerup(type) {
    // Find a valid spawn position (not in water and not too close to player)
    let x, y, isValid;
    let attempts = 0;

    // Calculate viewport edges with some margin
    const margin = 50;
    const minX = camera.x + margin;
    const maxX = camera.x + camera.width - margin;
    const minY = camera.y + margin;
    const maxY = camera.y + camera.height - margin;

    do {
        x = Math.random() * (maxX - minX) + minX;
        y = Math.random() * (maxY - minY) + minY;

        // Check if position is in water
        const tileX = Math.floor(x / map.tileSize);
        const tileY = Math.floor(y / map.tileSize);

        // Check distance to player
        const distToPlayer = Math.sqrt(
            Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
        );

        isValid = tileX >= 0 && tileX < map.width && 
                 tileY >= 0 && tileY < map.height && 
                 map.terrain[tileY][tileX] !== TERRAIN_TYPES.WATER &&
                 distToPlayer > 100;

        attempts++;
    } while (!isValid && attempts < 50);

    // If we couldn't find a valid position after 50 attempts, just use a random position
    if (!isValid) {
        x = Math.random() * (maxX - minX) + minX;
        y = Math.random() * (maxY - minY) + minY;
    }

    // Create the power-up
    powerups.push({
        x,
        y,
        type,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        expiryTime: Date.now() + POWERUP_LIFETIME
    });

    // Create spawn particles
    createParticles(x, y, 15, type === POWERUP_TYPES.ARMOR_PIERCING ? '#5af' : '#fa5');
}

// Check collisions between game objects
function checkCollisions() {
    // Check bullet collisions with turrets and enemy tanks
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Skip turret/enemy bullets
        if (bullet.fromTurret) continue;

        // Check collision with turrets
        let bulletHit = false;
        for (let j = turrets.length - 1; j >= 0; j--) {
            const turret = turrets[j];

            if (
                bullet.x + bullet.width / 2 > turret.x - turret.width / 2 &&
                bullet.x - bullet.width / 2 < turret.x + turret.width / 2 &&
                bullet.y + bullet.height / 2 > turret.y - turret.height / 2 &&
                bullet.y - bullet.height / 2 < turret.y + turret.height / 2
            ) {
                // Apply damage to turret
                turret.health -= bullet.damage;

                // Create impact particles
                createParticles(bullet.x, bullet.y, 10, '#ffaa00');

                // Remove bullet
                bullets.splice(i, 1);
                bulletHit = true;

                // If turret is destroyed
                if (turret.health <= 0) {
                    // Create explosion particles
                    createParticles(turret.x, turret.y, 30, '#ff5500');

                    // Remove turret
                    turrets.splice(j, 1);

                    // Increase score
                    gameState.score += 100;
                }

                break;
            }
        }

        // If bullet already hit something, skip to next bullet
        if (bulletHit) continue;

        // Check collision with enemy tanks
        for (let j = enemyTanks.length - 1; j >= 0; j--) {
            const tank = enemyTanks[j];

            if (
                bullet.x + bullet.width / 2 > tank.x - tank.width / 2 &&
                bullet.x - bullet.width / 2 < tank.x + tank.width / 2 &&
                bullet.y + bullet.height / 2 > tank.y - tank.height / 2 &&
                bullet.y - bullet.height / 2 < tank.y + tank.height / 2
            ) {
                // Apply damage to enemy tank
                tank.health -= bullet.damage;

                // Create impact particles
                createParticles(bullet.x, bullet.y, 10, '#ffaa00');

                // Remove bullet
                bullets.splice(i, 1);

                // If enemy tank is destroyed
                if (tank.health <= 0) {
                    // Create explosion particles
                    createParticles(tank.x, tank.y, 30, '#ff5500');

                    // Remove enemy tank
                    enemyTanks.splice(j, 1);

                    // Increase score
                    gameState.score += 150;
                }

                break;
            }
        }
    }

    // Check enemy/turret bullet collisions with player
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Only check turret/enemy bullets
        if (!bullet.fromTurret) continue;

        // Check collision with player
        if (
            bullet.x + bullet.width / 2 > player.x - player.width / 2 &&
            bullet.x - bullet.width / 2 < player.x + player.width / 2 &&
            bullet.y + bullet.height / 2 > player.y - player.height / 2 &&
            bullet.y - bullet.height / 2 < player.y + player.height / 2
        ) {
            // Apply damage to player
            player.health -= bullet.damage;
            updateHealthDisplay();

            // Create impact particles
            createParticles(bullet.x, bullet.y, 10, '#ff0000');

            // Remove bullet
            bullets.splice(i, 1);
        }
    }

    // Check player collision with power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];

        // Check collision with player
        if (
            player.x + player.width / 2 > powerup.x - powerup.width / 2 &&
            player.x - player.width / 2 < powerup.x + powerup.width / 2 &&
            player.y + player.height / 2 > powerup.y - powerup.height / 2 &&
            player.y - player.height / 2 < powerup.y + powerup.height / 2
        ) {
            // Add ammo based on power-up type
            if (powerup.type === POWERUP_TYPES.ARMOR_PIERCING) {
                player.ammo[AMMO_TYPES.ARMOR_PIERCING] += 5; // Add 5 AP ammo
            } else {
                player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE] += 3; // Add 3 HE ammo
            }

            // Update ammo display
            updateAmmoDisplay();

            // Create collection particles
            createParticles(
                powerup.x, 
                powerup.y, 
                20, 
                powerup.type === POWERUP_TYPES.ARMOR_PIERCING ? '#5af' : '#fa5'
            );

            // Remove power-up
            powerups.splice(i, 1);
        }
    }
}

// Render the game
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save context state
    ctx.save();

    // Apply camera translation
    ctx.translate(-camera.x, -camera.y);

    // Render terrain
    renderTerrain();

    // Render turrets
    renderTurrets();

    // Render enemy tanks
    renderEnemyTanks();

    // Render power-ups
    renderPowerups();

    // Render player
    renderPlayer();

    // Render bullets
    renderBullets();

    // Render particles
    renderParticles();

    // Restore context state
    ctx.restore();

    // Render game over screen if needed (this is rendered without camera offset)
    if (gameState.gameOver) {
        renderGameOver();
    }

    // Render level complete screen if needed (this is rendered without camera offset)
    if (gameState.levelComplete) {
        renderLevelComplete();
    }
}

// Render enemy tanks
function renderEnemyTanks() {
    enemyTanks.forEach(tank => {
        ctx.save();

        // Translate to tank position
        ctx.translate(tank.x, tank.y);

        // Draw tank body (rotated based on movement direction)
        ctx.rotate(tank.angle);
        ctx.fillStyle = '#a55';
        ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);
        ctx.restore();

        // Draw tank turret (can rotate independently)
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.turretAngle);
        ctx.fillStyle = '#833';
        ctx.fillRect(0, -4, 20, 8);
        ctx.restore();
    });
}

// Render the terrain
function renderTerrain() {
    // Calculate visible tiles based on camera position
    const startX = Math.max(0, Math.floor(camera.x / map.tileSize));
    const endX = Math.min(map.width - 1, Math.floor((camera.x + camera.width) / map.tileSize));
    const startY = Math.max(0, Math.floor(camera.y / map.tileSize));
    const endY = Math.min(map.height - 1, Math.floor((camera.y + camera.height) / map.tileSize));

    // Render visible tiles
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            const terrainType = map.terrain[y][x];

            // Set color based on terrain type
            switch (terrainType) {
                case TERRAIN_TYPES.DESERT:
                    ctx.fillStyle = '#e6c88a';
                    break;
                case TERRAIN_TYPES.CACTUS:
                    ctx.fillStyle = '#e6c88a';
                    break;
                case TERRAIN_TYPES.WATER:
                    ctx.fillStyle = '#4a80b0';
                    break;
            }

            // Draw terrain tile (slightly larger to remove grid lines)
            ctx.fillRect(
                x * map.tileSize,
                y * map.tileSize,
                map.tileSize + 1,
                map.tileSize + 1
            );

            // Draw cactus if terrain is cactus
            if (terrainType === TERRAIN_TYPES.CACTUS) {
                ctx.fillStyle = '#5a9c3d';
                ctx.fillRect(
                    x * map.tileSize + map.tileSize / 4,
                    y * map.tileSize + map.tileSize / 4,
                    map.tileSize / 2,
                    map.tileSize / 2
                );
            }
        }
    }
}

// Render the player tank
function renderPlayer() {
    ctx.save();

    // Translate to player position
    ctx.translate(player.x, player.y);

    // Draw tank body (rotated based on movement direction)
    ctx.fillStyle = '#5a7';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Rotate to aim direction
    ctx.rotate(player.angle);

    // Draw tank turret
    ctx.fillStyle = '#385';
    ctx.fillRect(0, -5, 25, 10);

    ctx.restore();
}

// Render turrets
function renderTurrets() {
    turrets.forEach(turret => {
        ctx.save();

        // Translate to turret position
        ctx.translate(turret.x, turret.y);

        // Calculate scale based on turret level (10% increase per level)
        const sizeScale = 1 + (turret.level - 1) * 0.1;

        // Draw turret base
        ctx.fillStyle = '#a33';
        ctx.beginPath();
        ctx.arc(0, 0, 15 * sizeScale, 0, Math.PI * 2);
        ctx.fill();

        // Rotate to aim direction
        ctx.rotate(turret.angle);

        // Draw turret barrel
        ctx.fillStyle = '#822';
        ctx.fillRect(0, -4 * sizeScale, 20 * sizeScale, 8 * sizeScale);

        ctx.restore();
    });
}

// Render bullets
function renderBullets() {
    bullets.forEach(bullet => {
        // Set color based on bullet type
        if (bullet.type === AMMO_TYPES.ARMOR_PIERCING) {
            ctx.fillStyle = bullet.fromTurret ? '#f55' : '#5af';
        } else {
            ctx.fillStyle = '#fa5';
        }

        // Draw bullet
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Render particles
function renderParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.lifetime / 20;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });
}

// Render power-ups
function renderPowerups() {
    powerups.forEach(powerup => {
        // Draw power-up base (circle)
        ctx.fillStyle = powerup.type === POWERUP_TYPES.ARMOR_PIERCING ? '#5af' : '#fa5';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw power-up icon (AP or HE)
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            powerup.type === POWERUP_TYPES.ARMOR_PIERCING ? 'AP' : 'HE', 
            powerup.x, 
            powerup.y
        );

        // Add pulsing effect
        const pulseSize = 2 + Math.sin(Date.now() / 200) * 2;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.width / 2 + pulseSize, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// Render game over screen
function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = '48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.font = '24px "Courier New", monospace';
    ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.font = '18px "Courier New", monospace';
    ctx.fillText('Refresh the page to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Render level complete screen
function renderLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Check if all levels are completed
    if (gameState.level >= 5) {
        // Game complete screen
        ctx.fillStyle = '#5ff';
        ctx.font = '48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('You completed all 5 levels!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('Refresh the page to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    } else {
        // Level complete screen
        ctx.fillStyle = '#5f5';
        ctx.font = '48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${gameState.level} COMPLETE`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('All turrets destroyed!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        // Draw next level button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = CANVAS_WIDTH / 2 - buttonWidth / 2;
        const buttonY = CANVAS_HEIGHT / 2 + 60;

        ctx.fillStyle = '#5a5';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('NEXT LEVEL', CANVAS_WIDTH / 2, buttonY + buttonHeight / 2 + 7);

        // Add click event listener for the button if not already added
        if (!window.nextLevelButtonAdded) {
            window.nextLevelButtonAdded = true;
            canvas.addEventListener('click', handleNextLevelClick);
        }
    }
}

// Handle click on the next level button
function handleNextLevelClick(e) {
    // Only process clicks if level is complete and not game over
    if (!gameState.levelComplete || gameState.gameOver) return;

    // Check if all levels are completed
    if (gameState.level >= 5) return;

    // Get mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if click is on the next level button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = CANVAS_WIDTH / 2 - buttonWidth / 2;
    const buttonY = CANVAS_HEIGHT / 2 + 60;

    if (
        mouseX >= buttonX && 
        mouseX <= buttonX + buttonWidth && 
        mouseY >= buttonY && 
        mouseY <= buttonY + buttonHeight
    ) {
        startNextLevel();
    }
}

// Start the next level
function startNextLevel() {
    // Increment level
    gameState.level++;

    // Reset level state
    gameState.levelComplete = false;
    gameState.currentWave = 0;
    gameState.nextWaveTime = Date.now() + 3000; // First wave starts after 3 seconds
    gameState.waveInProgress = false;

    // Clear game objects
    bullets = [];
    turrets = [];
    enemyTanks = [];
    powerups = [];

    // Reset player position and health
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    player.health = 100; // Reset health to full
    updateHealthDisplay(); // Update the health display

    // Reset player ammo
    player.ammo[AMMO_TYPES.ARMOR_PIERCING] = 10;
    player.ammo[AMMO_TYPES.HIGH_EXPLOSIVE] = 5;
    updateAmmoDisplay(); // Update the ammo display

    // Create new turrets for this level
    createTurrets(2 + gameState.level); // More turrets in higher levels

    // Remove the click event listener
    window.nextLevelButtonAdded = false;
    canvas.removeEventListener('click', handleNextLevelClick);
}

// Initialize the game when the page loads
window.addEventListener('load', init);
