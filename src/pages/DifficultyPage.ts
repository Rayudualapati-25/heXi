/**
 * Difficulty Page - Difficulty selection screen
 * Allows players to choose game difficulty before starting
 */

import { BasePage } from './BasePage';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { DifficultyLevel, difficultyConfigs } from '@config/difficulty';

export class DifficultyPage extends BasePage {
  private selectedDifficulty: DifficultyLevel = DifficultyLevel.MEDIUM;
  private difficultyCards: HTMLElement[] = [];

  public render(): void {
    this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 p-3 sm:p-4 md:p-6 overflow-y-auto';

    // Clear previous content
    this.element.innerHTML = '';

    // Back button
    const backBtn = this.createBackButton('← Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backBtn.style.marginBottom = '1rem';
    this.element.appendChild(backBtn);

    // Content container
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center justify-start min-h-screen max-w-3xl mx-auto space-y-6 sm:space-y-8';

  // Reset cards array
  this.difficultyCards = [];

  // Header
    const header = this.createHeader('SELECT DIFFICULTY', 'Choose your challenge');
    container.appendChild(header);

    // Difficulty cards grid with better spacing
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full px-0 sm:px-2';

    // Create cards for each difficulty
    const difficulties = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD];
    
    difficulties.forEach((level) => {
      const config = difficultyConfigs[level];
      const cardElement = this.createDifficultyCard(level, config);
      cardsGrid.appendChild(cardElement);
      this.difficultyCards.push(cardElement);
    });

    container.appendChild(cardsGrid);

    // Start button with more spacing
    const startButtonContainer = document.createElement('div');
    startButtonContainer.className = 'mt-4 sm:mt-6 w-full max-w-xs px-0 sm:px-2 mb-2 sm:mb-4';

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = `
      w-full py-2 sm:py-3 px-4 sm:px-6
      bg-black text-white text-sm sm:text-base
      rounded-lg font-bold
      hover:bg-gray-800 hover:scale-105
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
    `.trim().replace(/\s+/g, ' ');
    startButton.textContent = 'START GAME';
    startButton.addEventListener('click', () => this.startGame());

    startButtonContainer.appendChild(startButton);
    container.appendChild(startButtonContainer);

    this.element.appendChild(container);
    this.mount();
  }

  /**
   * Create difficulty card
   */
  private createDifficultyCard(level: DifficultyLevel, config: typeof difficultyConfigs[DifficultyLevel]): HTMLElement {
    const isSelected = level === this.selectedDifficulty;
    
    const card = document.createElement('div');
    
    // Base styling
    const baseStyles = {
      easy: {
        bg: 'bg-white',
        text: 'text-black',
        border: 'border-gray-300',
        hover: 'hover:bg-gray-50',
        emoji: '😌'
      },
      medium: {
        bg: 'bg-white',
        text: 'text-black',
        border: 'border-gray-300',
        hover: 'hover:bg-gray-50',
        emoji: '😎'
      },
      hard: {
        bg: 'bg-gray-900',
        text: 'text-white',
        border: 'border-gray-600',
        hover: 'hover:bg-black',
        emoji: '😤'
      }
    };

    const style = baseStyles[level];

    card.className = `
      ${style.bg} ${style.text}
      rounded-xl p-5 border-2 ${style.border}
      cursor-pointer transition-all duration-300
      ${style.hover}
    `.trim().replace(/\s+/g, ' ');
    card.dataset.level = level;

    // Icon
    const icon = document.createElement('div');
    icon.className = 'text-4xl mb-3 text-center';
    icon.textContent = style.emoji;
    card.appendChild(icon);

    // Title
    const title = document.createElement('h3');
    title.className = 'text-2xl font-black mb-1 text-center tracking-tight';
    title.textContent = config.name.toUpperCase();
    card.appendChild(title);

    // Description
    const description = document.createElement('p');
    description.className = `text-xs mb-3 text-center font-medium ${level === DifficultyLevel.HARD ? 'text-gray-400' : 'text-gray-700'}`;
    description.textContent = config.description;
    card.appendChild(description);

    // Stats section with better styling
    const statsContainer = document.createElement('div');
    statsContainer.className = `rounded-lg p-3 mb-3 ${level === DifficultyLevel.HARD ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-100'}`;
    
    const stats = document.createElement('div');
    stats.className = 'space-y-2 text-xs';
    
    const statItems = [
      { label: 'Block Speed', value: `${config.blockSpeed}px/s` },
      { label: 'Spawn Delay', value: `${config.spawnDelay}ms` },
      { label: 'Score Bonus', value: `×${config.scoreMultiplier}` },
    ];

    statItems.forEach(({ label, value }) => {
      const statDiv = document.createElement('div');
      statDiv.className = 'flex justify-between font-semibold';
      statDiv.innerHTML = `
        <span>${label}</span>
        <span class="font-bold">${value}</span>
      `;
      stats.appendChild(statDiv);
    });

    statsContainer.appendChild(stats);
    card.appendChild(statsContainer);

    const footer = document.createElement('div');
    footer.className = 'difficulty-card-footer';
    card.appendChild(footer);

    this.updateCardSelection(card, level, isSelected);

    // Click handler with logging
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectDifficulty(level);
    });

    return card;
  }

  /**
   * Select difficulty
   */
  private selectDifficulty(level: DifficultyLevel): void {
    this.selectedDifficulty = level;
    this.difficultyCards.forEach((card) => {
      const cardLevel = card.dataset.level as DifficultyLevel | undefined;
      if (cardLevel) {
        this.updateCardSelection(card, cardLevel, cardLevel === level);
      }
    });
  }

  private updateCardSelection(
    card: HTMLElement,
    level: DifficultyLevel,
    isSelected: boolean
  ): void {
    const selectedClasses = ['ring-4', 'ring-black', 'scale-105', 'shadow-2xl'];
    const unselectedClasses = ['shadow-md', 'hover:shadow-lg'];
    const lightBg = level !== DifficultyLevel.HARD;

    [...selectedClasses, ...unselectedClasses, 'bg-gray-100', 'bg-gray-800'].forEach((cls) => {
      card.classList.remove(cls);
    });

    if (isSelected) {
      selectedClasses.forEach((cls) => card.classList.add(cls));
      card.classList.add(lightBg ? 'bg-gray-100' : 'bg-gray-800');
    } else {
      unselectedClasses.forEach((cls) => card.classList.add(cls));
    }

    const footer = card.querySelector('.difficulty-card-footer');
    if (!footer) return;

    footer.innerHTML = '';

    if (isSelected) {
      const indicator = document.createElement('div');
      indicator.className = 'text-center mt-3 font-bold text-sm flex items-center justify-center gap-2';
      indicator.innerHTML = `<span class="text-2xl">✓</span> SELECTED`;
      footer.appendChild(indicator);
    } else {
      const hint = document.createElement('div');
      hint.className = `text-center mt-3 text-xs font-semibold opacity-60 ${level === DifficultyLevel.HARD ? 'text-gray-400' : 'text-gray-500'}`;
      hint.textContent = 'Click to select';
      footer.appendChild(hint);
    }
  }

  /**
   * Start game with selected difficulty
   */
  private startGame(): void {
    // Update game state with selected difficulty
    stateManager.updateGame({ difficulty: this.selectedDifficulty });
    
    // Navigate to game page
    Router.getInstance().navigate(ROUTES.GAME, { difficulty: this.selectedDifficulty });
  }

  public onMount(): void {
    this.element.classList.add('animate-fade-in');
  }

  public onUnmount(): void {
    this.difficultyCards = [];
  }
}
