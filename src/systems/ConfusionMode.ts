/**
 * ConfusionMode - Increases cognitive load at score > 3000
 * 
 * FEATURES:
 * - Canvas filter effects (hue rotation + saturation boost)
 * - Color remapping layer (randomizes block colors while preserving collision logic)
 * - Runtime flag for performance control
 * - Score milestone activation
 * 
 * CONSTRAINTS:
 * - Does not modify base color definitions
 * - Preserves collision detection colors
 * - Enable/disable via runtime flag only
 */

import { blockColors, type HexColor } from '@config/colors';

export interface ConfusionModeConfig {
  /** Score threshold to trigger confusion mode */
  activationScore: number;
  /** Canvas filter to apply */
  canvasFilter: string;
  /** Duration in ms before color remapping shuffles (0 = no shuffle) */
  remapInterval: number;
}

export class ConfusionMode {
  private active: boolean = false;
  private config: ConfusionModeConfig;
  private colorRemapTable: Map<HexColor, HexColor> = new Map();
  private originalColors: HexColor[] = [];
  private remapIntervalId: number | null = null;
  private lastRemapTime: number = 0;

  constructor(config?: Partial<ConfusionModeConfig>) {
    this.config = {
      activationScore: 3000,
      canvasFilter: 'hue-rotate(90deg) saturate(1.2)',
      remapInterval: 0, // No auto-shuffle by default
      ...config,
    };

    // Store original colors
    this.originalColors = [...blockColors];
    this.initializeRemapTable();
  }

  /**
   * Initialize color remap table with randomized mapping
   */
  private initializeRemapTable(): void {
    const shuffled = this.shuffleArray([...this.originalColors]);
    this.originalColors.forEach((original, index) => {
      this.colorRemapTable.set(original, shuffled[index]);
    });
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Activate confusion mode
   */
  public activate(): void {
    if (this.active) return;
    
    this.active = true;
    this.reshuffleColors();
    
    console.log('[ConfusionMode] Activated - cognitive load increased');
  }

  /**
   * Deactivate confusion mode
   */
  public deactivate(): void {
    if (!this.active) return;
    
    this.active = false;
    
    if (this.remapIntervalId !== null) {
      clearInterval(this.remapIntervalId);
      this.remapIntervalId = null;
    }
    
    console.log('[ConfusionMode] Deactivated');
  }

  /**
   * Check if mode is active
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Get canvas filter string
   */
  public getCanvasFilter(): string {
    return this.active ? this.config.canvasFilter : 'none';
  }

  /**
   * Get remapped color (returns original if mode inactive or color not in table)
   */
  public getRemappedColor(originalColor: HexColor): HexColor {
    if (!this.active) return originalColor;
    return this.colorRemapTable.get(originalColor) || originalColor;
  }

  /**
   * Reshuffle color mappings
   */
  public reshuffleColors(): void {
    this.initializeRemapTable();
    this.lastRemapTime = Date.now();
    console.log('[ConfusionMode] Colors reshuffled');
  }

  /**
   * Update method - call each frame if interval-based reshuffling is needed
   */
  public update(): void {
    if (!this.active || this.config.remapInterval <= 0) return;
    
    const now = Date.now();
    if (now - this.lastRemapTime >= this.config.remapInterval) {
      this.reshuffleColors();
    }
  }

  /**
   * Check score and auto-activate if threshold reached
   */
  public checkScoreMilestone(score: number): void {
    if (!this.active && score >= this.config.activationScore) {
      this.activate();
    }
  }

  /**
   * Reset for new game
   */
  public reset(): void {
    this.deactivate();
    this.initializeRemapTable();
  }

  /**
   * Get configuration
   */
  public getConfig(): ConfusionModeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (only works when inactive)
   */
  public setConfig(config: Partial<ConfusionModeConfig>): boolean {
    if (this.active) {
      console.warn('[ConfusionMode] Cannot change config while active');
      return false;
    }
    
    this.config = { ...this.config, ...config };
    return true;
  }

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    this.deactivate();
    this.colorRemapTable.clear();
  }
}
