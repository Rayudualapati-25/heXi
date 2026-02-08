/**
 * Daily Challenge System
 * Procedurally generates a unique challenge each day using date seed
 * Same challenge for all players worldwide
 */

interface DailyChallenge {
  id: string;
  date: string;
  type: string;
  name: string;
  icon: string;
  description: string;
  params: Record<string, number>;
  baseReward: number;
  streakBonus: number;
  totalReward: number;
  completed: boolean;
}

interface TrackingData {
  startTime: number;
  startScore: number;
  highestScore: number;
  combos: Array<{ size: number; timestamp: number }>;
  colorGroups: any[];
  livesLost: number;
  startingLives: number;
}

interface ChallengeType {
  id: string;
  name: string;
  icon: string;
  description: string;
  generateParams: () => Record<string, number>;
}

class DailyChallengeSystem {
  private currentChallenge: DailyChallenge | null = null;
  private challengeDate: string | null = null;
  private isActive: boolean = false;
  private completionStatus: Record<string, boolean>;
  private streakDays: number;
  private lastCompletionDate: string | null;
  private challengeTypes: ChallengeType[];
  private trackingData: TrackingData | null = null;
  private randomSeed: number = 0;

  constructor() {
    this.completionStatus = this.loadCompletionStatus();
    this.streakDays = this.loadStreak();
    this.lastCompletionDate = this.loadLastCompletion();
    
    this.challengeTypes = [
      {
        id: 'score_target',
        name: 'Score Target',
        icon: '🎯',
        description: 'Reach {target} points',
        generateParams: () => ({ target: this.randomRange(5000, 15000, 1000) })
      },
      {
        id: 'survival_time',
        name: 'Survival Challenge',
        icon: '⏰',
        description: 'Survive for {duration} seconds',
        generateParams: () => ({ duration: this.randomRange(120, 300, 30) })
      },
      {
        id: 'combo_master',
        name: 'Combo Master',
        icon: '🔥',
        description: 'Achieve {combos} combos of {size}+ blocks',
        generateParams: () => ({ 
          combos: this.randomRange(3, 8, 1), 
          size: this.randomRange(5, 10, 1) 
        })
      },
      {
        id: 'color_challenge',
        name: 'Color Challenge',
        icon: '🎨',
        description: 'Clear {clears} groups using only {colors} colors',
        generateParams: () => ({ 
          clears: this.randomRange(15, 30, 5),
          colors: this.randomRange(2, 4, 1)
        })
      },
      {
        id: 'no_life_loss',
        name: 'Perfect Run',
        icon: '💯',
        description: 'Reach {target} points without losing a life',
        generateParams: () => ({ target: this.randomRange(3000, 8000, 500) })
      },
      {
        id: 'speed_run',
        name: 'Speed Run',
        icon: '⚡',
        description: 'Reach {target} points in under {time} seconds',
        generateParams: () => ({ 
          target: this.randomRange(5000, 10000, 1000),
          time: this.randomRange(60, 120, 15)
        })
      }
    ];

    this.init();
  }

  init() {
    // Generate today's challenge
    this.generateTodaysChallenge();
    
    // Listen for challenge activation
    window.addEventListener('activateDailyChallenge', () => {
      this.activate();
    });

    // Listen for game events
    window.addEventListener('gameStart', () => {
      if (this.isActive) {
        this.startTracking();
      }
    });

    window.addEventListener('gameOver', () => {
      if (this.isActive) {
        this.checkCompletion();
      }
    });

    // Update streak on daily login
    this.checkDailyLogin();

    console.log('🎲 Daily Challenge System initialized');
    console.log(`📅 Today's challenge: ${this.currentChallenge?.name}`);
  }

