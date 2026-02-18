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
  timerScoreMultiplier?: number;
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
}

export interface LobbyPlayer {
  userId: string;
  userName: string;
  isReady: boolean;
  isHost: boolean;
}

// Room-based multiplayer types
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type RoomPlayerStatus = 'waiting' | 'ready' | 'playing' | 'left' | 'finished';

export interface Room {
  $id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  status: RoomStatus;
  maxPlayers: number;
  playerCount: number;
  createdAt: string;
  difficulty?: string;
}

export interface RoomPlayer {
  $id: string;
  roomId: string;
  odplayerName: string;
  odplayerId: string;
  score: number;
  status: RoomPlayerStatus;
  isHost: boolean;
  joinedAt: string;
}

export interface MultiplayerLobbyState {
  roomId: string | null;
  roomCode: string | null;
  players: LobbyPlayer[];
  isInLobby: boolean;
  localPlayerReady: boolean;
  localPlayerId: string | null;
  localPlayerName: string | null;
  isHost: boolean;
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

