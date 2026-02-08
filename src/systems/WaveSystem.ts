/**
 * WaveSystem - Handles block spawning patterns and difficulty progression
 * Ports logic from wavegen.js
 */

import { randInt } from '@utils/math';

type GenerationFunction = () => void;

interface WaveConfig {
  colors: string[];
  speedModifier: number;
  creationSpeedModifier: number;
}

export class WaveSystem {
  private lastGen: number = 0;
  private nextGen: number = 2700; // Initial delay before first block
  private ct: number = 0; // Pattern counter
  private difficulty: number = 1;
  private dt: number = 0; // Total elapsed time
  private lastDifficultyTime: number = 0;
  
  private colors: string[];
  private speedModifier: number;
  private creationSpeedModifier: number;
  
  private currentFunction: GenerationFunction;
  private hexSides: number = 6;
  
  // Callback to spawn blocks
  private onSpawnBlock: (lane: number, color: string, speed: number) => void;

  constructor(
    config: WaveConfig,
    hexSides: number,
    onSpawnBlock: (lane: number, color: string, speed: number) => void
  ) {
    this.colors = config.colors;
    this.speedModifier = config.speedModifier;
    this.creationSpeedModifier = config.creationSpeedModifier;
    this.hexSides = hexSides;
    this.onSpawnBlock = onSpawnBlock;
    
    // Start with random generation
    this.currentFunction = this.randomGeneration.bind(this);
  }

  /**
   * Update wave generation
   * Original: this.dt = (mobile ? 14 : 16.6667) * MainHex.ct
   */
  public update(_deltaTime: number, frameCount: number): void {
    // Original Hextris timing formula
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.dt = (isMobile ? 14 : 16.6667) * frameCount;
    
    // Run current generation pattern
    this.currentFunction();
    
    // Update difficulty over time
    this.computeDifficulty();
    
    // Speed up generation over time
    if ((this.dt - this.lastGen) * this.creationSpeedModifier > this.nextGen) {
      if (this.nextGen > 600) {
        this.nextGen -= 11 * (this.nextGen / 1300) * this.creationSpeedModifier;
      }
    }
  }

  /**
   * Called when blocks are destroyed - increases difficulty
   */
  public onBlocksDestroyed(): void {
    if (this.nextGen > 1350) {
      this.nextGen -= 30 * this.creationSpeedModifier;
    } else if (this.nextGen > 600) {
      this.nextGen -= 8 * this.creationSpeedModifier;
    } else {
      this.nextGen = 600;
    }

    if (this.difficulty < 35) {
      this.difficulty += 0.085 * this.speedModifier;
    } else {
      this.difficulty = 35;
    }
  }

  /**
   * Gradually increase difficulty over time
   */
  private computeDifficulty(): void {
    if (this.difficulty < 35) {
      let increment: number;
      if (this.difficulty < 8) {
        increment = (this.dt - this.lastDifficultyTime) / 5166667 * this.speedModifier;
      } else if (this.difficulty < 15) {
        increment = (this.dt - this.lastDifficultyTime) / 72333333 * this.speedModifier;
      } else {
        increment = (this.dt - this.lastDifficultyTime) / 90000000 * this.speedModifier;
      }
      
      this.difficulty += increment * 0.5;
      this.lastDifficultyTime = this.dt;
    }
  }

  /**
   * Get block speed based on difficulty
   * Original base speed: 1.6
   */
  private getBlockSpeed(): number {
    return 1.6 + (this.difficulty / 15) * 3;
  }

  /**
   * Random single block generation
   */
  private randomGeneration(): void {
    if (this.dt - this.lastGen > this.nextGen) {
      this.ct++;
      this.lastGen = this.dt;
      
      const lane = randInt(0, this.hexSides);
      const color = this.colors[randInt(0, this.colors.length)];
      this.onSpawnBlock(lane, color, this.getBlockSpeed());
      
      // After 5 blocks, chance to switch pattern
      if (this.ct > 5) {
        const nextPattern = randInt(0, 24);
        if (nextPattern > 15) {
          this.ct = 0;
          this.currentFunction = this.doubleGeneration.bind(this);
        } else if (nextPattern > 10) {
          this.ct = 0;
          this.currentFunction = this.crosswiseGeneration.bind(this);
        } else if (nextPattern > 7) {
          this.ct = 0;
          this.currentFunction = this.spiralGeneration.bind(this);
        } else if (nextPattern > 4) {
          this.ct = 0;
          this.currentFunction = this.circleGeneration.bind(this);
        } else if (nextPattern > 1) {
          this.ct = 0;
          this.currentFunction = this.halfCircleGeneration.bind(this);
        }
      }
    }
  }

