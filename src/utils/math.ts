/**
 * Mathematical utility functions for Hextris
 * Coordinate transformations, rotations, and random numbers
 */

/**
 * 2D point interface
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rotate a point around the origin
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param theta - Angle in degrees
 * @returns Rotated point coordinates
 */
export function rotatePoint(x: number, y: number, theta: number): Point {
  const thetaRad = theta * (Math.PI / 180);
  const rotX = Math.cos(thetaRad) * x - Math.sin(thetaRad) * y;
  const rotY = Math.sin(thetaRad) * x + Math.cos(thetaRad) * y;

  return {
    x: rotX,
    y: rotY,
  };
}

/**
 * Generate random integer - Original Hextris algorithm
 * @param min - Minimum value
 * @param max - Range (not maximum!) treated as exclusive upper bound
 * @returns Random integer from min to (min + max - 1)
 * @note Original: randInt(0, 6) returns [0, 5], not [0, 6]
 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * max) + min;
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize an angle to 0-360 range
 * @param angle - Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Calculate shortest angular distance between two angles
 * @param from - Start angle in degrees
 * @param to - End angle in degrees
 * @returns Shortest angular distance (-180 to 180)
 */
export function angleDifference(from: number, to: number): number {
  let diff = to - from;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}
