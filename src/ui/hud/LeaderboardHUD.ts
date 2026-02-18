/**
 * LeaderboardHUD - High-Performance Real-Time Leaderboard Dashboard
 * 
 * ARCHITECTURE:
 * - Event-driven: subscribes to scoreUpdated events
 * - No render loops: updates only on score changes
 * - Smooth animations: uses Tailwind utilities for transitions
 * - Theme-aware: adapts to current theme colors
 * 
 * FEATURES:
 * - Live ranking with smooth reordering
 * - Per-player score counting animation
 * - Momentum visualization (up/down/stable indicators)
 * - Highlight current player
 * - Compact, non-obstructive design
 */

export interface LeaderboardPlayer {
  userId: string;
  userName: string;
  score: number;
  isCurrentPlayer?: boolean;
  previousRank?: number;
  scoreChange?: number; // For momentum tracking
  hasLeft?: boolean; // Player quit mid-game
  hasFinished?: boolean; // Player completed their game
}

export class LeaderboardHUD {
  private element: HTMLDivElement;
  private entriesContainer!: HTMLDivElement;
  private players: Map<string, LeaderboardPlayer> = new Map();
  private previousScores: Map<string, number> = new Map();
  private animatingScores: Map<string, { current: number; target: number; frame: number | null }> = new Map();
  private maxVisible: number = 5;
  private visible: boolean = false;

  constructor(maxVisible: number = 5) {
    this.maxVisible = maxVisible;
    this.element = this.createElements();
  }

