class Vehicle {
    constructor(x, y, type, color, direction, speed, lane) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.direction = direction;
        this.speed = speed;
        this.lane = lane;

        this.setDimensions();
        this.active = true;
        this.honkTime = 0;
        this.lastHonkTime = 0;
    }

    setDimensions() {
        const dimensions = {
            car: { width: 60, height: 30 },
            truck: { width: 80, height: 35 },
            bus: { width: 100, height: 40 },
            motorcycle: { width: 40, height: 20 }
        };

        const dim = dimensions[this.type] || dimensions.car;
        this.width = dim.width;
        this.height = dim.height;
    }

    update(deltaTime) {
        if (!this.active) return;

        const moveDistance = this.speed * (deltaTime / 1000);

        if (this.direction === 'right') {
            this.x += moveDistance;
        } else {
            this.x -= moveDistance;
        }

        this.updateHonk(deltaTime);
    }

    updateHonk(deltaTime) {
        const currentTime = Date.now();

        if (this.honkTime > 0) {
            this.honkTime -= deltaTime;
        }

        if (Math.random() < 0.001 && currentTime - this.lastHonkTime > 3000) {
            this.honkTime = 1000;
            this.lastHonkTime = currentTime;

            if (window.game && window.game.audio) {
                window.game.audio.playSound('horn');
            }
        }
    }

    render(graphics) {
        if (!this.active) return;

        graphics.save();

        if (this.honkTime > 0) {
            graphics.ctx.shadowColor = this.color;
            graphics.ctx.shadowBlur = 10;
        }

        graphics.drawVehicle(this.x, this.y, this.width, this.height, this.type, this.color);

        if (this.honkTime > 0) {
            this.renderHonkEffect(graphics);
        }

        graphics.restore();
    }

    renderHonkEffect(graphics) {
        const alpha = this.honkTime / 1000;
        graphics.ctx.globalAlpha = alpha * 0.5;

        const effectX = this.direction === 'right' ? this.x + this.width + 10 : this.x - 30;
        const effectY = this.y - 10;

        graphics.drawText('♪', effectX, effectY, {
            font: '20px Arial',
            color: '#FFD700',
            align: 'center'
        });

        graphics.ctx.globalAlpha = 1;
    }

    getCollisionBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getCollisionCircle() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            radius: Math.min(this.width, this.height) / 2
        };
    }

    isOffScreen(gameWidth) {
        if (this.direction === 'right') {
            return this.x > gameWidth + this.width;
        } else {
            return this.x < -this.width;
        }
    }

    distanceToPlayer(player) {
        const vehicleCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };

        return Utils.distance(vehicleCenter.x, vehicleCenter.y, player.x, player.y);
    }
}

class VehicleManager {
    constructor(game) {
        this.game = game;
        this.vehicles = [];

        this.lanes = [];
        this.setupLanes();

        this.spawnTimer = 0;
        this.baseSpawnRate = 2000;
        this.minSpawnRate = 500;

        this.vehicleTypes = ['car', 'truck', 'bus', 'motorcycle'];
        this.vehicleColors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#800080',
            '#FFC0CB', '#A52A2A', '#808080', '#000000'
        ];

        this.difficultySettings = {
            1: { spawnRate: 2500, speedMultiplier: 0.8, density: 0.3 },
            2: { spawnRate: 2000, speedMultiplier: 1.0, density: 0.5 },
            3: { spawnRate: 1500, speedMultiplier: 1.2, density: 0.7 },
            4: { spawnRate: 1000, speedMultiplier: 1.4, density: 0.8 },
            5: { spawnRate: 800, speedMultiplier: 1.6, density: 0.9 }
        };