  generateTodaysChallenge() {
    const today = this.getTodayString();
    
    // Check if we already generated today's challenge
    if (this.challengeDate === today && this.currentChallenge) {
      return this.currentChallenge;
    }

    // Use date as seed for random number generator
    const seed = this.dateToSeed(today);
    this.seedRandom(seed);

    // Select challenge type based on seeded random
    const typeIndex = Math.floor(this.seededRandom() * this.challengeTypes.length);
    const challengeType = this.challengeTypes[typeIndex];

    // Generate challenge parameters
    const params = challengeType.generateParams();

    // Create challenge object
    this.currentChallenge = {
      id: `${today}_${challengeType.id}`,
      date: today,
      type: challengeType.id,
      name: challengeType.name,
      icon: challengeType.icon,
      description: this.formatDescription(challengeType.description, params),
      params,
      baseReward: 500,
      streakBonus: this.streakDays >= 7 ? 500 : 0,
      totalReward: 500 + (this.streakDays >= 7 ? 500 : 0),
      completed: this.isCompletedToday()
    };

    this.challengeDate = today;
    
    return this.currentChallenge;
  }

  formatDescription(template: string, params: Record<string, number>): string {
    let result = template;
    Object.keys(params).forEach(key => {
      result = result.replace(`{${key}}`, String(params[key]));
    });
    return result;
  }

  activate() {
    this.isActive = true;
    this.trackingData = this.initTrackingData();
    console.log('🎲 Daily Challenge ACTIVATED:', this.currentChallenge?.name);
  }

  deactivate() {
    this.isActive = false;
    this.trackingData = null;
    console.log('🎲 Daily Challenge deactivated');
  }

  startTracking(): void {
    this.trackingData = this.initTrackingData();
    
    // Listen for relevant game events
    window.addEventListener('scoreUpdate', ((e: CustomEvent) => this.onScoreUpdate(e)) as EventListener);
    window.addEventListener('comboAchieved', ((e: CustomEvent) => this.onComboAchieved(e)) as EventListener);
    window.addEventListener('livesChanged', ((e: CustomEvent) => this.onLifeChanged(e)) as EventListener);
  }

  initTrackingData(): TrackingData {
    return {
      startTime: Date.now(),
      startScore: 0,
      highestScore: 0,
      combos: [],
      colorGroups: [],
      livesLost: 0,
      startingLives: 3
    };
  }

  onScoreUpdate(e: CustomEvent): void {
    if (!this.trackingData) return;
    
    const currentScore = e.detail?.score || 0;
    this.trackingData.highestScore = Math.max(this.trackingData.highestScore, currentScore);
  }

  onComboAchieved(e: CustomEvent): void {
    if (!this.trackingData) return;
    
    const combo = e.detail;
    if (combo && combo.count >= 3) {
      this.trackingData.combos.push({
        size: combo.count,
        timestamp: Date.now()
      });
    }
  }

  onLifeChanged(e: CustomEvent): void {
    if (!this.trackingData) return;
    
    if (e.detail && e.detail.currentLives < this.trackingData.startingLives) {
      this.trackingData.livesLost++;
      this.trackingData.startingLives = e.detail.currentLives;
    }
  }

  checkCompletion() {
    if (!this.currentChallenge || !this.trackingData) return false;

    const challenge = this.currentChallenge;
    let completed = false;

    switch (challenge.type) {
      case 'score_target':
        completed = this.trackingData.highestScore >= challenge.params.target;
        break;

      case 'survival_time':
        const timeElapsed = (Date.now() - this.trackingData.startTime) / 1000;
        completed = timeElapsed >= challenge.params.duration;
        break;

      case 'combo_master':
        const validCombos = this.trackingData.combos.filter(c => c.size >= challenge.params.size);
        completed = validCombos.length >= challenge.params.combos;
        break;

      case 'color_challenge':
        // Simplified - count all clears (would need more game integration for color tracking)
        completed = this.trackingData.combos.length >= challenge.params.clears;
        break;

      case 'no_life_loss':
        completed = this.trackingData.highestScore >= challenge.params.target && 
                   this.trackingData.livesLost === 0;
        break;

      case 'speed_run':
        const duration = (Date.now() - this.trackingData.startTime) / 1000;
        completed = this.trackingData.highestScore >= challenge.params.target && 
                   duration <= challenge.params.time;
        break;
    }

    if (completed && !this.isCompletedToday()) {
      this.onChallengeCompleted();
    }

    return completed;
  }

