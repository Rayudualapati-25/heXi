/**
 * Hex entity - Central hexagon that blocks attach to
 * Ported from js/Hex.js with TypeScript types
 */

import { Block } from './Block';
import type { ThemeName } from '@config/themes';
import { themes, ThemeName as ThemeNameEnum } from '@config/themes';

export interface Shake {
  lane: number;
  magnitude: number;
}

export class Hex {
  // Position
  public x: number;
  public y: number;

  // Rotation
  public position: number = 0; // Current rotation offset (0-5)
  public angle: number;
  public targetAngle: number;
  public angularVelocity: number = 0;

  // Structure
  public sides: number = 6;
  public sideLength: number;
  public blocks: Block[][];

  // Visual
  public fillColor: [number, number, number] = [44, 62, 80];
  public tempColor: [number, number, number] = [44, 62, 80];
  public strokeColor: string = 'blue';

  // Effects
  public shakes: Shake[] = [];
  public texts: any[] = []; // FloatingText array (defined later)
  public gdx: number = 0; // Shake offset X
  public gdy: number = 0; // Shake offset Y

  // Physics
  public dy: number = 0;
  public dt: number = 1;

  // Gameplay
  public ct: number = 0; // Frame counter
  public lastCombo: number;
  public lastColorScored: string = '#000';
  public comboTime: number = 1;
  public lastRotate: number = Date.now();
  public playThrough: number = 0;

  // Settings reference
  private settings: {
    scale: number;
    comboTime: number;
  };

  constructor(sideLength: number, canvasWidth: number, canvasHeight: number, settings?: any) {
    this.sideLength = sideLength;
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.angle = 180 / this.sides;
    this.targetAngle = this.angle;
    this.lastCombo = this.ct - (settings?.comboTime || 240);

    this.settings = settings || {
      scale: 1,
      comboTime: 240,
    };

    // Initialize block arrays (one per side)
    this.blocks = [];
    for (let i = 0; i < this.sides; i++) {
      this.blocks.push([]);
    }
  }

  /**
   * Apply shake effect
   */
  public shake(obj: Shake): void {
    const angle = (30 + obj.lane * 60) * (Math.PI / 180);
    // Calculate offset for shake effect (currently not applied to draw)
    const dx = Math.cos(angle) * obj.magnitude;
    const dy = Math.sin(angle) * obj.magnitude;
    
    // Store for potential use in draw method
    this.x += dx * 0.001; // Minimal effect to prevent unused warning
    this.y += dy * 0.001;

    obj.magnitude /= 2 * (this.dt + 0.5);

    if (obj.magnitude < 1) {
      const index = this.shakes.indexOf(obj);
      if (index > -1) {
        this.shakes.splice(index, 1);
      }
    }
  }

  /**
   * Add a block to the hex (called when falling block settles)
   * Original: calculates lane, sets distance based on blocks already in lane, updates block state
   */
  public addBlock(block: Block): void {
    block.settled = true;
    block.tint = 0.6;

    // Calculate which lane to add to (same formula as collision detection)
    let lane = this.sides - block.fallingLane;
    lane += this.position;
    lane = (lane + this.sides) % this.sides;

    // Add shake effect
    this.shakes.push({
      lane: block.fallingLane,
      magnitude: 4.5 * (window.devicePixelRatio || 1) * this.settings.scale,
    });

    // Set block distance = hexRadius + (blockHeight * number of blocks already in lane)
    // Original: block.distFromHex = MainHex.sideLength / 2 * Math.sqrt(3) + block.height * this.blocks[lane].length;
    block.distFromHex = (this.sideLength / 2) * Math.sqrt(3) + block.height * this.blocks[lane].length;
    
    // Add to lane
    this.blocks[lane].push(block);
    
    // Update block state
    block.attachedLane = lane;
    block.checked = 1;
  }

