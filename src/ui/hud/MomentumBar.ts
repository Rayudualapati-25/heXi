/**
 * MomentumBar
 * Displays multiplayer momentum progress based on score delta.
 * 0-50 = Behind (red gradient), 50 = Tied (neutral), 50-100 = Ahead (green gradient)
 */

export class MomentumBar {
  private element: HTMLDivElement;
  private fill!: HTMLDivElement;
  private label!: HTMLDivElement;
  private lastValue = -1;

  constructor() {
    this.element = this.createElements();
  }

  private createElements(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = `
      fixed top-16 left-4 z-20
      w-36 sm:w-44
      px-3 py-2
      bg-black/70 text-white
      border border-white/15
      rounded-xl
      shadow-lg
      backdrop-blur-md
      text-[10px] uppercase tracking-widest
    `.trim().replace(/\s+/g, ' ');

    this.label = document.createElement('div');
    this.label.className = 'font-semibold mb-1';
    this.label.textContent = 'Momentum';

    const bar = document.createElement('div');
    bar.className = 'h-2 w-full bg-white/10 rounded-full overflow-hidden relative';

    // Center marker for 50% (tied position)
    const centerMarker = document.createElement('div');
    centerMarker.className = 'absolute top-0 left-1/2 w-0.5 h-full bg-white/30 z-10';
    bar.appendChild(centerMarker);

    this.fill = document.createElement('div');
    this.fill.className = 'h-full transition-all duration-300';
    this.fill.style.width = '50%';

    bar.appendChild(this.fill);
    container.appendChild(this.label);
    container.appendChild(bar);

    return container;
  }

  public setValue(value: number): void {
    if (value === this.lastValue) return;
    const clamped = Math.max(0, Math.min(100, value));
    
    // Update bar width
    this.fill.style.width = `${clamped}%`;
    
    // Update gradient color based on position
    if (clamped < 45) {
      // Behind - red gradient
      this.fill.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
      this.label.textContent = 'Behind';
      this.label.style.color = '#ef4444';
    } else if (clamped > 55) {
      // Ahead - green gradient
      this.fill.style.background = 'linear-gradient(to right, #10b981, #34d399)';
      this.label.textContent = 'Ahead';
      this.label.style.color = '#10b981';
    } else {
      // Tied - neutral cyan
      this.fill.style.background = 'linear-gradient(to right, #06b6d4, #22d3ee)';
      this.label.textContent = 'Tied';
      this.label.style.color = '#06b6d4';
    }
    
    this.lastValue = value;
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }
}
