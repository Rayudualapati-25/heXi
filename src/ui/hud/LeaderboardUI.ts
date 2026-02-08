/**
 * Leaderboard UI HUD Component
 * Shows real-time multiplayer leaderboard
 */

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  isCurrentPlayer?: boolean;
}

export class LeaderboardUI {
  private element: HTMLDivElement;
  private entriesContainer!: HTMLDivElement;
  private entries: LeaderboardEntry[] = [];
  private maxEntries: number = 10;

  constructor(maxEntries: number = 10) {
    this.maxEntries = maxEntries;
    this.element = this.createElements();
  }

  private createElements(): HTMLDivElement {
    // Container
    const container = document.createElement('div');
    container.className = `
      fixed top-16 right-4 z-20
      w-64 max-h-96
      bg-white/90 backdrop-blur-md
      border-2 border-gray-900
      rounded-lg shadow-xl
      overflow-hidden
    `;

    // Header
    const header = document.createElement('div');
    header.className = `
      px-4 py-3 bg-gray-900 text-white
      font-bold text-sm uppercase tracking-wider
      flex items-center justify-between
    `;
    header.innerHTML = `
      <span>🏆 Leaderboard</span>
      <span class="text-xs opacity-70">Live</span>
    `;

    // Entries container (scrollable)
    this.entriesContainer = document.createElement('div');
    this.entriesContainer.className = 'overflow-y-auto max-h-80';

    container.appendChild(header);
    container.appendChild(this.entriesContainer);

    return container;
  }

  /**
   * Update leaderboard entries
   */
  public updateEntries(entries: LeaderboardEntry[]): void {
    this.entries = entries
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxEntries);
    
    this.render();
  }

  /**
   * Render entries
   */
  private render(): void {
    this.entriesContainer.innerHTML = '';

    if (this.entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'px-4 py-8 text-center text-gray-500 text-sm';
      empty.textContent = 'No players yet';
      this.entriesContainer.appendChild(empty);
      return;
    }

    this.entries.forEach((entry, index) => {
      const entryEl = this.createEntryElement(entry, index);
      this.entriesContainer.appendChild(entryEl);
    });
  }

  /**
   * Create entry element
   */
  private createEntryElement(entry: LeaderboardEntry, index: number): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `
      px-4 py-3 flex items-center justify-between
      border-b border-gray-200
      transition-all duration-300
      ${entry.isCurrentPlayer 
        ? 'bg-yellow-100 border-l-4 border-l-yellow-500' 
        : 'hover:bg-gray-50'
      }
    `;

    // Rank and name
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center gap-3 flex-1 min-w-0';

    const rank = document.createElement('span');
    rank.className = `
      flex-shrink-0 w-6 h-6 rounded-full
      flex items-center justify-center
      text-xs font-bold
      ${index < 3 
        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' 
        : 'bg-gray-200 text-gray-700'
      }
    `;
    rank.textContent = (index + 1).toString();

    const name = document.createElement('span');
    name.className = `
      text-sm font-medium text-gray-900 truncate
      ${entry.isCurrentPlayer ? 'font-bold' : ''}
    `;
    name.textContent = entry.userName;
    name.title = entry.userName;

    leftSide.appendChild(rank);
    leftSide.appendChild(name);

    // Score
    const score = document.createElement('span');
    score.className = 'text-sm font-bold text-gray-900 ml-2 flex-shrink-0';
    score.textContent = entry.score.toLocaleString();

    el.appendChild(leftSide);
    el.appendChild(score);

    return el;
  }

  /**
   * Update single player score
   */
  public updatePlayerScore(userId: string, score: number): void {
    const entry = this.entries.find(e => e.userId === userId);
    if (entry) {
      entry.score = score;
      this.updateEntries(this.entries);
    }
  }

  /**
   * Add new player
   */
  public addPlayer(player: LeaderboardEntry): void {
    const existing = this.entries.findIndex(e => e.userId === player.userId);
    if (existing >= 0) {
      this.entries[existing] = player;
    } else {
      this.entries.push(player);
    }
    this.updateEntries(this.entries);
  }

  /**
   * Remove player
   */
  public removePlayer(userId: string): void {
    this.entries = this.entries.filter(e => e.userId !== userId);
    this.render();
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.entries = [];
    this.render();
  }

  /**
   * Show/hide leaderboard
   */
  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
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
