/**
 * Lives Display HUD Component
 * Shows player lives as hearts in the top-left corner
 */

export class LivesDisplay {
  private element: HTMLDivElement;
  private heartsContainer!: HTMLDivElement;
  private maxLives: number = 3;
  private currentLives: number = 3;

  constructor(maxLives: number = 3) {
    this.maxLives = maxLives;
    this.currentLives = maxLives;
    this.element = this.createElements();
  }

  private createElements(): HTMLDivElement {
    // Container
    const container = document.createElement('div');
    container.className = 'fixed top-4 left-4 z-20 flex items-center gap-2';

    // Hearts container
    this.heartsContainer = document.createElement('div');
    this.heartsContainer.className = 'flex gap-1';

    container.appendChild(this.heartsContainer);
    this.render();

    return container;
  }

  private render(): void {
    this.heartsContainer.innerHTML = '';

    for (let i = 0; i < this.maxLives; i++) {
      const heart = document.createElement('div');
      heart.className = `
        w-8 h-8 flex items-center justify-center
        text-2xl transition-all duration-300
        ${i < this.currentLives 
          ? 'opacity-100 scale-100 filter drop-shadow-[0_0_8px_rgba(231,76,60,0.6)]' 
          : 'opacity-30 scale-90 grayscale'
        }
      `;
      heart.textContent = '❤️';
      heart.title = `Life ${i + 1}`;
      this.heartsContainer.appendChild(heart);
    }
  }

  /**
   * Update lives count with animation
   */
  public setLives(lives: number): void {
    if (lives === this.currentLives) return;

    const wasLost = lives < this.currentLives;
    this.currentLives = Math.max(0, Math.min(lives, this.maxLives));
    
    this.render();

    // Animation effect when losing/gaining life
    if (wasLost) {
      this.heartsContainer.classList.add('animate-shake');
      setTimeout(() => {
        this.heartsContainer.classList.remove('animate-shake');
      }, 500);
    } else {
      this.heartsContainer.classList.add('animate-bounce');
      setTimeout(() => {
        this.heartsContainer.classList.remove('animate-bounce');
      }, 500);
    }
  }

  /**
   * Get current lives
   */
  public getLives(): number {
    return this.currentLives;
  }

  /**
   * Check if player is alive
   */
  public isAlive(): boolean {
    return this.currentLives > 0;
  }

  /**
   * Reset to max lives
   */
  public reset(): void {
    this.setLives(this.maxLives);
  }

  /**
   * Mount to parent element
   */
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  /**
   * Unmount from DOM
   */
  public unmount(): void {
    this.element.remove();
  }

  /**
   * Get DOM element
   */
  public getElement(): HTMLDivElement {
    return this.element;
  }
}
