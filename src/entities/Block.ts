/**
 * Block entity - Falling and attached blocks in the game
 * Ported from js/Block.js with TypeScript types
 */

import { rotatePoint } from '@utils/math';

export class Block {
  // Position and rotation
  public fallingLane: number;
  public attachedLane: number = 0;
  public angle: number;
  public targetAngle: number;
  public angularVelocity: number = 0;
  public distFromHex: number;

  // Dimensions
  public height: number;
  public width: number = 0;
  public widthWide: number = 0;

  // Visual properties
  public color: string;
  public opacity: number = 1;
  public tint: number = 0;

  // State flags
  public settled: boolean;
  public checked: number = 0;
  public deleted: number = 0; // 0: active, 1: deleting, 2: deleted
  public removed: boolean = false;
  public initializing: boolean = true;
  
  // Indestructible block mechanics
  public isIndestructible: boolean = false;
  public supportCleared: boolean = false; // True when block beneath is removed

  // Physics
  public iter: number; // Speed multiplier
  public dt: number = 1;

  // Initialization
  public ict: number; // Initial creation time
  public initLen: number;

  // Game settings reference
  private settings: {
    blockHeight: number;
    scale: number;
    prevScale: number;
    creationDt: number;
    startDist: number;
  };

  // Hex reference (for shake effects and timing)
  private hexRef: {
    ct: number;
    position: number;
    sides: number;
    blocks: Block[][];
    shakes: Array<{ lane: number; magnitude: number }>;
    gdx: number;
    gdy: number;
  };

  constructor(
    fallingLane: number,
    color: string,
    iter: number,
    distFromHex?: number,
    settled?: boolean,
    settings?: any,
    hexRef?: any
  ) {
    this.fallingLane = fallingLane;
    this.color = color;
    this.iter = iter;
    this.settled = settled !== undefined ? settled : false;
    this.angle = 90 - (30 + 60 * fallingLane);
    this.targetAngle = this.angle;

    // Use provided settings or defaults
    this.settings = settings || {
      blockHeight: 20,
      scale: 1,
      prevScale: 1,
      creationDt: 15,
      startDist: 340,
    };

    this.hexRef = hexRef || {
      ct: 0,
      position: 0,
      sides: 6,
      blocks: [],
      shakes: [],
      gdx: 0,
      gdy: 0,
    };

    this.height = this.settings.blockHeight;
    this.distFromHex = distFromHex || this.settings.startDist * this.settings.scale;
    this.ict = this.hexRef.ct;
    this.initLen = this.settings.creationDt;
  }

  /**
   * Increment opacity for deletion animation
   */
  public incrementOpacity(): void {
    if (this.deleted) {
      // Add shake when nearly deleted
      if (this.opacity >= 0.925) {
        let tLane = this.attachedLane - this.hexRef.position;
        tLane = this.hexRef.sides - tLane;
        while (tLane < 0) {
          tLane += this.hexRef.sides;
        }
        tLane %= this.hexRef.sides;

        this.hexRef.shakes.push({
          lane: tLane,
          magnitude: 3 * (window.devicePixelRatio || 1) * this.settings.scale,
        });
      }

      // Fade out
      this.opacity = this.opacity - 0.075 * this.dt;
      if (this.opacity <= 0) {
        this.opacity = 0;
        this.deleted = 2;
      }
    }
  }

