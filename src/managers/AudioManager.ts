type MusicTrack = 'game' | 'menu';
type SfxKey =
  | 'blockLand'
  | 'matchClear'
  | 'powerUpCollect'
  | 'lifeLost'
  | 'gameOver'
  | 'collision'
  | 'comboAchieved'
  | 'hammerActivated'
  | 'speedBurst'
  | 'orbCollect';

type ResumeHandler = () => void;

interface AudioPool {
  instances: HTMLAudioElement[];
  maxSize: number;
  nextIndex: number;
  lastPlayTime: number;
  throttleMs: number;
}

export class AudioManager {
  private static instance: AudioManager;
  private music: HTMLAudioElement;
  private currentTrack: MusicTrack | null = null;
  private pendingPlay = false;
  private resumeHandler: ResumeHandler | null = null;
  private isSfxMuted = false;
  private sfxVolume = 0.6;
  private baseMusicVolume = 0.35;
  private musicTempoLevel = 0;
  private musicIntensity = 0.4;
  private comboHeat = 0;
  private audioPoolsMap: Map<SfxKey, AudioPool> = new Map();

  private constructor() {
    this.music = new Audio();
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.volume = this.baseMusicVolume;
    this.initializeAudioPools();
  }

  /**
   * Initialize audio pools for frequently played sounds
   */
  private initializeAudioPools(): void {
    // Pool config: maxSize, throttleMs
    const poolConfigs: Record<SfxKey, { maxSize: number; throttleMs: number }> = {
      blockLand: { maxSize: 1, throttleMs: 0 },
      matchClear: { maxSize: 1, throttleMs: 0 },
      powerUpCollect: { maxSize: 1, throttleMs: 0 },
      lifeLost: { maxSize: 1, throttleMs: 0 },
      gameOver: { maxSize: 1, throttleMs: 0 },
      collision: { maxSize: 3, throttleMs: 50 }, // Pool for rapid collisions
      comboAchieved: { maxSize: 2, throttleMs: 100 },
      hammerActivated: { maxSize: 1, throttleMs: 200 },
      speedBurst: { maxSize: 1, throttleMs: 500 },
      orbCollect: { maxSize: 2, throttleMs: 100 },
    };

    Object.entries(poolConfigs).forEach(([key, config]) => {
      this.audioPoolsMap.set(key as SfxKey, {
        instances: [],
        maxSize: config.maxSize,
        nextIndex: 0,
        lastPlayTime: 0,
        throttleMs: config.throttleMs,
      });
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public playGameMusic(): void {
    this.playMusic('game');
  }

  public playMenuMusic(): void {
    this.playMusic('menu');
  }

  public stopMusic(): void {
    this.music.pause();
    this.music.currentTime = 0;
    this.currentTrack = null;
  }

  public setMusicMuted(muted: boolean): void {
    this.music.muted = muted;
    if (!muted && this.pendingPlay) {
      this.tryPlay();
    }
  }

  public setSfxMuted(muted: boolean): void {
    this.isSfxMuted = muted;
  }

  public setMusicVolume(volume: number): void {
    this.baseMusicVolume = this.clampVolume(volume);
    this.applyMusicMix();
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = this.clampVolume(volume);
  }

  public setMusicTempoLevel(level: number): void {
    this.musicTempoLevel = level;
    this.applyMusicMix();
  }

  public setMusicIntensity(intensity: number): void {
    const clamped = Math.min(1, Math.max(0, intensity));
    this.musicIntensity = clamped;
    this.applyMusicMix();
  }

  /**
   * Set combo heat level for volume scaling (0-100)
   */
  public setComboHeat(heat: number): void {
    this.comboHeat = Math.min(100, Math.max(0, heat));
  }

  /**
   * Play sound effect with pooling and volume scaling
   */
  public playSfx(key: SfxKey, options?: { forcePlay?: boolean; volumeScale?: number }): void {
    if (this.isSfxMuted) {
      return;
    }

    const pool = this.audioPoolsMap.get(key);
    if (!pool) {
      // Fallback to non-pooled playback
      this.playNonPooledSfx(key, options?.volumeScale || 1);
      return;
    }

    // Check throttle to prevent audio spam
    const now = Date.now();
    if (!options?.forcePlay && pool.throttleMs > 0) {
      if (now - pool.lastPlayTime < pool.throttleMs) {
        return; // Skip this play to avoid spam
      }
    }
    pool.lastPlayTime = now;

    // Get pooled audio instance
    let audio = pool.instances[pool.nextIndex];
    if (!audio) {
      // Create new instance if pool not full
      if (pool.instances.length < pool.maxSize) {
        audio = this.createAudioInstance(key);
        pool.instances.push(audio);
      } else {
        // Reuse existing instance
        audio = pool.instances[pool.nextIndex];
      }
    }

    // Apply volume scaling
    const baseVolume = options?.volumeScale ? this.sfxVolume * options.volumeScale : this.sfxVolume;
    const comboScale = this.getComboVolumeScale(key);
    audio.volume = this.clampVolume(baseVolume * comboScale);

    // Reset and play
    audio.currentTime = 0;
    const playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // Ignore autoplay restrictions
      });
    }

    // Move to next instance in pool
    pool.nextIndex = (pool.nextIndex + 1) % Math.max(1, pool.instances.length);
  }

