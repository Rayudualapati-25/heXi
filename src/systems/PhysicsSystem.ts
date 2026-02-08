/**
 * PhysicsSystem - Handles block movement, collision detection, and attachment
 */

import { Block } from '@entities/Block';
import { Hex } from '@entities/Hex';

export class PhysicsSystem {
  private fallingBlocks: Block[] = [];

  constructor(_hexRadius: number) {
    // hexRadius kept in constructor signature for API compatibility
  }

  /**
   * Add a falling block to track
   */
  public addFallingBlock(block: Block): void {
    this.fallingBlocks.push(block);
  }

  /**
   * Update all falling blocks
   * Original from update.js: CHECK COLLISION FIRST, THEN MOVE
   */
  public update(hex: Hex, deltaTime: number, scale: number): void {
    // dt is already in frame units from game loop (deltaTime / 16.666)
    const dt = deltaTime;
    
    // Update each falling block (iterate backwards to safely remove)
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      const block = this.fallingBlocks[i];
      
      // STEP 1: Check collision BEFORE movement (original order)
      hex.doesBlockCollide(block);
      
      // STEP 2: Move block toward hex center (original formula)
      // Original: if (!blocks[i].settled) { if (!blocks[i].initializing) blocks[i].distFromHex -= blocks[i].iter * dt * settings.scale; }
      if (!block.settled) {
        if (!block.initializing) {
          block.distFromHex -= block.iter * dt * scale;
        }
      } else if (!block.removed) {
        // Block just settled - mark for removal
        block.removed = true;
      }
    }
    
    // Remove blocks that settled (iterate backwards)
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      if (this.fallingBlocks[i].removed) {
        this.fallingBlocks.splice(i, 1);
      }
    }
  }

  /**
   * Remove a falling block (e.g., if it was destroyed)
   */
  public removeFallingBlock(block: Block): void {
    const index = this.fallingBlocks.indexOf(block);
    if (index !== -1) {
      this.fallingBlocks.splice(index, 1);
    }
  }

  /**
   * Get all falling blocks
   */
  public getFallingBlocks(): Block[] {
    return this.fallingBlocks;
  }

  /**
   * Clear all falling blocks
   */
  public clearFallingBlocks(): void {
    this.fallingBlocks = [];
  }

  /**
   * Count falling blocks
   */
  public getFallingBlockCount(): number {
    return this.fallingBlocks.length;
  }

  /**
   * Get blocks in a specific lane
   */
  public getBlocksInLane(lane: number): Block[] {
    return this.fallingBlocks.filter(block => block.fallingLane === lane);
  }

  /**
   * Check if any block is close to center (game over check)
   */
  public isAnyBlockNearCenter(threshold: number): boolean {
    return this.fallingBlocks.some(block => block.distFromHex < threshold);
  }

  /**
   * DEPRECATED: Falling blocks should NOT rotate with the hex!
   * Original Hextris: Only ATTACHED blocks rotate. Falling blocks maintain their angle.
   * The hex rotation affects which LANE they land in (via doesBlockCollide calculation),
   * but not their visual angle during flight.
   */
  public rotateFallingBlocks(_direction: 1 | -1, _hex: Hex): void {
    // DO NOTHING - falling blocks don't rotate!
    // Only attached blocks rotate (handled in Block.draw when settled=true)
  }

  /**
   * Reset physics system
   */
  public reset(): void {
    this.fallingBlocks = [];
  }

  /**
   * Get closest block to center
   */
  public getClosestBlock(): Block | null {
    if (this.fallingBlocks.length === 0) return null;
    
    let closest = this.fallingBlocks[0];
    let minDist = closest.distFromHex;
    
    for (const block of this.fallingBlocks) {
      if (block.distFromHex < minDist) {
        minDist = block.distFromHex;
        closest = block;
      }
    }
    
    return closest;
  }

  /**
   * Check for potential matches involving falling blocks
   * (Useful for power-ups or special effects)
   */
  public getFallingBlocksByColor(color: string): Block[] {
    return this.fallingBlocks.filter(block => block.color === color);
  }

  /**
   * Speed up all falling blocks (difficulty increase)
   */
  public speedUpBlocks(factor: number): void {
    for (const block of this.fallingBlocks) {
      block.iter *= factor;
    }
  }

  /**
   * Slow down all falling blocks (power-up effect)
   */
  public slowDownBlocks(factor: number): void {
    for (const block of this.fallingBlocks) {
      block.iter *= factor;
    }
  }
}
