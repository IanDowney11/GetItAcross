class UI {
    constructor(game) {
        this.game = game;

        this.elements = {
            startMenu: document.getElementById('startMenu'),
            pauseMenu: document.getElementById('pauseMenu'),
            gameOverMenu: document.getElementById('gameOverMenu'),
            levelCompleteMenu: document.getElementById('levelCompleteMenu'),
            hud: document.getElementById('hud'),
            touchControls: document.getElementById('touchControls'),

            levelNumber: document.getElementById('levelNumber'),
            livesNumber: document.getElementById('livesNumber'),
            scoreNumber: document.getElementById('scoreNumber'),

            finalScore: document.getElementById('finalScore'),
            levelScore: document.getElementById('levelScore'),
            timeBonus: document.getElementById('timeBonus'),

            muteBtn: document.getElementById('muteBtn')
        };

        this.animations = {
            scoreAnimation: null,
            livesAnimation: null,
            levelAnimation: null
        };

        this.notifications = [];
        this.setupAnimations();
    }

    setupAnimations() {
        this.scoreCounterTarget = 0;
        this.scoreCounterCurrent = 0;
        this.scoreAnimationSpeed = 2;
    }

    showStartMenu() {
        this.hideAllMenus();
        this.elements.startMenu.classList.remove('hidden');
        this.animateMenuEntry(this.elements.startMenu);
    }

    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
        this.animateMenuEntry(this.elements.pauseMenu);
    }

    hidePauseMenu() {
        this.animateMenuExit(this.elements.pauseMenu, () => {
            this.elements.pauseMenu.classList.add('hidden');
        });
    }

    showGameOver(finalScore) {
        this.elements.finalScore.textContent = Utils.formatScore(finalScore);
        this.elements.gameOverMenu.classList.remove('hidden');
        this.animateMenuEntry(this.elements.gameOverMenu);

        this.animateScoreCount(this.elements.finalScore, 0, finalScore, 2000);
    }

    showLevelComplete(levelScore, timeBonus) {
        this.elements.levelScore.textContent = Utils.formatScore(levelScore);
        this.elements.timeBonus.textContent = Utils.formatScore(timeBonus);
        this.elements.levelCompleteMenu.classList.remove('hidden');
        this.animateMenuEntry(this.elements.levelCompleteMenu);

        this.animateScoreCount(this.elements.levelScore, 0, levelScore, 1500);
        setTimeout(() => {
            this.animateScoreCount(this.elements.timeBonus, 0, timeBonus, 1000);
        }, 1500);
    }

    showHUD() {
        this.elements.hud.classList.remove('hidden');
        this.animateHUDEntry();

        if (Utils.isTouchDevice()) {
            this.elements.touchControls.classList.remove('hidden');
            this.animateTouchControlsEntry();
        }
    }

    hideHUD() {
        this.elements.hud.classList.add('hidden');
        this.elements.touchControls.classList.add('hidden');
    }

    hideAllMenus() {
        [
            this.elements.startMenu,
            this.elements.pauseMenu,
            this.elements.gameOverMenu,
            this.elements.levelCompleteMenu
        ].forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    updateHUD() {
        this.updateScore();
        this.updateLives();
        this.updateLevel();
    }

    updateScore() {
        const targetScore = this.game.score;
        if (this.scoreCounterTarget !== targetScore) {
            this.scoreCounterTarget = targetScore;
            this.animateScoreCounter();
        }
    }

    updateLives() {
        const livesElement = this.elements.livesNumber;
        const currentLives = parseInt(livesElement.textContent);
        const newLives = this.game.lives;

        if (currentLives !== newLives) {
            livesElement.textContent = newLives;

            if (newLives < currentLives) {
                this.animateLivesLoss(livesElement);
            }
        }
    }

    updateLevel() {
        const levelElement = this.elements.levelNumber;
        const currentLevel = parseInt(levelElement.textContent);
        const newLevel = this.game.currentLevel;

        if (currentLevel !== newLevel) {
            levelElement.textContent = newLevel;
            this.animateLevelChange(levelElement);
        }
    }

    animateScoreCounter() {
        const animate = () => {
            const diff = this.scoreCounterTarget - this.scoreCounterCurrent;
            if (Math.abs(diff) < 1) {
                this.scoreCounterCurrent = this.scoreCounterTarget;
                this.elements.scoreNumber.textContent = Utils.formatScore(this.scoreCounterCurrent);
                return;
            }

            this.scoreCounterCurrent += diff * 0.1;
            this.elements.scoreNumber.textContent = Utils.formatScore(Math.floor(this.scoreCounterCurrent));
            requestAnimationFrame(animate);
        };

        animate();
    }

    animateScoreCount(element, start, end, duration) {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeOutQuart(progress);
            const currentValue = Math.floor(start + (end - start) * easeProgress);

            element.textContent = Utils.formatScore(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    animateLivesLoss(element) {
        element.style.transform = 'scale(1.5)';
        element.style.color = '#FF0000';
        element.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 300);
    }

    animateLevelChange(element) {
        element.style.transform = 'scale(1.3)';
        element.style.color = '#FFD700';
        element.style.transition = 'all 0.5s ease';

        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 500);

        this.showNotification(`Level ${this.game.currentLevel}: ${this.game.levelManager.getLevelName(this.game.currentLevel)}`, 3000);
    }

    animateMenuEntry(menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.8)';
        menu.style.transition = 'all 0.4s ease';

        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        }, 10);
    }

    animateMenuExit(menu, callback) {
        menu.style.transition = 'all 0.3s ease';
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.8)';

        setTimeout(() => {
            if (callback) callback();
            menu.style.opacity = '';
            menu.style.transform = '';
            menu.style.transition = '';
        }, 300);
    }

    animateHUDEntry() {
        const hudElements = this.elements.hud.children;
        Array.from(hudElements).forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
            element.style.transition = `all 0.5s ease ${index * 0.1}s`;

            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 10);
        });
    }

    animateTouchControlsEntry() {
        const touchControls = this.elements.touchControls;
        touchControls.style.opacity = '0';
        touchControls.style.transform = 'translateY(50px)';
        touchControls.style.transition = 'all 0.6s ease 0.5s';

        setTimeout(() => {
            touchControls.style.opacity = '1';
            touchControls.style.transform = 'translateY(0)';
        }, 10);
    }

    showNotification(message, duration = 2000, type = 'info') {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);

        this.notifications.push(notification);

        setTimeout(() => {
            this.animateNotificationEntry(notification);
        }, 10);

        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transition: all 0.4s ease;
            text-align: center;
            max-width: 300px;
            word-wrap: break-word;
        `;

        return notification;
    }

    getNotificationColor(type) {
        const colors = {
            info: 'linear-gradient(135deg, #3498db, #2980b9)',
            success: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
            error: 'linear-gradient(135deg, #e74c3c, #c0392b)'
        };

        return colors[type] || colors.info;
    }

    animateNotificationEntry(notification) {
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    removeNotification(notification) {
        notification.style.transform = 'translate(-50%, -50%) scale(0)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }

            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 400);
    }

    showGameTip(tip, duration = 3000) {
        this.showNotification(tip, duration, 'info');
    }

    showWarning(warning, duration = 2000) {
        this.showNotification(warning, duration, 'warning');
    }

    showSuccess(message, duration = 2000) {
        this.showNotification(message, duration, 'success');
    }

    showError(error, duration = 2000) {
        this.showNotification(error, duration, 'error');
    }

    updateMuteButton(isMuted) {
        this.elements.muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }

    showLevelTransition(fromLevel, toLevel) {
        const message = `Level ${toLevel}: ${this.game.levelManager.getLevelName(toLevel)}`;
        this.showNotification(message, 3000, 'success');
    }

    showComboNotification(combo) {
        if (combo > 1) {
            this.showNotification(`${combo}x Combo!`, 1500, 'success');
        }
    }

    showSpeedBonus(bonus) {
        this.showNotification(`Speed Bonus: +${Utils.formatScore(bonus)}!`, 2000, 'info');
    }

    renderInGameUI(graphics) {
        if (this.game.gameState !== 'playing') return;

        this.renderProgressBar(graphics);
        this.renderMiniMap(graphics);
        this.renderCollisionWarnings(graphics);
    }

    renderProgressBar(graphics) {
        const barWidth = 200;
        const barHeight = 10;
        const barX = this.game.gameWidth / 2 - barWidth / 2;
        const barY = 20;

        const progress = this.game.player.x / this.game.gameWidth;

        graphics.drawRect(barX, barY, barWidth, barHeight, '#000000');
        graphics.drawRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4, '#333333');
        graphics.drawRect(barX + 2, barY + 2, (barWidth - 4) * progress, barHeight - 4, '#00FF00');

        graphics.drawText('Progress', barX + barWidth / 2, barY - 5, {
            font: '12px Arial',
            color: '#FFFFFF',
            align: 'center',
            stroke: true,
            strokeColor: '#000000'
        });
    }

    renderMiniMap(graphics) {
        const mapWidth = 150;
        const mapHeight = 100;
        const mapX = this.game.gameWidth - mapWidth - 10;
        const mapY = 60;

        graphics.ctx.globalAlpha = 0.7;
        graphics.drawRect(mapX, mapY, mapWidth, mapHeight, '#000000');
        graphics.ctx.globalAlpha = 1;

        const playerMapX = mapX + (this.game.player.x / this.game.gameWidth) * mapWidth;
        const playerMapY = mapY + (this.game.player.y / this.game.gameHeight) * mapHeight;
        graphics.drawCircle(playerMapX, playerMapY, 3, '#00FF00');

        this.game.vehicleManager.vehicles.forEach(vehicle => {
            const vehicleMapX = mapX + (vehicle.x / this.game.gameWidth) * mapWidth;
            const vehicleMapY = mapY + (vehicle.y / this.game.gameHeight) * mapHeight;
            graphics.drawCircle(vehicleMapX, vehicleMapY, 2, '#FF0000');
        });
    }

    renderCollisionWarnings(graphics) {
        const warnings = this.game.collision.getCollisionWarning(
            this.game.player,
            this.game.vehicleManager.vehicles,
            100
        );

        warnings.forEach(warning => {
            if (warning.severity > 0.5) {
                const vehicle = warning.vehicle;
                graphics.ctx.globalAlpha = warning.severity * 0.8;
                graphics.drawRect(
                    vehicle.x - 5,
                    vehicle.y - 5,
                    vehicle.width + 10,
                    vehicle.height + 10,
                    '#FFFF00',
                    false
                );
                graphics.ctx.globalAlpha = 1;
            }
        });
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    destroy() {
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        this.notifications = [];

        Object.values(this.animations).forEach(animation => {
            if (animation) {
                cancelAnimationFrame(animation);
            }
        });
    }

    reset() {
        this.scoreCounterCurrent = 0;
        this.scoreCounterTarget = 0;
        this.hideAllMenus();
        this.hideHUD();

        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }
}