/**
 * Timer Attack Mode - Enhanced with Runtime System
 * Race against the clock - survive for 90 seconds and maximize score
 * 
 * FEATURES:
 * - Adaptive pacing ramp (early/mid/final phases)
 * - Burst windows every 20 seconds
 * - Score multiplier during final phase (last 10s)
 */

export type TimerPhase = 'early' | 'mid' | 'final';

export interface TimerRuntimeCallbacks {
  onPhaseChange?: (phase: TimerPhase, multipliers: { speed: number; spawn: number }) => void;
  onBurstStart?: (multipliers: { speed: number; spawn: number }) => void;
  onBurstEnd?: () => void;
  onScoreMultiplier?: (multiplier: number) => void;
}

class TimerAttackMode {
  private isActive: boolean = false;
  private timeLimit: number = 90; // 90 seconds
  private timeRemaining: number;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private startTime: number | null = null;
  private isPaused: boolean = false;
  private bestTime: number | null;
  private bestScore: number;
  private totalBonusSeconds = 0;
  
  // Runtime phase system
  private currentPhase: TimerPhase = 'early';
  private burstActive: boolean = false;
  private lastBurstTime: number = 0;
  private burstInterval: number = 20; // Burst every 20 seconds
  private burstDuration: number = 5; // 5 second burst windows
  private scoreMultiplier: number = 1;
  private callbacks: TimerRuntimeCallbacks;
  
  constructor(timeLimit: number = 90, callbacks?: TimerRuntimeCallbacks) {
    this.timeLimit = timeLimit;
    this.timeRemaining = this.timeLimit;
    this.bestTime = this.loadBestTime();
    this.bestScore = this.loadBestScore();
    this.callbacks = callbacks || {};
    this.init();
  }

  init() {
    // Listen for mode activation
    window.addEventListener('activateTimerMode', () => {
      this.activate();
    });

    // Listen for game events
    window.addEventListener('gameStart', () => {
      if (this.isActive) {
        this.start();
      }
    });

    window.addEventListener('gameOver', () => {
      if (this.isActive) {
        this.end();
      }
    });

    window.addEventListener('pauseGame', () => {
      this.pause();
    });

    window.addEventListener('resumeGame', () => {
      this.resume();
    });

    console.log('Timer Attack Mode initialized');
  }

  activate() {
    this.isActive = true;
    this.timeRemaining = this.timeLimit;
    this.totalBonusSeconds = 0;
    this.currentPhase = 'early';
    this.burstActive = false;
    this.lastBurstTime = 0;
    this.scoreMultiplier = 1;
    console.log('Timer Attack Mode ACTIVATED');
    
    // Show mode indicator
    this.showModeIndicator();
  }

  deactivate() {
    this.isActive = false;
    this.stop();
    this.currentPhase = 'early';
    this.burstActive = false;
    this.lastBurstTime = 0;
    this.scoreMultiplier = 1;
    this.hideModeIndicator();
    console.log('Timer Attack Mode deactivated');
  }

  start() {
    if (!this.isActive || this.timerId) return;

    this.startTime = Date.now();
    this.timeRemaining = this.timeLimit;
    this.totalBonusSeconds = 0;
    this.isPaused = false;
    this.currentPhase = 'early';
    this.burstActive = false;
    this.lastBurstTime = 0;
    this.scoreMultiplier = 1;

    // Start countdown
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 100); // Update every 100ms for smooth display

    console.log('Timer started!');
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  pause() {
    if (this.isActive && !this.isPaused) {
      this.isPaused = true;
    }
  }

  resume() {
    if (this.isActive && this.isPaused) {
      this.isPaused = false;
    }
  }

  tick(): void {
    if (this.startTime === null) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.timeRemaining = Math.max(0, this.timeLimit + this.totalBonusSeconds - elapsed);

    // Update runtime phase system
    this.updatePhase(elapsed);
    this.updateBurstWindows(elapsed);
    this.updateScoreMultiplier();

    // Update UI
    this.updateTimerDisplay();

    // Check for time up
    if (this.timeRemaining <= 0) {
      this.onTimeUp();
    }
  }

  onTimeUp() {
    this.stop();
    
    // Calculate final score with time bonus
    const finalScore = this.calculateFinalScore(0);
    
    // Check for new best
    this.checkNewBest(finalScore);
    
    // Trigger game over
    console.log('TIME UP! Final score:', finalScore);
    
    // Dispatch time up event
    window.dispatchEvent(new CustomEvent('timerModeTimeUp', {
      detail: { score: finalScore, survived: true }
    }));
  }

