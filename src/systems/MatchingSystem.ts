/**
 * MatchingSystem - Detects and clears matching blocks
 * Ports logic from checking.js - flood fill algorithm
 */

import { Block } from '@entities/Block';
import { Hex } from '@entities/Hex';

interface BlockPosition {
  side: number;
  index: number;
}

export interface MatchResult {
  blocksCleared: number;
  score: number;
  combo: number;
  color: string;
  centerX: number;
  centerY: number;
}

export class MatchingSystem {
  private comboTime: number = 240; // Frames allowed for combo
  private lastComboFrame: number = 0;
  private comboMultiplier: number = 1;
  private creationSpeedModifier: number = 1;
  
  constructor(_speedModifier: number = 1, creationSpeedModifier: number = 1) {
    // speedModifier kept in signature for API compatibility
    this.creationSpeedModifier = creationSpeedModifier;
  }

  /**
   * Check for matches starting from a specific block
   */
  public checkMatches(hex: Hex, side: number, index: number, currentFrame: number): MatchResult | null {
    const blocks = hex.blocks;
    
    // Make sure block exists
    if (!blocks[side] || !blocks[side][index]) return null;
    if (blocks[side][index].deleted !== 0) return null;
    
    // Find all connected blocks of same color
    const deleting: BlockPosition[] = [];
    deleting.push({ side, index });
    
    this.floodFill(hex, side, index, deleting);
    
    // Need at least 3 blocks to clear
    if (deleting.length < 3) return null;
    
    // Mark all blocks as deleted
    const deletedBlocks: Block[] = [];
    const sidesChanged = new Set<number>();
    
    for (const pos of deleting) {
      if (blocks[pos.side] && blocks[pos.side][pos.index]) {
        blocks[pos.side][pos.index].deleted = 1;
        deletedBlocks.push(blocks[pos.side][pos.index]);
        sidesChanged.add(pos.side);
      }
    }
    
    // Check and update indestructible blocks' support status
    this.updateIndestructibleSupport(hex, sidesChanged);
    
    // Calculate score with combo multiplier
    const now = currentFrame;
    if (now - this.lastComboFrame < this.comboTime) {
      // Combo continues
      this.comboTime = (1 / this.creationSpeedModifier) * (2700 / 16.667) * 3;
      this.comboMultiplier += 1;
      this.lastComboFrame = now;
    } else {
      // New combo
      this.comboTime = 240;
      this.lastComboFrame = now;
      this.comboMultiplier = 1;
    }
    
    const score = deleting.length * deleting.length * this.comboMultiplier;
    
    // Find center of deleted blocks for text display
    const center = this.findCenterOfBlocks(deletedBlocks);
    
    return {
      blocksCleared: deleting.length,
      score,
      combo: this.comboMultiplier,
      color: deletedBlocks[0].color,
      centerX: center.x,
      centerY: center.y
    };
  }

