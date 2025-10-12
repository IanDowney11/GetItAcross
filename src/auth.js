class Auth {
    constructor() {
        this.isSignUp = false;

        this.elements = {
            modal: document.getElementById('authModal'),
            title: document.getElementById('authTitle'),
            form: document.getElementById('authForm'),
            email: document.getElementById('authEmail'),
            password: document.getElementById('authPassword'),
            username: document.getElementById('authUsername'),
            usernameGroup: document.getElementById('usernameGroup'),
            submitBtn: document.getElementById('authSubmitBtn'),
            toggleBtn: document.getElementById('authToggle'),
            forgotBtn: document.getElementById('forgotPassword'),
            closeBtn: document.getElementById('authCloseBtn')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Toggle between sign in / sign up
        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleMode();
        });

        // Forgot password
        this.elements.forgotBtn.addEventListener('click', () => {
            this.handleForgotPassword();
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

        // Listen for auth state changes
        window.addEventListener('authStateChange', (e) => {
            this.onAuthStateChange(e.detail);
        });
    }

    show(isSignUp = false) {
        this.isSignUp = isSignUp;
        this.updateUI();
        this.clearForm();
        this.elements.modal.classList.remove('hidden');
        this.elements.email.focus();
    }

    hide() {
        this.elements.modal.classList.add('hidden');
        this.clearForm();
    }

    toggleMode() {
        this.isSignUp = !this.isSignUp;
        this.updateUI();
    }

    updateUI() {
        if (this.isSignUp) {
            this.elements.title.textContent = 'Create Account';
            this.elements.submitBtn.textContent = 'Sign Up';
            this.elements.toggleBtn.textContent = 'Already have an account? Sign in';
            this.elements.usernameGroup.classList.remove('hidden');
            this.elements.forgotBtn.style.display = 'none';
        } else {
            this.elements.title.textContent = 'Sign In';
            this.elements.submitBtn.textContent = 'Sign In';
            this.elements.toggleBtn.textContent = 'Need an account? Sign up';
            this.elements.usernameGroup.classList.add('hidden');
            this.elements.forgotBtn.style.display = 'inline-block';
        }
    }

    clearForm() {
        this.elements.email.value = '';
        this.elements.password.value = '';
        this.elements.username.value = '';
        this.clearErrors();
    }

    async handleSubmit() {
        const email = this.elements.email.value.trim();
        const password = this.elements.password.value;
        const username = this.elements.username.value.trim();

        // Validation
        if (!email || !password) {
            this.showError('Please fill in all required fields.');
            return;
        }

        if (this.isSignUp && !username) {
            this.showError('Please enter a username.');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long.');
            return;
        }

        this.setLoading(true);
        this.clearErrors();

        try {
            if (!window.supabaseClient.isSupabaseConfigured()) {
                throw new Error('Supabase is not configured. Please set up your Supabase credentials.');
            }

            await window.supabaseClient.initialize();

            if (this.isSignUp) {
                await window.supabaseClient.signUp(email, password, username);
                this.showSuccess('Account created! Please check your email to verify your account.');
            } else {
                await window.supabaseClient.signIn(email, password);
                this.showSuccess('Signed in successfully!');
                this.hide();
            }

        } catch (error) {
            console.error('Auth error:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.setLoading(false);
        }
    }

    async handleForgotPassword() {
        const email = this.elements.email.value.trim();

        if (!email) {
            this.showError('Please enter your email address first.');
            return;
        }

        this.setLoading(true);
        this.clearErrors();

        try {
            await window.supabaseClient.resetPassword(email);
            this.showSuccess('Password reset email sent! Check your inbox.');
        } catch (error) {
            console.error('Password reset error:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.setLoading(false);
        }
    }

    async handleSignOut() {
        try {
            await window.supabaseClient.signOut();
            if (window.game && window.game.ui) {
                window.game.ui.showNotification('Signed out successfully', 2000, 'info');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            if (window.game && window.game.ui) {
                window.game.ui.showError('Failed to sign out');
            }
        }
    }

    setLoading(loading) {
        this.elements.submitBtn.disabled = loading;
        this.elements.submitBtn.textContent = loading
            ? 'Loading...'
            : (this.isSignUp ? 'Sign Up' : 'Sign In');
    }

    showError(message) {
        this.clearErrors();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.elements.form.appendChild(errorDiv);
    }

    showSuccess(message) {
        this.clearErrors();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            color: #2ecc71;
            text-align: center;
            padding: 15px;
            background: rgba(46, 204, 113, 0.1);
            border-radius: 8px;
            margin: 10px 0;
        `;
        successDiv.textContent = message;
        this.elements.form.appendChild(successDiv);
    }

    clearErrors() {
        const existingMessages = this.elements.form.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());
    }

    getErrorMessage(error) {
        const message = error.message || error.toString();

        // Map common Supabase errors to user-friendly messages
        if (message.includes('Invalid login credentials')) {
            return 'Invalid email or password. Please try again.';
        }
        if (message.includes('User already registered')) {
            return 'An account with this email already exists. Please sign in instead.';
        }
        if (message.includes('Password should be at least 6 characters')) {
            return 'Password must be at least 6 characters long.';
        }
        if (message.includes('Unable to validate email address')) {
            return 'Please enter a valid email address.';
        }
        if (message.includes('Email not confirmed')) {
            return 'Please check your email and click the confirmation link.';
        }
        if (message.includes('Supabase not configured')) {
            return 'Authentication is not available. Please try again later.';
        }

        return message;
    }

    onAuthStateChange(detail) {
        const { event, user } = detail;

        if (event === 'SIGNED_IN') {
            this.hide();
            if (window.game && window.game.ui) {
                window.game.ui.updateAuthUI(user);
                window.game.ui.showSuccess('Welcome back!');
            }
        } else if (event === 'SIGNED_OUT') {
            if (window.game && window.game.ui) {
                window.game.ui.updateAuthUI(null);
            }
        }
    }

    getAuthButtonText(user) {
        if (user) {
            const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
            return `👤 ${username}`;
        }
        return '👤 Sign In';
    }

    // Update auth buttons throughout the UI
    updateAuthButtons(user) {
        const authButtons = document.querySelectorAll('#authBtn, #loginBtn, #mainAuthBtn');
        authButtons.forEach(btn => {
            btn.textContent = this.getAuthButtonText(user);
        });

        // Update submit score button visibility
        const submitScoreBtn = document.getElementById('submitScoreBtn');
        if (submitScoreBtn) {
            if (user) {
                submitScoreBtn.classList.remove('hidden');
            } else {
                submitScoreBtn.classList.add('hidden');
            }
        }
    }
}

// Create global instance
window.auth = new Auth();