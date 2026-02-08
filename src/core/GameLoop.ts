/**
 * Game loop for Hextris
 * Manages the render and update cycle using requestAnimationFrame
 */

export type UpdateFunction = (deltaTime: number) => void;
export type RenderFunction = () => void;

export class GameLoop {
  private lastTime: number = 0;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private updateFn: UpdateFunction;
  private renderFn: RenderFunction;
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;

  constructor(updateFn: UpdateFunction, renderFn: RenderFunction) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main game loop - matches original Hextris timing
   * Original: dt = (now - lastTime)/16.666 * rush
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Calculate delta time (original Hextris timing formula)
    // dt in frame units (16.666ms per frame at 60fps)
    const deltaTime = (currentTime - this.lastTime) / 16.666;
    this.lastTime = currentTime;

    // Update game logic
    this.updateFn(deltaTime);

    // Render
    this.renderFn();

    // Calculate FPS
    this.updateFPS(currentTime);

    // Schedule next frame
    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Update FPS counter
   */
  private updateFPS(currentTime: number): void {
    this.frameCount++;
    const elapsed = currentTime - this.lastFpsUpdate;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  public getFPS(): number {
    return this.fps;
  }

  /**
   * Check if loop is running
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Pause the loop (keeps running state but skips updates)
   */
  public pause(): void {
    this.isRunning = false;
  }

  /**
   * Resume the loop
   */
  public resume(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }
}
