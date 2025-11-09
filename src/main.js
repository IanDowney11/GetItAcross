import Graphics3D from './graphics3d.js';
import * as THREE from 'three';
import { PowerUpManager3D } from './powerups3d.js';

/**
 * Main 3D Game Entry Point
 */
class Game3D {
    constructor() {
        this.graphics = new Graphics3D('gameCanvas');
        this.player = null;
        this.playerPosition = new THREE.Vector3(0, 0, 0);
        this.playerVelocity = new THREE.Vector3(0, 0, 0);
        this.speed = 15; // Base speed
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.jumpPower = 30;
        this.gravity = 40;
        this.lanes = [];
        this.obstacles = [];
        this.currentLane = 0;
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.isRunning = false;
        this.animationId = null;
        this.lastScoreZ = 0; // Track last Z position for scoring
        this.levelGoalZ = 100; // Distance to complete level
        this.levelStartZ = 0;
        this.invulnerable = false;
        this.invulnerableTime = 0;

        // Power-up manager
        this.powerUpManager = null;

        // Input state
        this.keys = {};
        this.setupInput();

        // Initialize game
        this.init();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls
        const setupButton = (id, direction) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.keys[direction] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.keys[direction] = false;
                });
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.keys[direction] = true;
                });
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    this.keys[direction] = false;
                });
            }
        };

        setupButton('upBtn', 'ArrowUp');
        setupButton('downBtn', 'ArrowDown');
        setupButton('leftBtn', 'ArrowLeft');
        setupButton('rightBtn', 'ArrowRight');
        setupButton('moveForwardBtn', 'forward');

        // Setup touch jump button
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
            });
            jumpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.jump();
            });
        }

        // Jump button handling (prevent held jumps)
        const jumpButtons = ['Space', 'KeyJ'];
        jumpButtons.forEach(key => {
            document.addEventListener('keydown', (e) => {
                if (e.code === key && !this.keys[key + '_pressed'] && this.isGrounded) {
                    this.jump();
                    this.keys[key + '_pressed'] = true;
                }
            });
            document.addEventListener('keyup', (e) => {
                if (e.code === key) {
                    this.keys[key + '_pressed'] = false;
                }
            });
        });

        // Setup shop buttons
        const shopBtn = document.getElementById('shopBtn');
        const menuShopBtn = document.getElementById('menuShopBtn');
        const pauseShopBtn = document.getElementById('pauseShopBtn');

        if (shopBtn) {
            shopBtn.addEventListener('click', () => {
                if (window.shop) window.shop.show();
            });
        }
        if (menuShopBtn) {
            menuShopBtn.addEventListener('click', () => {
                if (window.shop) window.shop.show();
            });
        }
        if (pauseShopBtn) {
            pauseShopBtn.addEventListener('click', () => {
                if (window.shop) window.shop.show();
            });
        }
    }

    init() {
        // Get equipped skin from shop
        const equippedSkin = window.shop ? window.shop.getEquippedSkin() : null;

        // Create player chicken with skin colors
        const chickenColors = {
            body: equippedSkin ? parseInt(equippedSkin.colors.body.replace('#', '0x')) : 0xFFFFFF,
            head: equippedSkin ? parseInt(equippedSkin.colors.head.replace('#', '0x')) : 0xFFFFFF,
            beak: equippedSkin ? parseInt(equippedSkin.colors.beak.replace('#', '0x')) : 0xFFA500,
            eye: equippedSkin ? parseInt(equippedSkin.colors.eye.replace('#', '0x')) : 0x000000,
            feet: equippedSkin ? parseInt(equippedSkin.colors.feet.replace('#', '0x')) : 0xFFA500,
            comb: equippedSkin ? parseInt(equippedSkin.colors.comb.replace('#', '0x')) : 0xFF0000
        };

        // Apply speed multiplier from skin
        if (equippedSkin && equippedSkin.speedMultiplier) {
            this.speed = 15 * equippedSkin.speedMultiplier;
        }

        this.player = this.graphics.createChicken(chickenColors);
        this.player.position.set(0, 0, 0);
        this.graphics.addObject('player', this.player);

        // Create jump shadow
        const shadowGeometry = new THREE.CircleGeometry(1, 32);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        this.jumpShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.jumpShadow.rotation.x = -Math.PI / 2; // Lay flat on ground
        this.jumpShadow.position.set(0, 0.01, 0); // Slightly above ground to prevent z-fighting
        this.graphics.addObject('jumpShadow', this.jumpShadow);

        // Create initial world
        this.createWorld();

        // Initialize power-up manager
        this.powerUpManager = new PowerUpManager3D(this, this.graphics);

        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();

        // Hide menus
        const startMenu = document.getElementById('startMenu');
        if (startMenu) startMenu.classList.add('hidden');

        const hud = document.getElementById('hud');
        if (hud) hud.classList.remove('hidden');

        // Add game-active class to enable canvas pointer events
        document.body.classList.add('game-active');

        // Update HUD
        this.updateHUD();

        // Setup next level button
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => this.nextLevel());
        }

        // Setup pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause());
        }

        // Setup restart level button from pause menu
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                location.reload(); // Reload to restart level
            });
        }

        // Setup main menu button from pause menu
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                location.reload(); // Reload to go back to start menu
            });
        }

        // Store reference to game for shop integration
        window.game3d = this;
    }

    togglePause() {
        const pauseMenu = document.getElementById('pauseMenu');

        if (this.isRunning) {
            // Pause the game
            this.pause();
            document.body.classList.remove('game-active');
            if (pauseMenu) pauseMenu.classList.remove('hidden');
        } else {
            // Resume the game
            this.resume();
            document.body.classList.add('game-active');
            if (pauseMenu) pauseMenu.classList.add('hidden');
        }
    }

    updateHUD() {
        const levelNumber = document.getElementById('levelNumber');
        const livesNumber = document.getElementById('livesNumber');
        const scoreNumber = document.getElementById('scoreNumber');

        if (levelNumber) {
            const progress = Math.max(0, Math.floor(((this.playerPosition.z - this.levelStartZ) / (this.levelGoalZ - this.levelStartZ)) * 100));
            levelNumber.textContent = `${this.level} (${progress}%)`;
        }
        if (livesNumber) livesNumber.textContent = this.lives;
        if (scoreNumber) scoreNumber.textContent = this.score;
    }

    updateChickenSkin() {
        // Called when player equips a new skin
        const equippedSkin = window.shop ? window.shop.getEquippedSkin() : null;
        if (!equippedSkin) return;

        // Remove old chicken
        if (this.player) {
            this.graphics.removeObject('player');
        }

        // Create new chicken with new colors
        const chickenColors = {
            body: parseInt(equippedSkin.colors.body.replace('#', '0x')),
            head: parseInt(equippedSkin.colors.head.replace('#', '0x')),
            beak: parseInt(equippedSkin.colors.beak.replace('#', '0x')),
            eye: parseInt(equippedSkin.colors.eye.replace('#', '0x')),
            feet: parseInt(equippedSkin.colors.feet.replace('#', '0x')),
            comb: parseInt(equippedSkin.colors.comb.replace('#', '0x'))
        };

        this.player = this.graphics.createChicken(chickenColors);
        this.player.position.copy(this.playerPosition);
        this.graphics.addObject('player', this.player);

        // Update speed
        this.speed = 15 * (equippedSkin.speedMultiplier || 1.0);
    }

    createWorld() {
        // Create starting lanes
        const laneTypes = ['grass', 'road', 'grass', 'road', 'water', 'grass'];

        for (let i = 0; i < laneTypes.length; i++) {
            const lane = this.graphics.createLane(laneTypes[i]);
            lane.position.set(0, 0, i * 4);
            this.graphics.addObject(`lane_${i}`, lane);
            this.lanes.push({
                mesh: lane,
                type: laneTypes[i],
                z: i * 4
            });

            // Add obstacles to road and water lanes
            if (laneTypes[i] === 'road') {
                this.createCarsForLane(i);
            } else if (laneTypes[i] === 'water') {
                this.createLogsForLane(i);
            }
        }
    }

    createCarsForLane(laneIndex, z = null) {
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];

        // Difficulty scaling - more cars and faster as level increases
        const baseCars = 2;
        const maxExtraCars = Math.min(3, Math.floor(this.level / 2)); // +1 car every 2 levels, max 5 total
        const numCars = baseCars + Math.floor(Math.random() * (maxExtraCars + 1));

        const minSpacing = Math.max(8, 12 - this.level * 0.5); // Cars get closer at higher levels
        const direction = Math.random() > 0.5 ? 1 : -1;

        // Speed increases with level
        const baseSpeed = 3 + Math.random() * 2;
        const levelSpeedBonus = this.level * 0.5;
        const speed = baseSpeed + levelSpeedBonus;

        const laneZ = z !== null ? z : laneIndex * 4;

        for (let i = 0; i < numCars; i++) {
            const car = this.graphics.createCar(colors[i % colors.length]);

            // Spread cars out with guaranteed minimum spacing
            const spacing = minSpacing + Math.random() * 8;
            car.position.set(-30 + i * spacing, 0, laneZ);

            car.userData.speed = speed;
            car.userData.direction = direction;
            car.userData.carLength = 4;
            car.userData.carWidth = 2;

            const uniqueId = `car_${laneIndex}_${i}_${Date.now()}`;
            this.graphics.addObject(uniqueId, car);
            this.obstacles.push({
                mesh: car,
                type: 'car',
                lane: laneIndex,
                id: uniqueId
            });
        }
    }

    createLogsForLane(laneIndex, z = null) {
        // Difficulty scaling - more logs and faster movement
        const numLogs = 2 + Math.floor(this.level / 3); // More logs at higher levels
        const spacing = Math.max(15, 20 - this.level); // Logs get closer

        const baseSpeed = 2 + Math.random() * 2;
        const levelSpeedBonus = this.level * 0.3;
        const speed = baseSpeed + levelSpeedBonus;

        const laneZ = z !== null ? z : laneIndex * 4;

        for (let i = 0; i < numLogs; i++) {
            const log = this.graphics.createLog(6);
            log.position.set(-15 + i * spacing, 0.5, laneZ);
            log.userData.speed = speed;
            log.userData.direction = 1;

            const uniqueId = `log_${laneIndex}_${i}_${Date.now()}`;
            this.graphics.addObject(uniqueId, log);
            this.obstacles.push({
                mesh: log,
                type: 'log',
                lane: laneIndex,
                id: uniqueId
            });
        }
    }

    jump() {
        if (this.isGrounded) {
            this.verticalVelocity = this.jumpPower;
            this.isGrounded = false;
            console.log('Jump!');
        }
    }

    handleInput(deltaTime) {
        const moveSpeed = this.speed * deltaTime;

        // Forward/backward movement (Z-axis)
        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['forward']) {
            this.playerVelocity.z = moveSpeed;
        } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.playerVelocity.z = -moveSpeed;
        } else {
            this.playerVelocity.z = 0;
        }

        // Left/right movement (X-axis)
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.playerVelocity.x = -moveSpeed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.playerVelocity.x = moveSpeed;
        } else {
            this.playerVelocity.x = 0;
        }

        // Apply horizontal movement
        this.playerPosition.add(this.playerVelocity);

        // Apply gravity and jump physics
        this.verticalVelocity -= this.gravity * deltaTime;
        this.playerPosition.y += this.verticalVelocity * deltaTime;

        // Ground collision
        if (this.playerPosition.y <= 0) {
            this.playerPosition.y = 0;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        }

        // Constrain to bounds
        this.playerPosition.x = THREE.MathUtils.clamp(this.playerPosition.x, -10, 10);
        this.playerPosition.z = Math.max(this.playerPosition.z, 0);

        // Update player mesh position
        if (this.player) {
            this.player.position.copy(this.playerPosition);

            // Animate chicken
            if (this.playerVelocity.length() > 0 && this.isGrounded) {
                const time = performance.now() * 0.003;
                this.player.rotation.y = Math.sin(time * 5) * 0.1;
            } else {
                this.player.rotation.y = 0;
            }

            // Jump animation - rotate chicken
            if (!this.isGrounded) {
                this.player.rotation.x = Math.PI * 0.2; // Tilt forward while jumping
            } else {
                this.player.rotation.x = 0;
            }
        }

        // Update jump shadow
        if (this.jumpShadow) {
            this.jumpShadow.position.x = this.playerPosition.x;
            this.jumpShadow.position.z = this.playerPosition.z;

            // Scale shadow based on height (smaller when higher)
            const shadowScale = Math.max(0.3, 1 - (this.playerPosition.y * 0.1));
            this.jumpShadow.scale.set(shadowScale, shadowScale, 1);

            // Fade shadow when jumping high
            const shadowOpacity = Math.max(0.1, 0.4 - (this.playerPosition.y * 0.02));
            this.jumpShadow.material.opacity = shadowOpacity;
        }
    }

    updateObstacles(deltaTime) {
        // Group obstacles by lane for overlap checking
        const laneObstacles = new Map();

        this.obstacles.forEach(obstacle => {
            if (!laneObstacles.has(obstacle.lane)) {
                laneObstacles.set(obstacle.lane, []);
            }
            laneObstacles.get(obstacle.lane).push(obstacle);
        });

        // Update positions and check for overlaps
        this.obstacles.forEach(obstacle => {
            const mesh = obstacle.mesh;
            const oldX = mesh.position.x;
            mesh.position.x += mesh.userData.speed * mesh.userData.direction * deltaTime;

            // Check for overlaps with other cars in same lane
            if (obstacle.type === 'car') {
                const sameLaneCars = laneObstacles.get(obstacle.lane) || [];

                for (let other of sameLaneCars) {
                    if (other === obstacle || other.type !== 'car') continue;

                    const distance = Math.abs(mesh.position.x - other.mesh.position.x);
                    const minDistance = 8; // Minimum safe distance between cars

                    // If cars are too close, prevent movement
                    if (distance < minDistance) {
                        // Same direction - maintain spacing
                        if (mesh.userData.direction === other.mesh.userData.direction) {
                            // Don't let faster car catch up
                            if (mesh.userData.direction > 0) {
                                // Moving right - check if this car is behind
                                if (mesh.position.x < other.mesh.position.x) {
                                    mesh.position.x = oldX; // Stop movement
                                }
                            } else {
                                // Moving left - check if this car is ahead
                                if (mesh.position.x > other.mesh.position.x) {
                                    mesh.position.x = oldX; // Stop movement
                                }
                            }
                        }
                    }
                }
            }

            // Wrap around
            if (mesh.position.x > 35) {
                mesh.position.x = -35;
            } else if (mesh.position.x < -35) {
                mesh.position.x = 35;
            }
        });
    }

    checkCollisions() {
        if (this.invulnerable) return; // Skip collision check during invulnerability

        // Only check collisions if player is close to the ground (not jumping high)
        // Car height is about 2 units, so if player is above 2.5 units, they clear the car
        const carHeight = 2.5;
        const isJumpingOverCars = this.playerPosition.y > carHeight;

        if (!isJumpingOverCars) {
            const playerBox = new THREE.Box3().setFromObject(this.player);

            this.obstacles.forEach(obstacle => {
                if (obstacle.type === 'car') {
                    const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);
                    if (playerBox.intersectsBox(obstacleBox)) {
                        console.log('Hit by car!');

                        // Check if player has shield
                        if (this.powerUpManager && this.powerUpManager.hasShield()) {
                            console.log('Shield protected you!');
                            // Remove shield instead of losing life
                            this.powerUpManager.activeEffects.shield = null;
                        } else {
                            this.loseLife();
                        }
                    }
                }
            });
        }
    }

    loseLife() {
        this.lives--;
        this.updateHUD();

        // Grant invulnerability frames
        this.invulnerable = true;
        this.invulnerableTime = 2000; // 2 seconds of invulnerability

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPlayerPosition();
        }
    }

    resetPlayerPosition() {
        this.playerPosition.set(0, 0, this.levelStartZ);
        if (this.player) {
            this.player.position.copy(this.playerPosition);
        }
    }

    gameOver() {
        this.isRunning = false;

        // Remove game-active class
        document.body.classList.remove('game-active');

        // Show game over screen
        const gameOverMenu = document.getElementById('gameOverMenu');
        const finalScore = document.getElementById('finalScore');

        if (gameOverMenu) gameOverMenu.classList.remove('hidden');
        if (finalScore) finalScore.textContent = this.score;

        // Setup restart button
        const restartGameBtn = document.getElementById('restartGameBtn');
        if (restartGameBtn) {
            restartGameBtn.onclick = () => {
                location.reload(); // Simple reload to restart
            };
        }

        // Setup back to menu button
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (backToMenuBtn) {
            backToMenuBtn.onclick = () => {
                location.reload(); // Reload to go back to start menu
            };
        }
    }

    levelComplete() {
        // Don't stop the game loop, just pause game logic
        const wasRunning = this.isRunning;
        this.isRunning = false;

        // Remove game-active class
        document.body.classList.remove('game-active');

        // Calculate time bonus
        let timeBonus = Math.floor(Math.random() * 100) + 50;

        // Apply score multiplier from power-ups
        if (this.powerUpManager) {
            const multiplier = this.powerUpManager.getScoreMultiplier();
            timeBonus *= multiplier;
        }

        this.score += timeBonus;

        if (window.shop) {
            window.shop.addPoints(timeBonus);
        }

        // Show level complete screen
        const levelCompleteMenu = document.getElementById('levelCompleteMenu');
        const levelScore = document.getElementById('levelScore');
        const timeBonusEl = document.getElementById('timeBonus');

        if (levelCompleteMenu) levelCompleteMenu.classList.remove('hidden');
        if (levelScore) levelScore.textContent = this.score;
        if (timeBonusEl) timeBonusEl.textContent = timeBonus;

        // Keep rendering but pause gameplay
        this.pausedForMenu = true;
    }

    nextLevel() {
        // Hide level complete menu
        const levelCompleteMenu = document.getElementById('levelCompleteMenu');
        if (levelCompleteMenu) levelCompleteMenu.classList.add('hidden');

        // Increment level
        this.level++;
        this.levelStartZ = this.playerPosition.z;
        this.levelGoalZ = this.levelStartZ + 100 + (this.level * 20); // Longer levels as you progress

        // Don't clear obstacles - keep the existing ones and generate new ones ahead
        // This maintains continuity

        // Resume game
        this.isRunning = true;
        this.pausedForMenu = false;

        // Re-enable canvas interactions
        document.body.classList.add('game-active');

        this.updateHUD();

        console.log(`Level ${this.level} started! Goal: ${this.levelGoalZ}, Current: ${this.playerPosition.z}`);
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        // Update invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime * 1000;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }

            // Flash effect during invulnerability
            if (this.player) {
                this.player.visible = Math.floor(performance.now() / 100) % 2 === 0;
            }
        } else {
            if (this.player) {
                this.player.visible = true;
            }
        }

        this.handleInput(deltaTime);
        this.updateObstacles(deltaTime);
        this.checkCollisions();

        // Update power-ups
        if (this.powerUpManager) {
            this.powerUpManager.update(deltaTime);
            this.powerUpManager.checkCollisions(this.playerPosition);
        }

        // Check if level is complete
        if (this.playerPosition.z >= this.levelGoalZ) {
            this.levelComplete();
            return;
        }

        // Award points for forward progress
        const zProgress = Math.floor(this.playerPosition.z / 4); // Every 4 units (1 lane)
        if (zProgress > this.lastScoreZ) {
            let pointsEarned = (zProgress - this.lastScoreZ) * 10;

            // Apply score multiplier from power-ups
            if (this.powerUpManager) {
                const multiplier = this.powerUpManager.getScoreMultiplier();
                pointsEarned *= multiplier;
            }

            this.score += pointsEarned;
            this.lastScoreZ = zProgress;

            // Add points to shop
            if (window.shop) {
                window.shop.addPoints(pointsEarned);
            }

            // Update HUD to show progress
            this.updateHUD();
        }

        // Update camera to follow player
        this.graphics.updateCamera(this.playerPosition);

        // Generate new lanes ahead
        const furthestLane = Math.max(...this.lanes.map(l => l.z));
        if (this.playerPosition.z > furthestLane - 20) {
            this.generateNewLane(furthestLane + 4);
        }

        // Remove old lanes behind player
        this.lanes = this.lanes.filter(lane => {
            if (lane.z < this.playerPosition.z - 30) {
                this.graphics.removeObject(`lane_${this.lanes.indexOf(lane)}`);
                return false;
            }
            return true;
        });
    }

    generateNewLane(z) {
        // Difficulty scaling - more dangerous lanes at higher levels
        const grassChance = Math.max(0.2, 0.5 - (this.level * 0.05)); // Less grass as level increases
        const rand = Math.random();

        let type;
        if (rand < grassChance) {
            type = 'grass';
        } else if (rand < grassChance + 0.5) {
            type = 'road';
        } else {
            type = 'water';
        }

        const lane = this.graphics.createLane(type);
        lane.position.set(0, 0, z);
        const laneIndex = Math.floor(z / 4); // Unique index based on position
        this.graphics.addObject(`lane_${laneIndex}`, lane);

        this.lanes.push({
            mesh: lane,
            type: type,
            z: z,
            index: laneIndex
        });

        // Create obstacles for this lane
        if (type === 'road') {
            this.createCarsForLane(laneIndex, z);
        } else if (type === 'water') {
            this.createLogsForLane(laneIndex, z);
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // Update game logic only if running
        if (this.isRunning) {
            this.update(deltaTime);
        }

        // Always render
        this.graphics.render();

        // Keep the loop going
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        this.isRunning = true;
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, setting up start button...');

    // Show touch controls on touch devices (iPad, mobile)
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    console.log('Touch device detected:', isTouchDevice);

    if (isTouchDevice) {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.classList.remove('hidden');
            console.log('Touch controls enabled');
        }
    }

    // Touch debug counter
    const touchDebug = document.getElementById('touchDebug');
    const touchCount = document.getElementById('touchCount');
    let touches = 0;

    // Show debug on any touch
    document.addEventListener('touchstart', () => {
        touches++;
        if (touchDebug) {
            touchDebug.style.display = 'block';
            if (touchCount) touchCount.textContent = touches;
        }
        console.log('Touch detected anywhere on page:', touches);
    });

    // Wait for start button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        console.log('Start button found, attaching event listeners');

        // Add multiple event types for better Safari compatibility
        const startGame = (e) => {
            console.log('Start button clicked!', e.type);
            e.preventDefault();
            e.stopPropagation();

            if (!window.game3d) {
                console.log('Initializing game...');
                window.game3d = new Game3D();
            }
        };

        startBtn.addEventListener('click', startGame, { passive: false });
        startBtn.addEventListener('touchend', startGame, { passive: false });

        // Visual feedback test
        startBtn.addEventListener('touchstart', (e) => {
            console.log('Touch detected on start button');
            startBtn.style.transform = 'scale(0.95)';
        });

        startBtn.addEventListener('touchend', () => {
            startBtn.style.transform = '';
        });
    } else {
        console.error('Start button not found!');
    }
});

export default Game3D;