        if (Utils.isMobile()) {
            Object.keys(this.difficultySettings).forEach(level => {
                this.difficultySettings[level].density *= 0.7;
                this.difficultySettings[level].spawnRate *= 1.3;
            });
        }
    }

    setupLanes() {
        const laneHeight = 80;
        const roadStartY = 100;
        const roadEndY = this.game.gameHeight - 100;
        const laneCount = Math.floor((roadEndY - roadStartY) / laneHeight);

        this.lanes = [];
        for (let i = 0; i < laneCount; i++) {
            const y = roadStartY + i * laneHeight + laneHeight / 2;
            const direction = i % 2 === 0 ? 'right' : 'left';

            this.lanes.push({
                y: y,
                direction: direction,
                speedMultiplier: Utils.random(0.8, 1.4),
                lastSpawn: 0,
                spawnCooldown: Utils.random(1000, 3000)
            });
        }
    }

    update(deltaTime) {
        this.updateVehicles(deltaTime);
        this.spawnVehicles(deltaTime);
        this.removeOffscreenVehicles();
    }

    updateVehicles(deltaTime) {
        this.vehicles.forEach(vehicle => {
            vehicle.update(deltaTime);
        });
    }

    spawnVehicles(deltaTime) {
        const currentTime = Date.now();
        const level = this.game.currentLevel;
        const difficulty = this.difficultySettings[level] || this.difficultySettings[5];
        const difficultyMultiplier = this.game.difficultyMultiplier;

        const adjustedSpawnRate = difficulty.spawnRate / difficultyMultiplier;
        const spawnChance = (deltaTime / adjustedSpawnRate) * difficulty.density;

        this.lanes.forEach((lane, index) => {
            if (currentTime - lane.lastSpawn < lane.spawnCooldown) return;

            if (Math.random() < spawnChance) {
                this.spawnVehicleInLane(lane, index);
                lane.lastSpawn = currentTime;
                lane.spawnCooldown = Utils.random(500, 2000) / difficultyMultiplier;
            }
        });
    }

    spawnVehicleInLane(lane, laneIndex) {
        if (this.isLaneCongested(lane)) return;

        const vehicleType = this.getRandomVehicleType();
        const color = this.getRandomColor();
        const baseSpeed = this.getBaseSpeed(vehicleType);

        const level = this.game.currentLevel;
        const difficulty = this.difficultySettings[level] || this.difficultySettings[5];
        const difficultyMultiplier = this.game.difficultyMultiplier;

        const speed = baseSpeed * difficulty.speedMultiplier * difficultyMultiplier * lane.speedMultiplier;

        let startX;
        if (lane.direction === 'right') {
            startX = -100;
        } else {
            startX = this.game.gameWidth + 100;
        }

        const vehicle = new Vehicle(
            startX,
            lane.y - 20,
            vehicleType,
            color,
            lane.direction,
            speed,
            laneIndex
        );

        this.vehicles.push(vehicle);
    }

    isLaneCongested(lane) {
        const vehiclesInLane = this.vehicles.filter(vehicle =>
            Math.abs(vehicle.y - lane.y) < 40
        );

        const minDistance = 120;

        return vehiclesInLane.some(vehicle => {
            if (lane.direction === 'right') {
                return vehicle.x > -50 && vehicle.x < minDistance;
            } else {
                return vehicle.x < this.game.gameWidth + 50 && vehicle.x > this.game.gameWidth - minDistance;
            }
        });
    }

    getRandomVehicleType() {
        const weights = {
            car: 0.4,
            motorcycle: 0.3,
            truck: 0.2,
            bus: 0.1
        };

        const rand = Math.random();
        let accumulator = 0;

        for (const [type, weight] of Object.entries(weights)) {
            accumulator += weight;
            if (rand <= accumulator) {
                return type;
            }
        }

        return 'car';
    }

    getRandomColor() {
        return this.vehicleColors[Math.floor(Math.random() * this.vehicleColors.length)];
    }

    getBaseSpeed(type) {
        const speeds = {
            motorcycle: 200,
            car: 150,
            truck: 100,
            bus: 80
        };

        return speeds[type] || speeds.car;
    }

    removeOffscreenVehicles() {
        this.vehicles = this.vehicles.filter(vehicle =>
            !vehicle.isOffScreen(this.game.gameWidth)
        );
    }

    render(graphics) {
        this.vehicles.forEach(vehicle => {
            vehicle.render(graphics);
        });

        if (this.game.gameState === 'playing') {
            this.renderLaneMarkers(graphics);
        }
    }

    renderLaneMarkers(graphics) {
        const dashLength = 20;
        const dashSpacing = 40;
        const dashCount = Math.ceil(this.game.gameWidth / (dashLength + dashSpacing));

        this.lanes.forEach(lane => {
            for (let i = 0; i < dashCount; i++) {
                const x = i * (dashLength + dashSpacing);
                const y = lane.y + 35;

                graphics.ctx.globalAlpha = 0.3;
                graphics.drawRect(x, y, dashLength, 2, '#FFFFFF');
                graphics.ctx.globalAlpha = 1;
            }
        });
    }

    getVehiclesNearPlayer(player, radius = 150) {
        return this.vehicles.filter(vehicle =>
            vehicle.distanceToPlayer(player) <= radius
        );
    }

    getVehicleCount() {
        return this.vehicles.length;
    }

    clearAllVehicles() {
        this.vehicles = [];
    }

    reset() {
        this.clearAllVehicles();
        this.spawnTimer = 0;

        this.lanes.forEach(lane => {
            lane.lastSpawn = 0;
            lane.spawnCooldown = Utils.random(1000, 3000);
        });
    }

    setDifficulty(level, multiplier = 1) {
        this.game.currentLevel = level;
        this.game.difficultyMultiplier = multiplier;
    }

    getClosestVehicle(player) {
        if (this.vehicles.length === 0) return null;

        let closestVehicle = null;
        let closestDistance = Infinity;

        this.vehicles.forEach(vehicle => {
            const distance = vehicle.distanceToPlayer(player);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestVehicle = vehicle;
            }
        });

        return closestVehicle;
    }

    predictCollision(player, timeAhead = 1) {
        const playerFutureX = player.x + (player.direction === 'right' ? player.speed * timeAhead : -player.speed * timeAhead);
        const playerFutureY = player.y;

        return this.vehicles.some(vehicle => {
            const vehicleFutureX = vehicle.x + (vehicle.direction === 'right' ? vehicle.speed * timeAhead : -vehicle.speed * timeAhead);

            const futureDistance = Utils.distance(
                playerFutureX, playerFutureY,
                vehicleFutureX + vehicle.width / 2, vehicle.y + vehicle.height / 2
            );

            return futureDistance < 50;
        });
    }
}