  /**
   * Full circle - spawn on all sides
   */
  private circleGeneration(): void {
    if (this.dt - this.lastGen > this.nextGen + 500) {
      let numColors = randInt(1, 4);
      if (numColors === 3) {
        numColors = randInt(1, 4);
      }
      
      // Pick random colors
      const colorList: string[] = [];
      for (let i = 0; i < numColors; i++) {
        let attempts = 0;
        while (attempts < 10) {
          const color = this.colors[randInt(0, this.colors.length)];
          if (!colorList.includes(color)) {
            colorList.push(color);
            break;
          }
          attempts++;
        }
      }
      
      // Spawn on all sides (original speeds)
      for (let i = 0; i < this.hexSides; i++) {
        this.onSpawnBlock(i, colorList[i % colorList.length], 1.5 + (this.difficulty / 15) * 3);
      }
      
      this.ct += 15;
      this.lastGen = this.dt;
      this.shouldChangePattern(true);
    }
  }

  /**
   * Half circle - spawn on 3 adjacent sides
   */
  private halfCircleGeneration(): void {
    if (this.dt - this.lastGen > (this.nextGen + 500) / 2) {
      const numColors = randInt(1, 3);
      const c = this.colors[randInt(0, this.colors.length)];
      
      let colorList = [c, c, c];
      if (numColors === 2) {
        colorList = [c, this.colors[randInt(0, this.colors.length)], c];
      }
      
      const startLane = randInt(0, this.hexSides);
      for (let i = 0; i < 3; i++) {
        this.onSpawnBlock((startLane + i) % this.hexSides, colorList[i], 1.5 + (this.difficulty / 15) * 3);
      }
      
      this.ct += 8;
      this.lastGen = this.dt;
      this.shouldChangePattern(false);
    }
  }

  /**
   * Crosswise - spawn on opposite sides
   */
  private crosswiseGeneration(): void {
    if (this.dt - this.lastGen > this.nextGen) {
      const color = this.colors[randInt(0, this.colors.length)];
      const lane = randInt(0, this.hexSides);
      
      this.onSpawnBlock(lane, color, 0.6 + (this.difficulty / 15) * 3);
      this.onSpawnBlock((lane + 3) % this.hexSides, color, 0.6 + (this.difficulty / 15) * 3);
      
      this.ct += 1.5;
      this.lastGen = this.dt;
      this.shouldChangePattern(false);
    }
  }

  /**
   * Spiral - spawn in rotating pattern
   */
  private spiralGeneration(): void {
    if (this.dt - this.lastGen > this.nextGen * (2 / 3)) {
      const clockwise = randInt(0, 2); // 0 or 1
      const lane = clockwise ? (5 - (this.ct % this.hexSides)) : (this.ct % this.hexSides);
      const color = this.colors[randInt(0, this.colors.length)];
      
      this.onSpawnBlock(lane, color, 1.5 + (this.difficulty / 15) * 1.5);
      
      this.ct++;
      this.lastGen = this.dt;
      this.shouldChangePattern(false);
    }
  }

  /**
   * Double - spawn two adjacent blocks
   */
  private doubleGeneration(): void {
    if (this.dt - this.lastGen > this.nextGen) {
      const lane = randInt(0, this.hexSides);
      
      this.onSpawnBlock(lane, this.colors[randInt(0, this.colors.length)], 1.5 + (this.difficulty / 15) * 3);
      this.onSpawnBlock((lane + 1) % this.hexSides, this.colors[randInt(0, this.colors.length)], 1.5 + (this.difficulty / 15) * 3);
      
      this.ct += 2;
      this.lastGen = this.dt;
      this.shouldChangePattern(false);
    }
  }

  /**
   * Decide whether to change generation pattern
   */
  private shouldChangePattern(forceChange: boolean): void {
    if (forceChange) {
      const q = randInt(0, 4);
      this.ct = 0;
      switch (q) {
        case 0:
          this.currentFunction = this.doubleGeneration.bind(this);
          break;
        case 1:
          this.currentFunction = this.spiralGeneration.bind(this);
          break;
        case 2:
          this.currentFunction = this.crosswiseGeneration.bind(this);
          break;
      }
    } else if (this.ct > 8) {
      // Original: randInt(0,1) always returns 0, so always resets
      if (randInt(0, 1) === 0) {
        this.ct = 0;
        this.currentFunction = this.randomGeneration.bind(this);
      }
    }
  }

  /**
   * Reset to initial state
   */
  public reset(): void {
    this.lastGen = 0;
    this.nextGen = 2700;
    this.ct = 0;
    this.difficulty = 1;
    this.dt = 0;
    this.lastDifficultyTime = 0;
    this.currentFunction = this.randomGeneration.bind(this);
  }

  // Getters
  public getDifficulty(): number {
    return this.difficulty;
  }

  public getNextGen(): number {
    return this.nextGen;
  }
}