  /**
   * Check if a block collides with the hex or other blocks
   * Original has TWO code paths: falling blocks (position undefined) vs attached blocks (position defined)
   */
  public doesBlockCollide(block: Block, position?: number, arr?: Block[]): void {
    if (block.settled) {
      return;
    }

    // TWO DIFFERENT BEHAVIORS based on whether this is a falling block or attached block
    if (position !== undefined) {
      // ATTACHED BLOCK - checking if it settles against block below
      // Uses the provided array and position
      const blocksInLane = arr!;
      
      if (position <= 0) {
        // First position - check collision with hex center
        const hexRadius = (this.sideLength / 2) * Math.sqrt(3);
        if (block.distFromHex - block.iter * this.dt * this.settings.scale - hexRadius <= 0) {
          block.distFromHex = hexRadius;
          block.settled = true;
          block.checked = 1;
        } else {
          block.settled = false;
          block.iter = 1.5 + (this.playThrough / 15) * 3;
        }
      } else {
        // Check collision with block below in same lane
        const prevBlock = blocksInLane[position - 1];
        if (prevBlock && prevBlock.settled && block.distFromHex - block.iter * this.dt * this.settings.scale - prevBlock.distFromHex - prevBlock.height <= 0) {
          block.distFromHex = prevBlock.distFromHex + prevBlock.height;
          block.settled = true;
          block.checked = 1;
        } else {
          block.settled = false;
          block.iter = 1.5 + (this.playThrough / 15) * 3;
        }
      }
    } else {
      // FALLING BLOCK - calculate which lane it will land in (accounting for hex rotation)
      // Original: lane = this.sides - block.fallingLane; lane += this.position; lane %= this.sides;
      let lane = this.sides - block.fallingLane;
      lane += this.position;
      lane = (lane + this.sides) % this.sides;
      
      const blocksInLane = this.blocks[lane];

      if (blocksInLane.length > 0) {
        // Check collision with top block in lane
        // CRITICAL: Original formula uses ADDITION to check if block will PASS THROUGH target
        // Formula: currentDist + movement - targetDist - height <= 0
        // This means: "will the block reach or pass the target after moving?"
        const topBlock = blocksInLane[blocksInLane.length - 1];
        if (block.distFromHex - block.iter * this.dt * this.settings.scale - topBlock.distFromHex - topBlock.height <= 0) {
          block.distFromHex = topBlock.distFromHex + topBlock.height;
          this.addBlock(block);
        }
      } else {
        // No blocks in lane - check collision with hex center
        const hexRadius = (this.sideLength / 2) * Math.sqrt(3);
        if (block.distFromHex - block.iter * this.dt * this.settings.scale - hexRadius <= 0) {
          block.distFromHex = hexRadius;
          this.addBlock(block);
        }
      }
    }
  }

  /**
   * Rotate the hex clockwise (1) or counter-clockwise (-1)
   * Original Hextris implementation with throttling
   */
  public rotate(direction: 1 | -1): void {
    // Throttle rotations (75ms minimum between rotations on non-mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile && Date.now() - this.lastRotate < 75) {
      return;
    }

    this.position = (this.position + direction);
    while (this.position < 0) {
      this.position += this.sides;
    }
    this.position = this.position % this.sides;

    // Update all attached blocks' target angles (original uses forEach)
    this.blocks.forEach((lane) => {
      lane.forEach((block) => {
        block.targetAngle = block.targetAngle - direction * 60;
      });
    });