  /**
   * Update runtime phase based on elapsed time
   * Early: 0-30s (1.0x speed, 1.0x spawn)
   * Mid: 30-80s (1.2x speed, 1.15x spawn)
   * Final: 80-90s (1.4x speed, 1.3x spawn)
   */
  private updatePhase(elapsed: number): void {
    let newPhase: TimerPhase = 'early';
    let speedMultiplier = 1.0;
    let spawnMultiplier = 1.0;

    if (elapsed >= 80) {
      newPhase = 'final';
      speedMultiplier = 1.4;
      spawnMultiplier = 1.3;
    } else if (elapsed >= 30) {
      newPhase = 'mid';
      speedMultiplier = 1.2;
      spawnMultiplier = 1.15;
    }

    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      console.log(`[TimerAttack] Phase changed to: ${newPhase}`);
      this.callbacks.onPhaseChange?.(newPhase, {
        speed: speedMultiplier,
        spawn: spawnMultiplier,
      });
    }
  }

  /**
   * Burst windows every 20 seconds
   * During burst: 1.6x speed, 1.5x spawn for 5 seconds
   */
  private updateBurstWindows(elapsed: number): void {
    const timeSinceLastBurst = elapsed - this.lastBurstTime;

    // Start new burst window every 20 seconds
    if (timeSinceLastBurst >= this.burstInterval && !this.burstActive) {
      this.burstActive = true;
      this.lastBurstTime = elapsed;
      console.log(`[TimerAttack] Burst window started at ${elapsed.toFixed(1)}s`);
      
      this.callbacks.onBurstStart?.({
        speed: 1.6,
        spawn: 1.5,
      });
      
      // Show burst notification
      this.showBurstNotification();
    }

    // End burst window after duration
    if (this.burstActive && timeSinceLastBurst >= this.burstDuration) {
      this.burstActive = false;
      console.log(`[TimerAttack] Burst window ended`);
      this.callbacks.onBurstEnd?.();
    }
  }

  /**
   * Score multiplier during final phase (last 10 seconds)
   */
  private updateScoreMultiplier(): void {
    const newMultiplier = this.timeRemaining <= 10 ? 2.0 : 1.0;
    
    if (newMultiplier !== this.scoreMultiplier) {
      this.scoreMultiplier = newMultiplier;
      console.log(`[TimerAttack] Score multiplier: ${this.scoreMultiplier}x`);
      this.callbacks.onScoreMultiplier?.(this.scoreMultiplier);
      
      if (this.scoreMultiplier > 1) {
        this.showMultiplierNotification();
      }
    }
  }

  /**
   * Show burst window notification
   */
  private showBurstNotification(): void {
    window.dispatchEvent(new CustomEvent('timerBurst', {
      detail: { message: 'BURST MODE!', color: '#f59e0b' }
    }));
  }

  /**
   * Show score multiplier notification
   */
  private showMultiplierNotification(): void {
    window.dispatchEvent(new CustomEvent('timerMultiplier', {
      detail: { message: 'FINAL SPRINT - 2X SCORE!', color: '#10b981' }
    }));
  }

  end(): void {
    // Called when player dies before time runs out
    const timeElapsed = this.timeLimit - this.timeRemaining;
    const finalScore = this.calculateFinalScore(0);
    
    this.stop();
    
    console.log(`Game ended at ${timeElapsed.toFixed(1)}s. Score: ${finalScore}`);
    
    window.dispatchEvent(new CustomEvent('timerModeEnded', {
      detail: { 
        score: finalScore, 
        timeElapsed,
        survived: false
      }
    }));
  }

  calculateFinalScore(currentScore: number = 0): number {
    let finalScore = currentScore;
    
    // Time bonus: +100 points per second survived
    const timeElapsed = this.timeLimit + this.totalBonusSeconds - this.timeRemaining;
    const timeBonus = Math.floor(timeElapsed * 100);
    
    // Completion bonus if survived full time
    const completionBonus = this.timeRemaining <= 0 ? 5000 : 0;
    
    finalScore += timeBonus + completionBonus;
    
    console.log(`Score breakdown: Base=${currentScore}, Time bonus=${timeBonus}, Completion=${completionBonus}`);
    
    return finalScore;
  }

  checkNewBest(finalScore: number): void {
    // Check best score
    if (finalScore > this.bestScore) {
      this.bestScore = finalScore;
      this.saveBestScore(finalScore);
      
      console.log('NEW TIMER ATTACK RECORD:', finalScore);
    }
    
    // Check best time (if survived)
    if (this.timeRemaining <= 0) {
      const currentTime = this.timeLimit;
      if (!this.bestTime || currentTime < this.bestTime) {
        this.bestTime = currentTime;
        this.saveBestTime(currentTime);
      }
    }
  }

  updateTimerDisplay() {
    const timerElement = document.getElementById('timer-attack-display');
    if (!timerElement) return;

    const seconds = Math.floor(this.timeRemaining);
    const milliseconds = Math.floor((this.timeRemaining % 1) * 10);
    
    // Format as MM:SS.d
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${minutes}:${secs.toString().padStart(2, '0')}.${milliseconds}`;
    
    timerElement.textContent = timeString;
    
    // Change color based on urgency
    if (this.timeRemaining <= 10) {
      timerElement.className = 'timer-attack-display critical';
    } else if (this.timeRemaining <= 30) {
      timerElement.className = 'timer-attack-display warning';
    } else {
      timerElement.className = 'timer-attack-display normal';
    }
  }

  showModeIndicator() {
    // Create timer display if it doesn't exist
    let timerDisplay = document.getElementById('timer-attack-display');
    if (!timerDisplay) {
      timerDisplay = document.createElement('div');
      timerDisplay.id = 'timer-attack-display';
      timerDisplay.className = 'timer-attack-display normal';
      timerDisplay.textContent = `${this.timeLimit / 60}:00.0`;
      const hud = document.getElementById('hud-overlay');
      (hud || document.body).appendChild(timerDisplay);
    }
    timerDisplay.style.display = 'block';

    // Show mode badge
    let modeBadge = document.getElementById('timer-mode-badge');
    if (!modeBadge) {
      modeBadge = document.createElement('div');
      modeBadge.id = 'timer-mode-badge';
      modeBadge.className = 'timer-mode-badge';
      modeBadge.innerHTML = 'TIMER ATTACK';
      const hud = document.getElementById('hud-overlay');
      (hud || document.body).appendChild(modeBadge);
    }
    modeBadge.style.display = 'block';
  }

  addBonusTime(seconds: number): void {
    if (!this.isActive || seconds <= 0) return;
    this.totalBonusSeconds += seconds;
    this.updateTimerDisplay();
  }

  hideModeIndicator() {
    const timerDisplay = document.getElementById('timer-attack-display');
    const modeBadge = document.getElementById('timer-mode-badge');
    
    if (timerDisplay) timerDisplay.style.display = 'none';
    if (modeBadge) modeBadge.style.display = 'none';
  }

  // Persistence
  loadBestTime(): number | null {
    try {
      const saved = localStorage.getItem('timerAttackBestTime');
      return saved ? parseFloat(saved) : null;
    } catch (error) {
      return null;
    }
  }

  saveBestTime(time: number): void {
    try {
      localStorage.setItem('timerAttackBestTime', time.toString());
    } catch (error) {
      console.error('Error saving best time:', error);
    }
  }

  loadBestScore(): number {
    try {
      const saved = localStorage.getItem('timerAttackBestScore');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  saveBestScore(score: number): void {
    try {
      localStorage.setItem('timerAttackBestScore', score.toString());
    } catch (error) {
      console.error('Error saving best score:', error);
    }
  }

  // Getters
  isTimerMode(): boolean {
    return this.isActive;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  getBestScore(): number {
    return this.bestScore;
  }

  getBestTime(): number | null {
    return this.bestTime;
  }

  getCurrentPhase(): TimerPhase {
    return this.currentPhase;
  }

  isBurstActive(): boolean {
    return this.burstActive;
  }

  getScoreMultiplier(): number {
    return this.scoreMultiplier;
  }

  /**
   * Get phase multipliers for current phase
   */
  getPhaseMultipliers(): { speed: number; spawn: number } {
    switch (this.currentPhase) {
      case 'early':
        return { speed: 1.0, spawn: 1.0 };
      case 'mid':
        return { speed: 1.2, spawn: 1.15 };
      case 'final':
        return { speed: 1.4, spawn: 1.3 };
    }
  }

  /**
   * Get burst multipliers (only when burst is active)
   */
  getBurstMultipliers(): { speed: number; spawn: number } | null {
    if (!this.burstActive) return null;
    return { speed: 1.6, spawn: 1.5 };
  }
}

// Export for use in the application
export { TimerAttackMode };

// Auto-initialize (commented out as it's not currently integrated)
// if (typeof window !== 'undefined') {
//   document.addEventListener('DOMContentLoaded', () => {
//     new TimerAttackMode();
//     console.log('Timer Attack Mode system initialized');
//   });
// }