  onChallengeCompleted(): void {
    if (!this.currentChallenge) return;
    
    console.log('🎉 DAILY CHALLENGE COMPLETED!');
    
    // Mark as completed
    this.markCompleted();
    
    // Update streak
    this.updateStreak();
    
    // Award rewards - would need integration with game systems
    console.log(`Reward awarded: ${this.currentChallenge.totalReward} special points`);
    
    // Show completion notification
    this.showCompletionNotification();
  }

  showCompletionNotification(): void {
    if (!this.currentChallenge) return;
    
    const streakBonus = this.streakDays >= 7 ? ' (2x Streak Bonus!)' : '';
    console.log(`🎉 Challenge Complete! You earned ${this.currentChallenge.totalReward} special points!${streakBonus} 🔥 ${this.streakDays}-day streak!`);
  }

  checkDailyLogin() {
    const today = this.getTodayString();
    const lastLogin = localStorage.getItem('lastDailyLogin');
    
    if (lastLogin !== today) {
      localStorage.setItem('lastDailyLogin', today);
      console.log('📅 Daily login registered');
    }
  }

  updateStreak() {
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();
    
    if (this.lastCompletionDate === yesterday) {
      // Continue streak
      this.streakDays++;
    } else if (this.lastCompletionDate === today) {
      // Already completed today (shouldn't happen)
      return;
    } else {
      // Streak broken, reset
      this.streakDays = 1;
    }
    
    this.lastCompletionDate = today;
    this.saveStreak();
    this.saveLastCompletion();
    
    console.log(`🔥 Challenge streak: ${this.streakDays} days`);
  }

  // Seeded random number generator (for consistent daily challenges)
  seedRandom(seed: number): void {
    this.randomSeed = seed;
  }

  seededRandom(): number {
    const x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  }

  randomRange(min: number, max: number, step: number): number {
    const range = (max - min) / step;
    return min + Math.floor(this.seededRandom() * (range + 1)) * step;
  }

  dateToSeed(dateString: string): number {
    // Convert date string to numeric seed
    const parts = dateString.split('-').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }

  // Persistence
  markCompleted(): void {
    const today = this.getTodayString();
    this.completionStatus[today] = true;
    this.saveCompletionStatus();
  }

  isCompletedToday(): boolean {
    const today = this.getTodayString();
    return this.completionStatus[today] === true;
  }

  loadCompletionStatus(): Record<string, boolean> {
    try {
      const saved = localStorage.getItem('dailyChallengeCompletions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  }

  saveCompletionStatus(): void {
    try {
      localStorage.setItem('dailyChallengeCompletions', JSON.stringify(this.completionStatus));
    } catch (error) {
      console.error('Error saving completion status:', error);
    }
  }

  loadStreak(): number {
    try {
      const saved = localStorage.getItem('dailyChallengeStreak');
      return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  saveStreak(): void {
    try {
      localStorage.setItem('dailyChallengeStreak', this.streakDays.toString());
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  }

  loadLastCompletion(): string | null {
    try {
      return localStorage.getItem('lastChallengeCompletion');
    } catch (error) {
      return null;
    }
  }

  saveLastCompletion(): void {
    try {
      if (this.lastCompletionDate) {
        localStorage.setItem('lastChallengeCompletion', this.lastCompletionDate);
      }
    } catch (error) {
      console.error('Error saving last completion:', error);
    }
  }

  async syncCompletionToCloud(): Promise<void> {
    try {
      // This would require an Appwrite collection for daily challenges
      // For now, just log it
      console.log('☁️ Would sync challenge completion to cloud');
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  // Getters
  getCurrentChallenge(): DailyChallenge | null {
    return this.currentChallenge;
  }

  getStreak(): number {
    return this.streakDays;
  }

  isActiveChallengeMode(): boolean {
    return this.isActive;
  }
}

// Export for use in the application
export { DailyChallengeSystem, type DailyChallenge, type TrackingData };

// Auto-initialize (commented out as it's not currently integrated)
// if (typeof window !== 'undefined') {
//   document.addEventListener('DOMContentLoaded', () => {
//     new DailyChallengeSystem();
//     console.log('✅ Daily Challenge System initialized');
//   });
// }
