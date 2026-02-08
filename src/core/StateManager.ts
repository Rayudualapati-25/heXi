/**
 * Centralized state management for Hextris
 * Provides immutable state updates with event notification
 */

import type { GameState, StateEvent, StateListener } from '../types/game';
import { GameStatus, STARTING_LIVES } from './constants';
import { DEFAULT_DIFFICULTY } from '@config/difficulty';
import { DEFAULT_THEME } from '@config/themes';

export class StateManager {
  private static instance: StateManager;
  private state: GameState;
  private listeners: Map<StateEvent, Set<StateListener>>;

  private constructor() {
    this.state = this.getInitialState();
    this.listeners = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Get initial game state
   */
  private getInitialState(): GameState {
    return {
      status: GameStatus.ENTRY,
      player: {
        id: '',
        name: '',
        highScore: 0,
        specialPoints: 500,
        gamesPlayed: 0,
        totalPlayTime: 0,
        themesUnlocked: [DEFAULT_THEME],
        selectedTheme: DEFAULT_THEME,
      },
      game: {
        score: 0,
        lives: STARTING_LIVES,
        difficulty: DEFAULT_DIFFICULTY,
        combo: 0,
        comboTimer: 0,
        gameTime: 0,
        isInvulnerable: false,
        speedMultiplier: 1.0,
      },
      ui: {
        currentRoute: '/',
        isPaused: false,
        isShopOpen: false,
        isModalOpen: false,
        isMuted: false,
        currentGameMode: 'standard',
        timerDuration: 90,
        currentGroupId: undefined,
      },
    };
  }

  /**
   * Get current state (readonly)
   */
  public getState(): Readonly<GameState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Update a top-level state property
   */
  public setState<K extends keyof GameState>(key: K, value: Partial<GameState[K]>): void {
    const currentValue = this.state[key];
    
    // Only spread if value is an object
    if (typeof currentValue === 'object' && currentValue !== null && typeof value === 'object') {
      this.state = {
        ...this.state,
        [key]: {
          ...(currentValue as object),
          ...(value as object),
        } as GameState[K],
      };
    } else {
      this.state = {
        ...this.state,
        [key]: value as GameState[K],
      };
    }

    // Emit specific events based on what changed
    this.emitStateChangeEvents(key, value);
  }

  /**
   * Update player state
   */
  public updatePlayer(updates: Partial<GameState['player']>): void {
    this.setState('player', updates);
  }

  /**
   * Update game state
   */
  public updateGame(updates: Partial<GameState['game']>): void {
    this.setState('game', updates);
  }

  /**
   * Update UI state
   */
  public updateUI(updates: Partial<GameState['ui']>): void {
    this.setState('ui', updates);
  }

  /**
   * Subscribe to state change events
   */
  public subscribe(event: StateEvent, callback: StateListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  public emit(event: StateEvent, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Emit state change events based on what was updated
   */
  private emitStateChangeEvents(key: keyof GameState, value: any): void {
    if (key === 'status') {
      this.emit('statusChanged', value);
    } else if (key === 'game') {
      if ('score' in value) this.emit('scoreUpdated', value.score);
      if ('lives' in value) this.emit('livesChanged', value.lives);
      if ('combo' in value) this.emit('comboChanged', value.combo);
    } else if (key === 'player') {
      if ('specialPoints' in value) this.emit('specialPointsChanged', value.specialPoints);
    }
  }

  /**
   * Reset game state (for new game)
   */
  public resetGame(): void {
    const player = { ...this.state.player };
    this.state = {
      ...this.getInitialState(),
      player,
      status: GameStatus.PLAYING,
    };
    this.emit('gameStarted');
  }

  /**
   * Reset all state (logout)
   */
  public resetAll(): void {
    this.state = this.getInitialState();
  }
}

// Export singleton instance
export const stateManager = StateManager.getInstance();
