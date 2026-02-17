/**
 * Difficulty configuration for Hextris - 2026 refresh
 * Adds richer metadata (surges, adaptive assists, prestige hooks)
 */

export enum DifficultyLevel {
  DISCOVERY = 'discovery',
  LOW = 'low',
  EASY = 'easy',
  MEDIUM = 'medium',
  STANDARD = 'standard',
  HARD = 'hard',
  FIERCE = 'fierce',
  APEX = 'apex',
}

export interface SurgeConfig {
  firstAt: number; // seconds until first surge
  cadence: number; // seconds between surges
  duration: number; // seconds the surge lasts
  spawnScalar: number; // additional spawn multiplier applied during surge
  speedScalar?: number; // optional global speed multiplier bump
}

export interface AdaptiveAssistConfig {
  enabled: boolean;
  lossThreshold: number; // number of lives lost inside the time window
  windowMs: number;
  slowScalar: number; // multiplier applied to slow things down (< 1)
  durationMs: number;
}

export interface PrestigeConfig {
  available: boolean;
  scoreMultiplier: number;
  mutators?: string[];
}

export interface PhaseDefinition {
  name: string;
  startsAt: number; // seconds since game start
  description?: string;
  musicIntensity?: number; // 0-1 to drive layering
  speedBoost?: number; // optional micro boost applied entering phase
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  blockSpeed: number;
  rotationSpeed: number;
  startingSpeed: number;
  speedIncrement: number;
  spawnDelay: number;
  comboTimeWindow: number;
  scoreMultiplier: number;
  speedMultiplier: number;
  spawnRateModifier: number;
  powerUpRate: number;
  hazardProfile: 'none' | 'light' | 'normal' | 'advanced' | 'brutal';
  unlockRequirement?: string;
  surge: SurgeConfig;
  adaptiveAssist?: AdaptiveAssistConfig;
  prestige?: PrestigeConfig;
  phases: PhaseDefinition[];
}

export const difficultyOrder: DifficultyLevel[] = [
  DifficultyLevel.DISCOVERY,
  DifficultyLevel.LOW,
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.STANDARD,
  DifficultyLevel.HARD,
  DifficultyLevel.FIERCE,
  DifficultyLevel.APEX,
];

