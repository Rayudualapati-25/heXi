/**
 * SpecialPointsSystem
 * Manages special points economy - earning and spending
 */

class SpecialPointsSystem {
  constructor() {
    this.points = 1000; // Start with 1000 diamonds
    this.userId = null;
    this.earningRules = {
      scorePoints: 100,        // 1 point per 100 score
      gameComplete: 50,        // 50 points per game completed
      dailyLogin: 100,         // 100 points for daily login
      highScoreBeat: 200,      // 200 points for new high score
      perfectClear: 150        // 150 points for perfect clear
    };
    
    this.shop = {
      continue: { cost: 500, name: 'Continue Game', icon: '🔄' },
      extraLife: { cost: 300, name: 'Extra Life', icon: '❤️' },
      hammer: { cost: 200, name: 'Hammer Power-up', icon: '🔨' },
      slowmo: { cost: 150, name: 'Slow Motion', icon: '⏱️' },
      shield: { cost: 250, name: 'Shield', icon: '🛡️' }
    };
    
    this.init();
  }

  /**
   * Initialize system
   */
  init() {
    // Load points from localStorage or use initial 1000
    const saved = localStorage.getItem('specialPoints');
    if (saved !== null) {
      this.points = parseInt(saved, 10) || 1000;
    } else {
      // First time - give them 1000 points
      this.points = 1000;
      this.savePoints();
    }

    // Listen for events
    document.addEventListener('scoreUpdated', (e) => {
      this.onScoreUpdate(e.detail);
    });

    document.addEventListener('gameEnded', (e) => {
      this.onGameEnd(e.detail);
    });

    document.addEventListener('perfectClear', () => {
      this.awardPoints(this.earningRules.perfectClear, 'Perfect Clear!');
    });

    document.addEventListener('userLoggedIn', (e) => {
      this.onUserLogin(e.detail.user);
    });

    console.log(`✅ SpecialPointsSystem initialized (${this.points} points)`);
  }

  /**
   * Award points to player
   */
  awardPoints(amount, reason = '') {
    this.points += amount;
    this.save();
    
    console.log(`💎 +${amount} special points ${reason ? `(${reason})` : ''}`);
    
    // Show notification
    this.showPointsNotification(amount, reason);
    
    // Dispatch event for transaction history
    window.dispatchEvent(new CustomEvent('specialPointsEarned', {
      detail: { amount, reason: reason || 'Points earned' }
    }));
    
    // Update UI
    this.updateUI();
    
    // Sync to Appwrite
    this.syncToCloud();
  }

  /**
   * Spend points
   */
  spendPoints(amount, item = '') {
    if (this.points < amount) {
      return false;
    }
    
    this.points -= amount;
    this.save();
    
    console.log(`💎 -${amount} special points ${item ? `(${item})` : ''}`);
    
    // Dispatch event for transaction history
    window.dispatchEvent(new CustomEvent('specialPointsSpent', {
      detail: { amount, item: item || 'Item purchased' }
    }));
    
    // Update UI
    this.updateUI();
    
    // Sync to Appwrite
    this.syncToCloud();
    
    return true;
  }

  /**
   * Handle score update
   */
  onScoreUpdate(detail) {
    const score = detail.score || 0;
    const previousScore = detail.previousScore || 0;
    const threshold = this.earningRules.scorePoints;
    
    // Calculate how many thresholds were crossed
    const currentThresholds = Math.floor(score / threshold);
    const previousThresholds = Math.floor(previousScore / threshold);
    
    if (currentThresholds > previousThresholds) {
      const earned = currentThresholds - previousThresholds;
      this.awardPoints(earned, `${earned} point${earned > 1 ? 's' : ''} earned`);
      console.log(`Special Points: Awarded ${earned} for reaching ${score} score`);
    }
  }

  /**
   * Handle game end
   */
  onGameEnd(detail) {
    // Award points for completing game
    this.awardPoints(this.earningRules.gameComplete, 'Game completed');
    
    // Bonus for new high score
    if (detail.newHighScore) {
      this.awardPoints(this.earningRules.highScoreBeat, 'New high score!');
    }
  }

