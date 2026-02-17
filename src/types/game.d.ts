/**
 * Type definitions for game state
 */

import type { DifficultyLevel } from '@config/difficulty';
import type { ThemeName } from '@config/themes';
import type { ShopItemId } from '@config/shopItems';
import type { GameStatus } from '@core/constants';

export type PlayerInventory = Record<ShopItemId, number>;

export interface PlayerState {
  id: string;
  name: string;
  highScore: number;
  specialPoints: number;
  gamesPlayed: number;
  totalPlayTime: number;
  themesUnlocked: ThemeName[];
  selectedTheme: ThemeName;
  inventory: PlayerInventory;
}

export interface GamePlayState {
  score: number;
  lives: number;
  difficulty: DifficultyLevel;
  combo: number;
  comboTimer: number;
  gameTime: number;
  isInvulnerable: boolean;
  speedMultiplier: number;
  comboHeat?: number;
  comboTier?: number;
  surgeActive?: boolean;
  strategyPhase?: string;
  tempoLevel?: number;
  timeOrbCount?: number;
  timeOrbGoal?: number;
  momentumValue?: number;
  ghostDelta?: number;
  activeMutators?: string[];
}

export interface UIState {
  currentRoute: string;
  isPaused: boolean;
  isShopOpen: boolean;
  isModalOpen: boolean;
  isMusicMuted: boolean;
  isSfxMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
  preGamePowerUps?: string[];
  currentGameMode?:
    | 'standard'
    | 'dailyChallenge'
    | 'weeklyGauntlet'
    | 'timerAttack'
    | 'multiplayerRace'
    | 'multiplayerSabotage'
    | 'multiplayerSync';
  timerDuration?: number;
  currentGroupId?: string;
  multiplayerMode?: 'race' | 'sabotage' | 'sync';
  prestigeMutators?: string[];
}

export interface Group {
  $id: string;
  roomCode: string;
  groupName: string;
  createdBy: string;
  memberIds: string[];
  memberCount: number;
  createdAt?: string;
  isActive?: boolean;
}

export interface GroupScore {
  $id: string;
  userId: string;
  groupId: string;
  userName: string;
  bestScore: number;
  gamesPlayed: number;
  lastPlayedAt?: string;
  difficulty?: string;
  hasLeft?: boolean; // Track if player left during the game
  leftAt?: string; // Timestamp when player left
}

export interface LobbyPlayer {
  userId: string;
  userName: string;
  displayName?: string; // Optional custom display name for the room
  isReady: boolean;
  isHost: boolean;
  isActive?: boolean; // Track if player is still in the game (not disconnected)
  hasLeft?: boolean; // Track if player left during the game
}

export interface MultiplayerLobbyState {
  roomId: string | null;
  roomCode: string | null;
  players: LobbyPlayer[];
  isInLobby: boolean;
  localPlayerReady: boolean;
}

export interface GameState {
  status: GameStatus;
  player: PlayerState;
  game: GamePlayState;
  ui: UIState;
  multiplayer: MultiplayerLobbyState;
}

export type StateEvent = 
  | 'statusChanged'
  | 'scoreUpdated'
  | 'livesChanged'
  | 'comboChanged'
  | 'specialPointsChanged'
  | 'gameStarted'
  | 'gamePaused'
  | 'gameResumed'
  | 'gameOver'
  | 'lifeLost'
  | 'lifeGained'
  | 'powerUpCollected'
  | 'powerUpUsed'
  | 'lobbyJoined'
  | 'lobbyLeft'
  | 'lobbyPlayersUpdated'
  | 'lobbyMatchStarted';

export type StateListener = (data?: any) => void;

