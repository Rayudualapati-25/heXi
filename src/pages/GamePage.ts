/**
 * GamePage - Main game screen with canvas and HUD
 * Canvas rendering, game loop, controls, pause menu, game over
 */

import { BasePage } from './BasePage';
import { Button } from '@ui/components/Button';
import { Modal } from '@ui/components/Modal';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { GameLoop } from '@core/GameLoop';
import { Canvas } from '@core/Canvas';
import { INVULNERABILITY_DURATION, LIFE_BONUS_INTERVAL, MAX_LIVES, ROUTES, GameStatus } from '@core/constants';
import { Hex } from '@entities/Hex';
import { Block } from '@entities/Block';
import { FloatingText } from '@entities/FloatingText';
import { WaveSystem } from '@systems/WaveSystem';
import { PhysicsSystem } from '@systems/PhysicsSystem';
import { MatchingSystem } from '@systems/MatchingSystem';
import { PowerUpSystem } from '@systems/PowerUpSystem';
import { SpecialPointsSystem } from '@systems/SpecialPointsSystem';
import { getInputManager } from '@utils/input';
import { themes, ThemeName } from '@config/themes';
import { appwriteClient } from '@network/AppwriteClient';
import { GroupManager } from '@network/GroupManager';
import { DailyChallengeSystem } from '@modes/DailyChallengeMode';
import { TimerAttackMode } from '@modes/TimerAttackMode';
import { DailyChallengeModal } from '@ui/modals/DailyChallengeModal';
import { ShopModal } from '@ui/modals/ShopModal';
import { 
  LivesDisplay, 
  PointsDisplay, 
  ScoreDisplay, 
  InventoryUI 
} from '@ui/hud';
import { audioManager } from '@/managers/AudioManager';
import { createEmptyInventory, ShopItemId } from '@config/shopItems';

export class GamePage extends BasePage {
  private canvas!: Canvas;
  private gameLoop!: GameLoop;
  private pauseModal: Modal | null = null;
  private gameOverModal: Modal | null = null;
  private shopModal: ShopModal | null = null;
  private shopPausedGame = false;
  private hasContinued = false;
  private lastLives = 0;
  private unsubscribeLivesChanged: (() => void) | null = null;
  
  // HUD Components
  private livesDisplay!: LivesDisplay;
  private pointsDisplay!: PointsDisplay;
  private scoreDisplay!: ScoreDisplay;
  private inventoryUI!: InventoryUI;
  
  // Game entities and systems
  private hex!: Hex;
  private waveSystem!: WaveSystem;
  private physicsSystem!: PhysicsSystem;
  private matchingSystem!: MatchingSystem;
  private powerUpSystem!: PowerUpSystem;
  private specialPointsSystem!: SpecialPointsSystem;
  private floatingTexts: FloatingText[] = [];
  private frameCount: number = 0;
  private rushMultiplier: number = 1;
  private powerUpSpeedMultiplier: number = 1;
  private slowMoTimeoutId: number | null = null;
  private shieldTimeoutId: number | null = null;
  private invulnerabilityTimeoutId: number | null = null;
  private nextLifeBonusScore: number = LIFE_BONUS_INTERVAL;
  private blockSettings: any;
  private dailyChallenge: DailyChallengeSystem | null = null;
  private dailyChallengeModal: DailyChallengeModal | null = null;
  private timerAttack: TimerAttackMode | null = null;
  private groupManager = new GroupManager();
  private unsubscribeGameOver: (() => void) | null = null;
  private handleGameOverSfx = (): void => {
    audioManager.playSfx('gameOver');
  };
  private handleBlockLandSfx = (): void => {
    audioManager.playSfx('blockLand');
  };
  private handlePowerUpCollectedSfx = (): void => {
    audioManager.playSfx('powerUpCollect');
  };
  private handlePowerUpUsedInventory = (event: Event): void => {
    const customEvent = event as CustomEvent<{ type?: ShopItemId }>;
    const type = customEvent.detail?.type;
    if (!type) return;
    this.consumeInventoryItem(type);
  };

  private handleTimerModeTimeUp = (event: Event): void => {
    if (stateManager.getState().status !== GameStatus.PLAYING) return;
    const customEvent = event as CustomEvent<{ score?: number }>;
    const finalScore = customEvent.detail?.score ?? stateManager.getState().game.score;
    stateManager.updateGame({ score: finalScore });
    stateManager.setState('status', GameStatus.GAME_OVER);
    stateManager.emit('gameOver', { score: finalScore, reason: 'timer' });

    const playerId = stateManager.getState().player.id;
    if (playerId) {
      void appwriteClient.updateTimerAttackBest(playerId, finalScore);
    }
  };

  public render(): void {
    this.element.className = 'page min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden';

    // Create game container
    const gameContainer = document.createElement('div');
    gameContainer.className = 'h-screen w-full flex flex-col';

    // Canvas Container (full screen for HUD overlay)
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'flex-1 flex items-center justify-center p-4';
    canvasContainer.id = 'game-canvas-container';
    gameContainer.appendChild(canvasContainer);

    // Controls Info (mobile)
    const controls = this.createControls();
    gameContainer.appendChild(controls);

    this.element.appendChild(gameContainer);
    this.mount();
  }

