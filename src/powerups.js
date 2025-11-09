class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 25;
        this.active = true;
        this.collected = false;

        // Balloon properties
        this.balloonColor = this.getBalloonColor();
        this.stringLength = 40;

        // Floating animation
        this.floatOffset = 0;
        this.floatSpeed = 0.5;
        this.floatAmplitude = 15;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.3;

        // Spawn animation
        this.spawnTime = 0;
        this.spawnDuration = 500;
        this.scale = 0;

        // Lifetime
        this.lifetime = 15000; // 15 seconds
        this.createdTime = Date.now();
        this.blinkTime = 3000; // Start blinking 3 seconds before disappearing
    }

    getBalloonColor() {
        const colors = {
            speed: '#FFD700',      // Gold
            shield: '#00BFFF',     // Deep Sky Blue
            scoreMultiplier: '#FF69B4', // Hot Pink
            extraLife: '#32CD32'   // Lime Green
        };
        return colors[this.type] || '#FFD700';
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

    update(deltaTime) {
        if (!this.active) return;

        // Spawn animation
        if (this.spawnTime < this.spawnDuration) {
            this.spawnTime += deltaTime;
            this.scale = Math.min(1, this.spawnTime / this.spawnDuration);
        } else {
            this.scale = 1;
        }

        // Floating animation
        this.floatOffset = Math.sin(Date.now() / 1000 * this.floatSpeed) * this.floatAmplitude;
        this.rotationAngle = Math.sin(Date.now() / 1000 * this.rotationSpeed) * 0.15;

        // Check lifetime
        const timeAlive = Date.now() - this.createdTime;
        if (timeAlive >= this.lifetime) {
            this.active = false;
        }
    }

    render(graphics) {
        if (!this.active) return;

        graphics.save();

        // Check if should blink (near end of lifetime)
        const timeAlive = Date.now() - this.createdTime;
        const timeRemaining = this.lifetime - timeAlive;

        if (timeRemaining < this.blinkTime) {
            const blinkRate = Math.max(100, timeRemaining / 10);
            if (Math.floor(Date.now() / blinkRate) % 2 === 0) {
                graphics.ctx.globalAlpha = 0.4;
            }
        }

        const currentY = this.y + this.floatOffset;

        // Draw balloon string (rope)
        graphics.ctx.strokeStyle = '#8B4513';
        graphics.ctx.lineWidth = 2;
        graphics.ctx.beginPath();
        graphics.ctx.moveTo(this.x, currentY + this.stringLength * this.scale);

        // Create a wavy string
        const segments = 8;
        for (let i = 1; i <= segments; i++) {
            const segmentY = currentY + (this.stringLength * this.scale * i / segments);
            const waveOffset = Math.sin(Date.now() / 500 + i) * 3;
            graphics.ctx.lineTo(this.x + waveOffset, segmentY);
        }
        graphics.ctx.stroke();

        // Apply rotation and scale
        graphics.ctx.translate(this.x, currentY);
        graphics.ctx.rotate(this.rotationAngle);
        graphics.ctx.scale(this.scale, this.scale);

        // Draw balloon
        this.drawBalloon(graphics);

        // Draw power-up icon on balloon
        graphics.ctx.globalAlpha = 1;
        graphics.drawText(this.getIcon(), 0, 0, {
            font: '20px Arial',
            color: '#FFFFFF',
            align: 'center',
            baseline: 'middle',
            stroke: true,
            strokeColor: '#000000',
            strokeWidth: 3
        });

        graphics.restore();
    }

    drawBalloon(graphics) {
        const ctx = graphics.ctx;

        // Balloon body (oval shape)
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.7, this.size * 0.85, 0, 0, Math.PI * 2);

        // Gradient fill
        const gradient = ctx.createRadialGradient(-5, -8, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.lightenColor(this.balloonColor, 40));
        gradient.addColorStop(0.7, this.balloonColor);
        gradient.addColorStop(1, this.darkenColor(this.balloonColor, 20));

        ctx.fillStyle = gradient;
        ctx.fill();

        // Balloon outline
        ctx.strokeStyle = this.darkenColor(this.balloonColor, 30);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Balloon highlight (shine effect)
        ctx.beginPath();
        ctx.ellipse(-6, -8, this.size * 0.25, this.size * 0.35, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        // Balloon knot at bottom
        ctx.beginPath();
        ctx.moveTo(0, this.size * 0.85);
        ctx.lineTo(-3, this.size * 0.95);
        ctx.lineTo(3, this.size * 0.95);
        ctx.closePath();
        ctx.fillStyle = this.darkenColor(this.balloonColor, 40);
        ctx.fill();
    }

    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getCollisionCircle() {
        return {
            x: this.x,
            y: this.y + this.floatOffset,
            radius: this.size
        };
    }

    collect() {
        this.collected = true;
        this.active = false;
    }
}

