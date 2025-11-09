class Graphics {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setTransform(scale = 1, offsetX = 0, offsetY = 0) {
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    }

    resetTransform() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    drawRect(x, y, width, height, color = '#000', fill = true) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;

        if (fill) {
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    drawCircle(x, y, radius, color = '#000', fill = true) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;

        if (fill) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    drawLine(x1, y1, x2, y2, color = '#000', width = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    drawText(text, x, y, options = {}) {
        const {
            font = '16px Arial',
            color = '#000',
            align = 'left',
            baseline = 'top',
            maxWidth = null,
            stroke = false,
            strokeColor = '#fff',
            strokeWidth = 2
        } = options;

        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (stroke) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            if (maxWidth) {
                this.ctx.strokeText(text, x, y, maxWidth);
            } else {
                this.ctx.strokeText(text, x, y);
            }
        }

        if (maxWidth) {
            this.ctx.fillText(text, x, y, maxWidth);
        } else {
            this.ctx.fillText(text, x, y);
        }
    }

    drawGradientRect(x, y, width, height, colorStops) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.position, stop.color);
        });

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    drawPattern(x, y, width, height, pattern) {
        this.ctx.fillStyle = pattern;
        this.ctx.fillRect(x, y, width, height);
    }

    drawRoadTexture(x, y, width, height, type = 'dirt') {
        const patterns = {
            dirt: () => this.drawDirtTexture(x, y, width, height),
            bitumen: () => this.drawBitumenTexture(x, y, width, height),
            gold: () => this.drawGoldTexture(x, y, width, height),
            diamond: () => this.drawDiamondTexture(x, y, width, height),
            obsidian: () => this.drawObsidianTexture(x, y, width, height)
        };

        if (patterns[type]) {
            patterns[type]();
        } else {
            patterns.dirt();
        }
    }

    drawDirtTexture(x, y, width, height) {
        this.drawGradientRect(x, y, width, height, [
            { position: 0, color: '#8B4513' },
            { position: 0.5, color: '#A0522D' },
            { position: 1, color: '#654321' }
        ]);

        for (let i = 0; i < 20; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 3 + 1;
            this.drawCircle(px, py, size, '#8B4513');
        }
    }

    drawBitumenTexture(x, y, width, height) {
        this.drawGradientRect(x, y, width, height, [
            { position: 0, color: '#2F2F2F' },
            { position: 0.5, color: '#1C1C1C' },
            { position: 1, color: '#0F0F0F' }
        ]);

        const laneWidth = width / 3;
        for (let i = 1; i < 3; i++) {
            const laneX = x + i * laneWidth;
            this.drawLine(laneX, y, laneX, y + height, '#FFFF00', 2);
        }
    }

    drawGoldTexture(x, y, width, height) {
        this.drawGradientRect(x, y, width, height, [
            { position: 0, color: '#FFD700' },
            { position: 0.5, color: '#FFA500' },
            { position: 1, color: '#FF8C00' }
        ]);

        for (let i = 0; i < 15; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 4 + 2;
            this.drawCircle(px, py, size, '#FFFF00', false);
        }
    }

    drawDiamondTexture(x, y, width, height) {
        this.drawGradientRect(x, y, width, height, [
            { position: 0, color: '#E6F3FF' },
            { position: 0.5, color: '#B8E0FF' },
            { position: 1, color: '#87CEEB' }
        ]);

        for (let i = 0; i < 10; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 6 + 3;
            this.drawStar(px, py, size, '#FFFFFF');
        }
    }

    drawObsidianTexture(x, y, width, height) {
        // Rainbow road effect with animated stripes
        const numStripes = 7;
        const stripeHeight = height / numStripes;
        const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

        for (let i = 0; i < numStripes; i++) {
            const stripeY = y + i * stripeHeight;
            const color = rainbowColors[i % rainbowColors.length];

            // Draw gradient stripe
            this.drawGradientRect(x, stripeY, width, stripeHeight, [
                { position: 0, color: this.adjustBrightness(color, -30) },
                { position: 0.5, color: color },
                { position: 1, color: this.adjustBrightness(color, -30) }
            ]);
        }

        // Add sparkle effects
        for (let i = 0; i < 30; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 3 + 1;
            this.drawCircle(px, py, size, '#FFFFFF');
        }

        // Add shimmer effect
        this.ctx.globalAlpha = 0.3;
        for (let i = 0; i < 15; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 5 + 2;
            this.drawStar(px, py, size, '#FFFFFF');
        }
        this.ctx.globalAlpha = 1;
    }

    adjustBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    drawStar(x, y, radius, color) {
        const spikes = 4;
        const outerRadius = radius;
        const innerRadius = radius * 0.5;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);

        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const ptX = x + Math.cos(angle - Math.PI / 2) * r;
            const ptY = y + Math.sin(angle - Math.PI / 2) * r;
            this.ctx.lineTo(ptX, ptY);
        }

        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawChicken(x, y, size = 20, direction = 'right', skin = null) {
        const headSize = size * 0.4;
        const bodyWidth = size * 0.8;
        const bodyHeight = size * 0.6;

        // Default colors (classic white chicken)
        const colors = skin && skin.colors ? skin.colors : {
            body: '#FFFFFF',
            head: '#FFFFFF',
            beak: '#FFA500',
            eye: '#000000',
            feet: '#FFA500',
            comb: '#FF0000'
        };

        // Body
        this.drawCircle(x, y + bodyHeight * 0.3, bodyWidth / 2, colors.body);

        // Head
        this.drawCircle(x + (direction === 'right' ? bodyWidth * 0.3 : -bodyWidth * 0.3), y, headSize, colors.head);

        // Comb (on top of head)
        const combX = x + (direction === 'right' ? bodyWidth * 0.3 : -bodyWidth * 0.3);
        const combY = y - headSize;
        this.ctx.save();
        this.ctx.fillStyle = colors.comb;
        this.ctx.beginPath();
        this.ctx.arc(combX - 2, combY, 3, 0, Math.PI * 2);
        this.ctx.arc(combX, combY - 1, 2.5, 0, Math.PI * 2);
        this.ctx.arc(combX + 2, combY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Beak
        const beakX = x + (direction === 'right' ? bodyWidth * 0.5 : -bodyWidth * 0.5);
        const beakY = y;
        this.drawRect(beakX, beakY - 2, direction === 'right' ? 6 : -6, 4, colors.beak);

        // Eye
        const eyeX = x + (direction === 'right' ? bodyWidth * 0.2 : -bodyWidth * 0.2);
        const eyeY = y - 3;
        this.drawCircle(eyeX, eyeY, 2, colors.eye);

        // Feet
        this.drawRect(x - 3, y + bodyHeight * 0.7, 6, 8, colors.feet);
        this.drawRect(x - 8, y + bodyHeight * 0.7, 6, 8, colors.feet);
    }

    drawVehicle(x, y, width, height, type = 'car', color = '#FF0000') {
        const vehicles = {
            car: () => this.drawCar(x, y, width, height, color),
            truck: () => this.drawTruck(x, y, width, height, color),
            bus: () => this.drawBus(x, y, width, height, color),
            motorcycle: () => this.drawMotorcycle(x, y, width, height, color)
        };

        if (vehicles[type]) {
            vehicles[type]();
        } else {
            vehicles.car();
        }
    }

    drawCar(x, y, width, height, color) {
        this.drawRect(x, y, width, height, color);
        this.drawRect(x + width * 0.1, y - height * 0.2, width * 0.8, height * 0.6, '#87CEEB');
        this.drawCircle(x + width * 0.2, y + height, height * 0.3, '#000');
        this.drawCircle(x + width * 0.8, y + height, height * 0.3, '#000');
    }

    drawTruck(x, y, width, height, color) {
        this.drawRect(x, y, width * 0.7, height, color);
        this.drawRect(x + width * 0.7, y - height * 0.3, width * 0.3, height * 1.3, '#666');
        this.drawRect(x + width * 0.75, y - height * 0.1, width * 0.2, height * 0.5, '#87CEEB');
        this.drawCircle(x + width * 0.15, y + height, height * 0.25, '#000');
        this.drawCircle(x + width * 0.55, y + height, height * 0.25, '#000');
        this.drawCircle(x + width * 0.85, y + height, height * 0.25, '#000');
    }

    drawBus(x, y, width, height, color) {
        this.drawRect(x, y, width, height, color);
        for (let i = 0; i < 4; i++) {
            const windowX = x + width * 0.1 + i * width * 0.2;
            this.drawRect(windowX, y + height * 0.1, width * 0.15, height * 0.4, '#87CEEB');
        }
        this.drawCircle(x + width * 0.2, y + height, height * 0.3, '#000');
        this.drawCircle(x + width * 0.8, y + height, height * 0.3, '#000');
    }

    drawMotorcycle(x, y, width, height, color) {
        this.drawRect(x + width * 0.3, y, width * 0.4, height * 0.6, color);
        this.drawCircle(x + width * 0.2, y + height * 0.8, height * 0.35, '#000');
        this.drawCircle(x + width * 0.8, y + height * 0.8, height * 0.35, '#000');
        this.drawLine(x + width * 0.5, y, x + width * 0.7, y + height * 0.5, '#666', 3);
    }

    save() {
        this.ctx.save();
    }

    restore() {
        this.ctx.restore();
    }
}