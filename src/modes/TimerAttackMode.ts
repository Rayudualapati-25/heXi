/**
 * Timer Attack Mode
 * Race against the clock - survive for 90 seconds and maximize score
 */

class TimerAttackMode {
  private isActive: boolean = false;
  private timeLimit: number = 90; // 90 seconds
  private timeRemaining: number;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private startTime: number | null = null;
  private isPaused: boolean = false;
  private bestTime: number | null;
  private bestScore: number;
  
  constructor(timeLimit: number = 90) {
    this.timeLimit = timeLimit;
    this.timeRemaining = this.timeLimit;
    this.bestTime = this.loadBestTime();
    this.bestScore = this.loadBestScore();
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

    console.log('⏱️ Timer Attack Mode initialized');
  }

  activate() {
    this.isActive = true;
    this.timeRemaining = this.timeLimit;
    console.log('⏱️ Timer Attack Mode ACTIVATED');
    
    // Show mode indicator
    this.showModeIndicator();
  }

  deactivate() {
    this.isActive = false;
    this.stop();
    this.hideModeIndicator();
    console.log('⏱️ Timer Attack Mode deactivated');
  }

  start() {
    if (!this.isActive || this.timerId) return;

    this.startTime = Date.now();
    this.timeRemaining = this.timeLimit;
    this.isPaused = false;

    // Start countdown
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 100); // Update every 100ms for smooth display

    console.log('⏱️ Timer started!');
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
    this.timeRemaining = Math.max(0, this.timeLimit - elapsed);

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
    console.log('⏱️ TIME UP! Final score:', finalScore);
    
    // Dispatch time up event
    window.dispatchEvent(new CustomEvent('timerModeTimeUp', {
      detail: { score: finalScore, survived: true }
    }));
  }

  end(): void {
    // Called when player dies before time runs out
    const timeElapsed = this.timeLimit - this.timeRemaining;
    const finalScore = this.calculateFinalScore(0);
    
    this.stop();
    
    console.log(`⏱️ Game ended at ${timeElapsed.toFixed(1)}s. Score: ${finalScore}`);
    
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
    const timeElapsed = this.timeLimit - this.timeRemaining;
    const timeBonus = Math.floor(timeElapsed * 100);
    
    // Completion bonus if survived full time
    const completionBonus = this.timeRemaining <= 0 ? 5000 : 0;
    
    finalScore += timeBonus + completionBonus;
    
    console.log(`⏱️ Score breakdown: Base=${currentScore}, Time bonus=${timeBonus}, Completion=${completionBonus}`);
    
    return finalScore;
  }

  checkNewBest(finalScore: number): void {
    // Check best score
    if (finalScore > this.bestScore) {
      this.bestScore = finalScore;
      this.saveBestScore(finalScore);
      
      console.log('🏆 NEW TIMER ATTACK RECORD:', finalScore);
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
      document.body.appendChild(timerDisplay);
    }
    timerDisplay.style.display = 'block';

    // Show mode badge
    let modeBadge = document.getElementById('timer-mode-badge');
    if (!modeBadge) {
      modeBadge = document.createElement('div');
      modeBadge.id = 'timer-mode-badge';
      modeBadge.className = 'timer-mode-badge';
      modeBadge.innerHTML = '⏱️ TIMER ATTACK';
      document.body.appendChild(modeBadge);
    }
    modeBadge.style.display = 'block';
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
}

// Export for use in the application
export { TimerAttackMode };

// Auto-initialize (commented out as it's not currently integrated)
// if (typeof window !== 'undefined') {
//   document.addEventListener('DOMContentLoaded', () => {
//     new TimerAttackMode();
//     console.log('✅ Timer Attack Mode system initialized');
//   });
// }
