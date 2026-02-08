/**
 * HUD Integration Guide for GamePage.ts
 * Quick reference for integrating all HUD components
 */

// ============================================
// 1. IMPORTS (Add to top of GamePage.ts)
// ============================================

import { 
  LivesDisplay, 
  PointsDisplay, 
  ScoreDisplay, 
  InventoryUI, 
  LeaderboardUI 
} from '@/ui/hud';

// ============================================
// 2. CLASS PROPERTIES (Add to GamePage class)
// ============================================

private livesDisplay!: LivesDisplay;
private pointsDisplay!: PointsDisplay;
private scoreDisplay!: ScoreDisplay;
private inventoryUI!: InventoryUI;
private leaderboardUI!: LeaderboardUI;

// ============================================
// 3. INITIALIZATION (In initCanvas method)
// ============================================

// Create HUD overlay container
const hudContainer = document.createElement('div');
hudContainer.className = 'absolute inset-0 pointer-events-none';
hudContainer.id = 'hud-overlay';

// Make HUD elements clickable
hudContainer.style.pointerEvents = 'none';
const hudStyle = document.createElement('style');
hudStyle.textContent = `
  #hud-overlay > * { pointer-events: auto; }
`;
document.head.appendChild(hudStyle);

canvasContainer.appendChild(hudContainer);

// Initialize HUD components
this.livesDisplay = new LivesDisplay(3);
this.pointsDisplay = new PointsDisplay(0);
this.scoreDisplay = new ScoreDisplay(0);
this.inventoryUI = new InventoryUI(3);
this.leaderboardUI = new LeaderboardUI(10);

// Mount to overlay
this.livesDisplay.mount(hudContainer);
this.pointsDisplay.mount(hudContainer);
this.scoreDisplay.mount(hudContainer);
this.inventoryUI.mount(hudContainer);

// Leaderboard only visible in multiplayer
this.leaderboardUI.mount(hudContainer);
this.leaderboardUI.setVisible(false); // Hide by default

// ============================================
// 4. GAME LOOP UPDATES (In update method)
// ============================================

// Update score
this.scoreDisplay.setScore(state.game.score);

// Update lives (connect to your life system)
// this.livesDisplay.setLives(this.lifeSystem.getLives());

// Update special points (every 100 score)
// const specialPoints = Math.floor(state.game.score / 100);
// this.pointsDisplay.setPoints(specialPoints);

// ============================================
// 5. EVENT HANDLERS
// ============================================

// Power-up collection (when player collects power-up)
private onPowerUpCollected(type: string): void {
  const added = this.inventoryUI.addPowerUp(type);
  if (!added) {
    // Inventory full, play error sound or show message
    console.log('Inventory full!');
  }
}

// Power-up usage (listen to custom event)
constructor() {
  // ... existing code ...
  
  window.addEventListener('powerup-used', (e: CustomEvent) => {
    const { type, index } = e.detail;
    this.applyPowerUp(type);
  });
}

private applyPowerUp(type: string): void {
  switch(type) {
    case 'hammer':
      // Remove bottom row of blocks
      break;
    case 'slowmo':
      // Slow down block falling
      break;
    case 'shield':
      // Temporary invincibility
      break;
    case 'star':
      // Clear all blocks of one color
      break;
    case 'lightning':
      // Instant rotation
      break;
  }
}

// Combo scoring (flash effect)
private onComboScored(): void {
  this.scoreDisplay.flashCombo();
}

// Life lost
private onLifeLost(): void {
  const currentLives = this.livesDisplay.getLives();
  this.livesDisplay.setLives(currentLives - 1);
  
  if (!this.livesDisplay.isAlive()) {
    this.onGameOver();
  }
}

// ============================================
// 6. MULTIPLAYER INTEGRATION (Optional)
// ============================================

// Show leaderboard
private startMultiplayerGame(): void {
  this.leaderboardUI.setVisible(true);
}

// Update leaderboard
private onMultiplayerUpdate(players: any[]): void {
  const entries = players.map(p => ({
    userId: p.id,
    userName: p.name,
    score: p.score,
    isCurrentPlayer: p.id === this.currentPlayerId
  }));
  this.leaderboardUI.updateEntries(entries);
}

// ============================================
// 7. CLEANUP (In cleanup/unmount method)
// ============================================

private cleanup(): void {
  this.livesDisplay?.unmount();
  this.pointsDisplay?.unmount();
  this.scoreDisplay?.unmount();
  this.inventoryUI?.unmount();
  this.leaderboardUI?.unmount();
}

