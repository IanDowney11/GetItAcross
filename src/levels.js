class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevel = 1;
        this.currentTheme = null;

        this.levelThemes = {
            1: {
                name: 'Dirt Roads',
                type: 'dirt',
                backgroundColor: '#8B4513',
                roadColor: '#A0522D',
                grassColor: '#228B22',
                description: 'Country dirt roads with light traffic'
            },
            2: {
                name: 'City Streets',
                type: 'bitumen',
                backgroundColor: '#2F2F2F',
                roadColor: '#1C1C1C',
                grassColor: '#32CD32',
                description: 'Urban streets with moderate traffic'
            },
            3: {
                name: 'Golden Highway',
                type: 'gold',
                backgroundColor: '#FFD700',
                roadColor: '#FFA500',
                grassColor: '#ADFF2F',
                description: 'Luxurious golden roads with heavy traffic'
            },
            4: {
                name: 'Diamond Boulevard',
                type: 'diamond',
                backgroundColor: '#E6F3FF',
                roadColor: '#B8E0FF',
                grassColor: '#98FB98',
                description: 'Crystalline diamond streets with intense traffic'
            },
            5: {
                name: 'Obsidian Expressway',
                type: 'obsidian',
                backgroundColor: '#1a001a',
                roadColor: '#0d0d0d',
                grassColor: '#006400',
                description: 'Dark obsidian highways with extreme traffic'
            }
        };

        this.parallaxLayers = [];
        this.backgroundElements = [];
        this.particleSystem = null;

        this.setupParallax();
    }

    loadLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.currentTheme = this.levelThemes[levelNumber] || this.levelThemes[5];

        this.setupLevelEnvironment();
        this.setupParticleSystem();
        this.setupBackgroundElements();

        if (window.game && window.game.vehicleManager) {
            window.game.vehicleManager.setDifficulty(levelNumber, window.game.difficultyMultiplier);
        }
    }

    setupLevelEnvironment() {
        const theme = this.currentTheme;

        document.body.style.background = `linear-gradient(135deg, ${theme.backgroundColor}, ${this.adjustColor(theme.backgroundColor, -30)})`;

        this.setupAmbientEffects();
    }

    setupParticleSystem() {
        this.particleSystem = {
            particles: [],
            maxParticles: this.getMaxParticles(),
            spawnRate: this.getParticleSpawnRate(),
            lastSpawn: 0
        };
    }

    getMaxParticles() {
        const particleCounts = { 1: 20, 2: 15, 3: 25, 4: 30, 5: 10 };
        const baseCount = particleCounts[this.currentLevel] || 15;
        return Utils.isMobile() ? Math.floor(baseCount * 0.5) : baseCount;
    }

    getParticleSpawnRate() {
        const spawnRates = { 1: 300, 2: 500, 3: 200, 4: 150, 5: 800 };
        const baseRate = spawnRates[this.currentLevel] || 300;
        return Utils.isMobile() ? baseRate * 2 : baseRate;
    }

    setupAmbientEffects() {
        switch (this.currentLevel) {
            case 1:
                this.setupDirtEffects();
                break;
            case 2:
                this.setupCityEffects();
                break;
            case 3:
                this.setupGoldEffects();
                break;
            case 4:
                this.setupDiamondEffects();
                break;
            case 5:
                this.setupObsidianEffects();
                break;
        }
    }

    setupDirtEffects() {
        this.ambientParticleType = 'dust';
    }

    setupCityEffects() {
        this.ambientParticleType = 'smoke';
    }

    setupGoldEffects() {
        this.ambientParticleType = 'sparkle';
    }

    setupDiamondEffects() {
        this.ambientParticleType = 'crystal';
    }

    setupObsidianEffects() {
        this.ambientParticleType = 'shadow';
    }

    setupParallax() {
        this.parallaxLayers = [
            { speed: 0.1, elements: [] },
            { speed: 0.3, elements: [] },
            { speed: 0.5, elements: [] }
        ];
    }

    setupBackgroundElements() {
        this.backgroundElements = [];
        this.parallaxLayers.forEach(layer => layer.elements = []);

        switch (this.currentLevel) {
            case 1:
                this.setupDirtBackground();
                break;
            case 2:
                this.setupCityBackground();
                break;
            case 3:
                this.setupGoldBackground();
                break;
            case 4:
                this.setupDiamondBackground();
                break;
            case 5:
                this.setupObsidianBackground();
                break;
        }
    }

    setupDirtBackground() {
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'tree',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(50, 150),
                size: Utils.random(30, 60),
                color: '#228B22'
            });
        }

        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'house',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(this.game.gameHeight - 200, this.game.gameHeight - 100),
                size: Utils.random(40, 80),
                color: '#8B4513'
            });
        }
    }

    setupCityBackground() {
        for (let i = 0; i < 12; i++) {
            this.backgroundElements.push({
                type: 'building',
                x: i * 100,
                y: Utils.random(50, 200),
                width: Utils.random(60, 100),
                height: Utils.random(100, 300),
                color: Utils.random() > 0.5 ? '#696969' : '#A9A9A9'
            });
        }

        for (let i = 0; i < 6; i++) {
            this.backgroundElements.push({
                type: 'streetlight',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(300, 500),
                size: 15,
                color: '#FFD700'
            });
        }
    }

    setupGoldBackground() {
        for (let i = 0; i < 10; i++) {
            this.backgroundElements.push({
                type: 'statue',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(100, 250),
                size: Utils.random(40, 80),
                color: '#DAA520'
            });
        }

        for (let i = 0; i < 15; i++) {
            this.backgroundElements.push({
                type: 'pillar',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(this.game.gameHeight - 200, this.game.gameHeight - 100),
                size: Utils.random(20, 40),
                color: '#B8860B'
            });
        }
    }

    setupDiamondBackground() {
        for (let i = 0; i < 20; i++) {
            this.backgroundElements.push({
                type: 'crystal',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(50, this.game.gameHeight - 50),
                size: Utils.random(15, 35),
                color: '#E0E0E0',
                rotation: Utils.random(0, 360)
            });
        }
    }

    setupObsidianBackground() {
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'spire',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(50, 200),
                size: Utils.random(30, 70),
                color: '#2F2F2F'
            });
        }

        for (let i = 0; i < 12; i++) {
            this.backgroundElements.push({
                type: 'void',
                x: Utils.random(0, this.game.gameWidth),
                y: Utils.random(this.game.gameHeight - 200, this.game.gameHeight - 50),
                size: Utils.random(20, 50),
                color: '#000000'
            });
        }
    }

    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.updateBackgroundElements(deltaTime);
        this.spawnAmbientParticles(deltaTime);
    }

    updateParticles(deltaTime) {
        if (!this.particleSystem) return;

        this.particleSystem.particles.forEach((particle, index) => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= particle.decay * (deltaTime / 1000);

            if (particle.life <= 0 || particle.x < -50 || particle.x > this.game.gameWidth + 50) {
                this.particleSystem.particles.splice(index, 1);
            }
        });
    }

    updateBackgroundElements(deltaTime) {
        this.backgroundElements.forEach(element => {
            if (element.rotation !== undefined) {
                element.rotation += 30 * (deltaTime / 1000);
            }

            if (element.type === 'crystal') {
                element.y += Math.sin(Date.now() / 1000 + element.x / 100) * 0.5;
            }
        });
    }

    spawnAmbientParticles(deltaTime) {
        if (!this.particleSystem) return;

        const currentTime = Date.now();
        if (currentTime - this.particleSystem.lastSpawn < this.particleSystem.spawnRate) return;

        if (this.particleSystem.particles.length < this.particleSystem.maxParticles) {
            this.createAmbientParticle();
            this.particleSystem.lastSpawn = currentTime;
        }
    }

    createAmbientParticle() {
        const particle = {
            x: this.game.gameWidth + 50,
            y: Utils.random(50, this.game.gameHeight - 50),
            vx: Utils.random(-30, -10),
            vy: Utils.random(-5, 5),
            life: 1.0,
            decay: Utils.random(0.1, 0.3),
            size: Utils.random(2, 8),
            color: this.getParticleColor(),
            type: this.ambientParticleType
        };

        this.particleSystem.particles.push(particle);
    }

    getParticleColor() {
        const colors = {
            dust: ['#D2B48C', '#DEB887', '#F4A460'],
            smoke: ['#696969', '#A9A9A9', '#D3D3D3'],
            sparkle: ['#FFD700', '#FFA500', '#FFFF00'],
            crystal: ['#E0E0E0', '#C0C0C0', '#B0E0E6'],
            shadow: ['#2F2F2F', '#1C1C1C', '#4B0082']
        };

        const typeColors = colors[this.ambientParticleType] || colors.dust;
        return typeColors[Math.floor(Math.random() * typeColors.length)];
    }

    render(graphics) {
        this.renderBackground(graphics);
        this.renderBackgroundElements(graphics);
        this.renderRoad(graphics);
        this.renderParticles(graphics);
        this.renderForegroundElements(graphics);
    }

    renderBackground(graphics) {
        const theme = this.currentTheme;
        if (!theme) return;

        graphics.drawGradientRect(0, 0, this.game.gameWidth, this.game.gameHeight, [
            { position: 0, color: theme.backgroundColor },
            { position: 0.7, color: this.adjustColor(theme.backgroundColor, -20) },
            { position: 1, color: this.adjustColor(theme.backgroundColor, -40) }
        ]);

        graphics.drawRect(0, 0, this.game.gameWidth, 80, theme.grassColor);
        graphics.drawRect(0, this.game.gameHeight - 80, this.game.gameWidth, 80, theme.grassColor);
    }

    renderBackgroundElements(graphics) {
        this.backgroundElements.forEach(element => {
            this.renderBackgroundElement(graphics, element);
        });
    }

    renderBackgroundElement(graphics, element) {
        graphics.save();

        switch (element.type) {
            case 'tree':
                this.renderTree(graphics, element);
                break;
            case 'house':
                this.renderHouse(graphics, element);
                break;
            case 'building':
                this.renderBuilding(graphics, element);
                break;
            case 'streetlight':
                this.renderStreetlight(graphics, element);
                break;
            case 'statue':
                this.renderStatue(graphics, element);
                break;
            case 'pillar':
                this.renderPillar(graphics, element);
                break;
            case 'crystal':
                this.renderCrystal(graphics, element);
                break;
            case 'spire':
                this.renderSpire(graphics, element);
                break;
            case 'void':
                this.renderVoid(graphics, element);
                break;
        }

        graphics.restore();
    }

    renderTree(graphics, tree) {
        graphics.drawRect(tree.x, tree.y + tree.size * 0.7, tree.size * 0.2, tree.size * 0.3, '#8B4513');
        graphics.drawCircle(tree.x + tree.size * 0.1, tree.y + tree.size * 0.3, tree.size * 0.4, tree.color);
    }

    renderHouse(graphics, house) {
        graphics.drawRect(house.x, house.y, house.size, house.size * 0.8, house.color);
        graphics.drawRect(house.x, house.y - house.size * 0.3, house.size, house.size * 0.3, '#8B0000');
        graphics.drawRect(house.x + house.size * 0.3, house.y + house.size * 0.2, house.size * 0.4, house.size * 0.6, '#4B0082');
    }

    renderBuilding(graphics, building) {
        graphics.drawRect(building.x, building.y, building.width, building.height, building.color);

        const windowSize = 8;
        const windowSpacing = 15;
        const windowsPerRow = Math.floor(building.width / windowSpacing);
        const windowRows = Math.floor(building.height / windowSpacing);

        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                const windowX = building.x + col * windowSpacing + 5;
                const windowY = building.y + row * windowSpacing + 5;
                const isLit = Math.random() > 0.6;
                graphics.drawRect(windowX, windowY, windowSize, windowSize, isLit ? '#FFFF00' : '#000080');
            }
        }
    }

    renderStreetlight(graphics, light) {
        graphics.drawRect(light.x, light.y, 3, light.size * 2, '#808080');
        graphics.drawCircle(light.x + 1.5, light.y - 5, 8, light.color);
        graphics.ctx.globalAlpha = 0.3;
        graphics.drawCircle(light.x + 1.5, light.y - 5, 20, light.color);
        graphics.ctx.globalAlpha = 1;
    }

    renderStatue(graphics, statue) {
        graphics.drawRect(statue.x, statue.y + statue.size * 0.5, statue.size, statue.size * 0.5, statue.color);
        graphics.drawCircle(statue.x + statue.size * 0.5, statue.y + statue.size * 0.3, statue.size * 0.2, statue.color);
    }

    renderPillar(graphics, pillar) {
        graphics.drawRect(pillar.x, pillar.y, pillar.size, pillar.size * 2, pillar.color);
        graphics.drawRect(pillar.x - 5, pillar.y, pillar.size + 10, pillar.size * 0.2, this.adjustColor(pillar.color, 20));
        graphics.drawRect(pillar.x - 5, pillar.y + pillar.size * 1.8, pillar.size + 10, pillar.size * 0.2, this.adjustColor(pillar.color, 20));
    }

    renderCrystal(graphics, crystal) {
        graphics.save();
        graphics.ctx.translate(crystal.x, crystal.y);
        graphics.ctx.rotate(Utils.degToRad(crystal.rotation));
        graphics.drawStar(0, 0, crystal.size, crystal.color);
        graphics.restore();
    }

    renderSpire(graphics, spire) {
        const points = [
            [spire.x + spire.size * 0.5, spire.y],
            [spire.x, spire.y + spire.size],
            [spire.x + spire.size, spire.y + spire.size]
        ];

        graphics.ctx.beginPath();
        graphics.ctx.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach(point => graphics.ctx.lineTo(point[0], point[1]));
        graphics.ctx.closePath();
        graphics.ctx.fillStyle = spire.color;
        graphics.ctx.fill();
    }

    renderVoid(graphics, voidElement) {
        graphics.ctx.globalAlpha = 0.7;
        graphics.drawCircle(voidElement.x, voidElement.y, voidElement.size, voidElement.color);
        graphics.ctx.globalAlpha = 0.3;
        graphics.drawCircle(voidElement.x, voidElement.y, voidElement.size * 1.5, '#4B0082');
        graphics.ctx.globalAlpha = 1;
    }

    renderRoad(graphics) {
        const roadStartY = 80;
        const roadEndY = this.game.gameHeight - 80;
        const roadHeight = roadEndY - roadStartY;

        graphics.drawRoadTexture(0, roadStartY, this.game.gameWidth, roadHeight, this.currentTheme.type);
    }

    renderParticles(graphics) {
        if (!this.particleSystem) return;

        this.particleSystem.particles.forEach(particle => {
            graphics.ctx.globalAlpha = particle.life;
            graphics.drawCircle(particle.x, particle.y, particle.size, particle.color);
        });

        graphics.ctx.globalAlpha = 1;
    }

    renderForegroundElements(graphics) {
        this.renderLevelInfo(graphics);
    }

    renderLevelInfo(graphics) {
        if (this.game.gameState !== 'playing') return;

        const theme = this.currentTheme;
        const text = `${theme.name} - ${theme.description}`;

        graphics.drawText(text, this.game.gameWidth / 2, 30, {
            font: '16px Arial',
            color: '#FFFFFF',
            align: 'center',
            stroke: true,
            strokeColor: '#000000',
            strokeWidth: 2
        });
    }

    adjustColor(color, adjustment) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + adjustment));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + adjustment));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + adjustment));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getLevelName(levelNumber) {
        return this.levelThemes[levelNumber]?.name || 'Unknown Level';
    }

    getLevelDescription(levelNumber) {
        return this.levelThemes[levelNumber]?.description || 'Unknown description';
    }

    reset() {
        this.currentLevel = 1;
        this.currentTheme = this.levelThemes[1];
        if (this.particleSystem) {
            this.particleSystem.particles = [];
        }
    }
}