  /**
   * Get the index of this block in its stack
   */
  public getIndex(): number {
    const parentArr = this.hexRef.blocks[this.attachedLane];
    for (let i = 0; i < parentArr.length; i++) {
      if (parentArr[i] === this) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Draw the block on canvas
   */
  public draw(ctx: CanvasRenderingContext2D, _attached: boolean = false, _index?: number): void {
    this.height = this.settings.blockHeight;

    // Update distance if scale changed
    if (Math.abs(this.settings.scale - this.settings.prevScale) > 0.000000001) {
      this.distFromHex *= this.settings.scale / this.settings.prevScale;
    }

    this.incrementOpacity();

    // CRITICAL: Only rotate ATTACHED blocks, not falling blocks
    // Original Hextris - falling blocks maintain their angle, only attached blocks rotate with hex
    if (this.settled || _attached) {
      // Update angular velocity (original uses 4, not 1.5)
      const angularVelocityConst = 4;
      if (this.angle > this.targetAngle) {
        this.angularVelocity -= angularVelocityConst * this.dt;
      } else if (this.angle < this.targetAngle) {
        this.angularVelocity += angularVelocityConst * this.dt;
      }

      // Snap to target angle
      if (Math.abs(this.angle - this.targetAngle + this.angularVelocity) <= Math.abs(this.angularVelocity)) {
        this.angle = this.targetAngle;
        this.angularVelocity = 0;
      } else {
        this.angle += this.angularVelocity;
      }
    }
    // Falling blocks keep their original angle (don't rotate with hex)

    // Calculate widths (original formula for perfect trapezoid fit)
    // These match the hexagon geometry to eliminate gaps
    this.width = (2 * this.distFromHex) / Math.sqrt(3);
    this.widthWide = (2 * (this.distFromHex + this.height)) / Math.sqrt(3);

    // Calculate 4-point trapezoid (original uses QUAD, not hexagon)
    let p1, p2, p3, p4;
    
    if (this.initializing) {
      // Block spawn animation - expand from center
      const rat = Math.min(1, (this.hexRef.ct - this.ict) / this.initLen);
      p1 = rotatePoint((-this.width / 2) * rat, this.height / 2, this.angle);
      p2 = rotatePoint((this.width / 2) * rat, this.height / 2, this.angle);
      p3 = rotatePoint((this.widthWide / 2) * rat, -this.height / 2, this.angle);
      p4 = rotatePoint((-this.widthWide / 2) * rat, -this.height / 2, this.angle);
      
      if (this.hexRef.ct - this.ict >= this.initLen) {
        this.initializing = false;
      }
    } else {
      p1 = rotatePoint(-this.width / 2, this.height / 2, this.angle);
      p2 = rotatePoint(this.width / 2, this.height / 2, this.angle);
      p3 = rotatePoint(this.widthWide / 2, -this.height / 2, this.angle);
      p4 = rotatePoint(-this.widthWide / 2, -this.height / 2, this.angle);
    }

    // Calculate block position (center of block, not inner edge)
    // CRITICAL: Original adds gdx/gdy for shake effects!
    const baseX = ctx.canvas.width / 2 + Math.sin((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + this.hexRef.gdx;
    const baseY = ctx.canvas.height / 2 - Math.cos((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + this.hexRef.gdy;

    // Draw simple trapezoid (original style) - no gaps
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    
    // Disable anti-aliasing for crisp edges (prevents gaps)
    ctx.imageSmoothingEnabled = false;
    
    ctx.beginPath();
    ctx.moveTo(Math.round(baseX + p1.x), Math.round(baseY + p1.y));
    ctx.lineTo(Math.round(baseX + p2.x), Math.round(baseY + p2.y));
    ctx.lineTo(Math.round(baseX + p3.x), Math.round(baseY + p3.y));
    ctx.lineTo(Math.round(baseX + p4.x), Math.round(baseY + p4.y));
    ctx.closePath();
    ctx.fill();

    // Draw white tint overlay when attaching
    if (this.tint) {
      ctx.fillStyle = '#FFF';
      ctx.globalAlpha = this.tint;
      ctx.beginPath();
      ctx.moveTo(Math.round(baseX + p1.x), Math.round(baseY + p1.y));
      ctx.lineTo(Math.round(baseX + p2.x), Math.round(baseY + p2.y));
      ctx.lineTo(Math.round(baseX + p3.x), Math.round(baseY + p3.y));
      ctx.lineTo(Math.round(baseX + p4.x), Math.round(baseY + p4.y));
      ctx.closePath();
      ctx.fill();
      
      this.tint -= 0.02 * this.dt;
      if (this.tint < 0) this.tint = 0;
    }
    
    // Draw indestructible glow overlay
    if (this.isIndestructible && !this.supportCleared) {
      const pulsePhase = (this.hexRef.ct * 0.05) % (Math.PI * 2);
      const glowIntensity = 0.2 + Math.sin(pulsePhase) * 0.15; // 0.05 to 0.35
      
      ctx.fillStyle = '#fbbf24'; // Amber glow
      ctx.globalAlpha = glowIntensity * this.opacity;
      ctx.beginPath();
      ctx.moveTo(Math.round(baseX + p1.x), Math.round(baseY + p1.y));
      ctx.lineTo(Math.round(baseX + p2.x), Math.round(baseY + p2.y));
      ctx.lineTo(Math.round(baseX + p3.x), Math.round(baseY + p3.y));
      ctx.lineTo(Math.round(baseX + p4.x), Math.round(baseY + p4.y));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Set references to game settings and hex
   */
  public setReferences(settings: any, hexRef: any): void {
    this.settings = settings;
    this.hexRef = hexRef;
    this.height = this.settings.blockHeight;
  }
  
  /**
   * Mark this block as indestructible
   * Indestructible blocks ignore combo clears until support is removed
   */
  public makeIndestructible(): void {
    this.isIndestructible = true;
    this.supportCleared = false;
  }
  
  /**
   * Check if this block can be destroyed
   */
  public canBeDestroyed(): boolean {
    return !this.isIndestructible || this.supportCleared;
  }
}

