/**
 * TimeOrbSystem
 * Spawns and manages timer extension orbs.
 */

import type { Canvas } from '@core/Canvas';
import type { Hex } from '@entities/Hex';
import { TimeOrb } from '@entities/TimeOrb';

export interface TimeOrbSystemOptions {
  hex: Hex;
  canvas: Canvas;
  spawnChance?: number;
  cooldownMs?: number;
  onCollect?: () => void;
}

export class TimeOrbSystem {
  private hex: Hex;
  private canvas: Canvas;
  private activeOrbs: TimeOrb[] = [];
  private spawnChance: number;
  private cooldownMs: number;
  private elapsedMs = 0;
  private lastSpawnMs = -Infinity;
  private enabled = true;
  private onCollect?: () => void;

  constructor(options: TimeOrbSystemOptions) {
    this.hex = options.hex;
    this.canvas = options.canvas;
    this.spawnChance = options.spawnChance ?? 0.6;
    this.cooldownMs = options.cooldownMs ?? 8000;
    this.onCollect = options.onCollect;
  }

  public update(dt: number): void {
    if (!this.enabled) return;

    this.elapsedMs += dt * 16.6667;
    const hexRadius = (this.hex.sideLength / 2) * Math.sqrt(3);

    for (let i = this.activeOrbs.length - 1; i >= 0; i--) {
      const orb = this.activeOrbs[i];
      orb.update(dt, hexRadius);

      if (orb.collected) {
        this.onCollect?.();
      }

      if (orb.shouldRemove()) {
        this.activeOrbs.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;
    const centerX = this.canvas.element.width / 2 + this.hex.gdx;
    const centerY = this.canvas.element.height / 2 + this.hex.gdy;
    this.activeOrbs.forEach((orb) => orb.render(ctx, centerX, centerY));
  }

  public reset(): void {
    this.activeOrbs = [];
    this.elapsedMs = 0;
    this.lastSpawnMs = -Infinity;
  }

  /**
   * Clear active orbs on field (for life loss)
   */
  public clearActiveOrbs(): void {
    this.activeOrbs = [];
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public trySpawn(): void {
    if (!this.enabled) return;
    if (this.elapsedMs - this.lastSpawnMs < this.cooldownMs) return;
    if (Math.random() > this.spawnChance) return;

    const lane = this.randomInt(0, this.hex.sides);
    const { startDist, scale } = this.getSpawnSettings();
    this.activeOrbs.push(new TimeOrb({ lane, startDist, scale }));
    this.lastSpawnMs = this.elapsedMs;
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
