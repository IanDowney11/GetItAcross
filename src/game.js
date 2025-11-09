class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.graphics = new Graphics(this.canvas, this.ctx);

        this.gameState = 'menu';
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;

        this.gameWidth = 1200;
        this.gameHeight = 800;

        this.score = 0;
        this.lives = 5;
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.levelStartTime = 0;
        this.difficultyMultiplier = 1;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupSystems();
        this.bindEvents();
        this.gameLoop();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerRect = container.getBoundingClientRect();

        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;

        const scaleX = this.canvas.width / this.gameWidth;
        const scaleY = this.canvas.height / this.gameHeight;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = (this.canvas.width - this.gameWidth * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.gameHeight * this.scale) / 2;

        this.graphics.setTransform(this.scale, this.offsetX, this.offsetY);
    }

    setupSystems() {
        this.audio = new Audio();
        this.input = new Input();
        this.player = new Player(50, this.gameHeight / 2, this);
        this.vehicleManager = new VehicleManager(this);
        this.collision = new Collision();
        this.levelManager = new LevelManager(this);
        this.ui = new UI(this);

        this.ui.showStartMenu();

        if (Utils.isTouchDevice()) {
            document.getElementById('touchControls').classList.remove('hidden');
        }
    }

    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartLevel());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('restartGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('muteBtn').addEventListener('click', () => this.toggleMute());

        // Auth and leaderboard buttons
        document.getElementById('authBtn').addEventListener('click', () => this.handleAuthButtonClick());
        document.getElementById('loginBtn').addEventListener('click', () => this.handleAuthButtonClick());
        document.getElementById('leaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('pauseLeaderboardBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('submitScoreBtn').addEventListener('click', () => this.submitScore());

        // Shop buttons
        document.getElementById('shopBtn').addEventListener('click', () => this.showShop());
        document.getElementById('menuShopBtn').addEventListener('click', () => this.showShop());
        document.getElementById('pauseShopBtn').addEventListener('click', () => this.showShop());
    }

    showShop() {
        if (window.shop) {
            window.shop.show();
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 5;
        this.currentLevel = 1;
        this.difficultyMultiplier = 1;
        this.levelStartTime = Date.now();

        this.player.reset(50, this.gameHeight / 2);
        this.vehicleManager.reset();
        this.levelManager.loadLevel(this.currentLevel);

        this.ui.hideAllMenus();
        this.ui.showHUD();
        this.ui.updateHUD();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.ui.showPauseMenu();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.ui.hidePauseMenu();
        }
    }

    restartLevel() {
        this.gameState = 'playing';
        this.levelStartTime = Date.now();
        this.player.reset(50, this.gameHeight / 2);
        this.vehicleManager.reset();
        this.levelManager.loadLevel(this.currentLevel);
        this.ui.hideAllMenus();
        this.ui.showHUD();
        this.ui.updateHUD();
    }

    showMainMenu() {
        this.gameState = 'menu';
        this.ui.hideAllMenus();
        this.ui.showStartMenu();
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > this.maxLevel) {
            this.currentLevel = 1;
            this.difficultyMultiplier += 0.5;
        }

        this.levelStartTime = Date.now();
        this.player.reset(50, this.gameHeight / 2);
        this.vehicleManager.reset();
        this.levelManager.loadLevel(this.currentLevel);

        this.gameState = 'playing';
        this.ui.hideAllMenus();
        this.ui.showHUD();
        this.ui.updateHUD();
    }

    levelComplete() {
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        const baseScore = 100 * this.currentLevel;
        const timeBonus = Math.max(0, Math.floor((30 - levelTime) * 10));
        const totalScore = baseScore + timeBonus;

        this.score += totalScore;
        this.gameState = 'levelComplete';
        this.lastLevelTime = levelTime;

        // Award shop points (10% of score as points)
        const pointsEarned = Math.floor(totalScore / 10);
        if (window.shop) {
            window.shop.addPoints(pointsEarned);
        }

        this.ui.showLevelComplete(totalScore, timeBonus);
        this.audio.playSound('levelComplete');

        // Show submit score button if user is authenticated
        this.updateSubmitScoreButton();
    }

    playerHit() {
        this.lives--;
        this.audio.playSound('collision');

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.restartLevel();
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.ui.showGameOver(this.score);
        this.audio.playSound('gameOver');
    }

    toggleMute() {
        this.audio.toggleMute();
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.textContent = this.audio.isMuted ? '🔇' : '🔊';
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        this.input.update();
        this.player.update(deltaTime);
        this.vehicleManager.update(deltaTime);

        if (this.player.x >= this.gameWidth - 50) {
            this.levelComplete();
        }

        if (this.collision.checkPlayerVehicleCollisions(this.player, this.vehicleManager.vehicles)) {
            this.playerHit();
        }
    }

    render() {
        this.graphics.clear();
        this.graphics.setTransform(this.scale, this.offsetX, this.offsetY);

        if (this.gameState === 'menu') {
            this.renderMenuBackground();
        } else {
            this.levelManager.render(this.graphics);
            this.vehicleManager.render(this.graphics);
            this.player.render(this.graphics);

            if (this.ui) {
                this.ui.renderInGameUI(this.graphics);
            }
        }

        this.graphics.resetTransform();
    }

    renderMenuBackground() {
        this.graphics.drawGradientRect(0, 0, this.gameWidth, this.gameHeight, [
            { position: 0, color: '#2c3e50' },
            { position: 1, color: '#3498db' }
        ]);

        for (let i = 0; i < 5; i++) {
            const x = i * 240 + 120;
            this.graphics.drawChicken(x, this.gameHeight / 2 + Math.sin(Date.now() / 1000 + i) * 20, 30);
        }
    }

    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        const isMobile = Utils.isMobile();
        const targetFrameTime = isMobile ? 1000 / 30 : this.frameTime;

        if (this.deltaTime >= targetFrameTime) {
            this.update(this.deltaTime);
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Authentication and Leaderboard Methods
    handleAuthButtonClick() {
        if (window.supabaseClient && window.supabaseClient.isAuthenticated()) {
            // User is signed in, show options
            this.showUserMenu();
        } else {
            // User is not signed in, show auth modal
            window.auth.show(false);
        }
    }

    showUserMenu() {
        const user = window.supabaseClient.getUser();
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';

        // Show user options directly
        if (confirm(`Signed in as: ${username}\n\nChoose an option:\nOK = View Leaderboard\nCancel = Sign Out`)) {
            this.showLeaderboard();
        } else {
            window.auth.handleSignOut();
        }
    }

    showLeaderboard() {
        if (window.leaderboard) {
            window.leaderboard.show();
        }
    }

    async submitScore() {
        if (!window.supabaseClient || !window.supabaseClient.isAuthenticated()) {
            this.ui.showError('Please sign in to submit your score');
            return;
        }

        try {
            console.log('Submitting score:', {
                score: this.score,
                level: this.currentLevel,
                time: this.lastLevelTime || 0,
                user: window.supabaseClient.getUser()
            });

            await window.supabaseClient.submitScore(
                this.score,
                this.currentLevel,
                this.lastLevelTime || 0
            );

            this.ui.showSuccess('Score submitted to leaderboard!');

            // Hide submit button after successful submission
            const submitBtn = document.getElementById('submitScoreBtn');
            if (submitBtn) {
                submitBtn.classList.add('hidden');
            }

            // Refresh leaderboard if it's open
            if (window.leaderboard) {
                window.leaderboard.onScoreSubmitted();
            }

        } catch (error) {
            console.error('Error submitting score:', error);
            console.error('Error details:', error.message, error.details);
            this.ui.showError(`Failed to submit score: ${error.message}`);
        }
    }

    updateSubmitScoreButton() {
        const submitBtn = document.getElementById('submitScoreBtn');
        if (!submitBtn) return;

        if (window.supabaseClient && window.supabaseClient.isAuthenticated()) {
            submitBtn.classList.remove('hidden');
        } else {
            submitBtn.classList.add('hidden');
        }
    }

    async initializeSupabase() {
        try {
            if (window.supabaseClient && window.supabaseClient.isSupabaseConfigured()) {
                await window.supabaseClient.initialize();

                // Update UI based on auth state
                const user = window.supabaseClient.getUser();
                if (window.auth) {
                    window.auth.updateAuthButtons(user);
                }
            }
        } catch (error) {
            console.warn('Supabase initialization failed:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    window.game = new Game();

    // Initialize Supabase
    await window.game.initializeSupabase();
});