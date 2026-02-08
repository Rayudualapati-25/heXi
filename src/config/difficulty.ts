/**
 * Difficulty configuration for Hextris
 * Defines speed, spawn rates, and game behavior for each difficulty level
 */

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  blockSpeed: number; // Blocks per second
  rotationSpeed:number; // Degrees per second when holding rotation
  startingSpeed: number; // Initial speed multiplier
  speedIncrement: number; // Speed increase per level
  spawnDelay: number; // Milliseconds between block spawns
  comboTimeWindow: number; // Milliseconds to maintain combo
  scoreMultiplier: number; // Score multiplier for this difficulty
}

export const difficultyConfigs: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    level: DifficultyLevel.EASY,
    name: 'Easy',
    description: 'Relaxed pace for beginners',
    blockSpeed: 45,
    rotationSpeed: 7,
    startingSpeed: 1.1,
    speedIncrement: 0.04,
    spawnDelay: 1700,
    comboTimeWindow: 2600,
    scoreMultiplier: 1.1,
  },
  [DifficultyLevel.MEDIUM]: {
    level: DifficultyLevel.MEDIUM,
    name: 'Medium',
    description: 'Balanced challenge',
    blockSpeed: 80,
    rotationSpeed: 9,
    startingSpeed: 1.4,
    speedIncrement: 0.07,
    spawnDelay: 1200,
    comboTimeWindow: 2200,
    scoreMultiplier: 1.8,
  },
  [DifficultyLevel.HARD]: {
    level: DifficultyLevel.HARD,
    name: 'Hard',
    description: 'For expert players',
    blockSpeed: 110,
    rotationSpeed: 11,
    startingSpeed: 1.8,
    speedIncrement: 0.1,
    spawnDelay: 800,
    comboTimeWindow: 1800,
    scoreMultiplier: 2.4,
  },
};

/**
 * Get difficulty configuration by level
 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return difficultyConfigs[level];
}

/**
 * Default difficulty level
 */
export const DEFAULT_DIFFICULTY = DifficultyLevel.MEDIUM;
