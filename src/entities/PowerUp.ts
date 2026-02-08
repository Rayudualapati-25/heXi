// @ts-nocheck
/**
 * PowerUp Base Class
 * Base entity for all power-up types in the game
 */

class PowerUp {
  constructor(type, lane, distFromHex) {
    this.type = type; // 'hammer', 'slowmo', 'shield', etc.
    this.lane = lane;
    this.angle = 90 - (30 + 60 * lane);
    this.distFromHex = distFromHex || settings.startDist * settings.scale;
    this.speed = 1.5; // Falling speed
    this.width = 30 * settings.scale;
    this.height = 30 * settings.scale;
    this.collected = false;
    this.removed = false;
    this.opacity = 1;
    this.glowPhase = 0; // For pulsing glow effect
    
    // Visual properties per type
    this.icon = this.getIcon();
    this.color = this.getColor();
  }

  /**
   * Get icon for power-up type
   */
  getIcon() {
    const icons = {
      hammer: '🔨',
      slowmo: '⏱️',
      shield: '🛡️',
      star: '⭐',
      lightning: '⚡'
    };
    return icons[this.type] || '❓';
  }

  /**
   * Get color for power-up type
   */
  getColor() {
    const colors = {
      hammer: '#f39c12',
      slowmo: '#3498db',
      shield: '#2ecc71',
      star: '#ffd700',
      lightning: '#f1c40f'
    };
    return colors[this.type] || '#95a5a6';
  }

  /**
   * Update power-up position (fall toward center)
   */
  update(dt) {
    if (this.collected || this.removed) {
      return;
    }

    // Fall toward center
    this.distFromHex -= this.speed * dt * settings.scale;

    // Update glow effect
    this.glowPhase += dt * 5;

    // Check if reached center hex
    if (this.distFromHex <= MainHex.sideLength / 2 + 10 * settings.scale) {
      this.onCollect();
    }

    // Check if passed center (missed)
    if (this.distFromHex < -50 * settings.scale) {
      this.removed = true;
    }
  }

  /**
   * Called when power-up is collected
   */
  onCollect() {
    if (this.collected) return;
    
    this.collected = true;
    
    // Dispatch collection event
    document.dispatchEvent(new CustomEvent('powerUpCollected', {
      detail: { type: this.type, powerUp: this }
    }));

    // Visual feedback
    this.showCollectionEffect();
    
    // Play sound if available
    if (window.sounds && window.sounds.powerUp) {
      window.sounds.powerUp.play();
    }
  }

  /**
   * Show collection visual effect
   */
  showCollectionEffect() {
    // Create floating text
    if (window.Text) {
      const text = new Text(
        trueCanvas.width / 2,
        trueCanvas.height / 2,
        `+${this.icon} ${this.type.toUpperCase()}!`,
        this.color,
        30
      );
      if (window.texts) {
        window.texts.push(text);
      }
    }

    // Screen flash effect
    this.flashScreen(this.color);
  }

  /**
   * Flash screen with color
   */
  flashScreen(color) {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.style.backgroundColor = color;
      overlay.style.opacity = '0.3';
      setTimeout(() => {
        overlay.style.opacity = '0';
      }, 200);
    }
  }

  /**
   * Render the power-up
   */
  render(ctx) {
    if (this.collected || this.removed) {
      return;
    }

    ctx.save();

    // Calculate position
    const x = trueCanvas.width / 2 + this.distFromHex * Math.cos(this.angle * (Math.PI / 180));
    const y = trueCanvas.height / 2 + this.distFromHex * Math.sin(this.angle * (Math.PI / 180));

    // Pulsing glow effect
    const glowIntensity = 0.7 + Math.sin(this.glowPhase) * 0.3;
    
    // Draw glow
    ctx.shadowBlur = 20 * settings.scale * glowIntensity;
    ctx.shadowColor = this.color;

    // Draw background circle
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.3 * glowIntensity;
    ctx.beginPath();
    ctx.arc(x, y, this.width * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw main circle
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.width, 0, Math.PI * 2);
    ctx.fill();

    // Draw icon
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `${this.width * 1.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, x, y);

    ctx.restore();
  }

  /**
   * Check if power-up should be removed
   */
  shouldRemove() {
    return this.removed || this.collected;
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.PowerUp = PowerUp;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PowerUp;
}
