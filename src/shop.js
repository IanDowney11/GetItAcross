/**
 * Shop System for Chicken Skins
 * Manages in-game currency, skin purchases, and skin selection
 */

class Shop {
    constructor() {
        // Player's currency
        this.points = 0;

        // Available skins with their properties
        this.skins = {
            default: {
                id: 'default',
                name: 'Classic Chicken',
                cost: 0,
                purchased: true,
                colors: {
                    body: '#FFFFFF',
                    head: '#FFFFFF',
                    beak: '#FFA500',
                    eye: '#000000',
                    feet: '#FFA500',
                    comb: '#FF0000'
                },
                description: 'The original chicken'
            },
            golden: {
                id: 'golden',
                name: 'Golden Chicken',
                cost: 50,
                purchased: false,
                speedMultiplier: 10.0,
                colors: {
                    body: '#FFD700',
                    head: '#FFD700',
                    beak: '#FFA500',
                    eye: '#000000',
                    feet: '#DAA520',
                    comb: '#FF4500'
                },
                description: 'Shiny, valuable, and 1000% faster!'
            },
            rainbow: {
                id: 'rainbow',
                name: 'Rainbow Chicken',
                cost: 1000,
                purchased: false,
                colors: {
                    body: '#FF69B4',
                    head: '#87CEEB',
                    beak: '#FFD700',
                    eye: '#4B0082',
                    feet: '#32CD32',
                    comb: '#FF1493'
                },
                description: 'All the colors!'
            },
            shadow: {
                id: 'shadow',
                name: 'Shadow Chicken',
                cost: 750,
                purchased: false,
                colors: {
                    body: '#2F2F2F',
                    head: '#1C1C1C',
                    beak: '#696969',
                    eye: '#FF0000',
                    feet: '#000000',
                    comb: '#4B0082'
                },
                description: 'Dark and mysterious'
            },
            robot: {
                id: 'robot',
                name: 'Robot Chicken',
                cost: 1500,
                purchased: false,
                colors: {
                    body: '#C0C0C0',
                    head: '#B0C4DE',
                    beak: '#708090',
                    eye: '#00FFFF',
                    feet: '#778899',
                    comb: '#4169E1'
                },
                description: 'Beep boop chicken'
            },
            fire: {
                id: 'fire',
                name: 'Fire Chicken',
                cost: 2000,
                purchased: false,
                colors: {
                    body: '#FF4500',
                    head: '#FF6347',
                    beak: '#FFD700',
                    eye: '#FFFF00',
                    feet: '#8B0000',
                    comb: '#FF0000'
                },
                description: 'Hot hot hot!'
            },
            ice: {
                id: 'ice',
                name: 'Ice Chicken',
                cost: 2000,
                purchased: false,
                colors: {
                    body: '#E0FFFF',
                    head: '#B0E0E6',
                    beak: '#87CEEB',
                    eye: '#4682B4',
                    feet: '#ADD8E6',
                    comb: '#00CED1'
                },
                description: 'Cool as ice'
            },
            zombie: {
                id: 'zombie',
                name: 'Zombie Chicken',
                cost: 1200,
                purchased: false,
                colors: {
                    body: '#9ACD32',
                    head: '#8FBC8F',
                    beak: '#6B8E23',
                    eye: '#FF0000',
                    feet: '#556B2F',
                    comb: '#8B0000'
                },
                description: 'Undead poultry'
            }
        };

        // Currently equipped skin
        this.equippedSkin = 'default';

        // UI Elements
        this.elements = {
            modal: null,
            pointsDisplay: null,
            skinsContainer: null,
            closeBtn: null
        };

        // Load saved data
        this.loadProgress();

        // Initialize UI elements after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        this.elements.modal = document.getElementById('shopModal');
        this.elements.pointsDisplay = document.getElementById('shopPoints');
        this.elements.skinsContainer = document.getElementById('skinsContainer');
        this.elements.closeBtn = document.getElementById('shopCloseBtn');

        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.hide());
        }

        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.hide();
                }
            });
        }

        // Update HUD points display
        this.updatePointsDisplay();
    }

    /**
     * Award points to the player
     */
    addPoints(amount) {
        this.points += amount;
        this.saveProgress();
        this.updatePointsDisplay();
    }

    /**
     * Get current points
     */
    getPoints() {
        return this.points;
    }

    /**
     * Show the shop modal
     */
    show() {
        if (!this.elements.modal) {
            this.initializeUI();
        }

        this.renderSkins();
        this.elements.modal.classList.remove('hidden');
    }

    /**
     * Hide the shop modal
     */
    hide() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
        }
    }

    /**
     * Render all available skins in the shop
     */
    renderSkins() {
        if (!this.elements.skinsContainer) return;

        const skinsHtml = Object.values(this.skins).map(skin => {
            const isPurchased = skin.purchased;
            const isEquipped = this.equippedSkin === skin.id;
            const canAfford = this.points >= skin.cost;

            let buttonHtml = '';
            let statusClass = '';

            if (isEquipped) {
                buttonHtml = '<button class="skin-btn equipped" disabled>Equipped</button>';
                statusClass = 'equipped';
            } else if (isPurchased) {
                buttonHtml = `<button class="skin-btn equip" onclick="window.shop.equipSkin('${skin.id}')">Equip</button>`;
                statusClass = 'purchased';
            } else if (canAfford) {
                buttonHtml = `<button class="skin-btn buy" onclick="window.shop.buySkin('${skin.id}')">Buy - ${skin.cost} points</button>`;
                statusClass = 'affordable';
            } else {
                buttonHtml = `<button class="skin-btn buy locked" disabled>Buy - ${skin.cost} points</button>`;
                statusClass = 'locked';
            }

            return `
                <div class="skin-card ${statusClass}">
                    <div class="skin-preview">
                        ${this.renderSkinPreview(skin)}
                    </div>
                    <div class="skin-info">
                        <h3 class="skin-name">${skin.name}</h3>
                        <p class="skin-description">${skin.description}</p>
                        ${isEquipped ? '<span class="equipped-badge">✓ Equipped</span>' : ''}
                        ${isPurchased && !isEquipped ? '<span class="owned-badge">✓ Owned</span>' : ''}
                        ${!isPurchased ? `<span class="cost-badge">${skin.cost} points</span>` : ''}
                    </div>
                    <div class="skin-actions">
                        ${buttonHtml}
                    </div>
                </div>
            `;
        }).join('');

        this.elements.skinsContainer.innerHTML = skinsHtml;
        this.updatePointsDisplay();
    }

    /**
     * Render a mini preview of the skin
     */
    renderSkinPreview(skin) {
        return `
            <svg width="80" height="80" viewBox="0 0 40 40" style="background: transparent;">
                <!-- Body -->
                <circle cx="20" cy="25" r="8" fill="${skin.colors.body}" stroke="#000" stroke-width="0.5"/>
                <!-- Head -->
                <circle cx="22" cy="15" r="5" fill="${skin.colors.head}" stroke="#000" stroke-width="0.5"/>
                <!-- Comb -->
                <path d="M 19 11 L 20 8 L 21 11 L 22 9 L 23 11 L 24 8 L 25 11" fill="${skin.colors.comb}" stroke="#000" stroke-width="0.5"/>
                <!-- Beak -->
                <polygon points="26,15 29,15 27,17" fill="${skin.colors.beak}" stroke="#000" stroke-width="0.5"/>
                <!-- Eye -->
                <circle cx="23" cy="14" r="1.5" fill="${skin.colors.eye}"/>
                <!-- Feet -->
                <rect x="17" y="32" width="2" height="4" fill="${skin.colors.feet}"/>
                <rect x="21" y="32" width="2" height="4" fill="${skin.colors.feet}"/>
            </svg>
        `;
    }

    /**
     * Purchase a skin
     */
    buySkin(skinId) {
        const skin = this.skins[skinId];

        if (!skin) {
            console.error('Skin not found:', skinId);
            return;
        }

        if (skin.purchased) {
            alert('You already own this skin!');
            return;
        }

        if (this.points < skin.cost) {
            alert(`Not enough points! You need ${skin.cost - this.points} more points.`);
            return;
        }

        // Purchase the skin
        this.points -= skin.cost;
        skin.purchased = true;

        // Save progress
        this.saveProgress();

        // Show success message
        this.showNotification(`${skin.name} purchased!`);

        // Refresh the shop display
        this.renderSkins();
    }

    /**
     * Equip a purchased skin
     */
    equipSkin(skinId) {
        const skin = this.skins[skinId];

        if (!skin) {
            console.error('Skin not found:', skinId);
            return;
        }

        if (!skin.purchased) {
            alert('You must purchase this skin first!');
            return;
        }

        // Equip the skin
        this.equippedSkin = skinId;

        // Save progress
        this.saveProgress();

        // Show success message
        this.showNotification(`${skin.name} equipped!`);

        // Refresh the shop display
        this.renderSkins();

        // Update the player's appearance if game is running
        if (window.game && window.game.player) {
            window.game.player.updateSkin(this.getEquippedSkin());
        }

        // Update the 3D game's chicken if running
        if (window.game3d && window.game3d.updateChickenSkin) {
            window.game3d.updateChickenSkin();
        }
    }

    /**
     * Get the currently equipped skin data
     */
    getEquippedSkin() {
        return this.skins[this.equippedSkin];
    }

    /**
     * Update points display in both HUD and shop
     */
    updatePointsDisplay() {
        // Update shop modal points
        if (this.elements.pointsDisplay) {
            this.elements.pointsDisplay.textContent = this.points.toLocaleString();
        }

        // Update HUD points display
        const hudPoints = document.getElementById('pointsNumber');
        if (hudPoints) {
            hudPoints.textContent = this.points.toLocaleString();
        }
    }

    /**
     * Show notification message
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'shop-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        const saveData = {
            points: this.points,
            equippedSkin: this.equippedSkin,
            purchasedSkins: Object.keys(this.skins)
                .filter(id => this.skins[id].purchased)
        };

        localStorage.setItem('chickenShopData', JSON.stringify(saveData));
    }

    /**
     * Load progress from localStorage
     */
    loadProgress() {
        try {
            const savedData = localStorage.getItem('chickenShopData');
            if (savedData) {
                const data = JSON.parse(savedData);

                this.points = data.points || 0;
                this.equippedSkin = data.equippedSkin || 'default';

                // Mark purchased skins
                if (data.purchasedSkins) {
                    data.purchasedSkins.forEach(skinId => {
                        if (this.skins[skinId]) {
                            this.skins[skinId].purchased = true;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading shop data:', error);
        }
    }

    /**
     * Reset all progress (for testing/debugging)
     */
    resetProgress() {
        if (confirm('Are you sure you want to reset all shop progress?')) {
            localStorage.removeItem('chickenShopData');
            this.points = 0;
            this.equippedSkin = 'default';

            Object.keys(this.skins).forEach(skinId => {
                if (skinId !== 'default') {
                    this.skins[skinId].purchased = false;
                }
            });

            this.renderSkins();
            this.updatePointsDisplay();
        }
    }
}

// Create global shop instance
window.shop = new Shop();
