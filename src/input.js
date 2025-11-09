class Input {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.swipeThreshold = 50;
        this.swipeTimeout = 300;

        this.touchStart = { x: 0, y: 0, time: 0 };
        this.lastSwipeTime = 0;

        this.bindEvents();
        this.setupTouchControls();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });

        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupTouchControls() {
        const touchControls = document.getElementById('touchControls');
        if (!touchControls) return;

        const dpadButtons = touchControls.querySelectorAll('.dpad-btn');
        const moveForwardBtn = document.getElementById('moveForwardBtn');

        dpadButtons.forEach(btn => {
            const direction = btn.dataset.direction;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onTouchButtonDown(direction);
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.onTouchButtonUp(direction);
            }, { passive: false });

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onTouchButtonDown(direction);
            });

            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.onTouchButtonUp(direction);
            });
        });

        if (moveForwardBtn) {
            moveForwardBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touches['forward'] = true;
            }, { passive: false });

            moveForwardBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touches['forward'] = false;
            }, { passive: false });

            moveForwardBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touches['forward'] = true;
            });

            moveForwardBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.touches['forward'] = false;
            });

            moveForwardBtn.addEventListener('mouseleave', (e) => {
                this.touches['forward'] = false;
            });
        }
    }

    onKeyDown(e) {
        this.keys[e.code] = true;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onTouchStart(e) {
        if (e.target.closest('#touchControls')) return;

        const touch = e.touches[0];
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }

    onTouchMove(e) {
        e.preventDefault();
    }

    onTouchEnd(e) {
        if (e.target.closest('#touchControls')) return;

        const currentTime = Date.now();
        const timeDiff = currentTime - this.touchStart.time;

        if (timeDiff > this.swipeTimeout) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this.swipeThreshold) {
            this.onTap();
            return;
        }

        if (currentTime - this.lastSwipeTime < 100) return;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
            if (deltaX > 0) {
                this.onSwipe('right');
            } else {
                this.onSwipe('left');
            }
        } else {
            if (deltaY > 0) {
                this.onSwipe('down');
            } else {
                this.onSwipe('up');
            }
        }

        this.lastSwipeTime = currentTime;
    }

    onTouchButtonDown(direction) {
        this.touches[direction] = true;
    }

    onTouchButtonUp(direction) {
        this.touches[direction] = false;
    }

    onSwipe(direction) {
        if (!window.game || window.game.gameState !== 'playing') return;

        const player = window.game.player;
        const moveDistance = 40;

        switch (direction) {
            case 'up':
                player.moveUp(moveDistance);
                break;
            case 'down':
                player.moveDown(moveDistance);
                break;
            case 'left':
                player.moveLeft(moveDistance);
                break;
            case 'right':
                player.moveRight(moveDistance);
                break;
        }

        window.game.audio.playSound('move');
    }

    onTap() {
        this.onMoveForward();
    }

    onMoveForward() {
        if (!window.game || window.game.gameState !== 'playing') return;

        const player = window.game.player;
        player.moveRight(30);
        window.game.audio.playSound('move');
    }

    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isTouchPressed(direction) {
        return !!this.touches[direction];
    }

    getMovementInput() {
        const movement = { x: 0, y: 0, moving: false };

        if (this.isKeyPressed('ArrowLeft') || this.isKeyPressed('KeyA') || this.isTouchPressed('left')) {
            movement.x -= 1;
            movement.moving = true;
        }

        if (this.isKeyPressed('ArrowRight') || this.isKeyPressed('KeyD') || this.isTouchPressed('right') || this.isTouchPressed('forward')) {
            movement.x += 1;
            movement.moving = true;
        }

        if (this.isKeyPressed('ArrowUp') || this.isKeyPressed('KeyW') || this.isTouchPressed('up')) {
            movement.y -= 1;
            movement.moving = true;
        }

        if (this.isKeyPressed('ArrowDown') || this.isKeyPressed('KeyS') || this.isTouchPressed('down')) {
            movement.y += 1;
            movement.moving = true;
        }

        return movement;
    }

    isPausePressed() {
        return this.isKeyPressed('Escape') || this.isKeyPressed('KeyP');
    }

    isActionPressed() {
        return this.isKeyPressed('Space') || this.isKeyPressed('Enter');
    }

    update() {
        // Handle pause input
        if (this.isPausePressed()) {
            if (window.game && (window.game.gameState === 'playing' || window.game.gameState === 'paused')) {
                if (!this.pauseKeyHeld) {
                    window.game.togglePause();
                    this.pauseKeyHeld = true;
                }
            }
        } else {
            this.pauseKeyHeld = false;
        }

        // Handle action input for menus
        if (this.isActionPressed()) {
            if (!this.actionKeyHeld) {
                this.handleMenuAction();
                this.actionKeyHeld = true;
            }
        } else {
            this.actionKeyHeld = false;
        }
    }

    handleMenuAction() {
        if (!window.game) return;

        switch (window.game.gameState) {
            case 'menu':
                window.game.startGame();
                break;
            case 'gameOver':
                window.game.startGame();
                break;
            case 'levelComplete':
                window.game.nextLevel();
                break;
        }
    }

    reset() {
        this.keys = {};
        this.touches = {};
        this.pauseKeyHeld = false;
        this.actionKeyHeld = false;
    }

    destroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }
}