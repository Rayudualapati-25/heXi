/**
 * Game constants for Hextris
 * Core configuration values used throughout the game
 */

// Canvas and Display
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const HEX_RADIUS = 100;
export const HEX_SIDES = 6;

// Game Mechanics
export const MAX_LIVES = 5;
export const STARTING_LIVES = 3;
export const INVULNERABILITY_DURATION = 2000; // milliseconds
export const LIFE_BONUS_INTERVAL = 5000; // Award life every 5000 points

// Special Points
export const POINTS_PER_SCORE = 100; // Award 1 point per 100 score
export const GAME_COMPLETE_BONUS = 50;
export const HIGH_SCORE_BONUS = 200;
export const DAILY_LOGIN_BONUS = 100;
export const PERFECT_CLEAR_BONUS = 150;

// Power-ups
export const POWER_UP_SPAWN_COOLDOWN = 30000; // 30 seconds
export const POWER_UP_COMBO_THRESHOLD = 10; // Combo required to spawn power-up
export const MAX_POWER_UP_INVENTORY = 3; // Max power-ups per type

// Combo System
export const COMBO_BASE_MULTIPLIER = 1.5;
export const COMBO_INCREMENT = 0.1;

// Animation
export const ANIMATION_DURATION = 300; // Default animation duration in ms
export const BLOCK_FALL_SPEED = 65; // Default speed (overridden by difficulty)

// Local Storage Keys
export const STORAGE_KEYS = {
  PLAYER_NAME: 'hextris_player_name',
  HIGH_SCORE: 'hextris_high_score',
  SPECIAL_POINTS: 'hextris_special_points',
  THEME: 'hextris_theme',
  SAVE_STATE: 'hextris_save_state',
  SETTINGS: 'hextris_settings',
  LAST_LOGIN: 'hextris_last_login',
} as const;

// Game States
export enum GameStatus {
  ENTRY = 'entry',
  MENU = 'menu',
  DIFFICULTY_SELECT = 'difficultySelect',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
  MULTIPLAYER_LOBBY = 'multiplayerLobby',
  MULTIPLAYER_PLAYING = 'multiplayerPlaying',
}

// Routes
export const ROUTES = {
  ENTRY: '/',
  RESET_PASSWORD: '/reset-password',
  MENU: '/menu',
  DIFFICULTY: '/difficulty',
  GAME: '/game',
  MULTIPLAYER: '/multiplayer',
  SETTINGS: '/settings',
  APPWRITE_TEST: '/appwrite-test',
} as const;

// Network
export const MULTIPLAYER_SERVER_URL = import.meta.env.VITE_MULTIPLAYER_URL || 'http://localhost:3000';
export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

// Responsive Breakpoints (matches Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;

// Touch Targets
export const MIN_TOUCH_TARGET_SIZE = 48; // pixels

// Performance
export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;