class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];

        this.spawnTimer = 0;
        this.baseSpawnRate = 8000; // Spawn every 8 seconds on average

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
        this.spawnTimer += deltaTime;

        const spawnChance = deltaTime / this.baseSpawnRate;

        if (this.spawnTimer >= this.baseSpawnRate || Math.random() < spawnChance * 0.1) {
            if (this.powerUps.length < 3) { // Max 3 power-ups on screen
                this.spawnPowerUp();
                this.spawnTimer = 0;
            }
        }
    }

    spawnPowerUp() {
        const type = this.getRandomPowerUpType();

        // Spawn in the playable area, avoiding edges
        const minX = 150;
        const maxX = this.game.gameWidth - 150;
        const minY = 150;
        const maxY = this.game.gameHeight - 150;

        const x = Utils.random(minX, maxX);
        const y = Utils.random(minY, maxY);

        const powerUp = new PowerUp(x, y, type);
        this.powerUps.push(powerUp);
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
        this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    }

    checkCollisions(player) {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active) return;

            const powerUpCircle = powerUp.getCollisionCircle();
            const playerCircle = player.getCollisionCircle();

            const distance = Utils.distance(
                powerUpCircle.x, powerUpCircle.y,
                playerCircle.x, playerCircle.y
            );

            if (distance < powerUpCircle.radius + playerCircle.radius) {
                this.collectPowerUp(powerUp);
            }
        });
    }

    collectPowerUp(powerUp) {
        powerUp.collect();
        this.applyPowerUpEffect(powerUp.type);

        // Play collection sound
        if (this.game.audio) {
            this.game.audio.playSound('powerup');
        }

        // Show collection notification
        if (this.game.ui) {
            this.game.ui.showPowerUpCollected(powerUp.type);
        }
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
        if (this.game.player) {
            this.game.player.speed = this.game.player.baseSpeed * 1.5;
        }
    }

    activateShield() {
        const now = Date.now();
        this.activeEffects.shield = {
            startTime: now,
            endTime: now + this.effectDurations.shield
        };
    }

    activateScoreMultiplier() {
        const now = Date.now();
        this.activeEffects.scoreMultiplier = {
            startTime: now,
            endTime: now + this.effectDurations.scoreMultiplier,
            multiplier: 2
        };
    }

    giveExtraLife() {
        if (this.game) {
            this.game.lives = Math.min(this.game.lives + 1, 10); // Max 10 lives
            if (this.game.ui) {
                this.game.ui.updateHUD();
            }
        }
    }

    updateActiveEffects(deltaTime) {
        const now = Date.now();

        // Update speed boost
        if (this.activeEffects.speed && now >= this.activeEffects.speed.endTime) {
            this.activeEffects.speed = null;
            // Reset player speed
            if (this.game.player) {
                this.game.player.applySpeedBonus();
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

    render(graphics) {
        this.powerUps.forEach(powerUp => {
            powerUp.render(graphics);
        });

        // Render active effect indicators on player
        if (this.game.gameState === 'playing') {
            this.renderActiveEffects(graphics);
        }
    }

    renderActiveEffects(graphics) {
        if (!this.game.player) return;

        const player = this.game.player;

        // Shield effect
        if (this.activeEffects.shield) {
            const timeRemaining = this.activeEffects.shield.endTime - Date.now();
            const pulseRate = timeRemaining < 2000 ? 100 : 300;
            const alpha = (Math.sin(Date.now() / pulseRate) + 1) / 2 * 0.3 + 0.2;

            graphics.ctx.globalAlpha = alpha;
            graphics.drawCircle(player.x, player.y, player.size * 1.8, '#00BFFF');
            graphics.ctx.globalAlpha = 1;

            // Shield sparkles
            for (let i = 0; i < 4; i++) {
                const angle = (Date.now() / 1000 + i * Math.PI / 2) % (Math.PI * 2);
                const distance = player.size * 1.5;
                const sparkleX = player.x + Math.cos(angle) * distance;
                const sparkleY = player.y + Math.sin(angle) * distance;

                graphics.ctx.globalAlpha = 0.6;
                graphics.drawCircle(sparkleX, sparkleY, 3, '#FFFFFF');
                graphics.ctx.globalAlpha = 1;
            }
        }

        // Speed boost effect (trail is more intense)
        if (this.activeEffects.speed) {
            // Add speed lines
            for (let i = 0; i < 3; i++) {
                const offsetX = (player.direction === 'right' ? -1 : 1) * (i + 1) * 15;
                const alpha = (3 - i) / 3 * 0.4;

                graphics.ctx.globalAlpha = alpha;
                graphics.ctx.strokeStyle = '#FFD700';
                graphics.ctx.lineWidth = 3;
                graphics.ctx.beginPath();
                graphics.ctx.moveTo(player.x + offsetX, player.y - 10);
                graphics.ctx.lineTo(player.x + offsetX - 10, player.y);
                graphics.ctx.lineTo(player.x + offsetX, player.y + 10);
                graphics.ctx.stroke();
                graphics.ctx.globalAlpha = 1;
            }
        }

        // Score multiplier effect (sparkles around player)
        if (this.activeEffects.scoreMultiplier) {
            for (let i = 0; i < 3; i++) {
                const angle = (Date.now() / 800 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
                const distance = player.size + 15;
                const starX = player.x + Math.cos(angle) * distance;
                const starY = player.y + Math.sin(angle) * distance;

                graphics.ctx.globalAlpha = 0.8;
                graphics.drawText('⭐', starX, starY, {
                    font: '16px Arial',
                    color: '#FF69B4',
                    align: 'center',
                    baseline: 'middle'
                });
                graphics.ctx.globalAlpha = 1;
            }
        }
    }

    reset() {
        this.powerUps = [];
        this.spawnTimer = 0;
        this.activeEffects = {
            speed: null,
            shield: null,
            scoreMultiplier: null
        };

        // Reset player speed if needed
        if (this.game.player) {
            this.game.player.applySpeedBonus();
        }
    }

    getActiveEffectTimeRemaining(effectType) {
        if (!this.activeEffects[effectType]) return 0;
        return Math.max(0, this.activeEffects[effectType].endTime - Date.now());
    }
}
