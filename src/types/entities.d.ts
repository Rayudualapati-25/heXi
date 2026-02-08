/**
 * Type definitions for game entities
 */

/**
 * Block state and properties
 */
export interface BlockState {
  id: string;
  fallingLane: number;
  color: string;
  angle: number;
  targetAngle: number;
  angularVelocity: number;
  distFromHex: number;
  height: number;
  width: number;
  widthWide: number;
  settled: boolean;
  deleted: number; // 0 = active, 1 = deleting, 2 = fully deleted
  removed: boolean;
  opacity: number;
  tint: number;
  initializing: boolean;
  iter: number; // Speed multiplier
  attachedLane: number;
  checked: boolean;
}

/**
 * Hexagon state and properties
 */
export interface HexState {
  x: number;
  y: number;
  currentRotation: number;
  targetRotation: number;
  angularVelocity: number;
  position: number; // Current rotation position (lane offset)
  fillColor: [number, number, number]; // RGB
  blocks: Block[][]; // Array of block stacks per side
  shakes: ShakeEffect[];
}

/**
 * Shake effect for visual feedback
 */
export interface ShakeEffect {
  lane: number;
  magnitude: number;
}

/**
 * Floating text for score popups
 */
export interface FloatingTextState {
  text: string;
  x: number;
  y: number;
  opacity: number;
  color: string;
  fontSize: number;
  velocity: { x: number; y: number };
  lifetime: number;
  maxLifetime: number;
}

/**
 * Power-up entity
 */
export interface PowerUpState {
  type: 'hammer' | 'slowmo' | 'shield';
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  opacity: number;
}

// Import type to avoid circular dependency
import type { Block } from '@entities/Block';
import type { Hex } from '@entities/Hex';
