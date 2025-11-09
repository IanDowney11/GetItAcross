import * as THREE from 'three';

export class PowerUp3D {
    constructor(x, z, type, graphics) {
        this.type = type;
        this.graphics = graphics;
        this.active = true;
        this.collected = false;

        // Position
        this.position = new THREE.Vector3(x, 0, z);

        // Floating animation
        this.floatOffset = 0;
        this.floatSpeed = 1 + Math.random() * 0.5;
        this.floatAmplitude = 1.5;
        this.rotationSpeed = 0.5;

        // Lifetime
        this.lifetime = 15000; // 15 seconds
        this.createdTime = Date.now();
        this.blinkTime = 3000; // Start blinking 3 seconds before disappearing

        // Create 3D balloon mesh
        this.createBalloonMesh();
    }

    getBalloonColor() {
        const colors = {
            speed: 0xFFD700,       // Gold
            shield: 0x00BFFF,      // Deep Sky Blue
            scoreMultiplier: 0xFF69B4, // Hot Pink
            extraLife: 0x32CD32    // Lime Green
        };
        return colors[this.type] || 0xFFD700;
    }

    getIcon() {
        const icons = {
            speed: '⚡',
            shield: '🛡️',
            scoreMultiplier: '⭐',
            extraLife: '❤️'
        };
        return icons[this.type] || '?';
    }

    createBalloonMesh() {
        this.group = new THREE.Group();

        // Balloon body (sphere slightly stretched vertically)
        const balloonGeometry = new THREE.SphereGeometry(1, 16, 16);
        balloonGeometry.scale(0.8, 1.2, 0.8); // Make it oval-shaped

        const balloonMaterial = new THREE.MeshPhongMaterial({
            color: this.getBalloonColor(),
            shininess: 100,
            specular: 0xFFFFFF,
            emissive: this.getBalloonColor(),
            emissiveIntensity: 0.2
        });

        this.balloonMesh = new THREE.Mesh(balloonGeometry, balloonMaterial);
        this.balloonMesh.position.y = 3; // Float above ground

        // Balloon knot (small cone at bottom)
        const knotGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const knotMaterial = new THREE.MeshPhongMaterial({
            color: this.darkenColor(this.getBalloonColor())
        });
        const knot = new THREE.Mesh(knotGeometry, knotMaterial);
        knot.position.y = 1.8;
        knot.rotation.x = Math.PI; // Point downward

        // String (rope)
        const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4);
        const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        this.stringMesh = new THREE.Mesh(stringGeometry, stringMaterial);
        this.stringMesh.position.y = 1.25;

