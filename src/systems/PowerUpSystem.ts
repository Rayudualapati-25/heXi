/**
 * PowerUpSystem
 * Manages power-up spawning, collection, and activation
 */

import { Canvas } from '@core/Canvas';
import { stateManager } from '@core/StateManager';
import { GameStatus, POWER_UP_SCORE_INTERVAL } from '@core/constants';
import type { Hex } from '@entities/Hex';
import { PowerUp, PowerUpType } from '@entities/PowerUp';
import type { InventoryUI } from '@ui/hud/InventoryUI';

type PowerUpUseHandler = (type: PowerUpType) => void;
type SlowMoHandler = (multiplier: number, durationMs: number) => void;
type ShieldHandler = (durationMs: number) => void;

export interface PowerUpSystemOptions {
  hex: Hex;
  canvas: Canvas;
  inventoryUI: InventoryUI;
  onUse?: PowerUpUseHandler;
  onSlowMo?: SlowMoHandler;
  onShield?: ShieldHandler;
}

export class PowerUpSystem {
  private hex: Hex;
  private canvas: Canvas;
  private inventoryUI: InventoryUI;
  private activePowerUps: PowerUp[] = [];
  private lastScoreBucket = 0;
  private enabled = true;
  private onUse?: PowerUpUseHandler;
  private onSlowMo?: SlowMoHandler;
  private onShield?: ShieldHandler;

  constructor(options: PowerUpSystemOptions) {
    this.hex = options.hex;
    this.canvas = options.canvas;
    this.inventoryUI = options.inventoryUI;
    this.onUse = options.onUse;
    this.onSlowMo = options.onSlowMo;
    this.onShield = options.onShield;

    this.init();
  }

  public update(dt: number): void {
    if (!this.enabled) return;

    const hexRadius = (this.hex.sideLength / 2) * Math.sqrt(3);
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      powerUp.update(dt, hexRadius);

      if (powerUp.collected) {
        this.handleCollected(powerUp);
      }

      if (powerUp.shouldRemove()) {
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    const centerX = this.canvas.element.width / 2 + this.hex.gdx;
    const centerY = this.canvas.element.height / 2 + this.hex.gdy;
    this.activePowerUps.forEach(powerUp => powerUp.render(ctx, centerX, centerY));
  }

  public reset(): void {
    this.activePowerUps = [];
    this.lastScoreBucket = 0;
    this.inventoryUI.clear();
  }

  public forceSpawn(): void {
    if (!this.enabled) return;
    if (stateManager.getState().status !== GameStatus.PLAYING) return;
    this.spawnPowerUp();
  }

  public destroy(): void {
    window.removeEventListener('scoreUpdate', this.handleScoreUpdate as EventListener);
    window.removeEventListener('powerup-used', this.handlePowerUpUsed as EventListener);
  }

  private init(): void {
    window.addEventListener('scoreUpdate', this.handleScoreUpdate as EventListener);
    window.addEventListener('powerup-used', this.handlePowerUpUsed as EventListener);
  }

  private handleScoreUpdate = (event: Event): void => {
    const customEvent = event as CustomEvent<{ score?: number }>;
    const score = customEvent.detail?.score ?? 0;
    if (stateManager.getState().status !== GameStatus.PLAYING) {
      return;
    }

    const bucket = Math.floor(score / POWER_UP_SCORE_INTERVAL);
    if (bucket <= this.lastScoreBucket) {
      return;
    }

    const spawnsToAdd = bucket - this.lastScoreBucket;
    this.lastScoreBucket = bucket;

    for (let i = 0; i < spawnsToAdd; i += 1) {
      this.spawnPowerUp();
    }
  };

  private handlePowerUpUsed = (event: Event): void => {
    const customEvent = event as CustomEvent<{ type?: PowerUpType }>;
    const type = customEvent.detail?.type;
    if (!type) return;

    this.activatePowerUp(type);
    window.dispatchEvent(new CustomEvent('powerUpUsed', { detail: { type } }));
    if (this.onUse) {
      this.onUse(type);
    }
  };

  private spawnPowerUp(): void {
    const lane = this.randomInt(0, this.hex.sides);
    const types: PowerUpType[] = ['hammer', 'hammer', 'slowmo', 'shield'];
    const type = types[this.randomInt(0, types.length)];

    const { startDist, scale } = this.getSpawnSettings();
    const powerUp = new PowerUp({
      type,
      lane,
      startDist,
      scale,
    });

    this.activePowerUps.push(powerUp);
  }

  private handleCollected(powerUp: PowerUp): void {
    if (this.inventoryUI.isFull()) {
      return;
    }

    const added = this.inventoryUI.addPowerUp(powerUp.type);
    if (added) {
      window.dispatchEvent(new CustomEvent('powerUpCollected', { detail: { type: powerUp.type } }));
    }
  }

  private activatePowerUp(type: PowerUpType): void {
    switch (type) {
      case 'hammer':
        this.activateHammer();
        break;
      case 'slowmo':
        if (this.onSlowMo) {
          this.onSlowMo(0.6, 12000);
        }
        break;
      case 'shield':
        if (this.onShield) {
          this.onShield(10000);
        }
        break;
      default:
        break;
    }
  }

  private activateHammer(): void {
    const lanes = this.hex.blocks;
    if (!lanes.length) return;

    let targetIndex = -1;
    for (let index = 0; index < 20; index++) {
      const complete = lanes.every(lane => lane.length > index && lane[index].deleted === 0);
      if (complete) {
        targetIndex = index;
        break;
      }
    }

    if (targetIndex === -1) {
      let maxIndex = -1;
      for (const lane of lanes) {
        if (lane.length > 0) {
          maxIndex = Math.max(maxIndex, lane.length - 1);
        }
      }

      if (maxIndex === -1) {
        return;
      }

      targetIndex = maxIndex;
    }

    let destroyed = 0;
    for (const lane of lanes) {
      const block = lane[targetIndex];
      if (block) {
        block.deleted = 1;
        destroyed += 1;
      }
    }

    if (destroyed > 0) {
      const bonusScore = destroyed * 50;
      const currentScore = stateManager.getState().game.score;
      const newScore = currentScore + bonusScore;
      stateManager.updateGame({ score: newScore });
      window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: { score: newScore } }));
    }
  }

  private getSpawnSettings(): { startDist: number; scale: number } {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const baseStartDist = isMobile ? 227 : 340;
    const scale = Math.min(this.canvas.element.width / 800, this.canvas.element.height / 800);
    return {
      startDist: baseStartDist * scale,
      scale,
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

