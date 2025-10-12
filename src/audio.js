class Audio {
    constructor() {
        this.context = null;
        this.isMuted = false;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;

        this.sounds = {};
        this.musicTracks = {};
        this.currentMusic = null;

        this.lastPlayTime = {};
        this.soundCooldown = 50;

        this.initAudioContext();
        this.createSounds();
        this.loadSettings();
    }

    initAudioContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            if (this.context.state === 'suspended') {
                const resumeAudio = () => {
                    this.context.resume();
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                };

                document.addEventListener('click', resumeAudio);
                document.addEventListener('touchstart', resumeAudio);
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    createSounds() {
        this.sounds = {
            move: this.createTone(220, 0.1, 'sine', 0.3),
            collision: this.createTone(150, 0.5, 'sawtooth', 0.8),
            horn: this.createTone(300, 0.3, 'square', 0.6),
            levelComplete: this.createMelody([
                { freq: 261.63, duration: 0.2 },
                { freq: 329.63, duration: 0.2 },
                { freq: 392.00, duration: 0.2 },
                { freq: 523.25, duration: 0.4 }
            ]),
            gameOver: this.createMelody([
                { freq: 523.25, duration: 0.3 },
                { freq: 392.00, duration: 0.3 },
                { freq: 329.63, duration: 0.3 },
                { freq: 261.63, duration: 0.5 }
            ]),
            pickup: this.createTone(440, 0.2, 'sine', 0.4),
            warning: this.createTone(800, 0.1, 'triangle', 0.5)
        };
    }

    createTone(frequency, duration, waveType = 'sine', volume = 0.5) {
        return () => {
            if (!this.context || this.isMuted) return;

            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
            oscillator.type = waveType;

            const adjustedVolume = volume * this.sfxVolume * this.masterVolume;
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, this.context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        };
    }

    createMelody(notes) {
        return () => {
            if (!this.context || this.isMuted) return;

            let currentTime = this.context.currentTime;

            notes.forEach(note => {
                const oscillator = this.context.createOscillator();
                const gainNode = this.context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.context.destination);

                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                oscillator.type = 'sine';

                const adjustedVolume = 0.3 * this.sfxVolume * this.masterVolume;
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(adjustedVolume, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);

                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);

                currentTime += note.duration;
            });
        };
    }

    createNoiseBuffer(duration, type = 'white') {
        if (!this.context) return null;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            switch (type) {
                case 'white':
                    output[i] = Math.random() * 2 - 1;
                    break;
                case 'pink':
                    output[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 0.5);
                    break;
                case 'brown':
                    output[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 2);
                    break;
            }
        }

        return buffer;
    }

    createEngineSound(frequency, duration) {
        return () => {
            if (!this.context || this.isMuted) return;

            const buffer = this.createNoiseBuffer(duration, 'brown');
            if (!buffer) return;

            const source = this.context.createBufferSource();
            const filter = this.context.createBiquadFilter();
            const gainNode = this.context.createGain();

            source.buffer = buffer;
            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.context.destination);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(frequency, this.context.currentTime);

            const adjustedVolume = 0.2 * this.sfxVolume * this.masterVolume;
            gainNode.gain.setValueAtTime(adjustedVolume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

            source.start(this.context.currentTime);
        };
    }

    playSound(soundName, force = false) {
        if (!this.sounds[soundName] || this.isMuted) return;

        const currentTime = Date.now();
        const lastTime = this.lastPlayTime[soundName] || 0;

        if (!force && currentTime - lastTime < this.soundCooldown) {
            return;
        }

        try {
            this.sounds[soundName]();
            this.lastPlayTime[soundName] = currentTime;
        } catch (e) {
            console.warn(`Error playing sound ${soundName}:`, e);
        }
    }

    playRandomHorn() {
        const hornTypes = ['horn1', 'horn2', 'horn3'];
        const randomHorn = hornTypes[Math.floor(Math.random() * hornTypes.length)];
        this.playSound(randomHorn || 'horn');
    }

    playEngineSound(vehicleType) {
        const engineFrequencies = {
            motorcycle: 800,
            car: 200,
            truck: 100,
            bus: 80
        };

        const frequency = engineFrequencies[vehicleType] || 200;
        const engineSound = this.createEngineSound(frequency, 0.5);
        engineSound();
    }

    playAmbientSound(levelType) {
        if (this.isMuted) return;

        switch (levelType) {
            case 'dirt':
                this.playSound('rustle');
                break;
            case 'bitumen':
                this.playEngineSound('car');
                break;
            case 'gold':
                this.playSound('chime');
                break;
            case 'diamond':
                this.playSound('crystal');
                break;
            case 'obsidian':
                this.playSound('echo');
                break;
        }
    }

    startBackgroundMusic(trackName) {
        if (this.isMuted) return;

        this.stopBackgroundMusic();

        if (this.musicTracks[trackName]) {
            this.currentMusic = this.musicTracks[trackName];
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
            this.currentMusic.loop = true;
            this.currentMusic.play().catch(e => {
                console.warn('Could not play background music:', e);
            });
        }
    }

    stopBackgroundMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    fadeOutMusic(duration = 1000) {
        if (!this.currentMusic) return;

        const music = this.currentMusic;
        const startVolume = music.volume;
        const fadeStep = startVolume / (duration / 50);

        const fadeInterval = setInterval(() => {
            music.volume = Math.max(0, music.volume - fadeStep);

            if (music.volume <= 0) {
                clearInterval(fadeInterval);
                this.stopBackgroundMusic();
            }
        }, 50);
    }

    fadeInMusic(trackName, duration = 1000) {
        this.startBackgroundMusic(trackName);

        if (!this.currentMusic) return;

        const music = this.currentMusic;
        const targetVolume = this.musicVolume * this.masterVolume;
        music.volume = 0;

        const fadeStep = targetVolume / (duration / 50);

        const fadeInterval = setInterval(() => {
            music.volume = Math.min(targetVolume, music.volume + fadeStep);

            if (music.volume >= targetVolume) {
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    setMasterVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
        this.updateMusicVolume();
        this.saveSettings();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Utils.clamp(volume, 0, 1);
        this.saveSettings();
    }

    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
        this.updateMusicVolume();
        this.saveSettings();
    }

    updateMusicVolume() {
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.stopBackgroundMusic();
        }

        this.saveSettings();

        if (window.game && window.game.ui) {
            window.game.ui.updateMuteButton(this.isMuted);
        }

        return this.isMuted;
    }

    mute() {
        this.isMuted = true;
        this.stopBackgroundMusic();
        this.saveSettings();
    }

    unmute() {
        this.isMuted = false;
        this.saveSettings();
    }

    preloadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new window.Audio();
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = () => {
                    if (!this.isMuted) {
                        const soundClone = audio.cloneNode();
                        soundClone.volume = this.sfxVolume * this.masterVolume;
                        soundClone.play().catch(e => console.warn('Sound play failed:', e));
                    }
                };
                resolve();
            });
            audio.addEventListener('error', reject);
            audio.src = url;
            audio.load();
        });
    }

    preloadMusic(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new window.Audio();
            audio.addEventListener('canplaythrough', () => {
                this.musicTracks[name] = audio;
                resolve();
            });
            audio.addEventListener('error', reject);
            audio.src = url;
            audio.preload = 'auto';
            audio.load();
        });
    }

    saveSettings() {
        const settings = {
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume
        };

        try {
            localStorage.setItem('gameAudioSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Could not save audio settings:', e);
        }
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('gameAudioSettings') || '{}');

            this.isMuted = settings.isMuted || false;
            this.masterVolume = settings.masterVolume !== undefined ? settings.masterVolume : 0.7;
            this.sfxVolume = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.8;
            this.musicVolume = settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
        } catch (e) {
            console.warn('Could not load audio settings:', e);
        }
    }

    createSpatialSound(soundName, playerPos, sourcePos, maxDistance = 300) {
        if (!this.context || this.isMuted) return;

        const distance = Utils.distance(playerPos.x, playerPos.y, sourcePos.x, sourcePos.y);
        if (distance > maxDistance) return;

        const volume = Math.max(0, 1 - distance / maxDistance);
        const pan = Utils.clamp((sourcePos.x - playerPos.x) / maxDistance, -1, 1);

        if (this.sounds[soundName]) {
            const originalSound = this.sounds[soundName];
            this.sounds[soundName] = () => {
                if (!this.context || this.isMuted) return;

                originalSound();

                if (this.context.createStereoPanner) {
                    const panner = this.context.createStereoPanner();
                    panner.pan.setValueAtTime(pan, this.context.currentTime);
                }
            };
        }
    }

    getVolumeLevels() {
        return {
            master: this.masterVolume,
            sfx: this.sfxVolume,
            music: this.musicVolume,
            isMuted: this.isMuted
        };
    }

    destroy() {
        this.stopBackgroundMusic();

        if (this.context) {
            this.context.close().catch(e => {
                console.warn('Error closing audio context:', e);
            });
        }

        this.sounds = {};
        this.musicTracks = {};
    }
}