  private createElements(): HTMLDivElement {
    // Container - positioned top-right, compact and elegant
    const container = document.createElement('div');
    container.className = `
      fixed top-20 right-4 z-20
      w-72
      bg-gradient-to-br from-black/80 to-black/60
      backdrop-blur-lg
      border border-white/20
      rounded-2xl shadow-2xl
      overflow-hidden
      transition-all duration-300
      animate-slide-down
    `.trim().replace(/\s+/g, ' ');
    container.style.display = 'none'; // Hidden by default

    // Header with glow effect
    const header = document.createElement('div');
    header.className = `
      px-4 py-3
      bg-gradient-to-r from-gray-900/90 to-gray-800/90
      border-b border-white/10
      flex items-center justify-between
    `.trim().replace(/\s+/g, ' ');
    header.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <span class="text-white font-bold text-sm uppercase tracking-wider">Live Rankings</span>
      </div>
      <span class="text-xs text-white/50 font-mono">TOP ${this.maxVisible}</span>
    `;

    // Entries container with smooth scrolling
    this.entriesContainer = document.createElement('div');
    this.entriesContainer.className = 'overflow-y-auto max-h-80 divide-y divide-white/5';

    container.appendChild(header);
    container.appendChild(this.entriesContainer);

    return container;
  }

  /**
   * Add or update a player in the leaderboard
   */
  public updatePlayer(userId: string, userName: string, score: number, isCurrentPlayer: boolean = false): void {
    const existing = this.players.get(userId);
    const previousScore = this.previousScores.get(userId) || 0;
    const scoreChange = score - previousScore;

    const player: LeaderboardPlayer = {
      userId,
      userName,
      score,
      isCurrentPlayer,
      previousRank: existing?.previousRank,
      scoreChange: scoreChange !== 0 ? scoreChange : existing?.scoreChange || 0,
    };

    this.players.set(userId, player);
    this.previousScores.set(userId, score);

    // Initialize score animation
    if (!this.animatingScores.has(userId)) {
      this.animatingScores.set(userId, { current: score, target: score, frame: null });
    } else {
      const anim = this.animatingScores.get(userId)!;
      anim.target = score;
      if (anim.frame === null) {
        this.animatePlayerScore(userId);
      }
    }

    this.render();
  }

  /**
   * Mark a player as having left the game
   */
  public markPlayerLeft(userId: string): void {
    const player = this.players.get(userId);
    if (player) {
      player.hasLeft = true;
      this.render();
    }
  }

  /**
   * Mark a player as having finished their game
   */
  public markPlayerFinished(userId: string): void {
    const player = this.players.get(userId);
    if (player) {
      player.hasFinished = true;
      this.render();
    }
  }

  /**
   * Remove a player from the leaderboard
   */
  public removePlayer(userId: string): void {
    this.players.delete(userId);
    this.previousScores.delete(userId);
    
    const anim = this.animatingScores.get(userId);
    if (anim?.frame) {
      cancelAnimationFrame(anim.frame);
    }
    this.animatingScores.delete(userId);
    
    this.render();
  }

  /**
   * Clear all players
   */
  public clear(): void {
    this.players.clear();
    this.previousScores.clear();
    
    this.animatingScores.forEach(anim => {
      if (anim.frame) cancelAnimationFrame(anim.frame);
    });
    this.animatingScores.clear();
    
    this.render();
  }

  /**
   * Animate individual player score counting
   */
  private animatePlayerScore(userId: string): void {
    const anim = this.animatingScores.get(userId);
    if (!anim) return;

    const diff = anim.target - anim.current;
    const increment = Math.max(1, Math.ceil(Math.abs(diff) / 15));

    if (Math.abs(diff) < 1) {
      anim.current = anim.target;
      anim.frame = null;
      this.updatePlayerScoreDisplay(userId, anim.current);
      return;
    }

    anim.current += diff > 0 ? increment : -increment;
    this.updatePlayerScoreDisplay(userId, anim.current);

    anim.frame = requestAnimationFrame(() => this.animatePlayerScore(userId));
  }

  /**
   * Update just the score element for a player (performance optimization)
   */
  private updatePlayerScoreDisplay(userId: string, score: number): void {
    const scoreEl = this.element.querySelector(`[data-player-id="${userId}"] .player-score`);
    if (scoreEl) {
      scoreEl.textContent = Math.floor(score).toLocaleString();
    }
  }

  /**
   * Render the leaderboard
   */
  private render(): void {
    const sortedPlayers = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxVisible);

    // Update previous ranks for momentum calculation
    sortedPlayers.forEach((player, index) => {
      const current = this.players.get(player.userId);
      if (current) {
        current.previousRank = index + 1;
      }
    });

    this.entriesContainer.innerHTML = '';

    if (sortedPlayers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'px-4 py-12 text-center text-white/40 text-sm';
      empty.textContent = 'No players yet';
      this.entriesContainer.appendChild(empty);
      return;
    }

    sortedPlayers.forEach((player, index) => {
      const entry = this.createPlayerEntry(player, index + 1);
      this.entriesContainer.appendChild(entry);
    });
  }

  /**
   * Create player entry element
   */
  private createPlayerEntry(player: LeaderboardPlayer, rank: number): HTMLDivElement {
    const entry = document.createElement('div');
    entry.className = `
      px-4 py-3
      flex items-center gap-3
      transition-all duration-300
      ${player.isCurrentPlayer 
        ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-l-4 border-yellow-400' 
        : 'hover:bg-white/5'
      }
      animate-fade-in
    `.trim().replace(/\s+/g, ' ');
    entry.setAttribute('data-player-id', player.userId);

    // Rank badge
    const rankBadge = document.createElement('div');
    rankBadge.className = `
      flex-shrink-0 w-8 h-8 rounded-lg
      flex items-center justify-center
      text-sm font-bold
      transition-all duration-300
      ${this.getRankStyle(rank)}
    `.trim().replace(/\s+/g, ' ');
    rankBadge.textContent = rank.toString();

    // Player info
    const playerInfo = document.createElement('div');
    playerInfo.className = 'flex-1 min-w-0';

    const nameRow = document.createElement('div');
    nameRow.className = 'flex items-center gap-2';

    const name = document.createElement('span');
    name.className = `
      text-white font-medium truncate
      ${player.isCurrentPlayer ? 'font-bold' : ''}
    `.trim().replace(/\s+/g, ' ');
    name.textContent = player.userName;
    name.title = player.userName;

    // Momentum indicator
    const momentum = this.createMomentumIndicator(player);
    if (momentum) {
      nameRow.appendChild(name);
      nameRow.appendChild(momentum);
    } else {
      nameRow.appendChild(name);
    }

    const score = document.createElement('div');
    score.className = 'player-score text-white/80 text-xs font-mono mt-0.5';
    const anim = this.animatingScores.get(player.userId);
    score.textContent = Math.floor(anim?.current || player.score).toLocaleString();

    playerInfo.appendChild(nameRow);
    playerInfo.appendChild(score);

    // Score change indicator (right side)
    if (player.scoreChange && player.scoreChange !== 0) {
      const change = document.createElement('div');
      change.className = `
        flex-shrink-0 px-2 py-1 rounded-md
        text-xs font-bold
        ${player.scoreChange > 0 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-red-500/20 text-red-400'
        }
        animate-scale-in
      `.trim().replace(/\s+/g, ' ');
      change.textContent = `${player.scoreChange > 0 ? '+' : ''}${player.scoreChange.toLocaleString()}`;
      entry.appendChild(rankBadge);
      entry.appendChild(playerInfo);
      entry.appendChild(change);
    } else {
      entry.appendChild(rankBadge);
      entry.appendChild(playerInfo);
    }
    // Status badge for left/finished players
    if (player.hasLeft) {
      const leftBadge = document.createElement('div');
      leftBadge.className = 'flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400';
      leftBadge.textContent = 'LEFT';
      entry.appendChild(leftBadge);
      entry.style.opacity = '0.6';
    } else if (player.hasFinished) {
      const finBadge = document.createElement('div');
      finBadge.className = 'flex-shrink-0 px-2 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400';
      finBadge.textContent = 'DONE';
      entry.appendChild(finBadge);
    }
    return entry;
  }

  /**
   * Create momentum indicator (up/down/stable arrow)
   */
  private createMomentumIndicator(player: LeaderboardPlayer): HTMLSpanElement | null {
    if (!player.scoreChange || player.scoreChange === 0) return null;

    const indicator = document.createElement('span');
    indicator.className = `
      text-xs transition-all duration-300
      ${player.scoreChange > 0 ? 'text-green-400' : 'text-red-400'}
    `.trim().replace(/\s+/g, ' ');
    
    if (player.scoreChange > 0) {
      indicator.innerHTML = '▲';
      indicator.title = 'Rising';
    } else {
      indicator.innerHTML = '▼';
      indicator.title = 'Falling';
    }

    return indicator;
  }

  /**
   * Get rank-specific styling
   */
  private getRankStyle(rank: number): string {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 shadow-lg shadow-gray-400/50';
      case 3:
        return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/50';
      default:
        return 'bg-white/10 text-white/70';
    }
  }

  /**
   * Show/hide leaderboard
   */
  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.element.style.display = visible ? 'block' : 'none';
  }

  /**
   * Check if leaderboard is visible
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * Mount to parent element
   */
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  /**
   * Unmount and cleanup
   */
  public unmount(): void {
    // Cancel all animations
    this.animatingScores.forEach(anim => {
      if (anim.frame) cancelAnimationFrame(anim.frame);
    });
    this.animatingScores.clear();
    
    this.element.remove();
  }

  /**
   * Get DOM element
   */
  public getElement(): HTMLDivElement {
    return this.element;
  }

  /**
   * Get current player count
   */
  public getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * Get current player rank
   */
  public getPlayerRank(userId: string): number {
    const sorted = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score);
    return sorted.findIndex(p => p.userId === userId) + 1;
  }
}