// ============================================
// 8. SPECIAL POINTS SPENDING (Shop integration)
// ============================================

private purchaseShopItem(cost: number): boolean {
  const canAfford = this.pointsDisplay.canAfford(cost);
  if (!canAfford) {
    // Show error message or shake animation (already built-in)
    return false;
  }
  
  const success = this.pointsDisplay.spend(cost);
  return success;
}

// ============================================
// 9. GAME OVER WITH CONTINUE OPTION
// ============================================

private onGameOver(): void {
  const specialPoints = this.pointsDisplay.getPoints();
  const canContinue = specialPoints >= 500;
  
  if (canContinue) {
    // Show continue modal
    this.showContinueModal(() => {
      // Continue game
      this.pointsDisplay.spend(500);
      this.livesDisplay.reset();
      // Resume game...
    });
  } else {
    // Show regular game over
    this.showGameOverModal();
  }
}

// ============================================
// 10. KEYBOARD SHORTCUTS
// ============================================

private setupKeyboardShortcuts(): void {
  window.addEventListener('keydown', (e) => {
    switch(e.key) {
      case '1':
        this.inventoryUI.usePowerUp(0);
        break;
      case '2':
        this.inventoryUI.usePowerUp(1);
        break;
      case '3':
        this.inventoryUI.usePowerUp(2);
        break;
    }
  });
}

// ============================================
// COMPLETE EXAMPLE: Typical Game Loop Update
// ============================================

private updateHUD(state: GameState): void {
  // Score
  this.scoreDisplay.setScore(state.game.score);
  
  // Special points (1 per 100 score)
  const points = Math.floor(state.game.score / 100);
  if (points > this.pointsDisplay.getPoints()) {
    this.pointsDisplay.addPoints(1);
  }
  
  // Lives (from life system)
  if (this.lifeSystem) {
    this.livesDisplay.setLives(this.lifeSystem.getLives());
  }
  
  // Multiplayer leaderboard
  if (state.multiplayer && this.multiplayerClient) {
    // Update happens via socket events, not here
  }
}

// ============================================
// EXAMPLE: Full GamePage Integration Pattern
// ============================================

export class GamePage extends BasePage {
  // ... existing properties ...
  
  // HUD components
  private livesDisplay!: LivesDisplay;
  private pointsDisplay!: PointsDisplay;
  private scoreDisplay!: ScoreDisplay;
  private inventoryUI!: InventoryUI;
  private leaderboardUI!: LeaderboardUI;
  
  public async onMount(): Promise<void> {
    await super.onMount();
    
    // Initialize HUD
    this.initHUD();
    
    // Setup event listeners
    this.setupHUDEvents();
  }
  
  private initHUD(): void {
    const hudContainer = document.getElementById('hud-overlay')!;
    
    this.livesDisplay = new LivesDisplay(3);
    this.pointsDisplay = new PointsDisplay(0);
    this.scoreDisplay = new ScoreDisplay(0);
    this.inventoryUI = new InventoryUI(3);
    this.leaderboardUI = new LeaderboardUI(10);
    
    this.livesDisplay.mount(hudContainer);
    this.pointsDisplay.mount(hudContainer);
    this.scoreDisplay.mount(hudContainer);
    this.inventoryUI.mount(hudContainer);
    this.leaderboardUI.mount(hudContainer);
    this.leaderboardUI.setVisible(false);
  }
  
  private setupHUDEvents(): void {
    // Power-up usage
    window.addEventListener('powerup-used', (e: CustomEvent) => {
      this.applyPowerUp(e.detail.type);
    });
    
    // State updates
    this.stateManager.subscribe('score-changed', (score) => {
      this.scoreDisplay.setScore(score);
    });
    
    this.stateManager.subscribe('lives-changed', (lives) => {
      this.livesDisplay.setLives(lives);
    });
  }
  
  public onUnmount(): void {
    this.livesDisplay.unmount();
    this.pointsDisplay.unmount();
    this.scoreDisplay.unmount();
    this.inventoryUI.unmount();
    this.leaderboardUI.unmount();
    
    super.onUnmount();
  }
}

/* 
NOTES:
- All HUD components are pointer-events: auto for interactivity
- Positions are fixed, no manual positioning needed
- Animations built-in, just call the methods
- Type-safe with TypeScript
- NO PURPLE anywhere!
*/