        // Add highlight (shine effect on balloon)
        const highlightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.4
        });
        const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlight.position.set(-0.3, 3.4, 0.3);

        // Create icon sprite (using canvas texture)
        const iconSprite = this.createIconSprite();
        iconSprite.position.y = 3;

        // Add all parts to group
        this.group.add(this.balloonMesh);
        this.group.add(knot);
        this.group.add(this.stringMesh);
        this.group.add(highlight);
        this.group.add(iconSprite);

        // Set initial position
        this.group.position.copy(this.position);

        // Add pulsing light for visibility
        const light = new THREE.PointLight(this.getBalloonColor(), 1, 10);
        light.position.y = 3;
        this.group.add(light);
        this.light = light;
    }

    createIconSprite() {
        // Create canvas for icon
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw icon
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.getIcon(), 64, 64);
        ctx.fillText(this.getIcon(), 64, 64);

        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 1.5, 1);

        return sprite;
    }

    darkenColor(color) {
        const tempColor = new THREE.Color(color);
        tempColor.multiplyScalar(0.6);
        return tempColor.getHex();
    }

    update(deltaTime) {
        if (!this.active) return;

        const now = Date.now();

        // Check lifetime
        const timeAlive = now - this.createdTime;
        if (timeAlive >= this.lifetime) {
            this.active = false;
            return;
        }

        // Floating animation
        const time = now / 1000;
        this.floatOffset = Math.sin(time * this.floatSpeed) * this.floatAmplitude;

        // Update balloon position
        if (this.balloonMesh) {
            this.balloonMesh.position.y = 3 + this.floatOffset;
        }

        // Gentle rotation
        if (this.group) {
            this.group.rotation.y = Math.sin(time * this.rotationSpeed) * 0.2;
        }

        // Make string wave
        if (this.stringMesh) {
            this.stringMesh.rotation.z = Math.sin(time * 2) * 0.1;
        }

        // Pulsing light
        if (this.light) {
            this.light.intensity = 0.5 + Math.sin(time * 3) * 0.3;
        }

        // Blinking near end of lifetime
        const timeRemaining = this.lifetime - timeAlive;
        if (timeRemaining < this.blinkTime) {
            const blinkRate = Math.max(100, timeRemaining / 10);
            const visible = Math.floor(now / blinkRate) % 2 === 0;
            if (this.group) {
                this.group.visible = visible;
            }
        }
    }

    getCollisionSphere() {
        return {
            center: new THREE.Vector3(
                this.position.x,
                3 + this.floatOffset,
                this.position.z
            ),
            radius: 1.5
        };
    }

    collect() {
        this.collected = true;
        this.active = false;
    }

    getMesh() {
        return this.group;
    }

    destroy() {
        if (this.group) {
            // Dispose geometries and materials
            this.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}

export class PowerUpManager3D {
    constructor(game, graphics) {
        this.game = game;
        this.graphics = graphics;
        this.powerUps = [];

        this.spawnTimer = 0;
        this.baseSpawnRate = 10000; // Spawn every 10 seconds on average

        this.powerUpTypes = ['speed', 'shield', 'scoreMultiplier', 'extraLife'];
        this.powerUpWeights = {
            speed: 0.3,
            shield: 0.3,
            scoreMultiplier: 0.3,
            extraLife: 0.1
        };

        // Active power-up effects
        this.activeEffects = {
            speed: null,
            shield: null,
            scoreMultiplier: null
        };

        this.effectDurations = {
            speed: 5000,          // 5 seconds
            shield: 8000,         // 8 seconds
            scoreMultiplier: 10000 // 10 seconds
        };

        this.lastSpawnZ = 0;
    }

    update(deltaTime) {
        this.updatePowerUps(deltaTime);
        this.spawnPowerUps(deltaTime);
        this.removeInactivePowerUps();
        this.updateActiveEffects(deltaTime);
    }

    updatePowerUps(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
    }

    spawnPowerUps(deltaTime) {
        if (!this.game.playerPosition) return;

        this.spawnTimer += deltaTime * 1000;

        const playerZ = this.game.playerPosition.z;

        // Spawn power-ups ahead of the player
        if (this.spawnTimer >= this.baseSpawnRate && playerZ > this.lastSpawnZ + 20) {
            if (this.powerUps.length < 2) { // Max 2 power-ups on screen
                this.spawnPowerUp(playerZ);
                this.spawnTimer = 0;
                this.lastSpawnZ = playerZ;
            }
        }
    }

    spawnPowerUp(playerZ = 0) {
        const type = this.getRandomPowerUpType();

        // Spawn ahead of player, within lane bounds
        const x = (Math.random() - 0.5) * 16; // -8 to 8 (within lane bounds)
        const z = playerZ + 20 + Math.random() * 20; // 20-40 units ahead

        const powerUp = new PowerUp3D(x, z, type, this.graphics);
        this.powerUps.push(powerUp);

        // Add to scene
        const uniqueId = `powerup_${Date.now()}_${Math.random()}`;
        this.graphics.addObject(uniqueId, powerUp.getMesh());
        powerUp.id = uniqueId;
    }

    getRandomPowerUpType() {
        const rand = Math.random();
        let accumulator = 0;

        for (const [type, weight] of Object.entries(this.powerUpWeights)) {
            accumulator += weight;
            if (rand <= accumulator) {
                return type;
            }
        }

        return 'speed';
    }

    removeInactivePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            if (!powerUp.active) {
                // Remove from scene
                this.graphics.removeObject(powerUp.id);
                powerUp.destroy();
                return false;
            }
            return true;
        });
    }

    checkCollisions(playerPosition) {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active) return;

            const sphere = powerUp.getCollisionSphere();
            const distance = playerPosition.distanceTo(sphere.center);

            if (distance < sphere.radius + 0.5) { // 0.5 is rough player radius
                this.collectPowerUp(powerUp);
            }
        });
    }

    collectPowerUp(powerUp) {
        powerUp.collect();
        this.applyPowerUpEffect(powerUp.type);

        // Visual feedback - create particle burst
        this.createCollectionEffect(powerUp.position);

        console.log(`Collected ${powerUp.type} power-up!`);
    }

    createCollectionEffect(position) {
        // Create a burst of particles at collection point
        const particleCount = 20;
        const particles = new THREE.Group();

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
            });
            const particle = new THREE.Mesh(geometry, material);

            // Random direction
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * 2,
                Math.random() * 3 + 2,
                Math.sin(angle) * 2
            );

            particle.userData.velocity = velocity;
            particles.add(particle);
        }

        particles.position.copy(position);
        particles.position.y = 3;

        const particleId = `particles_${Date.now()}`;
        this.graphics.addObject(particleId, particles);

        // Animate and remove after 1 second
        setTimeout(() => {
            this.graphics.removeObject(particleId);
        }, 1000);
    }

    applyPowerUpEffect(type) {
        switch (type) {
            case 'speed':
                this.activateSpeedBoost();
                break;
            case 'shield':
                this.activateShield();
                break;
            case 'scoreMultiplier':
                this.activateScoreMultiplier();
                break;
            case 'extraLife':
                this.giveExtraLife();
                break;
        }
    }

    activateSpeedBoost() {
        const now = Date.now();
        this.activeEffects.speed = {
            startTime: now,
            endTime: now + this.effectDurations.speed
        };

        // Apply speed boost to player
        if (this.game) {
            this.game.speed = 15 * 1.75; // 75% speed boost
        }

        this.showEffectNotification('⚡ Speed Boost!');
    }

    activateShield() {
        const now = Date.now();
        this.activeEffects.shield = {
            startTime: now,
            endTime: now + this.effectDurations.shield
        };

        this.showEffectNotification('🛡️ Shield Active!');
    }

    activateScoreMultiplier() {
        const now = Date.now();
        this.activeEffects.scoreMultiplier = {
            startTime: now,
            endTime: now + this.effectDurations.scoreMultiplier,
            multiplier: 2
        };

        this.showEffectNotification('⭐ 2x Score!');
    }

    giveExtraLife() {
        if (this.game) {
            this.game.lives = Math.min(this.game.lives + 1, 10); // Max 10 lives
            this.game.updateHUD();
        }

        this.showEffectNotification('❤️ Extra Life!');
    }

    showEffectNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
            animation: fadeInOut 2s ease;
        `;

        // Add fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 2000);
    }

    updateActiveEffects(deltaTime) {
        const now = Date.now();

        // Update speed boost
        if (this.activeEffects.speed && now >= this.activeEffects.speed.endTime) {
            this.activeEffects.speed = null;
            // Reset player speed
            if (this.game) {
                // Get speed from equipped skin
                const equippedSkin = window.shop ? window.shop.getEquippedSkin() : null;
                this.game.speed = 15 * (equippedSkin?.speedMultiplier || 1.0);
            }
        }

        // Update shield
        if (this.activeEffects.shield && now >= this.activeEffects.shield.endTime) {
            this.activeEffects.shield = null;
        }

        // Update score multiplier
        if (this.activeEffects.scoreMultiplier && now >= this.activeEffects.scoreMultiplier.endTime) {
            this.activeEffects.scoreMultiplier = null;
        }
    }

    hasShield() {
        return this.activeEffects.shield !== null;
    }

    getScoreMultiplier() {
        if (this.activeEffects.scoreMultiplier) {
            return this.activeEffects.scoreMultiplier.multiplier;
        }
        return 1;
    }

    reset() {
        // Remove all power-ups from scene
        this.powerUps.forEach(powerUp => {
            this.graphics.removeObject(powerUp.id);
            powerUp.destroy();
        });

        this.powerUps = [];
        this.spawnTimer = 0;
        this.lastSpawnZ = 0;

        this.activeEffects = {
            speed: null,
            shield: null,
            scoreMultiplier: null
        };

        // Reset player speed
        if (this.game) {
            const equippedSkin = window.shop ? window.shop.getEquippedSkin() : null;
            this.game.speed = 15 * (equippedSkin?.speedMultiplier || 1.0);
        }
    }

    getActiveEffectTimeRemaining(effectType) {
        if (!this.activeEffects[effectType]) return 0;
        return Math.max(0, this.activeEffects[effectType].endTime - Date.now());
    }
}