  /**
   * Flood fill algorithm to find all connected blocks of same color
   */
  private floodFill(hex: Hex, side: number, index: number, deleting: BlockPosition[]): void {
    const blocks = hex.blocks;
    const sides = hex.sides;
    
    if (!blocks[side] || !blocks[side][index]) return;
    
    const color = blocks[side][index].color;
    
    // Check 4 adjacent positions (up, down, left, right)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        // Skip diagonals
        if (Math.abs(x) === Math.abs(y)) continue;
        
        // Calculate adjacent position
        const curSide = (side + x + sides) % sides;
        const curIndex = index + y;
        
        // Check if block exists at this position
        if (!blocks[curSide] || !blocks[curSide][curIndex]) continue;
        
        const block = blocks[curSide][curIndex];
        
        // Skip indestructible blocks that still have support
        if (block.isIndestructible && !block.supportCleared) continue;
        
        // Check if same color, not already found, and not deleted
        if (
          block.color === color &&
          !this.positionExists(deleting, curSide, curIndex) &&
          block.deleted === 0
        ) {
          // Add to list and recurse
          deleting.push({ side: curSide, index: curIndex });
          this.floodFill(hex, curSide, curIndex, deleting);
        }
      }
    }
  }

  /**
   * Check if position already exists in array
   */
  private positionExists(positions: BlockPosition[], side: number, index: number): boolean {
    return positions.some(pos => pos.side === side && pos.index === index);
  }

  /**
   * Find geometric center of a group of blocks
   * Original Hextris algorithm: averages polar coordinates then converts
   */
  private findCenterOfBlocks(blocks: Block[]): { x: number; y: number } {
    if (blocks.length === 0) return { x: 0, y: 0 };
    
    let avgDFH = 0; // Average distance from hex
    let avgAngle = 0; // Average angle
    
    for (const block of blocks) {
      avgDFH += block.distFromHex;
      
      // Normalize angle to [0, 360)
      let ang = block.angle;
      while (ang < 0) {
        ang += 360;
      }
      avgAngle += ang % 360;
    }
    
    avgDFH /= blocks.length;
    avgAngle /= blocks.length;
    
    // Convert averaged polar coordinates to Cartesian (relative to hex center)
    return {
      x: Math.cos(avgAngle * (Math.PI / 180)) * avgDFH,
      y: Math.sin(avgAngle * (Math.PI / 180)) * avgDFH
    };
  }

  /**
   * Check all blocks in hex for matches
   */
  public checkAllMatches(hex: Hex, currentFrame: number): MatchResult[] {
    const results: MatchResult[] = [];
    const blocks = hex.blocks;
    const sides = hex.sides;
    
    // Check each side
    for (let side = 0; side < sides; side++) {
      if (!blocks[side]) continue;
      
      // Check each block in side
      for (let index = 0; index < blocks[side].length; index++) {
        const block = blocks[side][index];
        if (block && block.deleted === 0 && block.checked === 0) {
          // Mark as checked to avoid duplicate checks
          block.checked = 1;
          
          const result = this.checkMatches(hex, side, index, currentFrame);
          if (result) {
            results.push(result);
          }
        }
      }
    }
    
    // Reset checked flags
    for (let side = 0; side < sides; side++) {
      if (!blocks[side]) continue;
      for (const block of blocks[side]) {
        if (block) block.checked = 0;
      }
    }
    
    return results;
  }

  /**
   * Reset combo state
   */
  public resetCombo(): void {
    this.comboMultiplier = 1;
    this.lastComboFrame = 0;
    this.comboTime = 240;
  }

  /**
   * Get current combo multiplier
   */
  public getComboMultiplier(): number {
    return this.comboMultiplier;
  }

  /**
   * Check if combo is active
   */
  public isComboActive(currentFrame: number): boolean {
    return currentFrame - this.lastComboFrame < this.comboTime;
  }
  
  /**
   * Update indestructible blocks' support status after blocks are cleared
   * Only evaluates during combo resolution phase (performance optimization)
   */
  private updateIndestructibleSupport(hex: Hex, affectedSides: Set<number>): void {
    const blocks = hex.blocks;
    
    // Only check lanes where blocks were deleted
    for (const side of affectedSides) {
      if (!blocks[side]) continue;
      
      // Scan from bottom to top (inner to outer)
      for (let index = 0; index < blocks[side].length; index++) {
        const block = blocks[side][index];
        
        // Skip non-indestructible or already cleared support
        if (!block || !block.isIndestructible || block.supportCleared) continue;
        
        // Check if block directly beneath (at index-1) is missing or deleted
        if (index === 0) {
          // Block at hex surface - always has support
          continue;
        }
        
        const blockBeneath = blocks[side][index - 1];
        if (!blockBeneath || blockBeneath.deleted !== 0) {
          // Support removed - make destructible
          block.supportCleared = true;
        }
      }
    }
  }
}