  /**
   * Create controls info
   */
  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'bg-white/80 backdrop-blur-sm border-t-2 border-gray-300 px-4 py-2 text-center';
    controls.innerHTML = `
      <div class="text-xs text-gray-600">
        <span class="hidden md:inline">Left/Right Arrow Keys to Rotate - Down Arrow to Speed Up - P or Space to Pause</span>
        <span class="md:hidden">Swipe to Move - Tap to Rotate</span>
      </div>
    `;
    return controls;
  }

  /**
   * Initialize canvas
   */
  private initCanvas(): void {
    const container = document.getElementById('game-canvas-container');
    if (!container) return;

    // Initialize Canvas wrapper (it creates its own canvas element)
    this.canvas = new Canvas(container);

    // Add border and shadow styles
    this.canvas.element.className = 'border-4 border-black rounded-lg shadow-2xl';

    // Create HUD overlay container
    const hudContainer = document.createElement('div');
    hudContainer.className = 'absolute inset-0 pointer-events-none';
    hudContainer.id = 'hud-overlay';
    container.appendChild(hudContainer);

    // Make HUD elements clickable
    const hudStyle = document.createElement('style');
    hudStyle.textContent = `#hud-overlay > * { pointer-events: auto; }`;
    document.head.appendChild(hudStyle);

    // Initialize HUD components
    const state = stateManager.getState();
    this.livesDisplay = new LivesDisplay(state.game.lives);
    this.pointsDisplay = new PointsDisplay(state.player.specialPoints, {
      onShopClick: () => this.openShopModal(),
    });
    this.scoreDisplay = new ScoreDisplay(state.game.score);
    this.inventoryUI = new InventoryUI(3);
    this.lastLives = state.game.lives;
    this.nextLifeBonusScore = LIFE_BONUS_INTERVAL;

    this.seedInventorySlots();
    this.applyStoredExtraLives();

    // Mount to overlay
    this.livesDisplay.mount(hudContainer);
    this.pointsDisplay.mount(hudContainer);
    this.scoreDisplay.mount(hudContainer);
    this.inventoryUI.mount(hudContainer);

    // Add pause button
    const pauseButton = document.createElement('button');
    pauseButton.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 translate-y-16 z-20
      px-4 py-2 bg-white/90 backdrop-blur-md
      border-2 border-gray-900 rounded-lg shadow-lg
      text-sm font-bold text-gray-900
      hover:scale-105 transition-all duration-200
      active:scale-95
    `;
    pauseButton.textContent = 'PAUSE (P)';
    pauseButton.onclick = () => this.pauseGame();
    hudContainer.appendChild(pauseButton);

    // Initialize game entities
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;
    // hexSideLength is actually the RADIUS (center to vertex), not side length
    // Original Hextris uses 65 for desktop, 87 for mobile
    // Scale proportionally to canvas size
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const baseHexWidth = isMobile ? 87 : 65;
    const hexRadius = baseHexWidth * Math.min(centerX / 400, centerY / 400);
    
    // Create hex with correct parameters (radius, canvasWidth, canvasHeight)
    this.hex = new Hex(hexRadius, this.canvas.element.width, this.canvas.element.height, {
      scale: 1,
      comboTime: 240
    });
    
    // Get current theme colors for blocks
    const theme = themes[state.player.selectedTheme] || themes[ThemeName.CLASSIC];
    const blockColors = theme.colors.blocks;
    
    // Initialize game systems
    const difficulty = state.game.difficulty;
    const speedModifier = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.3 : 1.0;
    const creationSpeedModifier = 1.0;
    
    this.waveSystem = new WaveSystem(
      { colors: blockColors, speedModifier, creationSpeedModifier },
      6,
      (lane: number, color: string, speed: number) => this.spawnBlock(lane, color, speed)
    );
    
    // Use hexRadius directly (already calculated above)
    this.physicsSystem = new PhysicsSystem(hexRadius);
    
    this.matchingSystem = new MatchingSystem(speedModifier, creationSpeedModifier);
    this.specialPointsSystem = new SpecialPointsSystem();
    this.powerUpSystem = new PowerUpSystem({
      hex: this.hex,
      canvas: this.canvas,
      inventoryUI: this.inventoryUI,
      onSlowMo: (multiplier, durationMs) => this.applySlowMo(multiplier, durationMs),
      onShield: (durationMs) => this.applyShield(durationMs),
    });
    
    // Reset frame counter
    this.frameCount = 0;
    
    console.log('Canvas initialized', {
      canvasSize: `${this.canvas.element.width}x${this.canvas.element.height}`,
      hexCenter: `(${centerX}, ${centerY})`,
      hexRadius: hexRadius,
      hexApothem: (hexRadius * Math.sqrt(3) / 2).toFixed(2),
      blockColors
    });
  }
  
  /**
   * Spawn a new falling block
   */
  private spawnBlock(lane: number, color: string, speed: number): void {
    const state = stateManager.getState();
    if (state.status !== GameStatus.PLAYING) return;
    
    // Calculate starting distance from hex (spawn off-screen)
    // Original: 340 for desktop, 227 for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const baseStartDist = isMobile ? 227 : 340;
    const scale = Math.min(this.canvas.element.width / 800, this.canvas.element.height / 800);
    const startDist = baseStartDist * scale;
    
    // Create block settings (original values)
    const baseBlockHeight = isMobile ? 20 : 15;
    const creationDt = isMobile ? 60 : 9;
    this.blockSettings = {
      blockHeight: baseBlockHeight * scale,
      scale: scale,
      prevScale: scale,
      creationDt: creationDt,
      startDist,
    };
    
    // Pass hex reference for shake effects
    const block = new Block(
      lane,
      color,
      speed, // Don't apply rush here, it's applied in update()
      startDist,
      false,
      this.blockSettings,
      this.hex
    );
    this.physicsSystem.addFallingBlock(block);
  }

  /**
   * Start game loop
   */
  private startGameLoop(): void {
    // Create game loop with update and render callbacks
    this.gameLoop = new GameLoop(
      (deltaTime: number) => this.update(deltaTime),
      () => this.draw()
    );
    
    this.gameLoop.start();

    // No longer need HUD update interval - HUD updates in game loop
  }

  /**
   * Update game state
   * Original from update.js - proper order: update falling, check matches, remove deleted, update attached
   */
  private update(deltaTime: number): void {
    const state = stateManager.getState();
    if (state.status !== GameStatus.PLAYING) return;
    
    // Apply rush multiplier to deltaTime (original: dt * rush)
    const dt = deltaTime * this.rushMultiplier * this.powerUpSpeedMultiplier;
    
    this.frameCount++;
    
    // Update hex rotation animation and dt
    this.hex.dt = dt;
    
    // Sync hex difficulty with wave system
    this.hex.playThrough = this.waveSystem.getDifficulty();
    
    // Update wave generation (spawn new blocks)
    this.waveSystem.update(dt, this.frameCount);
    
    // Update physics (falling blocks move toward center and check collision)
    // Pass scale=1 for now (can be adjusted for screen scaling later)
    this.physicsSystem.update(this.hex, dt, 1);

    this.powerUpSystem.update(dt);
    
    // Check for matches on newly settled blocks (checked=1)
    // Original: for each block, if (block.checked == 1) consolidateBlocks(...)
    const matchResults = this.matchingSystem.checkAllMatches(this.hex, this.frameCount);
    let runningScore = state.game.score;
    let diamondsToAdd = 0;
    for (const result of matchResults) {
      // Add score
      runningScore += result.score;
      window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: { score: runningScore } }));

      // Award diamonds based on streak (combo)
      const diamondsEarned = Math.max(0, result.combo - 1);
      console.log(`Match found: ${result.blocksCleared} blocks, Combo: ${result.combo}, Diamonds earned: ${diamondsEarned}`);
      if (diamondsEarned > 0) {
        diamondsToAdd += diamondsEarned;
      }
      
      // Create floating text for score
      const centerX = this.canvas.element.width / 2;
      const centerY = this.canvas.element.height / 2;
      this.floatingTexts.push(
        FloatingText.createScore(centerX + result.centerX, centerY + result.centerY, result.score, result.color)
      );
      
      // Show combo text if combo > 1
      if (result.combo > 1) {
        this.floatingTexts.push(
          FloatingText.createCombo(centerX, centerY - 50, result.combo)
        );
        window.dispatchEvent(new CustomEvent('comboAchieved', { detail: { count: result.combo } }));
      }
      
      // Speed up wave system
      this.waveSystem.onBlocksDestroyed();
    }

    if (matchResults.length > 0) {
      audioManager.playSfx('matchClear');
      stateManager.updateGame({ score: runningScore });
    }

    if (runningScore >= this.nextLifeBonusScore) {
      this.applyLifeBonus(runningScore);
    }

    if (diamondsToAdd > 0) {
      this.specialPointsSystem.addPoints(diamondsToAdd);
    }
    
    // Remove fully deleted blocks (deleted=2) and reset settled flags
    // Original: for each lane, splice deleted blocks, track lowest index, reset settled for blocks above
    for (let i = 0; i < this.hex.blocks.length; i++) {
      let lowestDeletedIndex = 999;
      
      for (let j = this.hex.blocks[i].length - 1; j >= 0; j--) {
        const block = this.hex.blocks[i][j];
        
        if (block.deleted === 2) {
          // Remove block
          this.hex.blocks[i].splice(j, 1);
          if (j < lowestDeletedIndex) {
            lowestDeletedIndex = j;
          }
        }
      }
      
      // Reset settled flag for blocks above deleted ones (they need to fall)
      if (lowestDeletedIndex < this.hex.blocks[i].length) {
        for (let j = lowestDeletedIndex; j < this.hex.blocks[i].length; j++) {
          this.hex.blocks[i][j].settled = false;
        }
      }
    }
    
    // Update attached blocks (make them fall to fill gaps)
    // Original: for each block, doesBlockCollide to settle, then move if not settled
    for (let i = 0; i < this.hex.blocks.length; i++) {
      for (let j = 0; j < this.hex.blocks[i].length; j++) {
        const block = this.hex.blocks[i][j];
        
        // Check collision to settle block
        this.hex.doesBlockCollide(block, j, this.hex.blocks[i]);
        
        // Move unsettled blocks down
        if (!block.settled) {
          block.distFromHex -= block.iter * dt * 1; // scale = 1
        }
      }
    }
    
    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      const alive = text.update(dt);
      if (!alive) {
        this.floatingTexts.splice(i, 1);
      }
    }
    
    // Increment hex frame counter
    this.hex.ct += dt;
    
    // Check for game over (original: checks if blocks exceed rows setting)
    if (this.hex.isGameOver(8)) { // Original uses settings.rows which is typically 7-8
      if (!state.game.isInvulnerable) {
        this.handleLifeLoss();
      }
    }

    // Update HUD displays
    const updatedState = stateManager.getState();
    this.scoreDisplay.setScore(updatedState.game.score);
    this.livesDisplay.setLives(updatedState.game.lives);

    // Update special points from player state
    this.pointsDisplay.setPoints(updatedState.player.specialPoints);
  }

  /**
   * Draw game frame
   */
  private draw(): void {
    if (!this.canvas) return;

    this.canvas.clear();
    const ctx = this.canvas.ctx;
    const state = stateManager.getState();
    
    // Save context state
    ctx.save();
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.element.height);
    gradient.addColorStop(0, '#f9fafb');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.element.width, this.canvas.element.height);
    
    // Process shake effects (reset each frame)
    this.hex.gdx = 0;
    this.hex.gdy = 0;
    for (const shake of this.hex.shakes) {
      const angle = (30 + shake.lane * 60) * (Math.PI / 180);
      this.hex.gdx -= Math.cos(angle) * shake.magnitude;
      this.hex.gdy += Math.sin(angle) * shake.magnitude;
    }
    
    // Draw outer hexagon ring (shows game-over boundary)
    // Original formula: (rows * blockHeight) * (2/Math.sqrt(3)) + hexWidth
    const rows = 8; // Maximum rows before game over
    const blockHeight = this.blockSettings?.blockHeight || 20;
    const outerRadius = (rows * blockHeight) * (2 / Math.sqrt(3)) + this.hex.sideLength;
    this.drawOuterHexagon(ctx, outerRadius);
    
    // Draw combo timer on outer hexagon (original Hextris feature)
    this.drawComboTimer(ctx, outerRadius);
    
    // Draw hexagon with attached blocks
    const theme = state.player.selectedTheme;
    this.hex.draw(ctx, theme);
    
    // Draw falling blocks
    const fallingBlocks = this.physicsSystem.getFallingBlocks();
    for (const block of fallingBlocks) {
      block.draw(ctx);
    }

    this.powerUpSystem.render(ctx);
    
    // Draw floating texts (score popups)
    for (const text of this.floatingTexts) {
      text.draw(ctx);
    }
    
    // Restore context state
    ctx.restore();
  }

  /**
   * Draw combo timer visualization (colored lines on outer hexagon)
   * Original: drawTimer() function
   */
  private drawComboTimer(ctx: CanvasRenderingContext2D, radius: number): void {
    const timeSinceLastCombo = this.hex.ct - this.hex.lastCombo;
    const comboTimeLimit = 240; // Original: settings.comboTime
    
    if (timeSinceLastCombo >= comboTimeLimit) return;
    
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;
    
    // Draw colored progress lines on outer hexagon
    ctx.save();
    ctx.strokeStyle = this.hex.lastColorScored || '#3498db';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    
    // Calculate how many complete sides to draw
    const progress = 1 - (timeSinceLastCombo / comboTimeLimit);
    const totalSides = 6;
    const completeSides = Math.floor(progress * totalSides);
    const partialProgress = (progress * totalSides) % 1;
    
    ctx.beginPath();
    for (let i = 0; i < completeSides; i++) {
      const angle1 = (30 + i * 60) * (Math.PI / 180);
      const angle2 = (30 + (i + 1) * 60) * (Math.PI / 180);
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    
    // Draw partial side
    if (partialProgress > 0 && completeSides < totalSides) {
      const i = completeSides;
      const angle1 = (30 + i * 60) * (Math.PI / 180);
      const angle2 = (30 + (i + 1) * 60) * (Math.PI / 180);
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      const partialX = x1 + (x2 - x1) * partialProgress;
      const partialY = y1 + (y2 - y1) * partialProgress;
      ctx.moveTo(x1, y1);
      ctx.lineTo(partialX, partialY);
    }
    
    ctx.stroke();
    ctx.restore();
  }
  
  /**
   * Draw outer hexagon boundary ring (shows game-over limit)
   * Uses SAME formula as inner hex - pointy-top orientation with fixed (non-rotating) angle
   */
  private drawOuterHexagon(ctx: CanvasRenderingContext2D, radius: number): void {
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;
    
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    
    // Use SAME formula as inner hexagon for perfect alignment
    // Initial angle is 30 degrees (180 / 6 sides)
    const baseAngle = 30; // This matches Hex.angle initial value
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Match inner hex formula: angle = base + (i * 360/sides)
      const vertexAngle = (baseAngle + (i * 360 / 6)) * (Math.PI / 180);
      // Match inner hex coordinate formula: x = centerX - radius * sin(angle), y = centerY + radius * cos(angle)
      const x = centerX - radius * Math.sin(vertexAngle);
      const y = centerY + radius * Math.cos(vertexAngle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw corner circles for better visibility
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 6; i++) {
      const vertexAngle = (baseAngle + (i * 360 / 6)) * (Math.PI / 180);
      const x = centerX - radius * Math.sin(vertexAngle);
      const y = centerY + radius * Math.cos(vertexAngle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  /**
   * Update HUD display
   */
  /**
   * Pause game
   */
  private pauseGame(): void {
    this.gameLoop.pause();
    window.dispatchEvent(new CustomEvent('pauseGame'));

    this.pauseModal = new Modal({
      title: 'PAUSED',
      closeOnBackdrop: false,
      closeOnEscape: false,
    });

    const content = document.createElement('div');
    content.className = 'space-y-4 py-4';

    // Resume button
    const resumeBtn = new Button('Resume Game', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.resumeGame(),
    });
    content.appendChild(resumeBtn.element);

    // Restart button
    const restartBtn = new Button('Restart', {
      variant: 'outline',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.restartGame(),
    });
    content.appendChild(restartBtn.element);

    // Main menu button
    const menuBtn = new Button('Main Menu', {
      variant: 'ghost',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.exitToMenu(),
    });
    content.appendChild(menuBtn.element);

    this.pauseModal.setContent(content);
    this.pauseModal.open();
  }

  /**
   * Resume game
   */
  private resumeGame(): void {
    if (this.pauseModal) {
      this.pauseModal.close();
      this.pauseModal = null;
    }
    this.gameLoop.resume();
    window.dispatchEvent(new CustomEvent('resumeGame'));
  }

  /**
   * Restart game
   */
  private restartGame(): void {
    if (this.pauseModal) {
      this.pauseModal.close();
      this.pauseModal = null;
    }
    stateManager.resetGame();
    
    // Reset game systems
    this.hex.clearBlocks();
    this.physicsSystem.reset();
    this.waveSystem.reset();
    this.matchingSystem.resetCombo();
    this.powerUpSystem.reset();
    this.floatingTexts = [];
    this.frameCount = 0;
    this.rushMultiplier = 1;
    this.powerUpSpeedMultiplier = 1;
    this.nextLifeBonusScore = LIFE_BONUS_INTERVAL;
    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
      this.slowMoTimeoutId = null;
    }
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
      this.shieldTimeoutId = null;
    }
    
    this.resumeGame();
  }

  /**
   * Exit to main menu
   */
  private exitToMenu(): void {
    if (this.pauseModal) {
      this.pauseModal.close();
      this.pauseModal = null;
    }
    this.gameLoop.stop();
    Router.getInstance().navigate(ROUTES.MENU);
  }

  private applySlowMo(multiplier: number, durationMs: number): void {
    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
    }
    this.powerUpSpeedMultiplier = multiplier;
    this.slowMoTimeoutId = window.setTimeout(() => {
      this.powerUpSpeedMultiplier = 1;
      this.slowMoTimeoutId = null;
    }, durationMs);
  }

  private applyShield(durationMs: number): void {
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
    }
    stateManager.updateGame({ isInvulnerable: true });
    this.shieldTimeoutId = window.setTimeout(() => {
      stateManager.updateGame({ isInvulnerable: false });
      this.shieldTimeoutId = null;
    }, durationMs);
  }

  private applyLifeBonus(score: number): void {
    const state = stateManager.getState();
    if (state.game.lives >= MAX_LIVES) {
      this.nextLifeBonusScore = Math.ceil(score / LIFE_BONUS_INTERVAL) * LIFE_BONUS_INTERVAL + LIFE_BONUS_INTERVAL;
      return;
    }

    let livesToAdd = 0;
    while (score >= this.nextLifeBonusScore) {
      livesToAdd += 1;
      this.nextLifeBonusScore += LIFE_BONUS_INTERVAL;
    }

    const nextLives = Math.min(MAX_LIVES, state.game.lives + livesToAdd);
    if (nextLives > state.game.lives) {
      stateManager.updateGame({ lives: nextLives });
      const centerX = this.canvas.element.width / 2;
      const centerY = this.canvas.element.height / 2;
      this.floatingTexts.push(FloatingText.createLifeGained(centerX, centerY - 120));
    }
  }

  private handleLifeLoss(): void {
    const state = stateManager.getState();
    const nextLives = state.game.lives - 1;
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;

    if (nextLives <= 0) {
      stateManager.updateGame({ lives: 0 });
      stateManager.setState('status', GameStatus.GAME_OVER);
      stateManager.emit('gameOver', { score: state.game.score });
      window.dispatchEvent(new CustomEvent('gameOver', { detail: { score: state.game.score } }));
      return;
    }

    stateManager.updateGame({ lives: nextLives, isInvulnerable: true });
    this.floatingTexts.push(FloatingText.createLifeLost(centerX, centerY - 120));
    this.clearBlocksAndRestart();

    if (this.invulnerabilityTimeoutId) {
      window.clearTimeout(this.invulnerabilityTimeoutId);
    }
    this.invulnerabilityTimeoutId = window.setTimeout(() => {
      stateManager.updateGame({ isInvulnerable: false });
      this.invulnerabilityTimeoutId = null;
    }, INVULNERABILITY_DURATION);
  }

  private clearBlocksAndRestart(): void {
    this.hex.clearBlocks();
    this.physicsSystem.clearFallingBlocks();
    this.matchingSystem.resetCombo();
  }

  private openShopModal(): void {
    if (this.shopModal || this.pauseModal || this.gameOverModal) {
      return;
    }

    this.shopPausedGame = this.gameLoop.getIsRunning();
    if (this.shopPausedGame) {
      this.gameLoop.pause();
    }

    stateManager.updateUI({ isShopOpen: true });
    this.shopModal = new ShopModal({
      mode: 'game',
      inventoryUI: this.inventoryUI,
      onClose: () => {
        this.shopModal = null;
        stateManager.updateUI({ isShopOpen: false });
        if (this.shopPausedGame && stateManager.getState().status === GameStatus.PLAYING) {
          this.gameLoop.resume();
        }
        this.shopPausedGame = false;
      },
    });
    this.shopModal.open();
  }

  /**
   * Show game over screen
   */
  private showGameOver(): void {
    this.gameLoop.stop();

    const state = stateManager.getState();
    const uiState = state.ui;

    // Check if daily challenge was completed
    if (uiState.currentGameMode === 'dailyChallenge' && this.dailyChallenge) {
      const challenge = this.dailyChallenge.getCurrentChallenge();
      const isCompleted = this.dailyChallenge.checkCompletion();
      const streak = this.dailyChallenge.getStreak();

      // Show completion modal for daily challenge
      if (isCompleted && challenge) {
        this.dailyChallengeModal = new DailyChallengeModal();
        this.dailyChallengeModal.showCompletion(challenge, streak, state.game.score);
        
        // Update player diamonds with challenge reward
        const newDiamonds = state.player.specialPoints + challenge.totalReward;
        stateManager.updatePlayer({
          specialPoints: newDiamonds,
        });

        if (state.player.id) {
          void appwriteClient.addDiamonds(state.player.id, challenge.totalReward);
        }
      }
    }

    this.gameOverModal = new Modal({
      title: 'GAME OVER',
      closeOnBackdrop: false,
      closeOnEscape: false,
    });

    const content = document.createElement('div');
    content.className = 'space-y-6 py-4';

    // Score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'text-center';
    scoreDisplay.innerHTML = `
      <div class="text-6xl font-bold mb-2">${state.game.score}</div>
      <div class="text-gray-600">Final Score</div>
      ${state.game.score > state.player.highScore ? '<div class="text-sm text-green-600 font-bold mt-2">NEW HIGH SCORE!</div>' : ''}
    `;
    content.appendChild(scoreDisplay);

    // Play again button
    const playAgainBtn = new Button('Play Again', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.playAgain(),
    });
    content.appendChild(playAgainBtn.element);

    const continueCount = this.getInventoryCount(ShopItemId.CONTINUE);
    const canContinue = !this.hasContinued && continueCount > 0;
    const continueBtn = new Button(`Continue (${continueCount})`, {
      variant: 'secondary',
      size: 'medium',
      fullWidth: true,
      disabled: !canContinue,
      onClick: () => this.continueGame(),
    });
    content.appendChild(continueBtn.element);

    if (this.hasContinued) {
      const continueHint = document.createElement('p');
      continueHint.className = 'text-xs text-gray-500 text-center';
      continueHint.textContent = 'Continue already used this run.';
      content.appendChild(continueHint);
    } else if (continueCount === 0) {
      const continueHint = document.createElement('p');
      continueHint.className = 'text-xs text-gray-500 text-center';
      continueHint.textContent = 'No continues in inventory.';
      content.appendChild(continueHint);
    }

    // Main menu button
    const menuBtn = new Button('Main Menu', {
      variant: 'outline',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.exitToMenu(),
    });
    content.appendChild(menuBtn.element);

    this.gameOverModal.setContent(content);
    this.gameOverModal.open();

    // Update high score and games played
    const isNewHighScore = state.game.score > state.player.highScore;
    stateManager.updatePlayer({
      highScore: isNewHighScore ? state.game.score : state.player.highScore,
      gamesPlayed: state.player.gamesPlayed + 1,
    });

    if (isNewHighScore && state.player.id) {
      void appwriteClient.updateSinglePlayerScore(state.player.id, state.game.score);
    }

    if (uiState.currentGameMode === 'timerAttack' && state.player.id) {
      void appwriteClient.updateTimerAttackBest(state.player.id, state.game.score);
    }

    const groupId = state.ui.currentGroupId;
    if (groupId && state.player.id) {
      void this.groupManager.recordGroupScore(
        state.player.id,
        state.player.name,
        groupId,
        state.game.score,
        String(state.game.difficulty)
      );
    }
  }

  /**
   * Play again
   */
  private playAgain(): void {
    if (this.gameOverModal) {
      this.gameOverModal.close();
      this.gameOverModal = null;
    }
    this.hasContinued = false;
    stateManager.resetGame();
    this.startGameLoop();
  }

  private continueGame(): void {
    if (this.hasContinued || !this.specialPointsSystem) {
      return;
    }

    const consumed = this.consumeInventoryItem(ShopItemId.CONTINUE);
    if (!consumed) {
      return;
    }

    this.hasContinued = true;
    if (this.gameOverModal) {
      this.gameOverModal.close();
      this.gameOverModal = null;
    }

    this.applyContinueRecovery();
    stateManager.setState('status', GameStatus.PLAYING);
    stateManager.updateGame({ lives: 1 });
    this.gameLoop.start();
  }

  private seedInventorySlots(): void {
    const inventory = stateManager.getState().player.inventory ?? createEmptyInventory();
    const slotOrder: ShopItemId[] = [ShopItemId.HAMMER, ShopItemId.SLOWMO, ShopItemId.SHIELD];

    for (const itemId of slotOrder) {
      const count = Math.max(0, inventory[itemId] ?? 0);
      for (let i = 0; i < count; i++) {
        if (!this.inventoryUI.addPowerUp(itemId)) {
          return;
        }
      }
    }
  }

  private applyStoredExtraLives(): void {
    const state = stateManager.getState();
    const inventory = state.player.inventory ?? createEmptyInventory();
    const available = Math.max(0, inventory[ShopItemId.EXTRA_LIFE] ?? 0);
    if (available === 0) return;

    const lifeRoom = Math.max(0, MAX_LIVES - state.game.lives);
    const toApply = Math.min(available, lifeRoom);
    if (toApply === 0) return;

    const nextInventory = {
      ...inventory,
      [ShopItemId.EXTRA_LIFE]: available - toApply,
    };

    stateManager.updateGame({ lives: state.game.lives + toApply });
    stateManager.updatePlayer({ inventory: nextInventory });

    if (state.player.id) {
      void appwriteClient.updateInventory(state.player.id, nextInventory);
    }
  }

  private applyContinueRecovery(): void {
    const maxRows = 8;
    const targetRows = Math.max(4, maxRows - 2);

    for (let i = 0; i < this.hex.blocks.length; i++) {
      const lane = this.hex.blocks[i];
      let active = lane.filter(block => block.deleted === 0).length;

      for (let j = lane.length - 1; j >= 0 && active > targetRows; j--) {
        if (lane[j].deleted === 0) {
          lane.splice(j, 1);
          active -= 1;
        }
      }
    }
  }

  /**
   * Handle keyboard input
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    const state = stateManager.getState();
    if (state.status !== GameStatus.PLAYING) return;
    
    switch (event.key) {
      case 'p':
      case 'P':
      case 'Escape':
        if (this.gameLoop.getIsRunning()) {
          this.pauseGame();
        } else {
          this.resumeGame();
        }
        break;
      
      case 'ArrowDown':
      case 's':
      case 'S':
        // Speed up blocks (handled by inputManager)
        break;
      
      case ' ':
      case 'ArrowUp':
        // Rotate - handled by inputManager
        event.preventDefault();
        break;
      
      // Note: ArrowLeft, ArrowRight, 'a', 'A', 'd', 'D' are handled by inputManager
      // to avoid double rotation
    }
  };
  
  /**
   * Handle key release
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowDown':
      case 's':
      case 'S':
        // Reset speed multiplier
        this.rushMultiplier = 1;
        break;
    }
  };

  /**
   * Handle window resize
   */
  public onResize(): void {
    if (this.canvas) {
      this.canvas.updateScale();
    }
  }

  public onMount(): void {
    this.element.classList.add('animate-fade-in');

    this.hasContinued = false;

    audioManager.playGameMusic();

    const uiState = stateManager.getState().ui;
    audioManager.setMusicMuted(uiState.isMusicMuted);
    audioManager.setSfxMuted(uiState.isSfxMuted);
    audioManager.setMusicVolume(uiState.musicVolume);
    audioManager.setSfxVolume(uiState.sfxVolume);
    
    // Set game status to playing
    stateManager.setState('status', GameStatus.PLAYING);
    
    this.initCanvas();
    this.startGameLoop();

    if (uiState.currentGameMode === 'dailyChallenge') {
      if (!this.dailyChallenge) {
        this.dailyChallenge = new DailyChallengeSystem();
      }
      
      // Show challenge preview modal
      const challenge = this.dailyChallenge.getCurrentChallenge();
      const streak = this.dailyChallenge.getStreak();
      if (challenge) {
        this.dailyChallengeModal = new DailyChallengeModal();
        this.dailyChallengeModal.showPreview(challenge, streak);
      }
      
      window.dispatchEvent(new CustomEvent('activateDailyChallenge'));
    } else if (uiState.currentGameMode === 'timerAttack') {
      const duration = uiState.timerDuration || 90;
      this.timerAttack = new TimerAttackMode(duration);
      window.dispatchEvent(new CustomEvent('activateTimerMode'));
    }

    window.dispatchEvent(new CustomEvent('gameStart'));

    // Setup input manager
    const inputManager = getInputManager();
    inputManager.clearHandlers(); // Clear any existing handlers to prevent double rotation
    inputManager.setEnabled(true);
    inputManager.on('rotateLeft', (pressed) => {
      if (pressed && stateManager.getState().status === GameStatus.PLAYING) {
        // Original Hextris: only rotate hex, not falling blocks
        this.hex.rotate(1);
      }
    });
    inputManager.on('rotateRight', (pressed) => {
      if (pressed && stateManager.getState().status === GameStatus.PLAYING) {
        // Original Hextris: only rotate hex, not falling blocks
        this.hex.rotate(-1);
      }
    });
    inputManager.on('speedUp', (pressed) => {
      this.rushMultiplier = pressed ? 4 : 1;
    });
    inputManager.on('pause', (pressed) => {
      if (pressed) {
        if (this.gameLoop.getIsRunning()) {
          this.pauseGame();
        } else {
          this.resumeGame();
        }
      }
    });
    
    // Listen for keyboard input
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Listen for game over event
    this.unsubscribeGameOver = stateManager.subscribe('gameOver', () => {
      this.handleGameOverSfx();
      this.showGameOver();
    });
    this.unsubscribeLivesChanged = stateManager.subscribe('livesChanged', (lives) => {
      if (typeof lives !== 'number') return;
      if (lives < this.lastLives) {
        this.handleLifeLostSfx();
      }
      this.lastLives = lives;
    });
    window.addEventListener('timerModeTimeUp', this.handleTimerModeTimeUp as EventListener);
    window.addEventListener('powerUpCollected', this.handlePowerUpCollectedSfx as EventListener);
    window.addEventListener('powerUpUsed', this.handlePowerUpUsedInventory as EventListener);
    window.addEventListener('blockLand', this.handleBlockLandSfx as EventListener);
  }

  public onUnmount(): void {
    // Stop game loop
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
    
    // Disable input manager
    const inputManager = getInputManager();
    inputManager.setEnabled(false);
    inputManager.clearHandlers();

    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('timerModeTimeUp', this.handleTimerModeTimeUp as EventListener);
    window.removeEventListener('powerUpCollected', this.handlePowerUpCollectedSfx as EventListener);
    window.removeEventListener('powerUpUsed', this.handlePowerUpUsedInventory as EventListener);
    window.removeEventListener('blockLand', this.handleBlockLandSfx as EventListener);

    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
      this.slowMoTimeoutId = null;
    }
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
      this.shieldTimeoutId = null;
    }
    if (this.invulnerabilityTimeoutId) {
      window.clearTimeout(this.invulnerabilityTimeoutId);
      this.invulnerabilityTimeoutId = null;
    }

    if (this.powerUpSystem) {
      this.powerUpSystem.destroy();
    }

    if (this.timerAttack) {
      this.timerAttack.deactivate();
      this.timerAttack = null;
    }

    if (this.dailyChallenge) {
      this.dailyChallenge.deactivate();
      this.dailyChallenge = null;
    }

    // Clean up Daily Challenge modal
    if (this.dailyChallengeModal) {
      this.dailyChallengeModal.close();
      this.dailyChallengeModal = null;
    }

    // Clean up modals
    if (this.pauseModal) {
      this.pauseModal.destroy();
      this.pauseModal = null;
    }
    if (this.gameOverModal) {
      this.gameOverModal.destroy();
      this.gameOverModal = null;
    }

    if (this.shopModal) {
      this.shopModal.close();
      this.shopModal = null;
    }

    if (this.unsubscribeGameOver) {
      this.unsubscribeGameOver();
      this.unsubscribeGameOver = null;
    }

    if (this.unsubscribeLivesChanged) {
      this.unsubscribeLivesChanged();
      this.unsubscribeLivesChanged = null;
    }
  }

  private handleLifeLostSfx(): void {
    if (stateManager.getState().status !== GameStatus.PLAYING) return;
    audioManager.playSfx('lifeLost');
  }

  private consumeInventoryItem(itemId: ShopItemId): boolean {
    const state = stateManager.getState();
    const inventory = state.player.inventory ?? createEmptyInventory();
    const current = inventory[itemId] ?? 0;
    if (current <= 0) return false;

    const nextInventory = {
      ...inventory,
      [itemId]: current - 1,
    };

    stateManager.updatePlayer({ inventory: nextInventory });
    if (state.player.id) {
      void appwriteClient.updateInventory(state.player.id, nextInventory);
    }

    return true;
  }

  private getInventoryCount(itemId: ShopItemId): number {
    const inventory = stateManager.getState().player.inventory ?? createEmptyInventory();
    return inventory[itemId] ?? 0;
  }
}


