/**
 * Canvas utility for Hextris
 * Handles canvas setup, scaling, and responsive behavior
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, BREAKPOINTS } from './constants';

export class Canvas {
  public element: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private scale: number = 1;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = document.createElement('canvas');
    this.element.width = CANVAS_WIDTH;
    this.element.height = CANVAS_HEIGHT;
    
    const ctx = this.element.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    this.setupCanvas();
    this.updateScale();
  }

  /**
   * Setup canvas element
   */
  private setupCanvas(): void {
    this.element.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      image-rendering: crisp-edges;
    `;
    this.container.appendChild(this.element);
  }

  /**
   * Update canvas scale based on viewport size
   */
  public updateScale(): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate scale to fit viewport
    const scaleX = viewportWidth / CANVAS_WIDTH;
    const scaleY = viewportHeight / CANVAS_HEIGHT;
    this.scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

    // Apply responsive scaling based on breakpoints
    if (viewportWidth < BREAKPOINTS.SM) {
      // Mobile: Fill viewport
      this.scale = Math.min(scaleX, scaleY);
    } else if (viewportWidth < BREAKPOINTS.MD) {
      // Tablet: Scale down slightly
      this.scale = Math.min(scaleX, scaleY) * 0.9;
    } else {
      // Desktop: Max size with padding
      this.scale = Math.min(scaleX, scaleY, 1) * 0.85;
    }

    // Apply scale
    this.element.style.width = `${CANVAS_WIDTH * this.scale}px`;
    this.element.style.height = `${CANVAS_HEIGHT * this.scale}px`;
  }

  /**
   * Clear the canvas
   */
  public clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Get canvas coordinates from screen coordinates
   */
  public getCanvasCoordinates(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    const x = (screenX - rect.left) / this.scale;
    const y = (screenY - rect.top) / this.scale;
    return { x, y };
  }

  /**
   * Get current scale
   */
  public getScale(): number {
    return this.scale;
  }

  /**
   * Get canvas center
   */
  public getCenter(): { x: number; y: number } {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    };
  }

  /**
   * Set background color
   */
  public setBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Save context state
   */
  public save(): void {
    this.ctx.save();
  }

  /**
   * Restore context state
   */
  public restore(): void {
    this.ctx.restore();
  }

  /**
   * Set global alpha
   */
  public setAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha;
  }

  /**
   * Draw text (helper method)
   */
  public drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    } = {}
  ): void {
    this.ctx.save();
    this.ctx.font = options.font || '20px "Exo 2", sans-serif';
    this.ctx.fillStyle = options.color || '#000000';
    this.ctx.textAlign = options.align || 'center';
    this.ctx.textBaseline = options.baseline || 'middle';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  /**
   * Remove canvas from DOM
   */
  public destroy(): void {
    this.element.remove();
  }
}