  /**
   * Get volume scale based on combo heat level
   */
  private getComboVolumeScale(key: SfxKey): number {
    // Scale volume up with combo heat for certain sounds
    const heatScalingSounds: SfxKey[] = ['collision', 'comboAchieved', 'matchClear'];
    if (!heatScalingSounds.includes(key)) {
      return 1.0;
    }

    // 0-100 heat → 0.9-1.2 volume scale
    const heatNormalized = this.comboHeat / 100;
    return 0.9 + heatNormalized * 0.3;
  }

  /**
   * Create audio instance for pooling
   */
  private createAudioInstance(key: SfxKey): HTMLAudioElement {
    const src = this.getSfxUrl(key);
    const audio = new Audio(src);
    audio.preload = 'auto';
    return audio;
  }

  /**
   * Fallback non-pooled playback
   */
  private playNonPooledSfx(key: SfxKey, volumeScale: number = 1): void {
    if (this.isSfxMuted) {
      return;
    }

    const src = this.getSfxUrl(key);
    if (!src) {
      return;
    }

    const sfx = new Audio(src);
    sfx.volume = this.clampVolume(this.sfxVolume * volumeScale);
    const playAttempt = sfx.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // Ignore autoplay restrictions for SFX.
      });
    }
  }

  private playMusic(track: MusicTrack): void {
    if (this.currentTrack === track) {
      this.tryPlay();
      return;
    }

    this.currentTrack = track;
    this.music.src = this.getTrackUrl(track);
    this.music.load();
    this.applyMusicMix();
    this.tryPlay();
  }

  private getTrackUrl(track: MusicTrack): string {
    if (track === 'game') {
      return '/audio/game-music.mp3';
    }
    return '/audio/menu-music.mp3';
  }

  private getSfxUrl(key: SfxKey): string {
    const map: Record<SfxKey, string> = {
      blockLand: '/audio/block-land.mp3',
      matchClear: '/audio/match-clear.mp3',
      powerUpCollect: '/audio/powerup-collect.mp3',
      lifeLost: '/audio/life-lost.mp3',
      gameOver: '/audio/game-over.mp3',
      collision: '/audio/block-land.mp3', // Reuse for collision
      comboAchieved: '/audio/match-clear.mp3', // Reuse for combo
      hammerActivated: '/audio/powerup-collect.mp3', // Reuse for hammer
      speedBurst: '/audio/powerup-collect.mp3', // Reuse for burst
      orbCollect: '/audio/powerup-collect.mp3', // Reuse for orb
    };

    return map[key];
  }

  private clampVolume(value: number): number {
    if (Number.isNaN(value)) {
      return 0.5;
    }
    return Math.min(1, Math.max(0, value));
  }

  private applyMusicMix(): void {
    const tempoRate = this.getTempoPlaybackRate(this.musicTempoLevel);
    this.music.playbackRate = tempoRate;

    const intensityBoost = 0.9 + this.musicIntensity * 0.2;
    const tempoBoost = this.musicTempoLevel >= 2 ? 1.05 : 1;
    const targetVolume = this.baseMusicVolume * intensityBoost * tempoBoost;
    this.music.volume = this.clampVolume(targetVolume);
  }

  private getTempoPlaybackRate(level: number): number {
    if (level <= -1) return 0.94;
    if (level === 1) return 1.02;
    if (level >= 2) return 1.08;
    return 1.0;
  }

  private tryPlay(): void {
    const playAttempt = this.music.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => this.deferPlayUntilInteraction());
    }
  }

  private deferPlayUntilInteraction(): void {
    if (this.pendingPlay) {
      return;
    }

    this.pendingPlay = true;
    this.resumeHandler = () => {
      this.pendingPlay = false;
      this.tryPlay();
      this.clearResumeListeners();
    };

    window.addEventListener('pointerdown', this.resumeHandler, { once: true });
    window.addEventListener('keydown', this.resumeHandler, { once: true });
  }

  private clearResumeListeners(): void {
    if (!this.resumeHandler) {
      return;
    }

    window.removeEventListener('pointerdown', this.resumeHandler);
    window.removeEventListener('keydown', this.resumeHandler);
    this.resumeHandler = null;
  }
}

export const audioManager = AudioManager.getInstance();