  /**
   * Handle user login
   */
  async onUserLogin(user) {
    this.userId = user.$id;
    
    // Load points from Appwrite
    if (window.appwriteClient && user.specialPoints !== undefined) {
      this.points = user.specialPoints;
      this.save();
      this.updateUI();
    }
    
    // Award daily login bonus
    this.checkDailyLogin();
  }

  /**
   * Check and award daily login bonus
   */
  checkDailyLogin() {
    const lastLogin = localStorage.getItem('lastDailyLogin');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
      this.awardPoints(this.earningRules.dailyLogin, 'Daily login bonus!');
      localStorage.setItem('lastDailyLogin', today);
    }
  }

  /**
   * Purchase item from shop
   */
  purchase(itemId) {
    const item = this.shop[itemId];
    if (!item) {
      console.error(`Unknown shop item: ${itemId}`);
      return false;
    }
    
    if (this.points < item.cost) {
      this.showInsufficientPointsMessage(item);
      return false;
    }
    
    // Confirm purchase
    if (typeof swal !== 'undefined') {
      swal({
        title: `Purchase ${item.name}?`,
        text: `Cost: ${item.cost} special points\nYour balance: ${this.points} points`,
        type: 'info',
        showCancelButton: true,
        confirmButtonText: 'Buy',
        cancelButtonText: 'Cancel'
      }, (confirmed) => {
        if (confirmed) {
          if (this.spendPoints(item.cost, item.name)) {
            this.deliverItem(itemId, item);
          }
        }
      });
    } else {
      // Direct purchase without dialog
      if (this.spendPoints(item.cost, item.name)) {
        this.deliverItem(itemId, item);
      }
    }
    
    return true;
  }

  /**
   * Deliver purchased item
   */
  deliverItem(itemId, item) {
    switch (itemId) {
      case 'continue':
        // Continue is handled by game over screen
        document.dispatchEvent(new CustomEvent('continueGamePurchased'));
        break;
        
      case 'extraLife':
        if (window.lifeSystem) {
          window.lifeSystem.addLife();
          console.log('✅ Extra life purchased and added!');
        } else {
          console.error('❌ Life system not available');
        }
        break;
        
      case 'hammer':
      case 'slowmo':
      case 'shield':
        if (window.powerUpSystem) {
          window.powerUpSystem.addToInventory(itemId);
        }
        break;
    }
    
    // Show success message
    if (typeof swal !== 'undefined') {
      swal({
        title: `${item.icon} ${item.name} Purchased!`,
        text: 'Item added to your inventory',
        type: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  /**
   * Show insufficient points message
   */
  showInsufficientPointsMessage(item) {
    const needed = item.cost - this.points;
    
    if (typeof swal !== 'undefined') {
      swal({
        title: 'Not Enough Points',
        text: `You need ${needed} more special points to purchase ${item.name}.`,
        type: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }

  /**
   * Show points notification
   */
  showPointsNotification(amount, reason) {
    // Create floating text in game
    if (window.Text && window.texts && typeof trueCanvas !== 'undefined') {
      const text = new Text(
        trueCanvas.width / 2,
        trueCanvas.height / 2 - 100,
        `+${amount} 💎 ${reason}`,
        '#ffd700',
        25
      );
      texts.push(text);
    }
  }

  /**
   * Save points to localStorage
   */
  save() {
    localStorage.setItem('specialPoints', this.points.toString());
  }

  /**
   * Sync points to Appwrite
   */
  async syncToCloud() {
    if (!this.userId || !window.appwriteClient) {
      return;
    }
    
    try {
      await window.appwriteClient.updateSpecialPoints(this.userId, this.points);
    } catch (err) {
      console.warn('Failed to sync special points:', err);
    }
  }

  /**
   * Update UI
   */
  updateUI() {
    // Dispatch event for UI components
    document.dispatchEvent(new CustomEvent('specialPointsUpdated', {
      detail: { points: this.points }
    }));
  }

  /**
   * Get current points
   */
  getPoints() {
    return this.points;
  }

  /**
   * Get shop items
   */
  getShop() {
    return this.shop;
  }

  /**
   * Check if can afford item
   */
  canAfford(itemId) {
    const item = this.shop[itemId];
    return item && this.points >= item.cost;
  }
}

// Export for future use
export { SpecialPointsSystem };

// Auto-initialization commented out - not currently integrated
// if (typeof window !== 'undefined') {
//   new SpecialPointsSystem();
// }
