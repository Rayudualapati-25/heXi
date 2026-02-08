/**
 * PowerUpSystem
 * Manages power-up spawning, collection, and activation
 */

class PowerUpSystem {
  constructor() {
    this.activePowerUps = []; // Power-ups currently falling
    this.inventory = {}; // Collected power-ups in inventory
    this.lastSpawnTime = 0;
    this.spawnCooldown = 30000; // 30 seconds between spawns
    this.comboThreshold = 10; // Combo needed to trigger spawn
    this.enabled = true;
    
    this.init();
  }

  /**
   * Initialize the power-up system
   */
  init() {
    // Listen for combo achievements
    document.addEventListener('comboAchieved', (e) => {
      if (e.detail.combo >= this.comboThreshold) {
        this.trySpawnPowerUp();
      }
    });

    // Listen for power-up collection
    document.addEventListener('powerUpCollected', (e) => {
      this.addToInventory(e.detail.type);
    });

    // Listen for activation requests
    document.addEventListener('keydown', (e) => {
      this.handleKeyPress(e);
    });

    console.log('✅ PowerUpSystem initialized');
  }

  /**
   * Update all active power-ups
   */
  update(dt) {
    if (!this.enabled) return;

    // Update each power-up
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      powerUp.update(dt);

      // Remove if collected or off-screen
      if (powerUp.shouldRemove()) {
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  /**
   * Render all active power-ups
   */
  render(ctx) {
    if (!this.enabled) return;

    this.activePowerUps.forEach(powerUp => {
      powerUp.render(ctx);
    });
  }

  /**
   * Try to spawn a power-up
   */
  trySpawnPowerUp() {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return;
    }

    // Only spawn if game is active
    if (gameState !== 1) {
      return;
    }

    // Spawn power-up
    this.spawnPowerUp();
    this.lastSpawnTime = now;
  }

  /**
   * Spawn a random power-up
   */
  spawnPowerUp() {
    // Random lane
    const lane = randInt(0, MainHex.sides);
    
    // Random type (for now, mostly hammers)
    const types = ['hammer', 'hammer', 'hammer', 'slowmo', 'shield'];
    const type = types[randInt(0, types.length)];
    
    // Create power-up
    const powerUp = new PowerUp(type, lane, settings.startDist * settings.scale);
    this.activePowerUps.push(powerUp);

    console.log(`🎁 Power-up spawned: ${type} on lane ${lane}`);
  }

  /**
   * Add power-up to inventory
   */
  addToInventory(type) {
    // Initialize if not exists
    if (!this.inventory[type]) {
      this.inventory[type] = 0;
    }

    // Add to inventory (max 3 of each type)
    if (this.inventory[type] < 3) {
      this.inventory[type]++;
      
      console.log(`📦 Power-up collected: ${type} (x${this.inventory[type]})`);
      
      // Update UI
      this.updateInventoryUI();
      
      // Show notification
      this.showInventoryNotification(type);
    }
  }

  /**
   * Use a power-up from inventory
   */
  usePowerUp(type) {
    if (!this.inventory[type] || this.inventory[type] <= 0) {
      console.warn(`No ${type} power-up in inventory`);
      return false;
    }

    // Consume power-up
    this.inventory[type]--;
    this.updateInventoryUI();

    // Activate effect
    this.activatePowerUp(type);

    console.log(`⚡ Power-up used: ${type} (${this.inventory[type]} remaining)`);
    return true;
  }

  /**
   * Activate power-up effect
   */
  activatePowerUp(type) {
    switch (type) {
      case 'hammer':
        this.activateHammer();
        break;
      case 'slowmo':
        this.activateSlowMo();
        break;
      case 'shield':
        this.activateShield();
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
    }
  }

  /**
   * Activate Hammer - Destroy nearest complete row
   */
  activateHammer() {
    if (!MainHex || !MainHex.blocks) {
      return;
    }

    // Find the lowest complete row
    let destroyed = 0;
    let bonusScore = 0;

    // Check each ring level
    for (let level = 1; level <= 10; level++) {
      const blocksAtLevel = MainHex.blocks.filter(b => {
        const blockLevel = Math.floor(b.distFromHex / (settings.blockHeight * settings.scale));
        return blockLevel === level && !b.deleted;
      });

      // Check if ring is complete (one block per side)
      if (blocksAtLevel.length >= MainHex.sides) {
        // Delete all blocks at this level
        blocksAtLevel.forEach(block => {
          block.deleted = 1;
          destroyed++;
        });

        // Calculate bonus
        bonusScore = destroyed * 50;
        break;
      }
    }

    if (destroyed > 0) {
      // Add bonus score
      if (window.score !== undefined) {
        score += bonusScore;
      }

      // Show effect
      this.showHammerEffect(destroyed, bonusScore);

      // Check for perfect clear
      const remainingBlocks = MainHex.blocks.filter(b => !b.deleted).length;
      if (remainingBlocks === 0) {
        this.handlePerfectClear();
      }
    } else {
      // No complete row found, refund power-up
      this.inventory['hammer']++;
      this.updateInventoryUI();
      
      if (typeof swal !== 'undefined') {
        swal({
          title: 'No Target!',
          text: 'No complete row to destroy. Hammer returned to inventory.',
          type: 'info',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }
  }

  /**
   * Show hammer destruction effect
   */
  showHammerEffect(blocksDestroyed, bonusScore) {
    // Screen shake
    if (MainHex && MainHex.shake) {
      MainHex.shake(10, 300);
    }

    // Show bonus text
    if (window.Text && window.texts) {
      const text = new Text(
        trueCanvas.width / 2,
        trueCanvas.height / 2,
        `🔨 ${blocksDestroyed} Blocks! +${bonusScore}`,
        '#f39c12',
        40
      );
      texts.push(text);
    }

    // Flash screen
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.style.backgroundColor = '#f39c12';
      overlay.style.opacity = '0.4';
      setTimeout(() => {
        overlay.style.opacity = '0';
      }, 300);
    }
  }

  /**
   * Handle perfect clear (all blocks destroyed)
   */
  handlePerfectClear() {
    console.log('🌟 PERFECT CLEAR!');

    // Award extra life
    if (window.lifeSystem) {
      window.lifeSystem.addLife();
    }

    // Show message
    if (typeof swal !== 'undefined') {
      swal({
        title: '🌟 PERFECT CLEAR! 🌟',
        text: 'All blocks destroyed! +1 Life!',
        type: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    }
  }

  /**
   * Activate Slow Motion
   */
  activateSlowMo() {
    // Reduce game speed for 15 seconds
    const originalSpeed = settings.scale;
    settings.scale *= 0.5;

    // Show notification
    if (typeof swal !== 'undefined') {
      swal({
        title: '⏱️ Slow Motion!',
        text: 'Time slowed for 15 seconds',
        type: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    }

    // Restore after 15 seconds
    setTimeout(() => {
      settings.scale = originalSpeed;
      console.log('⏱️ Slow motion ended');
    }, 15000);
  }

  /**
   * Activate Shield
   */
  activateShield() {
    // Grant temporary invulnerability
    if (window.lifeSystem) {
      window.lifeSystem.grantInvulnerability(10000); // 10 seconds
    }

    if (typeof swal !== 'undefined') {
      swal({
        title: '🛡️ Shield Active!',
        text: 'Protected for 10 seconds',
        type: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  /**
   * Update inventory UI
   */
  updateInventoryUI() {
    // Dispatch event for UI to update
    document.dispatchEvent(new CustomEvent('inventoryUpdated', {
      detail: { inventory: this.inventory }
    }));
  }

  /**
   * Show inventory notification
   */
  showInventoryNotification(type) {
    const icons = {
      hammer: '🔨',
      slowmo: '⏱️',
      shield: '🛡️'
    };
    
    const messages = {
      hammer: 'Press H to destroy a row!',
      slowmo: 'Press S for slow motion!',
      shield: 'Press D for shield!'
    };

    if (typeof swal !== 'undefined') {
      swal({
        title: `${icons[type]} ${type.toUpperCase()} Collected!`,
        text: messages[type] || 'Power-up added to inventory',
        type: 'success',
        timer: 2500,
        showConfirmButton: false
      });
    }
  }

  /**
   * Handle keyboard input
   */
  handleKeyPress(e) {
    if (gameState !== 1) return;

    switch (e.key.toLowerCase()) {
      case 'h':
        this.usePowerUp('hammer');
        break;
      case 's':
        this.usePowerUp('slowmo');
        break;
      case 'd':
        this.usePowerUp('shield');
        break;
    }
  }

  /**
   * Reset system (for new game)
   */
  reset() {
    this.activePowerUps = [];
    this.inventory = {};
    this.lastSpawnTime = 0;
    this.updateInventoryUI();
  }

  /**
   * Get inventory
   */
  getInventory() {
    return this.inventory;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.PowerUpSystem = PowerUpSystem;
  window.powerUpSystem = new PowerUpSystem();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PowerUpSystem;
}
