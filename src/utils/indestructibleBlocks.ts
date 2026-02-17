/**
 * Indestructible Block Utilities
 * 
 * Usage examples for creating and managing indestructible color blocks.
 */

import type { Block } from '@entities/Block';
import type { Hex } from '@entities/Hex';

/**
 * Mark a specific block as indestructible
 * 
 * Example:
 * ```typescript
 * const block = new Block(...);
 * makeBlockIndestructible(block);
 * ```
 */
export function makeBlockIndestructible(block: Block): void {
  block.makeIndestructible();
}

/**
 * Mark random blocks in the hex as indestructible
 * Useful for adding challenge/variety to gameplay
 * 
 * @param hex - The hex entity containing all blocks
 * @param percentage - Percentage of blocks to make indestructible (0-100)
 * 
 * Example:
 * ```typescript
 * // Make 10% of blocks indestructible
 * makeRandomBlocksIndestructible(hex, 10);
 * ```
 */
export function makeRandomBlocksIndestructible(hex: Hex, percentage: number = 10): number {
  let count = 0;
  const chance = percentage / 100;
  
  for (const lane of hex.blocks) {
    for (const block of lane) {
      if (block && block.deleted === 0 && !block.isIndestructible) {
        if (Math.random() < chance) {
          block.makeIndestructible();
          count++;
        }
      }
    }
  }
  
  return count;
}

/**
 * Make all blocks in a specific lane indestructible
 * 
 * @param hex - The hex entity
 * @param laneIndex - Lane index (0 to hex.sides-1)
 * 
 * Example:
 * ```typescript
 * makeBlocksIndestructible.inLane(hex, 0);
 * ```
 */
export function makeLaneIndestructible(hex: Hex, laneIndex: number): number {
  let count = 0;
  const lane = hex.blocks[laneIndex];
  
  if (!lane) return 0;
  
  for (const block of lane) {
    if (block && block.deleted === 0 && !block.isIndestructible) {
      block.makeIndestructible();
      count++;
    }
  }
  
  return count;
}

/**
 * Make blocks at a specific distance from hex center indestructible
 * Creates a "ring" of indestructible blocks
 * 
 * @param hex - The hex entity
 * @param targetIndex - Block index (0 = innermost, higher = further out)
 * @param tolerance - Allow blocks within +/- tolerance indices
 * 
 * Example:
 * ```typescript
 * // Make all blocks at index 5 indestructible
 * makeRingIndestructible(hex, 5, 0);
 * ```
 */
export function makeRingIndestructible(hex: Hex, targetIndex: number, tolerance: number = 0): number {
  let count = 0;
  
  for (const lane of hex.blocks) {
    for (let i = 0; i < lane.length; i++) {
      if (Math.abs(i - targetIndex) <= tolerance) {
        const block = lane[i];
        if (block && block.deleted === 0 && !block.isIndestructible) {
          block.makeIndestructible();
          count++;
        }
      }
    }
  }
  
  return count;
}

/**
 * Check if a block can be destroyed (respects indestructible rules)
 */
export function canBlockBeDestroyed(block: Block): boolean {
  return block.canBeDestroyed();
}

/**
 * Count indestructible blocks in the hex
 */
export function countIndestructibleBlocks(hex: Hex): { total: number; withSupport: number } {
  let total = 0;
  let withSupport = 0;
  
  for (const lane of hex.blocks) {
    for (const block of lane) {
      if (block && block.isIndestructible) {
        total++;
        if (!block.supportCleared) {
          withSupport++;
        }
      }
    }
  }
  
  return { total, withSupport };
}

/**
 * Integration example for WaveSystem callback:
 * 
 * ```typescript
 * // In spawnBlock callback, randomly make 5% of new blocks indestructible
 * const spawnBlock = (lane: number, color: string, speed: number) => {
 *   const block = new Block(lane, color, speed, ...);
 *   
 *   // Make 5% of blocks indestructible
 *   if (Math.random() < 0.05) {
 *     makeBlockIndestructible(block);
 *   }
 *   
 *   physicsSystem.addFallingBlock(block);
 * };
 * ```
 */
