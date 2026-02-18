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
import { DifficultyLevel, getDifficultyConfig } from '@config/difficulty';
import type { DifficultyConfig, AdaptiveAssistConfig } from '@config/difficulty';
import { appwriteClient } from '@network/AppwriteClient';
import { GroupManager } from '@network/GroupManager';
import { RoomManager } from '@network/RoomManager';
import { DailyChallengeSystem } from '@modes/DailyChallengeMode';
import { TimerAttackMode } from '@modes/TimerAttackMode';
import { DailyChallengeModal } from '@ui/modals/DailyChallengeModal';
import { ShopModal } from '@ui/modals/ShopModal';
import { 
  LivesDisplay, 
  PointsDisplay, 
  ScoreDisplay, 
  InventoryUI,
  StrategyStatusHUD,
  ComboHeatMeter,
  MomentumBar,
  TimeOrbDisplay,
  LeaderboardHUD
} from '@ui/hud';
import { audioManager } from '@/managers/AudioManager';
import { createEmptyInventory, ShopItemId } from '@config/shopItems';
import { TimeOrbSystem } from '@systems/TimeOrbSystem';
import { ConfusionMode } from '@systems/ConfusionMode';
import { getChallengeScriptForDate, type ChallengeScript } from '@config/challengeSeeds';

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
  private strategyStatusHUD!: StrategyStatusHUD;
  private comboHeatMeter!: ComboHeatMeter;
  private momentumBar!: MomentumBar;
  private timeOrbDisplay!: TimeOrbDisplay;
  private leaderboardHUD!: LeaderboardHUD;
  
  // Game entities and systems
  private hex!: Hex;
  private waveSystem!: WaveSystem;
  private physicsSystem!: PhysicsSystem;
  private matchingSystem!: MatchingSystem;
  private powerUpSystem!: PowerUpSystem;
  private specialPointsSystem!: SpecialPointsSystem;
  private timeOrbSystem: TimeOrbSystem | null = null;
  private confusionMode!: ConfusionMode;
  private floatingTexts: FloatingText[] = [];
  private frameCount: number = 0;
  private rushMultiplier: number = 1;
  private powerUpSpeedMultiplier: number = 1;
  private slowMoTimeoutId: number | null = null;
  private slowMoIntervalId: number | null = null;
  private shieldTimeoutId: number | null = null;
  private invulnerabilityTimeoutId: number | null = null;
  private hammerEffectTimeoutId: number | null = null;
  private nextLifeBonusScore: number = LIFE_BONUS_INTERVAL;
  private blockSettings: any;
  private dailyChallenge: DailyChallengeSystem | null = null;
  private dailyChallengeModal: DailyChallengeModal | null = null;
  private timerAttack: TimerAttackMode | null = null;
  private groupManager = new GroupManager();
  private roomManager: RoomManager | null = null;
  private unsubscribeGameOver: (() => void) | null = null;
  private unsubscribeScoreUpdated: (() => void) | null = null;
  private effectLayer: HTMLDivElement | null = null;
  private slowMoOverlay: HTMLDivElement | null = null;
  private slowMoTimerEl: HTMLDivElement | null = null;
  private shieldOverlay: HTMLDivElement | null = null;
  private hammerOverlay: HTMLDivElement | null = null;
  private surgeOverlay: HTMLDivElement | null = null;
  private surgeTimeoutId: number | null = null;
  private activeDifficultyConfig: DifficultyConfig | null = null;
  private currentPhaseName: string | null = null;
  
  // Multiplayer competitive scoring
  private ghostScore: number = 0;
  private ghostPlayerName: string = '';
  private multiplayerSyncActive: boolean = false;
  private lifeLossTimestamps: number[] = [];
  private adaptiveAssistActive: boolean = false;
  private adaptiveAssistResetId: number | null = null;
  private comboHeatValue = 0;
  private comboTier = 0;
  private lastComboFrame = 0;
  private heatDecayRate = 6;
  private challengeScript: ChallengeScript | null = null;
  private challengePhaseIndex = 0;
  private timerRampTimer = 0;
  private nextTimerRamp = 15;
  private timerRampStage = 0;
  private timerRampSpeedMultiplier = 1;
  private timerRampSpawnMultiplier = 1;
  private challengeSpeedMultiplier = 1;
  private challengeSpawnMultiplier = 1;
  private catchupSpeedMultiplier = 1;
  private catchupSpawnMultiplier = 1;
  private momentumValue = 0;
  private momentumDecayRate = 4;
  private activeMutators = new Set<string>();
  private noShieldActive = false;
  
  // Dynamic rotation speed system
  private baseRotationThrottleMs = 75; // Base throttle from difficulty
  private rotationSpeedScaleFactor = 0.00015; // Score scaling factor (reduces throttle as score increases)
  
  // Visual hexagon rotation (strategy phase effect)
  private hexagonRotationOffset = 0; // Visual rotation offset in degrees
  private targetRotationSpeed = 0; // Target rotation speed in degrees per frame
  private currentRotationSpeed = 0; // Current rotation speed (smoothed)
  
  // Random speed burst system (uses existing Surge)
  private lastRandomBurstMs = 0; // Last time a random burst occurred
  private randomBurstCooldownMs = 25000; // Cooldown between random bursts (25 seconds)
  private randomBurstChance = 0.00008; // Chance per frame to trigger burst (~0.48% per second at 60fps)
  private isRandomBurstActive = false; // Track if random burst is active
  private randomBurstSpeedMultiplier = 1; // Multiplier applied during random burst
  private randomBurstSpawnMultiplier = 1; // Spawn multiplier during random burst
  
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

  private handlePowerUpEffect = (event: Event): void => {
    const customEvent = event as CustomEvent<{ type?: string }>;
    const type = customEvent.detail?.type;
    if (type === 'hammer') {
      this.triggerHammerEffect();
    }
  };

  // Audio and visual feedback handlers
  private handleCollisionFeedback = (event: Event): void => {
    const customEvent = event as CustomEvent<{ lane: number; speed: number; distFromHex: number }>;
    const { lane, speed } = customEvent.detail;
    
    // Play collision sound with volume based on speed
    const volumeScale = Math.min(1.2, 0.8 + speed * 0.05);
    audioManager.playSfx('collision', { volumeScale });
    
    // Add screen shake based on collision speed
    const shakeMagnitude = Math.min(15, 5 + speed * 0.8);
    this.hex.shake({ lane, magnitude: shakeMagnitude });
  };

  private handleComboAchievedFeedback = (event: Event): void => {
    const customEvent = event as CustomEvent<{ combo: number; score: number }>;
    const { combo } = customEvent.detail;
    
    // Scale volume with combo size
    const volumeScale = Math.min(1.5, 1.0 + combo * 0.1);
    audioManager.playSfx('comboAchieved', { volumeScale });
  };

  private handleHammerActivatedFeedback = (): void => {
    audioManager.playSfx('hammerActivated', { forcePlay: true });
  };

  private handleSpeedBurstFeedback = (): void => {
    audioManager.playSfx('speedBurst', { forcePlay: true });
  };

  private handleTimeOrbCollected = (): void => {
    const state = stateManager.getState();
    const nextCount = (state.game.timeOrbCount ?? 0) + 1;
    const goal = state.game.timeOrbGoal ?? 3;
    if (nextCount >= goal) {
      this.timerAttack?.addBonusTime(5);
      stateManager.updateGame({ timeOrbCount: 0 });
      this.floatingTexts.push(FloatingText.createMessage(
        this.canvas.element.width / 2,
        this.canvas.element.height / 2 - 140,
        '+5s',
        '#9ad8ff'
      ));
    } else {
      stateManager.updateGame({ timeOrbCount: nextCount });
    }
  };

  private applyMutators(mutators: string[]): void {
    this.activeMutators = new Set(mutators);
    this.noShieldActive = this.activeMutators.has('noShield');
    const powerUpsAllowed = !this.activeMutators.has('noPowerUps');
    this.powerUpSystem?.setEnabled(powerUpsAllowed);
    stateManager.updateGame({ activeMutators: [...this.activeMutators] });
  }

  private handleSurgeChange = (state: { active: boolean; durationMs?: number; remainingMs?: number }): void => {
    // Don't override random bursts with regular surges
    if (this.isRandomBurstActive) {
      return;
    }
    
    stateManager.updateGame({ surgeActive: state.active });
    if (state.active) {
      this.showSurgeEffect(state.durationMs ?? 0, false); // Pass false for regular surge
    } else {
      this.hideSurgeEffect();
    }
    this.syncTempoLevel();
  };

  private handleTimerPhaseChange = (p: string, m: { speed: number; spawn: number }): void => {
    this.timerRampSpeedMultiplier = m.speed;
    this.timerRampSpawnMultiplier = m.spawn;
    this.applyWaveTuning();
    const n: Record<string, string> = { early: 'EARLY PHASE', mid: 'MID PHASE!', final: 'FINAL PHASE!' };
    this.floatingTexts.push(FloatingText.createMessage(this.canvas.element.width / 2, this.canvas.element.height / 2 - 80, n[p] || p.toUpperCase(), '#3b82f6'));
  };

  private handleTimerBurstStart = (m: { speed: number; spawn: number }): void => {
    this.timerRampSpeedMultiplier *= m.speed;
    this.timerRampSpawnMultiplier *= m.spawn;
    this.applyWaveTuning();
    
    // Dispatch speed burst event for audio feedback
    window.dispatchEvent(new CustomEvent('speedBurst', { detail: { source: 'timer' } }));
  };

  private handleTimerBurstEnd = (): void => {
    if (this.timerAttack) {
      const pm = this.timerAttack.getPhaseMultipliers();
      this.timerRampSpeedMultiplier = pm.speed;
      this.timerRampSpawnMultiplier = pm.spawn;
      this.applyWaveTuning();
    }
  };

  private handleTimerScoreMultiplier = (m: number): void => {
    stateManager.updateGame({ timerScoreMultiplier: m });
  };

  private handleTimerBurstNotification = (e: Event): void => {
    const ce = e as CustomEvent;
    this.floatingTexts.push(FloatingText.createMessage(this.canvas.element.width / 2, this.canvas.element.height / 2 - 50, ce.detail.message, ce.detail.color));
  };

  private handleTimerMultiplierNotification = (e: Event): void => {
    const ce = e as CustomEvent;
    this.floatingTexts.push(FloatingText.createMessage(this.canvas.element.width / 2, this.canvas.element.height / 2 - 50, ce.detail.message, ce.detail.color));
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
    this.element.className = 'page min-h-screen w-full theme-page relative overflow-hidden';

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
    controls.className = 'theme-card-muted backdrop-blur-sm border-t-2 px-4 py-2 text-center';
    controls.innerHTML = `
      <div class="text-xs theme-text-secondary">
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

    this.effectLayer = document.createElement('div');
    this.effectLayer.className = 'game-effect-layer';
    hudContainer.appendChild(this.effectLayer);

    // Initialize HUD components
    const state = stateManager.getState();
    this.livesDisplay = new LivesDisplay(state.game.lives);
    this.pointsDisplay = new PointsDisplay(state.player.specialPoints, {
      onShopClick: () => this.openShopModal(),
    });
    this.scoreDisplay = new ScoreDisplay(state.game.score);
    this.inventoryUI = new InventoryUI(3);
    this.strategyStatusHUD = new StrategyStatusHUD({
      phase: state.game.strategyPhase,
      tempoLevel: state.game.tempoLevel,
      surgeActive: state.game.surgeActive,
    });
    this.comboHeatMeter = new ComboHeatMeter();
    this.momentumBar = new MomentumBar();
    this.timeOrbDisplay = new TimeOrbDisplay();
    this.leaderboardHUD = new LeaderboardHUD(5);
    this.lastLives = state.game.lives;
    this.nextLifeBonusScore = LIFE_BONUS_INTERVAL;

    this.seedInventorySlots();
    this.applyStoredExtraLives();

    // Mount to overlay
    this.livesDisplay.mount(hudContainer);
    this.pointsDisplay.mount(hudContainer);
    this.scoreDisplay.mount(hudContainer);
    this.inventoryUI.mount(hudContainer);
    this.strategyStatusHUD.mount(hudContainer);
    this.comboHeatMeter.mount(hudContainer);
    this.momentumBar.mount(hudContainer);
    this.timeOrbDisplay.mount(hudContainer);
    this.leaderboardHUD.mount(hudContainer);

    // Add pause button
    const pauseButton = document.createElement('button');
    pauseButton.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 translate-y-16 z-20
      px-4 py-2 theme-card backdrop-blur-md
      rounded-lg shadow-lg
      text-sm font-bold theme-text
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
    const difficultyLevel = state.game.difficulty ?? DifficultyLevel.STANDARD;
    const difficultyConfig = getDifficultyConfig(difficultyLevel);
    this.activeDifficultyConfig = difficultyConfig;
    this.currentPhaseName = null;
    this.lifeLossTimestamps = [];
    this.adaptiveAssistActive = false;
    this.comboHeatValue = 0;
    this.comboTier = 0;
    this.lastComboFrame = 0;
    this.timerRampTimer = 0;
    this.nextTimerRamp = 15;
    this.timerRampStage = 0;
    this.timerRampSpeedMultiplier = 1;
    this.timerRampSpawnMultiplier = 1;
    this.challengeSpeedMultiplier = 1;
    this.challengeSpawnMultiplier = 1;
    this.catchupSpeedMultiplier = 1;
    this.catchupSpawnMultiplier = 1;
    this.challengeScript = null;
    this.challengePhaseIndex = 0;
    this.momentumValue = 0;
    this.activeMutators = new Set();
    this.noShieldActive = false;
    
    // Reset visual hexagon rotation state
    this.hexagonRotationOffset = 0;
    this.targetRotationSpeed = 0;
    this.currentRotationSpeed = 0;
    
    // Reset random burst state
    this.lastRandomBurstMs = 0;
    this.isRandomBurstActive = false;
    this.randomBurstSpeedMultiplier = 1;
    this.randomBurstSpawnMultiplier = 1;
    
    if (this.adaptiveAssistResetId) {
      window.clearTimeout(this.adaptiveAssistResetId);
      this.adaptiveAssistResetId = null;
    }
    stateManager.updateGame({
      surgeActive: false,
      strategyPhase: undefined,
      tempoLevel: 0,
      timeOrbCount: 0,
      timeOrbGoal: 3,
      activeMutators: [],
    });

    const speedModifier = difficultyConfig.speedMultiplier;
    const creationSpeedModifier = difficultyConfig.spawnRateModifier;
    
    // Set base rotation throttle from difficulty config
    // rotationSpeed from config: higher = faster, so convert to throttle (lower = faster)
    // Formula: baseThrottle = 100ms - (rotationSpeed * 5ms)
    // This gives: speed=6 → 70ms, speed=9 → 55ms, speed=13 → 35ms
    this.baseRotationThrottleMs = Math.max(20, 100 - (difficultyConfig.rotationSpeed * 5));
    this.hex.setRotationThrottle(this.baseRotationThrottleMs);
    
    this.waveSystem = new WaveSystem(
      {
        colors: blockColors,
        speedModifier,
        creationSpeedModifier,
        surge: difficultyConfig.surge,
        onSurgeChange: this.handleSurgeChange,
      },
      6,
      (lane: number, color: string, speed: number) => this.spawnBlock(lane, color, speed)
    );
    this.syncTempoLevel();
    
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
    this.timeOrbSystem = new TimeOrbSystem({
      hex: this.hex,
      canvas: this.canvas,
      spawnChance: 0.55,
      cooldownMs: 7500,
      onCollect: this.handleTimeOrbCollected,
    });
    this.timeOrbSystem.setEnabled(state.ui.currentGameMode === 'timerAttack');
    
    // Initialize Confusion Mode (triggers at score > 3000)
    this.confusionMode = new ConfusionMode({
      activationScore: 3000,
      canvasFilter: 'hue-rotate(90deg) saturate(1.2)',
      remapInterval: 0, // No auto-shuffle
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
    
    // Apply Confusion Mode color remapping if active
    const remappedColor = this.confusionMode 
      ? this.confusionMode.getRemappedColor(color as any) 
      : color;
    
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
      remappedColor, // Use remapped color for confusion mode
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
    this.updateTimerRamp(dt);
    this.updateChallengePhase();
    this.updateDifficultyPhase();
    this.updateCatchupMultiplier();
    this.updateRandomBurst(); // Check for random speed bursts
    
    // Update physics (falling blocks move toward center and check collision)
    // Pass scale=1 for now (can be adjusted for screen scaling later)
    this.physicsSystem.update(this.hex, dt, 1);

    this.powerUpSystem.update(dt);
    this.timeOrbSystem?.update(dt);
    
    // Check for matches on newly settled blocks (checked=1)
    // Original: for each block, if (block.checked == 1) consolidateBlocks(...)
    const matchResults = this.matchingSystem.checkAllMatches(this.hex, this.frameCount);
    let runningScore = state.game.score;
    let diamondsToAdd = 0;
    
    // Get timer score multiplier if in timer mode
    const timerMultiplier = state.game.timerScoreMultiplier || 1;
    
    for (const result of matchResults) {
      // Apply timer score multiplier in Timer Attack mode
      const scoreToAdd = result.score * timerMultiplier;
      runningScore += scoreToAdd;
      window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: { score: runningScore } }));

      // Award diamonds based on streak (combo)
      const diamondsEarned = Math.max(0, result.combo - 1);
      console.log(`Match found: ${result.blocksCleared} blocks, Combo: ${result.combo}, Diamonds earned: ${diamondsEarned}`);
      if (diamondsEarned > 0) {
        diamondsToAdd += diamondsEarned;
      }
      
      // Create floating text for score (with multiplier applied)
      const centerX = this.canvas.element.width / 2;
      const centerY = this.canvas.element.height / 2;
      this.floatingTexts.push(
        FloatingText.createScore(centerX + result.centerX, centerY + result.centerY, scoreToAdd, result.color)
      );
      
      // Show combo text if combo > 1
      if (result.combo > 1) {
        this.floatingTexts.push(
          FloatingText.createCombo(centerX, centerY - 50, result.combo)
        );
        window.dispatchEvent(new CustomEvent('comboAchieved', { detail: { count: result.combo } }));
        this.addComboHeat(result.combo);
      }

      if (state.ui.currentGameMode === 'timerAttack' && result.blocksCleared >= 4 && result.combo >= 2) {
        this.timeOrbSystem?.trySpawn();
      }
      
      // Speed up wave system
      this.waveSystem.onBlocksDestroyed();
      this.addMomentum(result.blocksCleared);
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

    this.decayComboHeat(dt);
    this.decayMomentum(dt);
    
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
    this.comboHeatMeter.setHeat(updatedState.game.comboHeat ?? 0, updatedState.game.comboTier ?? 0);
    this.timeOrbDisplay.setCount(updatedState.game.timeOrbCount ?? 0, updatedState.game.timeOrbGoal ?? 3);
    this.momentumBar.setValue(updatedState.game.momentumValue ?? 0);
    this.strategyStatusHUD.setStatus({
      phase: updatedState.game.strategyPhase,
      tempoLevel: updatedState.game.tempoLevel,
      surgeActive: updatedState.game.surgeActive,
    });

    const isTimer = updatedState.ui.currentGameMode === 'timerAttack';
    const isMultiplayer = updatedState.ui.currentGameMode?.startsWith('multiplayer');
    this.timeOrbDisplay.getElement().style.display = isTimer ? 'flex' : 'none';
    this.momentumBar.setVisible(Boolean(isMultiplayer));
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
    
    // Apply Confusion Mode canvas filter if active
    if (this.confusionMode && this.confusionMode.isActive()) {
      ctx.filter = this.confusionMode.getCanvasFilter();
    }
    
    // Draw background gradient
    const themeConfig = themes[state.player.selectedTheme] || themes[ThemeName.CLASSIC];
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.element.height);
    gradient.addColorStop(0, themeConfig.ui.surfaceMuted);
    gradient.addColorStop(1, themeConfig.colors.background);
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
    
    // Update visual hexagon rotation (smooth interpolation)
    if (Math.abs(this.targetRotationSpeed - this.currentRotationSpeed) > 0.001) {
      this.currentRotationSpeed += (this.targetRotationSpeed - this.currentRotationSpeed) * 0.05;
    } else {
      this.currentRotationSpeed = this.targetRotationSpeed;
    }
    this.hexagonRotationOffset += this.currentRotationSpeed;
    
    // Apply visual rotation transform for entire game field
    // This rotates the canvas without affecting entity physics
    if (Math.abs(this.hexagonRotationOffset) > 0.01) {
      const centerX = this.canvas.element.width / 2;
      const centerY = this.canvas.element.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(this.hexagonRotationOffset * Math.PI / 180);
      ctx.translate(-centerX, -centerY);
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
    
    // Draw invulnerability shield effect
    if (state.game.isInvulnerable) {
      this.drawInvulnerabilityEffect(ctx);
    }
    
    // Draw falling blocks
    const fallingBlocks = this.physicsSystem.getFallingBlocks();
    for (const block of fallingBlocks) {
      block.draw(ctx);
    }

    this.powerUpSystem.render(ctx);
    this.timeOrbSystem?.render(ctx);
    
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
   * Draw invulnerability shield effect - pulsing blue glow
   */
  private drawInvulnerabilityEffect(ctx: CanvasRenderingContext2D): void {
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;
    const hexRadius = this.hex.radius;
    
    // Pulsing animation based on frame count
    const pulseSpeed = 0.08;
    const pulse = Math.sin(this.frameCount * pulseSpeed) * 0.3 + 0.7; // 0.4 to 1.0
    
    ctx.save();
    
    // Draw pulsing glow hexagon
    const baseAngle = 30;
    const glowRadius = hexRadius + 15;
    
    // Outer glow
    ctx.strokeStyle = `rgba(52, 152, 219, ${0.6 * pulse})`;
    ctx.lineWidth = 8;
    ctx.shadowColor = 'rgba(52, 152, 219, 0.8)';
    ctx.shadowBlur = 20 * pulse;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const vertexAngle = (baseAngle + (i * 360 / 6)) * (Math.PI / 180);
      const x = centerX - glowRadius * Math.sin(vertexAngle);
      const y = centerY + glowRadius * Math.cos(vertexAngle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Inner shield
    ctx.strokeStyle = `rgba(41, 128, 185, ${0.4 * pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10 * pulse;
    
    const shieldRadius = hexRadius + 8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const vertexAngle = (baseAngle + (i * 360 / 6)) * (Math.PI / 180);
      const x = centerX - shieldRadius * Math.sin(vertexAngle);
      const y = centerY + shieldRadius * Math.cos(vertexAngle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    
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

    // Resume button - Black and white theme
    const resumeBtn = new Button('Resume Game', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.resumeGame(),
    });
    // Apply black/white styling
    resumeBtn.element.style.background = '#000000';
    resumeBtn.element.style.color = '#ffffff';
    resumeBtn.element.style.border = '2px solid #000000';
    content.appendChild(resumeBtn.element);

    // Restart button - Black and white theme
    const restartBtn = new Button('Restart', {
      variant: 'outline',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.restartGame(),
    });
    // Apply black/white styling
    restartBtn.element.style.background = '#ffffff';
    restartBtn.element.style.color = '#000000';
    restartBtn.element.style.border = '2px solid #000000';
    content.appendChild(restartBtn.element);

    // Main menu button - Black and white theme
    const menuBtn = new Button('Main Menu', {
      variant: 'ghost',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.exitToMenu(),
    });
    // Apply black/white styling
    menuBtn.element.style.background = '#f5f5f5';
    menuBtn.element.style.color = '#000000';
    menuBtn.element.style.border = '1px solid #cccccc';
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
    this.timeOrbSystem?.reset();
    this.confusionMode?.reset();
    this.floatingTexts = [];
    this.frameCount = 0;
    this.rushMultiplier = 1;
    this.powerUpSpeedMultiplier = 1;
    this.comboHeatValue = 0;
    this.comboTier = 0;
    this.lastComboFrame = 0;
    this.momentumValue = 0;
    stateManager.updateGame({ comboHeat: 0, comboTier: 0, momentumValue: 0, timeOrbCount: 0 });
    this.nextLifeBonusScore = LIFE_BONUS_INTERVAL;
    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
      this.slowMoTimeoutId = null;
    }
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
      this.shieldTimeoutId = null;
    }
    this.clearSlowMoEffect();
    this.hideShieldEffect();
    this.hideSurgeEffect();
    audioManager.setMusicIntensity(0.4);
    audioManager.setMusicTempoLevel(0);
    if (this.hammerOverlay) {
      this.hammerOverlay.remove();
      this.hammerOverlay = null;
    }
    if (this.hammerEffectTimeoutId) {
      window.clearTimeout(this.hammerEffectTimeoutId);
      this.hammerEffectTimeoutId = null;
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
    
    // Mark as "left" if multiplayer game is in progress
    if (this.multiplayerSyncActive && this.roomManager) {
      this.roomManager.leaveRoom();
    }
    
    this.gameLoop.stop();
    Router.getInstance().navigate(ROUTES.MENU);
  }

  private applySlowMo(multiplier: number, durationMs: number): void {
    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
    }
    this.clearSlowMoEffect();
    this.powerUpSpeedMultiplier = multiplier;
    this.showSlowMoEffect(durationMs);
    this.slowMoTimeoutId = window.setTimeout(() => {
      this.powerUpSpeedMultiplier = 1;
      this.clearSlowMoEffect();
      this.slowMoTimeoutId = null;
    }, durationMs);
  }

  private applyShield(durationMs: number): void {
    if (this.noShieldActive) {
      return;
    }
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
    }
    stateManager.updateGame({ isInvulnerable: true });
    this.showShieldEffect();
    this.shieldTimeoutId = window.setTimeout(() => {
      stateManager.updateGame({ isInvulnerable: false });
      this.hideShieldEffect();
      this.shieldTimeoutId = null;
    }, durationMs);
  }

  private showSlowMoEffect(durationMs: number): void {
    if (!this.effectLayer) return;
    this.clearSlowMoEffect();

    const overlay = document.createElement('div');
    overlay.className = 'game-effect-slowmo';

    const label = document.createElement('div');
    label.className = 'game-effect-label';
    label.textContent = 'SLOW-MO';

    const timer = document.createElement('div');
    timer.className = 'game-effect-timer';

    overlay.appendChild(label);
    overlay.appendChild(timer);
    this.effectLayer.appendChild(overlay);

    this.slowMoOverlay = overlay;
    this.slowMoTimerEl = timer;

    const start = performance.now();
    const updateTimer = (): void => {
      if (!this.slowMoTimerEl) return;
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, durationMs - elapsed);
      this.slowMoTimerEl.textContent = `${(remaining / 1000).toFixed(1)}s`;
    };

    updateTimer();
    this.slowMoIntervalId = window.setInterval(updateTimer, 100);

    if (this.canvas?.element) {
      this.canvas.element.classList.add('game-canvas-slowmo');
    }
  }

  private clearSlowMoEffect(): void {
    if (this.slowMoIntervalId) {
      window.clearInterval(this.slowMoIntervalId);
      this.slowMoIntervalId = null;
    }
    if (this.slowMoOverlay) {
      this.slowMoOverlay.remove();
      this.slowMoOverlay = null;
      this.slowMoTimerEl = null;
    }
    this.canvas?.element.classList.remove('game-canvas-slowmo');
  }

  private showShieldEffect(): void {
    if (!this.effectLayer) return;
    this.hideShieldEffect();
    const overlay = document.createElement('div');
    overlay.className = 'game-effect-shield';
    this.effectLayer.appendChild(overlay);
    this.shieldOverlay = overlay;
    this.canvas?.element.classList.add('game-canvas-shield');
  }

  private hideShieldEffect(): void {
    if (this.shieldOverlay) {
      this.shieldOverlay.remove();
      this.shieldOverlay = null;
    }
    this.canvas?.element.classList.remove('game-canvas-shield');
  }

  /**
   * Show red flash effect when life is lost
   */
  private showLifeLostFlash(): void {
    if (!this.effectLayer) return;
    
    const flash = document.createElement('div');
    flash.className = 'game-effect-life-lost';
    flash.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(231, 76, 60, 0.5);
      pointer-events: none;
      animation: lifeLostFlash 0.8s ease-out forwards;
      z-index: 100;
    `;
    
    this.effectLayer.appendChild(flash);
    
    // Remove after animation
    setTimeout(() => {
      flash.remove();
    }, 800);
    
    // Add to canvas as well for extra emphasis
    this.canvas?.element.classList.add('game-canvas-life-lost');
    setTimeout(() => {
      this.canvas?.element.classList.remove('game-canvas-life-lost');
    }, 500);
  }

  private triggerHammerEffect(): void {
    if (!this.effectLayer) return;
    if (this.hammerOverlay) {
      this.hammerOverlay.remove();
      this.hammerOverlay = null;
    }
    if (this.hammerEffectTimeoutId) {
      window.clearTimeout(this.hammerEffectTimeoutId);
      this.hammerEffectTimeoutId = null;
    }

    // Dispatch hammer activated event for audio feedback
    window.dispatchEvent(new CustomEvent('hammerActivated'));

    const overlay = document.createElement('div');
    overlay.className = 'game-effect-hammer';

    const flash = document.createElement('div');
    flash.className = 'game-effect-hammer-flash';
    overlay.appendChild(flash);

    const burst = document.createElement('div');
    burst.className = 'game-effect-hammer-burst';

    const impact = document.createElement('div');
    impact.className = 'game-effect-hammer-impact';
    burst.appendChild(impact);

    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement('div');
      ring.className = 'game-effect-hammer-ring';
      ring.style.animationDelay = `${i * 0.1}s`;
      burst.appendChild(ring);
    }

    overlay.appendChild(burst);

    const sparkCount = 12;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('span');
      spark.className = 'game-effect-hammer-spark';
      const rotation = (360 / sparkCount) * i + (Math.random() * 12 - 6);
      spark.style.setProperty('--spark-angle', `${rotation}deg`);
      spark.style.animationDelay = `${i * 0.02}s`;
      overlay.appendChild(spark);
    }

    this.effectLayer.appendChild(overlay);
    this.hammerOverlay = overlay;
    this.hammerEffectTimeoutId = window.setTimeout(() => {
      overlay.remove();
      this.hammerOverlay = null;
      this.hammerEffectTimeoutId = null;
    }, 1100);
  }

  private showSurgeEffect(durationMs: number, isRandomBurst: boolean = false): void {
    if (!this.effectLayer) return;
    this.hideSurgeEffect();
    const overlay = document.createElement('div');
    overlay.className = 'game-effect-surge';
    
    // Different text for random bursts vs regular surges
    if (isRandomBurst) {
      overlay.innerHTML = '<span>Speed Burst!</span><p>Sudden acceleration</p>';
    } else {
      overlay.innerHTML = '<span>Surge</span><p>Brace for rapid waves</p>';
    }
    
    this.effectLayer.appendChild(overlay);
    this.surgeOverlay = overlay;
    if (this.surgeTimeoutId) {
      window.clearTimeout(this.surgeTimeoutId);
      this.surgeTimeoutId = null;
    }
    if (durationMs > 0) {
      this.surgeTimeoutId = window.setTimeout(() => {
        this.hideSurgeEffect();
      }, durationMs + 100);
    }
  }

  private hideSurgeEffect(): void {
    if (this.surgeOverlay) {
      this.surgeOverlay.remove();
      this.surgeOverlay = null;
    }
    if (this.surgeTimeoutId) {
      window.clearTimeout(this.surgeTimeoutId);
      this.surgeTimeoutId = null;
    }
  }

  private updateDifficultyPhase(): void {
    if (!this.waveSystem || !this.activeDifficultyConfig || !this.activeDifficultyConfig.phases?.length) {
      return;
    }
    const elapsedSeconds = this.waveSystem.getElapsedMs() / 1000;
    let activePhase = this.activeDifficultyConfig.phases[0];
    for (const phase of this.activeDifficultyConfig.phases) {
      if (elapsedSeconds + 0.001 >= phase.startsAt) {
        activePhase = phase;
      } else {
        break;
      }
    }
    if (!activePhase || this.currentPhaseName === activePhase.name) {
      return;
    }
    this.currentPhaseName = activePhase.name;
    stateManager.updateGame({ strategyPhase: activePhase.name });
    
    // Update visual rotation speed based on phase
    this.updateHexagonRotationSpeed(activePhase.name);
    
    if (typeof activePhase.musicIntensity === 'number') {
      audioManager.setMusicIntensity(activePhase.musicIntensity);
    }
    window.dispatchEvent(new CustomEvent('difficultyPhaseChanged', { detail: activePhase }));
  }

  private applyWaveTuning(): void {
    if (!this.waveSystem) return;
    const speedMultiplier = this.timerRampSpeedMultiplier * this.challengeSpeedMultiplier * this.catchupSpeedMultiplier * this.randomBurstSpeedMultiplier;
    const spawnMultiplier = this.timerRampSpawnMultiplier * this.challengeSpawnMultiplier * this.catchupSpawnMultiplier * this.randomBurstSpawnMultiplier;
    this.waveSystem.setExternalMultipliers({ speedMultiplier, spawnMultiplier });
  }

  /**
   * Update rotation speed dynamically based on player score
   * Formula: rotationThrottle = baseThrottle - (score * scaleFactor)
   * Lower throttle = faster rotation
   */
  private updateRotationSpeed(score: number): void {
    if (!this.hex) return;
    
    // Calculate dynamic rotation throttle
    // As score increases, throttle decreases (rotation gets faster)
    const scoreBonus = score * this.rotationSpeedScaleFactor;
    const newThrottle = this.baseRotationThrottleMs - scoreBonus;
    
    // Apply with safety bounds (min 15ms, max 100ms)
    const clampedThrottle = Math.max(15, Math.min(100, newThrottle));
    
    this.hex.setRotationThrottle(clampedThrottle);
  }

  /**
   * Update visual hexagon rotation speed based on strategy phase
   * Higher phases = faster rotation for visual interest
   * Does NOT affect physics - only visual rendering
   */
  private updateHexagonRotationSpeed(phaseName: string): void {
    // Map phase names to rotation speeds (degrees per frame)
    const rotationMap: Record<string, number> = {
      // Early phases - no rotation
      'Orientation': 0,
      'Warm Up': 0,
      'Opening Calm': 0,
      'Getting Started': 0,
      'Building Confidence': 0,
      'Focus Groove': 0,
      'Pulse Check': 0,
      'Steady Start': 0,
      'Growing Tempo': 0,
      'Challenge Ramp': 0,
      'Quick Start': 0,
      
      // Mid phases - slow rotation
      'Flow Phase': 0.08,
      'Acceleration Phase': 0.12,
      
      // High phases - faster rotation
      'Pressure Phase': 0.15,
      'High Pressure': 0.18,
      'Pressure Cooker': 0.22,
      'Surge Boss': 0.25,
      
      // Extreme phases - very fast rotation
      'Fracture Onslaught': 0.3,
      'Ascension': 0.2,
    };
    
    this.targetRotationSpeed = rotationMap[phaseName] || 0;
  }

  /**
   * Update random speed burst system
   * Triggers short random surges using existing Surge infrastructure
   * Reuses runtime scheduler instead of creating new timers
   */
  private updateRandomBurst(): void {
    if (!this.waveSystem) return;
    
    const elapsedMs = this.waveSystem.getElapsedMs();
    
    // Check if cooldown has passed
    if (elapsedMs - this.lastRandomBurstMs < this.randomBurstCooldownMs) {
      return;
    }
    
    // Don't trigger during regular surges
    if (this.waveSystem.isSurgeActive() && !this.isRandomBurstActive) {
      return;
    }
    
    // Random chance to trigger burst
    if (Math.random() < this.randomBurstChance) {
      this.triggerRandomBurst();
    }
  }

  /**
   * Trigger a random temporary speed burst
   * Duration: 2-4 seconds
   */
  private triggerRandomBurst(): void {
    if (!this.waveSystem) return;
    
    const elapsedMs = this.waveSystem.getElapsedMs();
    this.lastRandomBurstMs = elapsedMs;
    this.isRandomBurstActive = true;
    
    // Random burst duration: 2-4 seconds
    const burstDurationMs = 2000 + Math.random() * 2000;
    
    // Dispatch speed burst event for audio feedback
    window.dispatchEvent(new CustomEvent('speedBurst', { detail: { duration: burstDurationMs } }));
    
    // Manually trigger surge state
    stateManager.updateGame({ surgeActive: true });
    this.showSurgeEffect(burstDurationMs, true); // Pass true for random burst
    this.syncTempoLevel();
    
    // Apply burst multipliers (slightly less intense than regular surge)
    this.randomBurstSpeedMultiplier = 1.25; // 25% speed increase
    this.randomBurstSpawnMultiplier = 1.2; // 20% spawn increase
    this.applyWaveTuning(); // Apply combined multipliers
    
    // Schedule burst end (reuse runtime via setTimeout)
    window.setTimeout(() => {
      if (!this.waveSystem) return;
      
      // End burst
      this.isRandomBurstActive = false;
      stateManager.updateGame({ surgeActive: false });
      this.hideSurgeEffect();
      this.syncTempoLevel();
      
      // Reset burst multipliers
      this.randomBurstSpeedMultiplier = 1;
      this.randomBurstSpawnMultiplier = 1;
      this.applyWaveTuning(); // Reapply without burst
    }, burstDurationMs);
  }

  private updateChallengePhase(): void {
    if (!this.challengeScript || !this.waveSystem) return;
    const elapsedSeconds = this.waveSystem.getElapsedMs() / 1000;
    const phases = this.challengeScript.phases;
    if (!phases.length) return;

    let nextIndex = this.challengePhaseIndex;
    while (nextIndex + 1 < phases.length && elapsedSeconds >= phases[nextIndex + 1].startsAt) {
      nextIndex += 1;
    }

    if (nextIndex === this.challengePhaseIndex) return;
    this.challengePhaseIndex = nextIndex;
    const phase = phases[nextIndex];

    this.challengeSpeedMultiplier = phase.speedMultiplier ?? 1;
    this.challengeSpawnMultiplier = phase.spawnMultiplier ?? 1;
    this.applyWaveTuning();

    if (typeof phase.musicIntensity === 'number') {
      audioManager.setMusicIntensity(phase.musicIntensity);
    }

    if (phase.message) {
      this.floatingTexts.push(FloatingText.createMessage(
        this.canvas.element.width / 2,
        this.canvas.element.height / 2 - 150,
        phase.message,
        '#f9a826'
      ));
    }
  }

  private registerLifeLossAssist(): void {
    const assist = this.activeDifficultyConfig?.adaptiveAssist;
    if (!assist?.enabled) return;
    const now = performance.now();
    const cutoff = now - assist.windowMs;
    this.lifeLossTimestamps = this.lifeLossTimestamps.filter((ts) => ts >= cutoff);
    this.lifeLossTimestamps.push(now);
    if (this.adaptiveAssistActive) return;
    if (this.lifeLossTimestamps.length >= assist.lossThreshold) {
      this.triggerAdaptiveAssist(assist);
    }
  }

  private triggerAdaptiveAssist(config: AdaptiveAssistConfig): void {
    if (this.adaptiveAssistActive) return;
    this.adaptiveAssistActive = true;
    this.applySlowMo(config.slowScalar, config.durationMs);
    this.syncTempoLevel();
    if (this.adaptiveAssistResetId) {
      window.clearTimeout(this.adaptiveAssistResetId);
    }
    this.adaptiveAssistResetId = window.setTimeout(() => {
      this.adaptiveAssistActive = false;
      this.lifeLossTimestamps = [];
      this.syncTempoLevel();
      this.adaptiveAssistResetId = null;
    }, config.durationMs + 200);
  }

  private syncTempoLevel(): void {
    let tempo = 0;
    if (this.adaptiveAssistActive) {
      tempo = -1;
    } else if (this.waveSystem?.isSurgeActive()) {
      tempo = 2;
    }
    stateManager.updateGame({ tempoLevel: tempo });
    audioManager.setMusicTempoLevel(tempo);
  }

  private updateTimerRamp(_dt: number): void {
    const state = stateManager.getState();
    if (state.ui.currentGameMode !== 'timerAttack' || !this.timerAttack) return;
    
    // Timer Attack now uses runtime phase system - multipliers applied via callbacks
    // Keep this method for compatibility but phase management is in TimerAttackMode
  }

  private updateCatchupMultiplier(): void {
    const state = stateManager.getState();
    const isMultiplayer = state.ui.currentGameMode?.startsWith('multiplayer');
    if (!isMultiplayer) {
      this.catchupSpeedMultiplier = 1;
      this.catchupSpawnMultiplier = 1;
      this.applyWaveTuning();
      return;
    }

    const delta = state.game.ghostDelta ?? 0;
    
    // Player is significantly behind - apply adaptive assist
    if (delta <= -0.25) {
      // Reduce difficulty (slower block speed, less spawning)
      this.catchupSpeedMultiplier = 0.90; // Was 0.95, now more help
      this.catchupSpawnMultiplier = 0.85; // Was 0.9, now more help
    } 
    // Player is moderately behind - slight assist
    else if (delta < -0.1) {
      this.catchupSpeedMultiplier = 0.95;
      this.catchupSpawnMultiplier = 0.93;
    }
    // Player is significantly ahead - increase challenge
    else if (delta >= 0.25) {
      this.catchupSpeedMultiplier = 1.05;
      this.catchupSpawnMultiplier = 1.05;
    }
    // Player is moderately ahead - slight challenge increase
    else if (delta > 0.1) {
      this.catchupSpeedMultiplier = 1.03;
      this.catchupSpawnMultiplier = 1.02;
    }
    // Scores are close - neutral
    else {
      this.catchupSpeedMultiplier = 1;
      this.catchupSpawnMultiplier = 1;
    }
    
    this.applyWaveTuning();
  }

  private addComboHeat(combo: number): void {
    const gain = Math.min(35, combo * 8);
    this.comboHeatValue = Math.min(100, this.comboHeatValue + gain);
    this.lastComboFrame = this.hex.ct;

    const nextTier = this.getComboTier(this.comboHeatValue);
    if (nextTier !== this.comboTier) {
      this.comboTier = nextTier;
      this.scoreDisplay.flashCombo();
    }

    stateManager.updateGame({ comboHeat: this.comboHeatValue, comboTier: this.comboTier });
    
    // Update audio manager for volume scaling
    audioManager.setComboHeat(this.comboHeatValue);
  }

  private decayComboHeat(dt: number): void {
    const sinceCombo = this.hex.ct - this.lastComboFrame;
    if (sinceCombo < 30) return;
    if (this.comboHeatValue <= 0) return;

    this.comboHeatValue = Math.max(0, this.comboHeatValue - this.heatDecayRate * dt);
    const nextTier = this.getComboTier(this.comboHeatValue);
    if (nextTier !== this.comboTier) {
      this.comboTier = nextTier;
    }
    stateManager.updateGame({ comboHeat: this.comboHeatValue, comboTier: this.comboTier });
    
    // Update audio manager for volume scaling
    audioManager.setComboHeat(this.comboHeatValue);
  }

  private getComboTier(heat: number): number {
    if (heat >= 80) return 3;
    if (heat >= 50) return 2;
    if (heat >= 20) return 1;
    return 0;
  }

  private addMomentum(blocksCleared: number): void {
    const state = stateManager.getState();
    const isMultiplayer = state.ui.currentGameMode?.startsWith('multiplayer');
    if (!isMultiplayer) return;

    const gain = Math.min(12, blocksCleared * 2);
    this.momentumValue = Math.min(100, this.momentumValue + gain);
    stateManager.updateGame({ momentumValue: this.momentumValue });
  }

  private decayMomentum(dt: number): void {
    const state = stateManager.getState();
    const isMultiplayer = state.ui.currentGameMode?.startsWith('multiplayer');
    if (!isMultiplayer) return;

    if (this.momentumValue <= 0) return;
    this.momentumValue = Math.max(0, this.momentumValue - this.momentumDecayRate * dt);
    stateManager.updateGame({ momentumValue: this.momentumValue });
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

  /**
   * Handle life loss - core LifeSystem implementation
   * 
   * This intercepts game over triggers and manages the life system:
   * - Checks remaining lives before triggering game over
   * - Decrements lives and updates StateManager
   * - Resets level state (blocks, effects, combos)
   * - Grants invulnerability period
   * - Updates HUD via StateManager events
   * - Only triggers actual game over when lives = 0
   * 
   * Does NOT modify collision detection - only intercepts the game over trigger.
   */
  private handleLifeLoss(): void {
    const state = stateManager.getState();
    const nextLives = state.game.lives - 1;
    const centerX = this.canvas.element.width / 2;
    const centerY = this.canvas.element.height / 2;

    // Check if game over (lives depleted)
    if (nextLives <= 0) {
      stateManager.updateGame({ lives: 0 });
      stateManager.setState('status', GameStatus.GAME_OVER);
      stateManager.emit('gameOver', { score: state.game.score });
      window.dispatchEvent(new CustomEvent('gameOver', { detail: { score: state.game.score } }));
      return;
    }

    // Life lost - reset level state and continue
    this.registerLifeLossAssist();
    stateManager.updateGame({ lives: nextLives, isInvulnerable: true });
    stateManager.emit('lifeLost', { lives: nextLives });
    
    // Visual feedback
    this.floatingTexts.push(FloatingText.createLifeLost(centerX, centerY - 120));
    this.showLifeLostFlash();
    audioManager.playSfx('lifeLost');
    
    // Reset level state
    this.clearBlocksAndRestart();

    // Grant invulnerability period
    if (this.invulnerabilityTimeoutId) {
      window.clearTimeout(this.invulnerabilityTimeoutId);
    }
    this.invulnerabilityTimeoutId = window.setTimeout(() => {
      stateManager.updateGame({ isInvulnerable: false });
      this.invulnerabilityTimeoutId = null;
    }, INVULNERABILITY_DURATION);
  }

  /**
   * Clear all blocks and reset level state when life is lost
   * Resets: blocks, falling blocks, combo, active effects, power-ups
   */
  private clearBlocksAndRestart(): void {
    // Clear blocks and reset combo
    this.hex.clearBlocks();
    this.physicsSystem.clearFallingBlocks();
    this.matchingSystem.resetCombo();
    
    // Clear all active power-up effects
    this.clearSlowMoEffect();
    if (this.slowMoTimeoutId) {
      window.clearTimeout(this.slowMoTimeoutId);
      this.slowMoTimeoutId = null;
    }
    
    // Clear shield effect
    this.hideShieldEffect();
    if (this.shieldTimeoutId) {
      window.clearTimeout(this.shieldTimeoutId);
      this.shieldTimeoutId = null;
    }
    
    // Clear hammer effect
    if (this.hammerOverlay) {
      this.hammerOverlay.remove();
      this.hammerOverlay = null;
    }
    if (this.hammerEffectTimeoutId) {
      window.clearTimeout(this.hammerEffectTimeoutId);
      this.hammerEffectTimeoutId = null;
    }
    
    // Reset speed multipliers
    this.rushMultiplier = 1;
    this.powerUpSpeedMultiplier = 1;
    
    // Clear floating texts
    this.floatingTexts = [];
    
    // Reset power-up system spawns
    if (this.powerUpSystem) {
      this.powerUpSystem.clearActivePowerUps();
    }
    
    // Reset time orb system if active
    if (this.timeOrbSystem) {
      this.timeOrbSystem.clearActiveOrbs();
    }
    
    // Reset game state values
    stateManager.updateGame({
      combo: 0,
      comboTimer: 0,
      comboHeat: 0,
      comboTier: 0,
      speedMultiplier: 1.0,
    });
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
      // Mark player as finished in room
      if (this.roomManager) {
        this.roomManager.finishGame(state.game.score);
      }
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
    this.confusionMode?.reset();
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
    
    // Start multiplayer score sync if in multiplayer mode
    this.startMultiplayerSync();
    
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
    
    // Reset score to 0 for multiplayer matches
    const isMultiplayer = uiState.currentGameMode?.startsWith('multiplayer');
    if (isMultiplayer) {
      console.log('[GamePage] Resetting score for multiplayer match');
      stateManager.updateGame({ score: 0 });
    }
    
    // Set game status to playing
    stateManager.setState('status', GameStatus.PLAYING);
    
    // Initialize canvas first (so leaderboardHUD is created)
    this.initCanvas();
    
    // Start multiplayer score sync if in multiplayer mode
    this.startMultiplayerSync();
    
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
      const date = new Date().toISOString().slice(0, 10);
      this.challengeScript = getChallengeScriptForDate(date);
      if (this.challengeScript) {
        this.challengePhaseIndex = 0;
        this.challengeSpeedMultiplier = this.challengeScript.phases[0]?.speedMultiplier ?? 1;
        this.challengeSpawnMultiplier = this.challengeScript.phases[0]?.spawnMultiplier ?? 1;
        this.applyWaveTuning();
        this.applyMutators(this.challengeScript.mutators);
      }
    } else if (uiState.currentGameMode === 'timerAttack') {
      const duration = uiState.timerDuration || 90;
      this.timerAttack = new TimerAttackMode(duration, {
        onPhaseChange: (phase, multipliers) => this.handleTimerPhaseChange(phase, multipliers),
        onBurstStart: (multipliers) => this.handleTimerBurstStart(multipliers),
        onBurstEnd: () => this.handleTimerBurstEnd(),
        onScoreMultiplier: (multiplier) => this.handleTimerScoreMultiplier(multiplier),
      });
      window.dispatchEvent(new CustomEvent('activateTimerMode'));
      this.timeOrbSystem?.setEnabled(true);
      this.applyMutators([]);
    } else {
      this.applyMutators([]);
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
    
    // Listen for score updates to dynamically adjust rotation speed
    this.unsubscribeScoreUpdated = stateManager.subscribe('scoreUpdated', (score) => {
      this.updateRotationSpeed(score);
      
      // Check confusion mode milestone
      if (this.confusionMode) {
        const wasActive = this.confusionMode.isActive();
        this.confusionMode.checkScoreMilestone(score);
        
        // Show notification when confusion mode activates
        if (!wasActive && this.confusionMode.isActive()) {
          this.floatingTexts.push(FloatingText.createMessage(
            this.canvas.element.width / 2,
            this.canvas.element.height / 2 - 50,
            'CONFUSION MODE!',
            '#f59e0b'
          ));
          console.log('[GamePage] Confusion Mode activated at score:', score);
        }
      }
      
      // Emit score to multiplayer session
      if (this.multiplayerSyncActive) {
        if (this.roomManager) {
          this.roomManager.emitScore(score);
        } else {
          this.groupManager.emitScore(score);
        }
        
        // Update local player in leaderboard
        const state = stateManager.getState();
        this.leaderboardHUD.updatePlayer(
          state.player.id,
          state.player.name,
          score,
          true
        );
      }
    });
    
    this.unsubscribeLivesChanged = stateManager.subscribe('livesChanged', (lives) => {
      if (typeof lives !== 'number') return;
      if (lives < this.lastLives) {
        this.handleLifeLostSfx();
      }
      this.lastLives = lives;
    });
    window.addEventListener('timerModeTimeUp', this.handleTimerModeTimeUp as EventListener);
    window.addEventListener('timerBurst', this.handleTimerBurstNotification as EventListener);
    window.addEventListener('timerMultiplier', this.handleTimerMultiplierNotification as EventListener);
    window.addEventListener('powerUpCollected', this.handlePowerUpCollectedSfx as EventListener);
    window.addEventListener('powerUpUsed', this.handlePowerUpUsedInventory as EventListener);
    window.addEventListener('powerUpEffect', this.handlePowerUpEffect as EventListener);
    window.addEventListener('blockLand', this.handleBlockLandSfx as EventListener);
    
    // Audio and visual feedback events
    window.addEventListener('collision', this.handleCollisionFeedback as EventListener);
    window.addEventListener('comboAchieved', this.handleComboAchievedFeedback as EventListener);
    window.addEventListener('hammerActivated', this.handleHammerActivatedFeedback as EventListener);
    window.addEventListener('speedBurst', this.handleSpeedBurstFeedback as EventListener);
  }
  
  /**
   * Start multiplayer score sync for competitive play (using RoomManager + Appwrite Realtime)
   */
  private startMultiplayerSync(): void {
    const state = stateManager.getState();
    const isMultiplayer = state.ui.currentGameMode?.startsWith('multiplayer');
    
    if (!isMultiplayer || !state.ui.currentGroupId || !state.player.id) {
      return;
    }
    
    this.multiplayerSyncActive = true;
    this.ghostScore = 0;
    this.ghostPlayerName = '';
    
    // Show leaderboard in multiplayer mode
    this.leaderboardHUD.setVisible(true);
    
    // Add current player to leaderboard
    const currentScore = state.game.score;
    this.leaderboardHUD.updatePlayer(
      state.player.id,
      state.player.name,
      currentScore,
      true
    );
    
    // Try to get RoomManager from MultiplayerPage (passed via window)
    this.roomManager = (window as any).__hexi_roomManager as RoomManager | null;
    
    if (this.roomManager) {
      // Subscribe to real-time score updates via Socket.io
      this.roomManager.subscribeScoreUpdates(
        (scores) => {
          // scores is ScoreEntry[]: { playerId, name, score }[]
          const localId = this.roomManager!.getLocalId();
          for (const entry of scores) {
            const isLocal = entry.playerId === localId;
            if (!isLocal) {
              this.leaderboardHUD.updatePlayer(
                entry.playerId,
                entry.name,
                entry.score,
                false
              );
              
              // Track ghost score (highest opponent)
              if (entry.score > this.ghostScore) {
                this.ghostScore = entry.score;
                this.ghostPlayerName = entry.name;
              }
            }
          }
          
          // Update local score on leaderboard
          const localScore = stateManager.getState().game.score;
          this.leaderboardHUD.updatePlayer(
            state.player.id,
            state.player.name,
            localScore,
            true
          );
          
          // Calculate score delta
          if (this.ghostScore > 0) {
            const maxScore = Math.max(localScore, this.ghostScore, 1);
            const delta = (localScore - this.ghostScore) / maxScore;
            stateManager.updateGame({ ghostDelta: delta });
            this.momentumBar.setValue(50 + (delta * 50));
            this.updateCatchupMultiplier();
          }
        },
        (leftPlayer) => {
          // A player left — mark them on leaderboard
          this.leaderboardHUD.markPlayerLeft(leftPlayer.playerId);
          this.floatingTexts.push(FloatingText.createMessage(
            this.canvas.element.width / 2,
            this.canvas.element.height / 2 - 100,
            leftPlayer.name + ' LEFT',
            '#ef4444'
          ));
        }
      );
    } else {
      // Fallback to old GroupManager localStorage sync
      this.groupManager.startScoreSync(
        state.player.id,
        state.player.name,
        state.ui.currentGroupId,
        (opponentScore: number, opponentName: string) => {
          this.handleOpponentScoreUpdate(opponentScore, opponentName);
        },
        () => {
          this.handleOpponentDisconnect();
        }
      );
    }
    
    console.log('[GamePage] Multiplayer score sync started');
  }
  
  /**
   * Handle opponent score update from sync
   */
  private handleOpponentScoreUpdate(opponentScore: number, opponentName: string): void {
    this.ghostScore = opponentScore;
    this.ghostPlayerName = opponentName;
    
    // Calculate score delta (-1 to +1 normalized)
    const localScore = stateManager.getState().game.score;
    const maxScore = Math.max(localScore, opponentScore, 1);
    const delta = (localScore - opponentScore) / maxScore;
    
    // Update state with ghost delta
    stateManager.updateGame({ ghostDelta: delta });
    
    // Update momentum bar (0-100 where 50 is tied)
    const momentum = 50 + (delta * 50); // Behind = 0, Tied = 50, Ahead = 100
    this.momentumBar.setValue(momentum);
    
    // Update leaderboard with opponent score
    const state = stateManager.getState();
    this.leaderboardHUD.updatePlayer(
      'opponent',
      opponentName,
      opponentScore,
      false
    );
    this.leaderboardHUD.updatePlayer(
      state.player.id,
      state.player.name,
      localScore,
      true
    );
    
    // Update catch-up multiplier
    this.updateCatchupMultiplier();
    
    console.log('[GamePage] Ghost score updated:', opponentScore, 'Delta:', delta.toFixed(3));
  }
  
  /**
   * Handle opponent disconnect - convert to single-player
   */
  private handleOpponentDisconnect(): void {
    console.log('[GamePage] Opponent disconnected - converting to single-player');
    
    this.multiplayerSyncActive = false;
    this.ghostScore = 0;
    this.ghostPlayerName = '';
    
    // Remove opponent from leaderboard
    this.leaderboardHUD.removePlayer('opponent');
    this.leaderboardHUD.setVisible(false);
    
    // Reset momentum bar
    this.momentumBar.setVisible(false);
    
    // Reset delta and catch-up multipliers
    stateManager.updateGame({ ghostDelta: 0 });
    this.catchupSpeedMultiplier = 1;
    this.catchupSpawnMultiplier = 1;
    this.applyWaveTuning();
    
    // Show notification
    this.floatingTexts.push(FloatingText.createMessage(
      this.canvas.element.width / 2,
      this.canvas.element.height / 2 - 100,
      'OPPONENT LEFT',
      '#ef4444'
    ));
  }
  
  /**
   * Stop multiplayer sync
   */
  private stopMultiplayerSync(): void {
    if (this.multiplayerSyncActive) {
      if (this.roomManager) {
        this.roomManager.cleanup();
        this.roomManager = null;
      } else {
        this.groupManager.stopScoreSync();
      }
      this.multiplayerSyncActive = false;
    }
  }

  public onUnmount(): void {
    // Stop multiplayer sync
    this.stopMultiplayerSync();
    
    // Unmount and cleanup HUD components
    if (this.leaderboardHUD) {
      this.leaderboardHUD.unmount();
    }
    
    // Cleanup Confusion Mode
    if (this.confusionMode) {
      this.confusionMode.destroy();
    }
    
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
    window.removeEventListener('timerBurst', this.handleTimerBurstNotification as EventListener);
    window.removeEventListener('timerMultiplier', this.handleTimerMultiplierNotification as EventListener);
    window.removeEventListener('powerUpCollected', this.handlePowerUpCollectedSfx as EventListener);
    window.removeEventListener('powerUpUsed', this.handlePowerUpUsedInventory as EventListener);
    window.removeEventListener('powerUpEffect', this.handlePowerUpEffect as EventListener);
    window.removeEventListener('blockLand', this.handleBlockLandSfx as EventListener);
    window.removeEventListener('collision', this.handleCollisionFeedback as EventListener);
    window.removeEventListener('comboAchieved', this.handleComboAchievedFeedback as EventListener);
    window.removeEventListener('hammerActivated', this.handleHammerActivatedFeedback as EventListener);
    window.removeEventListener('speedBurst', this.handleSpeedBurstFeedback as EventListener);

    this.clearSlowMoEffect();
    this.hideShieldEffect();
    if (this.hammerOverlay) {
      this.hammerOverlay.remove();
      this.hammerOverlay = null;
    }
    if (this.hammerEffectTimeoutId) {
      window.clearTimeout(this.hammerEffectTimeoutId);
      this.hammerEffectTimeoutId = null;
    }

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

    if (this.adaptiveAssistResetId) {
      window.clearTimeout(this.adaptiveAssistResetId);
      this.adaptiveAssistResetId = null;
    }
    this.adaptiveAssistActive = false;
    this.lifeLossTimestamps = [];
    this.activeDifficultyConfig = null;
    this.currentPhaseName = null;
    stateManager.updateGame({ surgeActive: false, tempoLevel: 0, strategyPhase: undefined });
    audioManager.setMusicIntensity(0.4);
    audioManager.setMusicTempoLevel(0);

    if (this.powerUpSystem) {
      this.powerUpSystem.destroy();
    }

    if (this.timerAttack) {
      this.timerAttack.deactivate();
      this.timerAttack = null;
    }

    if (this.timeOrbSystem) {
      this.timeOrbSystem.setEnabled(false);
      this.timeOrbSystem = null;
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
    
    if (this.unsubscribeScoreUpdated) {
      this.unsubscribeScoreUpdated();
      this.unsubscribeScoreUpdated = null;
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


