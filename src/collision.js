class Collision {
    constructor() {
        this.debugMode = false;
        this.lastCollisionTime = 0;
        this.collisionCooldown = 500;
    }

    checkPlayerVehicleCollisions(player, vehicles) {
        const currentTime = Date.now();

        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return false;
        }

        const playerCircle = player.getCollisionCircle();

        for (const vehicle of vehicles) {
            if (this.checkCircleRectCollision(playerCircle, vehicle.getCollisionBox())) {
                this.lastCollisionTime = currentTime;
                this.handleCollision(player, vehicle);
                return true;
            }
        }

        return false;
    }

    checkCircleRectCollision(circle, rect) {
        const closestX = Utils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = Utils.clamp(circle.y, rect.y, rect.y + rect.height);

        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        return distanceSquared < (circle.radius * circle.radius);
    }

    checkCircleCircleCollision(circle1, circle2) {
        const distance = Utils.distance(circle1.x, circle1.y, circle2.x, circle2.y);
        return distance < (circle1.radius + circle2.radius);
    }

    checkRectRectCollision(rect1, rect2) {
        return Utils.rectCollision(rect1, rect2);
    }

    handleCollision(player, vehicle) {
        if (window.game) {
            this.createCollisionEffect(player.x, player.y);

            if (vehicle.type === 'motorcycle') {
                this.createMotorcycleEffect(vehicle);
            }
        }
    }

    createCollisionEffect(x, y) {
        const particles = [];
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 6 + 2,
                color: this.getRandomFeatherColor()
            });
        }

        this.animateParticles(particles);
    }

    createMotorcycleEffect(vehicle) {
        if (Math.random() < 0.3) {
            vehicle.speed *= 0.8;
            vehicle.honkTime = 2000;
        }
    }

    getRandomFeatherColor() {
        const colors = ['#FFFFFF', '#FFF8DC', '#F5F5DC', '#FFFACD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animateParticles(particles) {
        const animate = () => {
            if (!window.game || !window.game.graphics) return;

            const graphics = window.game.graphics;
            graphics.save();

            particles.forEach((particle, index) => {
                particle.x += particle.vx * 0.016;
                particle.y += particle.vy * 0.016;
                particle.vy += 300 * 0.016;
                particle.life -= particle.decay;

                if (particle.life > 0) {
                    graphics.ctx.globalAlpha = particle.life;
                    graphics.drawCircle(particle.x, particle.y, particle.size * particle.life, particle.color);
                } else {
                    particles.splice(index, 1);
                }
            });

            graphics.restore();

            if (particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    checkPlayerBounds(player, gameWidth, gameHeight) {
        const bounds = {
            left: player.x < 0,
            right: player.x > gameWidth,
            top: player.y < 50,
            bottom: player.y > gameHeight - 50
        };

        return bounds;
    }

    getNearestVehicle(player, vehicles, maxDistance = 100) {
        let nearestVehicle = null;
        let nearestDistance = maxDistance;

        vehicles.forEach(vehicle => {
            const distance = this.getDistanceToVehicle(player, vehicle);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestVehicle = vehicle;
            }
        });

        return nearestVehicle;
    }

    getDistanceToVehicle(player, vehicle) {
        const playerCircle = player.getCollisionCircle();
        const vehicleRect = vehicle.getCollisionBox();

        const closestX = Utils.clamp(playerCircle.x, vehicleRect.x, vehicleRect.x + vehicleRect.width);
        const closestY = Utils.clamp(playerCircle.y, vehicleRect.y, vehicleRect.y + vehicleRect.height);

        return Utils.distance(playerCircle.x, playerCircle.y, closestX, closestY);
    }

    predictCollision(player, vehicle, timeAhead = 0.5) {
        const playerFuturePos = {
            x: player.x + player.movement.targetX - player.x,
            y: player.y + player.movement.targetY - player.y
        };

        const vehicleFuturePos = {
            x: vehicle.x + (vehicle.direction === 'right' ? vehicle.speed * timeAhead : -vehicle.speed * timeAhead),
            y: vehicle.y
        };

        const futurePlayerCircle = {
            x: playerFuturePos.x,
            y: playerFuturePos.y,
            radius: player.size / 2
        };

        const futureVehicleRect = {
            x: vehicleFuturePos.x,
            y: vehicleFuturePos.y,
            width: vehicle.width,
            height: vehicle.height
        };

        return this.checkCircleRectCollision(futurePlayerCircle, futureVehicleRect);
    }

    getCollisionWarning(player, vehicles, warningDistance = 80) {
        const warnings = [];

        vehicles.forEach(vehicle => {
            const distance = this.getDistanceToVehicle(player, vehicle);

            if (distance < warningDistance) {
                const severity = 1 - (distance / warningDistance);
                warnings.push({
                    vehicle: vehicle,
                    distance: distance,
                    severity: severity,
                    direction: this.getCollisionDirection(player, vehicle)
                });
            }
        });

        return warnings.sort((a, b) => a.distance - b.distance);
    }

    getCollisionDirection(player, vehicle) {
        const playerCircle = player.getCollisionCircle();
        const vehicleCenter = {
            x: vehicle.x + vehicle.width / 2,
            y: vehicle.y + vehicle.height / 2
        };

        const deltaX = vehicleCenter.x - playerCircle.x;
        const deltaY = vehicleCenter.y - playerCircle.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    renderCollisionDebug(graphics, player, vehicles) {
        if (!this.debugMode) return;

        graphics.save();

        const playerCircle = player.getCollisionCircle();
        graphics.ctx.strokeStyle = '#00FF00';
        graphics.ctx.lineWidth = 2;
        graphics.ctx.beginPath();
        graphics.ctx.arc(playerCircle.x, playerCircle.y, playerCircle.radius, 0, Math.PI * 2);
        graphics.ctx.stroke();

        vehicles.forEach(vehicle => {
            const rect = vehicle.getCollisionBox();
            graphics.ctx.strokeStyle = '#FF0000';
            graphics.ctx.lineWidth = 2;
            graphics.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        });

        const warnings = this.getCollisionWarning(player, vehicles);
        warnings.forEach(warning => {
            const vehicle = warning.vehicle;
            graphics.ctx.strokeStyle = `rgba(255, 255, 0, ${warning.severity})`;
            graphics.ctx.lineWidth = 3;
            graphics.ctx.strokeRect(
                vehicle.x - 5,
                vehicle.y - 5,
                vehicle.width + 10,
                vehicle.height + 10
            );
        });

        graphics.restore();
    }

    enableDebugMode() {
        this.debugMode = true;
    }

    disableDebugMode() {
        this.debugMode = false;
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
    }

    reset() {
        this.lastCollisionTime = 0;
    }

    checkSafeZone(player, safeZones) {
        const playerCircle = player.getCollisionCircle();

        return safeZones.some(zone => {
            return playerCircle.x >= zone.x &&
                   playerCircle.x <= zone.x + zone.width &&
                   playerCircle.y >= zone.y &&
                   playerCircle.y <= zone.y + zone.height;
        });
    }

    getCollisionForce(player, vehicle) {
        const playerCircle = player.getCollisionCircle();
        const vehicleCenter = {
            x: vehicle.x + vehicle.width / 2,
            y: vehicle.y + vehicle.height / 2
        };

        const deltaX = playerCircle.x - vehicleCenter.x;
        const deltaY = playerCircle.y - vehicleCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance === 0) return { x: 0, y: 0 };

        const force = Math.min(vehicle.speed / 50, 10);
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;

        return {
            x: normalizedX * force,
            y: normalizedY * force
        };
    }
}