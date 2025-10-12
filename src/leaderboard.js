class Leaderboard {
    constructor() {
        this.currentFilter = 'all';
        this.leaderboardData = [];
        this.userStats = null;
        this.isLoading = false;

        this.elements = {
            modal: document.getElementById('leaderboardModal'),
            content: document.getElementById('leaderboardContent'),
            userStats: document.getElementById('userStats'),
            userBestScore: document.getElementById('userBestScore'),
            userRank: document.getElementById('userRank'),
            closeBtn: document.getElementById('leaderboardCloseBtn')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Close button
        this.elements.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Close on backdrop click
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.hide();
            }
        });
    }

    async show() {
        this.elements.modal.classList.remove('hidden');
        await this.loadLeaderboard();

        if (window.supabaseClient.isAuthenticated()) {
            await this.loadUserStats();
        }
    }

    hide() {
        this.elements.modal.classList.add('hidden');
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Reload leaderboard with new filter
        this.loadLeaderboard();
    }

    async loadLeaderboard() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            if (!window.supabaseClient.isSupabaseConfigured()) {
                this.showError('Leaderboard requires Supabase configuration');
                return;
            }

            await window.supabaseClient.initialize();

            const levelFilter = this.currentFilter === 'all' ? null : parseInt(this.currentFilter);
            const data = await window.supabaseClient.getLeaderboard(20, 0, levelFilter);

            this.leaderboardData = data;
            this.renderLeaderboard();

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    async loadUserStats() {
        try {
            const userBest = await window.supabaseClient.getUserBestScore();
            const userRank = await window.supabaseClient.getUserRank();

            if (userBest) {
                this.elements.userBestScore.textContent = window.supabaseClient.formatScore(userBest.score);
                this.elements.userRank.textContent = userRank ? `#${userRank}` : '-';
                this.elements.userStats.classList.remove('hidden');
            } else {
                this.elements.userStats.classList.add('hidden');
            }

        } catch (error) {
            console.error('Error loading user stats:', error);
            this.elements.userStats.classList.add('hidden');
        }
    }

    renderLeaderboard() {
        if (!this.leaderboardData || this.leaderboardData.length === 0) {
            this.showEmpty();
            return;
        }

        const listHtml = this.leaderboardData.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = window.supabaseClient.getUser()?.id === entry.user_id;

            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            if (isCurrentUser) rankClass += ' current-user';

            const timeFormatted = this.formatTime(entry.time_to_complete);
            const scoreFormatted = window.supabaseClient.formatScore(entry.score);
            const dateFormatted = new Date(entry.created_at).toLocaleDateString();

            return `
                <div class="leaderboard-item ${rankClass}">
                    <div class="player-info">
                        <div class="player-rank">#${rank}</div>
                        <div>
                            <div class="player-name">${this.escapeHtml(entry.username)}</div>
                            <div class="player-level">Level ${entry.level_reached}</div>
                        </div>
                    </div>
                    <div class="player-stats">
                        <div class="player-score">${scoreFormatted}</div>
                        <div class="player-time">${timeFormatted}</div>
                        <div class="player-date">${dateFormatted}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.content.innerHTML = `
            <div class="leaderboard-list">
                ${listHtml}
            </div>
        `;
    }

    showLoading() {
        this.elements.content.innerHTML = '<div class="loading">Loading leaderboard...</div>';
    }

    showEmpty() {
        const filterText = this.currentFilter === 'all' ? 'any level' : `level ${this.currentFilter}`;
        this.elements.content.innerHTML = `
            <div class="empty-leaderboard">
                <p>No scores found for ${filterText}.</p>
                <p>Be the first to submit a score!</p>
            </div>
        `;
    }

    showError(message) {
        this.elements.content.innerHTML = `
            <div class="error-message">
                ${this.escapeHtml(message)}
            </div>
        `;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async refresh() {
        await this.loadLeaderboard();

        if (window.supabaseClient.isAuthenticated()) {
            await this.loadUserStats();
        }
    }

    // Method to submit a new score and refresh the leaderboard
    async onScoreSubmitted() {
        // Small delay to ensure the score is saved
        setTimeout(async () => {
            await this.refresh();
        }, 1000);
    }
}

// Create global instance
window.leaderboard = new Leaderboard();