export const difficultyConfigs: Record<DifficultyLevel, DifficultyConfig> = {
  [DifficultyLevel.DISCOVERY]: {
    level: DifficultyLevel.DISCOVERY,
    name: 'Discovery',
    description: 'On-ramp with forgiving timing and boosted power-ups.',
    blockSpeed: 35,
    rotationSpeed: 6,
    startingSpeed: 0.9,
    speedIncrement: 0.025,
    spawnDelay: 1850,
    comboTimeWindow: 3000,
    scoreMultiplier: 0.9,
    speedMultiplier: 1.0,
    spawnRateModifier: 0.75,
    powerUpRate: 1.25,
    hazardProfile: 'none',
    surge: {
      firstAt: 60,
      cadence: 45,
      duration: 4,
      spawnScalar: 0.25,
      speedScalar: 0.05,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 15000,
      slowScalar: 0.8,
      durationMs: 10000,
    },
    phases: [
      { name: 'Orientation', startsAt: 0, description: 'Tutorial drip feed.', musicIntensity: 0.15 },
      { name: 'Warm Up', startsAt: 45, musicIntensity: 0.25 },
    ],
  },
  [DifficultyLevel.LOW]: {
    level: DifficultyLevel.LOW,
    name: 'Low',
    description: 'Gentle introduction with slow falling and rotation speeds.',
    blockSpeed: 40,
    rotationSpeed: 6,
    startingSpeed: 1.0,
    speedIncrement: 0.035,
    spawnDelay: 1750,
    comboTimeWindow: 2800,
    scoreMultiplier: 1.0,
    speedMultiplier: 1.2,
    spawnRateModifier: 0.8,
    powerUpRate: 1.15,
    hazardProfile: 'none',
    surge: {
      firstAt: 55,
      cadence: 42,
      duration: 5,
      spawnScalar: 0.3,
      speedScalar: 0.07,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 15000,
      slowScalar: 0.82,
      durationMs: 9500,
    },
    phases: [
      { name: 'Getting Started', startsAt: 0, musicIntensity: 0.18 },
      { name: 'Building Confidence', startsAt: 50, musicIntensity: 0.28 },
    ],
  },
  [DifficultyLevel.EASY]: {
    level: DifficultyLevel.EASY,
    name: 'Easy',
    description: 'Relaxed pace with light hazards and early warning audio cues.',
    blockSpeed: 55,
    rotationSpeed: 7,
    startingSpeed: 1.15,
    speedIncrement: 0.045,
    spawnDelay: 1650,
    comboTimeWindow: 2550,
    scoreMultiplier: 1.15,
    speedMultiplier: 1.4,
    spawnRateModifier: 0.9,
    powerUpRate: 1.1,
    hazardProfile: 'light',
    surge: {
      firstAt: 50,
      cadence: 40,
      duration: 6,
      spawnScalar: 0.35,
      speedScalar: 0.08,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 15000,
      slowScalar: 0.85,
      durationMs: 9000,
    },
    phases: [
      { name: 'Opening Calm', startsAt: 0, musicIntensity: 0.2 },
      { name: 'Focus Groove', startsAt: 60, musicIntensity: 0.35 },
      { name: 'Pulse Check', startsAt: 150, musicIntensity: 0.45 },
    ],
  },
  [DifficultyLevel.MEDIUM]: {
    level: DifficultyLevel.MEDIUM,
    name: 'Medium',
    description: 'Balanced challenge with moderate pacing and hazard introduction.',
    blockSpeed: 75,
    rotationSpeed: 8,
    startingSpeed: 1.35,
    speedIncrement: 0.065,
    spawnDelay: 1375,
    comboTimeWindow: 2325,
    scoreMultiplier: 1.6,
    speedMultiplier: 1.6,
    spawnRateModifier: 0.95,
    powerUpRate: 1.05,
    hazardProfile: 'light',
    surge: {
      firstAt: 45,
      cadence: 37,
      duration: 6,
      spawnScalar: 0.38,
      speedScalar: 0.09,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 13500,
      slowScalar: 0.88,
      durationMs: 8000,
    },
    phases: [
      { name: 'Steady Start', startsAt: 0, musicIntensity: 0.25 },
      { name: 'Growing Tempo', startsAt: 70, musicIntensity: 0.45 },
      { name: 'Challenge Ramp', startsAt: 180, musicIntensity: 0.6 },
    ],
  },
  [DifficultyLevel.STANDARD]: {
    level: DifficultyLevel.STANDARD,
    name: 'Standard',
    description: 'Baseline leaderboard difficulty with balanced hazard mix.',
    blockSpeed: 95,
    rotationSpeed: 9,
    startingSpeed: 1.5,
    speedIncrement: 0.08,
    spawnDelay: 1100,
    comboTimeWindow: 2100,
    scoreMultiplier: 2.0,
    speedMultiplier: 1.8,
    spawnRateModifier: 1.0,
    powerUpRate: 1.0,
    hazardProfile: 'normal',
    surge: {
      firstAt: 40,
      cadence: 35,
      duration: 6,
      spawnScalar: 0.4,
      speedScalar: 0.1,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 12000,
      slowScalar: 0.9,
      durationMs: 7000,
    },
    phases: [
      { name: 'Opening Calm', startsAt: 0, description: 'Discovery + Easy blend', musicIntensity: 0.3 },
      { name: 'Flow Phase', startsAt: 60, description: 'Rotating hazard arcs', musicIntensity: 0.55, speedBoost: 0.05 },
      { name: 'Pressure Phase', startsAt: 240, description: 'Counter-rotating surges', musicIntensity: 0.75, speedBoost: 0.1 },
    ],
  },
  [DifficultyLevel.HARD]: {
    level: DifficultyLevel.HARD,
    name: 'Hard',
    description: 'Intense pacing with faster spawns and rapid rotation demands.',
    blockSpeed: 120,
    rotationSpeed: 10,
    startingSpeed: 1.75,
    speedIncrement: 0.1,
    spawnDelay: 950,
    comboTimeWindow: 1850,
    scoreMultiplier: 2.35,
    speedMultiplier: 2.0,
    spawnRateModifier: 1.1,
    powerUpRate: 0.95,
    hazardProfile: 'normal',
    surge: {
      firstAt: 38,
      cadence: 32,
      duration: 7,
      spawnScalar: 0.45,
      speedScalar: 0.13,
    },
    adaptiveAssist: {
      enabled: true,
      lossThreshold: 2,
      windowMs: 11000,
      slowScalar: 0.92,
      durationMs: 6000,
    },
    phases: [
      { name: 'Quick Start', startsAt: 0, musicIntensity: 0.35 },
      { name: 'Acceleration Phase', startsAt: 50, musicIntensity: 0.6, speedBoost: 0.07 },
      { name: 'High Pressure', startsAt: 150, musicIntensity: 0.8, speedBoost: 0.12 },
    ],
  },
  [DifficultyLevel.FIERCE]: {
    level: DifficultyLevel.FIERCE,
    name: 'Fierce',
    description: 'Advanced pacing with counter-rotating waves and shield-breakers.',
    blockSpeed: 130,
    rotationSpeed: 11,
    startingSpeed: 1.9,
    speedIncrement: 0.12,
    spawnDelay: 900,
    comboTimeWindow: 1700,
    scoreMultiplier: 2.6,
    speedMultiplier: 2.2,
    spawnRateModifier: 1.2,
    powerUpRate: 0.9,
    hazardProfile: 'advanced',
    surge: {
      firstAt: 35,
      cadence: 30,
      duration: 7,
      spawnScalar: 0.5,
      speedScalar: 0.15,
    },
    adaptiveAssist: {
      enabled: false,
      lossThreshold: 0,
      windowMs: 0,
      slowScalar: 1,
      durationMs: 0,
    },
    prestige: {
      available: true,
      scoreMultiplier: 1.2,
      mutators: ['mirroredInput', 'noShield'],
    },
    phases: [
      { name: 'Opening Calm', startsAt: 0, musicIntensity: 0.4 },
      { name: 'Flow Phase', startsAt: 45, musicIntensity: 0.65, speedBoost: 0.08 },
      { name: 'Pressure Phase', startsAt: 120, musicIntensity: 0.85, speedBoost: 0.12 },
      { name: 'Surge Boss', startsAt: 240, description: 'Boss waves every 120s', musicIntensity: 1 },
    ],
  },
  [DifficultyLevel.APEX]: {
    level: DifficultyLevel.APEX,
    name: 'Apex',
    description: 'Prestige-only brutality with fracture rows and relentless surges.',
    blockSpeed: 160,
    rotationSpeed: 13,
    startingSpeed: 2.25,
    speedIncrement: 0.16,
    spawnDelay: 780,
    comboTimeWindow: 1500,
    scoreMultiplier: 3.25,
    speedMultiplier: 2.6,
    spawnRateModifier: 1.35,
    powerUpRate: 0.8,
    hazardProfile: 'brutal',
    unlockRequirement: 'Prestige unlock after clearing Fierce with mutators.',
    surge: {
      firstAt: 25,
      cadence: 25,
      duration: 8,
      spawnScalar: 0.6,
      speedScalar: 0.2,
    },
    prestige: {
      available: true,
      scoreMultiplier: 1.4,
      mutators: ['noPowerUps', 'fractureRows', 'mirroredInput'],
    },
    phases: [
      { name: 'Ascension', startsAt: 0, musicIntensity: 0.5 },
      { name: 'Pressure Cooker', startsAt: 60, musicIntensity: 0.8, speedBoost: 0.15 },
      { name: 'Fracture Onslaught', startsAt: 180, musicIntensity: 1, description: 'Fracture rows + double surges' },
    ],
  },
};

export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return difficultyConfigs[level];
}

export const DEFAULT_DIFFICULTY = DifficultyLevel.STANDARD;

