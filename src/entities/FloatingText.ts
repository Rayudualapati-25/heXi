/**
 * FloatingText entity - Animated score popups and messages
 * Displays text that fades out and floats upward
 */

export class FloatingText {
  public x: number;
  public y: number;
  public text: string;
  public color: string;
  public opacity: number = 1;
  public size: number;
  public lifetime: number;
  public maxLifetime: number;
  
  private vx: number = 0;
  private vy: number = -1; // Float upward
  private fadeRate: number = 0.02;

  constructor(x: number, y: number, text: string, color: string = '#ffffff', size: number = 24) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.maxLifetime = 60; // 1 second at 60fps
    this.lifetime = this.maxLifetime;
  }

  /**
   * Update text position and opacity
   * @returns false when text should be removed
   */
  public update(dt: number): boolean {
    // Move text
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Fade out
    this.opacity -= this.fadeRate * dt;
    this.lifetime -= dt;

    // Remove when fully faded or lifetime expired
    return this.opacity > 0 && this.lifetime > 0;
  }

  /**
   * Draw the floating text
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px 'Exo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text with shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }

  /**
   * Create a score popup
   */
  public static createScore(x: number, y: number, score: number, color: string = '#2ecc71'): FloatingText {
    return new FloatingText(x, y, `+${score}`, color, 28);
  }

  /**
   * Create a combo popup
   */
  public static createCombo(x: number, y: number, combo: number): FloatingText {
    const text = combo > 1 ? `COMBO x${combo}!` : 'COMBO!';
    const color = combo > 3 ? '#f39c12' : '#3498db';
    return new FloatingText(x, y, text, color, 32);
  }

  /**
   * Create a message popup
   */
  public static createMessage(x: number, y: number, message: string, color: string = '#ffffff'): FloatingText {
    return new FloatingText(x, y, message, color, 24);
  }

  /**
   * Create a life lost popup
   */
  public static createLifeLost(x: number, y: number): FloatingText {
    return new FloatingText(x, y, '❤️ LOST', '#e74c3c', 36);
  }

  /**
   * Create a life gained popup
   */
  public static createLifeGained(x: number, y: number): FloatingText {
    return new FloatingText(x, y, '❤️ +1 LIFE', '#2ecc71', 36);
  }

  /**
   * Create a power-up collected popup
   */
  public static createPowerUp(x: number, y: number, powerUpName: string): FloatingText {
    return new FloatingText(x, y, powerUpName.toUpperCase(), '#f1c40f', 28);
  }
}
