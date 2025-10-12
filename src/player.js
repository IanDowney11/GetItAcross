class Player {
    constructor(x, y, game) {
        this.game = game;
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 150;
        this.direction = 'right';

        this.animation = {
            frame: 0,
            frameTime: 0,
            frameDuration: 200,
            walking: false
        };

        this.movement = {
            targetX: x,
            targetY: y,
            moving: false,
            moveSpeed: 300
        };

        this.bounds = {
            minX: 0,
            maxX: game.gameWidth - this.size,
            minY: 50,
            maxY: game.gameHeight - 50
        };

        this.lastMoveTime = 0;
        this.moveDelay = 100;
    }

    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateMovement(deltaTime);
        this.constrainToBounds();
    }

    handleInput(deltaTime) {
        if (!this.game.input) return;

        const movement = this.game.input.getMovementInput();
        const currentTime = Date.now();

        if (movement.moving && currentTime - this.lastMoveTime > this.moveDelay) {
            const moveDistance = this.speed * (deltaTime / 1000);

            if (movement.x !== 0) {
                this.moveHorizontal(movement.x * moveDistance);
            }

            if (movement.y !== 0) {
                this.moveVertical(movement.y * moveDistance);
            }

            if (movement.moving) {
                this.animation.walking = true;
                this.game.audio.playSound('move');
                this.lastMoveTime = currentTime;
            }
        } else if (!movement.moving) {
            this.animation.walking = false;
        }
    }

    moveHorizontal(distance) {
        this.movement.targetX = this.x + distance;
        this.movement.moving = true;
        this.direction = distance > 0 ? 'right' : 'left';
    }

    moveVertical(distance) {
        this.movement.targetY = this.y + distance;
        this.movement.moving = true;
    }

    moveUp(distance = 40) {
        this.movement.targetY = this.y - distance;
        this.movement.moving = true;
        this.animation.walking = true;
    }

    moveDown(distance = 40) {
        this.movement.targetY = this.y + distance;
        this.movement.moving = true;
        this.animation.walking = true;
    }

    moveLeft(distance = 40) {
        this.movement.targetX = this.x - distance;
        this.movement.moving = true;
        this.direction = 'left';
        this.animation.walking = true;
    }

    moveRight(distance = 40) {
        this.movement.targetX = this.x + distance;
        this.movement.moving = true;
        this.direction = 'right';
        this.animation.walking = true;
    }

    updateMovement(deltaTime) {
        if (!this.movement.moving) return;

        const moveSpeed = this.movement.moveSpeed * (deltaTime / 1000);
        let reachedTarget = true;

        const deltaX = this.movement.targetX - this.x;
        const deltaY = this.movement.targetY - this.y;

        if (Math.abs(deltaX) > 1) {
            this.x += Math.sign(deltaX) * Math.min(moveSpeed, Math.abs(deltaX));
            reachedTarget = false;
        } else {
            this.x = this.movement.targetX;
        }

        if (Math.abs(deltaY) > 1) {
            this.y += Math.sign(deltaY) * Math.min(moveSpeed, Math.abs(deltaY));
            reachedTarget = false;
        } else {
            this.y = this.movement.targetY;
        }

        if (reachedTarget) {
            this.movement.moving = false;
            this.animation.walking = false;
        }
    }

    updateAnimation(deltaTime) {
        if (this.animation.walking) {
            this.animation.frameTime += deltaTime;

            if (this.animation.frameTime >= this.animation.frameDuration) {
                this.animation.frame = (this.animation.frame + 1) % 4;
                this.animation.frameTime = 0;
            }
        } else {
            this.animation.frame = 0;
            this.animation.frameTime = 0;
        }
    }

    constrainToBounds() {
        this.x = Utils.clamp(this.x, this.bounds.minX, this.bounds.maxX);
        this.y = Utils.clamp(this.y, this.bounds.minY, this.bounds.maxY);

        this.movement.targetX = Utils.clamp(this.movement.targetX, this.bounds.minX, this.bounds.maxX);
        this.movement.targetY = Utils.clamp(this.movement.targetY, this.bounds.minY, this.bounds.maxY);
    }

    getCollisionBox() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    getCollisionCircle() {
        return {
            x: this.x,
            y: this.y,
            radius: this.size / 2
        };
    }

    reset(x, y) {
        this.x = x || this.startX;
        this.y = y || this.startY;
        this.movement.targetX = this.x;
        this.movement.targetY = this.y;
        this.movement.moving = false;
        this.direction = 'right';
        this.animation.walking = false;
        this.animation.frame = 0;
        this.animation.frameTime = 0;
        this.lastMoveTime = 0;
    }

    render(graphics) {
        graphics.save();

        const bobOffset = this.animation.walking ? Math.sin(Date.now() / 150) * 2 : 0;
        const size = this.size + (this.animation.walking ? 2 : 0);

        if (this.animation.walking && this.animation.frame % 2 === 1) {
            graphics.ctx.globalAlpha = 0.9;
        }

        this.renderChicken(graphics, this.x, this.y + bobOffset, size);

        if (this.game.gameState === 'playing' && this.movement.moving) {
            this.renderTrail(graphics);
        }

        graphics.restore();
    }

    renderChicken(graphics, x, y, size) {
        const headSize = size * 0.4;
        const bodyWidth = size * 0.8;
        const bodyHeight = size * 0.6;

        graphics.drawCircle(x, y + bodyHeight * 0.3, bodyWidth / 2, '#FFFFFF');

        const shadowOffset = 3;
        graphics.ctx.globalAlpha = 0.3;
        graphics.drawCircle(x + shadowOffset, y + bodyHeight * 0.3 + shadowOffset, bodyWidth / 2, '#000000');
        graphics.ctx.globalAlpha = 1;

        graphics.drawCircle(x + (this.direction === 'right' ? bodyWidth * 0.3 : -bodyWidth * 0.3), y, headSize, '#FFFFFF');

        graphics.drawCircle(x + (this.direction === 'right' ? bodyWidth * 0.3 : -bodyWidth * 0.3), y, headSize - 2, '#FFF8DC');

        const beakX = x + (this.direction === 'right' ? bodyWidth * 0.5 : -bodyWidth * 0.5);
        const beakY = y;
        const beakWidth = this.direction === 'right' ? 6 : -6;
        graphics.drawRect(beakX, beakY - 2, beakWidth, 4, '#FFA500');

        const eyeX = x + (this.direction === 'right' ? bodyWidth * 0.2 : -bodyWidth * 0.2);
        const eyeY = y - 3;
        graphics.drawCircle(eyeX, eyeY, 2, '#000');

        const leftLegX = x - 3;
        const rightLegX = x + 3;
        const legY = y + bodyHeight * 0.7;
        const legHeight = 8;

        if (this.animation.walking) {
            const legOffset = Math.sin(Date.now() / 100) * 2;
            graphics.drawRect(leftLegX, legY + legOffset, 3, legHeight, '#FFA500');
            graphics.drawRect(rightLegX, legY - legOffset, 3, legHeight, '#FFA500');
        } else {
            graphics.drawRect(leftLegX, legY, 3, legHeight, '#FFA500');
            graphics.drawRect(rightLegX, legY, 3, legHeight, '#FFA500');
        }

        if (this.animation.walking && Math.random() < 0.3) {
            this.renderFeathers(graphics, x, y);
        }
    }

    renderFeathers(graphics, x, y) {
        for (let i = 0; i < 3; i++) {
            const featherX = x + (Math.random() - 0.5) * 20;
            const featherY = y + (Math.random() - 0.5) * 20;
            const featherSize = Math.random() * 3 + 1;

            graphics.ctx.globalAlpha = 0.5;
            graphics.drawCircle(featherX, featherY, featherSize, '#FFFFFF');
            graphics.ctx.globalAlpha = 1;
        }
    }

    renderTrail(graphics) {
        const trailLength = 5;
        const trailSpacing = 8;

        for (let i = 1; i <= trailLength; i++) {
            const alpha = (trailLength - i) / trailLength * 0.3;
            const trailX = this.x - (this.direction === 'right' ? i * trailSpacing : -i * trailSpacing);
            const trailY = this.y;

            graphics.ctx.globalAlpha = alpha;
            graphics.drawCircle(trailX, trailY, this.size / 3, '#FFFFFF');
        }

        graphics.ctx.globalAlpha = 1;
    }

    isMoving() {
        return this.movement.moving || this.animation.walking;
    }

    stopMovement() {
        this.movement.moving = false;
        this.movement.targetX = this.x;
        this.movement.targetY = this.y;
        this.animation.walking = false;
    }
}