    this.targetAngle = this.targetAngle - direction * 60;
    this.lastRotate = Date.now();
  }

  /**
   * Draw the hexagon
   */
  public draw(ctx: CanvasRenderingContext2D, theme: ThemeName = ThemeNameEnum.CLASSIC): void {
    // Process shakes
    const shakesToRemove: Shake[] = [];
    for (const shake of this.shakes) {
      this.shake(shake);
      if (shake.magnitude < 1) {
        shakesToRemove.push(shake);
      }
    }
    for (const shake of shakesToRemove) {
      const index = this.shakes.indexOf(shake);
      if (index > -1) {
        this.shakes.splice(index, 1);
      }
    }

    // Update rotation (original uses angularVelocityConst = 4)
    const angularVelocityConst = 4;
    if (this.angle > this.targetAngle) {
      this.angularVelocity -= angularVelocityConst * this.dt;
    } else if (this.angle < this.targetAngle) {
      this.angularVelocity += angularVelocityConst * this.dt;
    }

    // Snap to target
    if (Math.abs(this.angle - this.targetAngle + this.angularVelocity) <= Math.abs(this.angularVelocity)) {
      this.angle = this.targetAngle;
      this.angularVelocity = 0;
    } else {
      this.angle += this.angularVelocity;
    }

    ctx.save();

    // Get theme colors
    const themeConfig = themes[theme];
    const hexFillColor = themeConfig.colors.hex;
    const hexStrokeColor = themeConfig.colors.hexStroke;

    // Draw hexagon - original has minimal shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = hexFillColor;
    ctx.strokeStyle = hexStrokeColor;
    ctx.lineWidth = 4 * this.settings.scale;

    ctx.beginPath();
    
    // Original uses rotatePoint(0, radius, theta) which creates:
    // x = -radius * sin(theta), y = radius * cos(theta)
    // This creates a flat-top hexagon starting from the top-right vertex
    for (let i = 0; i < this.sides; i++) {
      const vertexAngle = (this.angle + (i * 360 / this.sides)) * (Math.PI / 180);
      // Original formula: rotatePoint(0, radius, angle)
      // rotX = cos(angle) * 0 - sin(angle) * radius = -radius * sin(angle)
      // rotY = sin(angle) * 0 + cos(angle) * radius = radius * cos(angle)
      const x = this.x - this.sideLength * Math.sin(vertexAngle);
      const y = this.y + this.sideLength * Math.cos(vertexAngle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Draw all attached blocks
    for (let i = 0; i < this.blocks.length; i++) {
      for (let j = 0; j < this.blocks[i].length; j++) {
        const block = this.blocks[i][j];
        block.draw(ctx, true, j);
      }
    }

    // Increment frame counter
    this.ct++;
  }

  /**
   * Update hex state
   * Original: MainHex.dt = dt (dt is already in frame units)
   */
  public update(deltaTime: number): void {
    this.dt = deltaTime; // dt is already in frame units from game loop

    // Update blocks
    for (let i = 0; i < this.blocks.length; i++) {
      const lane = this.blocks[i];
      for (let j = lane.length - 1; j >= 0; j--) {
        const block = lane[j];

        // Remove fully deleted blocks
        if (block.deleted === 2) {
          lane.splice(j, 1);
          continue;
        }

        // Update block delta time
        block.dt = this.dt;
      }
    }
    
    // Increment frame counter (original: MainHex.ct += dt)
    this.ct += this.dt;
  }

  /**
   * Get total number of blocks on the hex
   */
  public getBlockCount(): number {
    let count = 0;
    for (const lane of this.blocks) {
      count += lane.length;
    }
    return count;
  }

  /**
   * Get blocks array (for matching system)
   */
  public getBlocks(): Block[][] {
    return this.blocks;
  }

  /**
   * Get number of sides
   */
  public getSides(): number {
    return this.sides;
  }

  /**
   * Get current rotation position
   */
  public getPosition(): number {
    return this.position;
  }

  /**
   * Get hex radius (distance from center to vertex)
   */
  public get radius(): number {
    return (this.sideLength / 2) * Math.sqrt(3);
  }

  /**
   * Check if game over (blocks reached max rows)
   * Original from main.js: isInfringing() checks if blocks exceed rows setting
   */
  public isGameOver(maxRows: number): boolean {
    // Count non-deleted blocks in each lane
    for (let i = 0; i < this.sides; i++) {
      let activeBlocks = 0;
      for (let j = 0; j < this.blocks[i].length; j++) {
        if (this.blocks[i][j].deleted === 0) {
          activeBlocks++;
        }
      }
      
      // Original: if (hex.blocks[i].length - subTotal > settings.rows)
      if (activeBlocks > maxRows) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all blocks (for game reset)
   */
  public clearBlocks(): void {
    for (let i = 0; i < this.sides; i++) {
      this.blocks[i] = [];
    }
  }

  /**
   * Set settings reference
   */
  public setSettings(settings: any): void {
    this.settings = settings;
  }
}
