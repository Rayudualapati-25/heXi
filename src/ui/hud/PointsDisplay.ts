/**
 * Special Points Display HUD Component
 * Shows diamond counter and shop button in top-right corner
 */

export class PointsDisplay {
  private element: HTMLDivElement;
  private pointsText!: HTMLSpanElement;
  private currentPoints: number = 0;

  constructor(initialPoints: number = 0) {
    this.currentPoints = initialPoints;
    this.element = this.createElements();
  }

  private createElements(): HTMLDivElement {
    // Container
    const container = document.createElement('div');
    container.className = `
      fixed top-4 right-4 z-20
      flex items-center gap-3
    `;

    // Points display
    const pointsContainer = document.createElement('div');
    pointsContainer.className = `
      flex items-center gap-2 px-4 py-2
      bg-white/90 backdrop-blur-md
      border-2 border-gray-900
      rounded-lg shadow-lg
      transition-all duration-300
      hover:scale-105
    `;

    // Diamond icon
    const diamond = document.createElement('span');
    diamond.className = 'text-xl filter drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]';
    diamond.textContent = '💎';

    // Points text
    this.pointsText = document.createElement('span');
    this.pointsText.className = 'text-lg font-bold text-gray-900';
    this.pointsText.textContent = this.currentPoints.toString();

    pointsContainer.appendChild(diamond);
    pointsContainer.appendChild(this.pointsText);
    container.appendChild(pointsContainer);

    return container;
  }

  /**
   * Update points with animation
   */
  public setPoints(points: number): void {
    if (points === this.currentPoints) return;

    const gained = points > this.currentPoints;
    const difference = points - this.currentPoints;
    this.currentPoints = points;
    this.pointsText.textContent = points.toString();

    // Pulse animation on change
    if (gained && difference > 0) {
      // Add floating text for the diamond gain
      const floatingText = document.createElement('div');
      floatingText.className = 'absolute -top-8 left-0 text-yellow-400 font-bold text-lg animate-pulse';
      floatingText.textContent = `+${difference}`;
      this.element.appendChild(floatingText);
      setTimeout(() => floatingText.remove(), 600);

      this.element.classList.add('animate-pulse');
      this.element.style.transform = 'scale(1.1)';
      setTimeout(() => {
        this.element.classList.remove('animate-pulse');
        this.element.style.transform = 'scale(1)';
      }, 500);
    }
  }

  /**
   * Add points with animation
   */
  public addPoints(amount: number): void {
    this.setPoints(this.currentPoints + amount);
  }

  /**
   * Get current points
   */
  public getPoints(): number {
    return this.currentPoints;
  }

  /**
   * Check if player can afford something
   */
  public canAfford(cost: number): boolean {
    return this.currentPoints >= cost;
  }

  /**
   * Spend points
   */
  public spend(amount: number): boolean {
    if (!this.canAfford(amount)) {
      // Shake animation to indicate insufficient funds
      this.element.classList.add('animate-shake');
      setTimeout(() => {
        this.element.classList.remove('animate-shake');
      }, 500);
      return false;
    }

    this.setPoints(this.currentPoints - amount);
    return true;
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
