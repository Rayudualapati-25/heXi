/**
 * Settings Page - Game settings and preferences
 * Theme selector, audio settings, accessibility options, account management
 */

import { BasePage } from './BasePage';
import { Card } from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { ThemeName, themes, availableThemes, themePrices, type Theme } from '@config/themes';
import { createEmptyInventory } from '@config/shopItems';
import { audioManager } from '@/managers/AudioManager';
import { themeManager } from '@/managers/ThemeManager';

export class SettingsPage extends BasePage {
  private buttons: Button[] = [];

  public render(): void {
    const contentWrapper = this.initPageLayout({
      align: 'top',
      maxWidthClass: 'max-w-5xl',
      paddingClass: 'px-2 sm:px-4 py-8 sm:py-12',
    });

    // Back button
    const backBtn = this.createBackButton('<- Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backBtn.style.marginBottom = '1.5rem';
    contentWrapper.appendChild(backBtn);

    // Content container
      const container = document.createElement('div');
      container.className = 'max-w-4xl mx-auto py-4 sm:py-8 space-y-8 sm:space-y-12 pb-16';

    // Header
    const header = this.createHeader('SETTINGS', 'Customize your experience');
    container.appendChild(header);

    // Settings sections
    const sections = document.createElement('div');
    sections.className = 'space-y-6 sm:space-y-8';

    // Theme Selector Section
    sections.appendChild(this.createThemeSection());

    // Audio Section
    sections.appendChild(this.createAudioSection());

    // Accessibility Section
    sections.appendChild(this.createAccessibilitySection());

    // Account Section
    sections.appendChild(this.createAccountSection());

    container.appendChild(sections);
    contentWrapper.appendChild(container);
    this.mount();
  }

  /**
   * Create theme selector section
   */
  private createThemeSection(): HTMLElement {
    const card = new Card({
      title: 'Theme',
      subtitle: 'Choose your visual style',
      padding: 'large',
    });

    const themesGrid = document.createElement('div');
    themesGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 mt-4';

    const player = stateManager.getState().player;
    const currentTheme = player.selectedTheme;
    const unlockedThemes = new Set(player.themesUnlocked);

    availableThemes.forEach((themeName) => {
      const theme = themes[themeName];
      const themeCard = this.createThemeCard(theme, {
        isSelected: currentTheme === themeName,
        isUnlocked: unlockedThemes.has(themeName),
        cost: themePrices[themeName] ?? 0,
      });
      themesGrid.appendChild(themeCard);
    });

    card.appendChild(themesGrid);
    return card.element;
  }

  /**
   * Create theme card
   */
  private createThemeCard(
    theme: Theme,
    options: { isSelected: boolean; isUnlocked: boolean; cost: number }
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = `
      relative p-4 rounded-lg border-2 cursor-pointer
      transition-all duration-200
      hover:scale-105 hover:shadow-lg
      theme-card
      ${options.isSelected ? 'scale-105' : ''}
      ${options.isUnlocked ? '' : 'opacity-60'}
    `.trim().replace(/\s+/g, ' ');

    // Theme name
    const name = document.createElement('div');
    name.className = 'font-bold text-center mb-3 theme-text';
    name.textContent = theme.name;
    card.appendChild(name);

    // Color preview
    card.appendChild(this.createThemeSwatches(theme));

    // Description
    const description = document.createElement('div');
    description.className = 'text-xs theme-text-secondary text-center';
    description.textContent = theme.description;
    card.appendChild(description);

    const price = document.createElement('div');
    price.className = 'mt-2 text-center text-xs font-semibold theme-text-secondary';
    price.textContent = options.cost > 0 ? `💎 ${options.cost}` : 'Free';
    card.appendChild(price);

    // Selected indicator
    if (options.isSelected) {
      const indicator = document.createElement('div');
      indicator.className = 'mt-2 text-center text-sm font-bold theme-text';
      indicator.textContent = 'EQUIPPED';
      card.appendChild(indicator);
    } else if (options.isUnlocked) {
      const indicator = document.createElement('div');
      indicator.className = 'mt-2 text-center text-xs font-semibold theme-text-secondary';
      indicator.textContent = 'UNLOCKED';
      card.appendChild(indicator);
    } else {
      const indicator = document.createElement('div');
      indicator.className = 'mt-2 text-center text-xs font-semibold theme-text-secondary';
      indicator.textContent = 'LOCKED';
      card.appendChild(indicator);
    }

    // Click handler
    card.addEventListener('click', () => {
      if (!options.isUnlocked) {
        this.showLockedThemeMessage(theme.name, options.cost);
        return;
      }
      this.selectTheme(theme.id);
    });

    return card;
  }

  private createThemeSwatches(theme: Theme): HTMLElement {
    const group = document.createElement('div');
    group.className = 'flex flex-wrap items-center justify-center gap-1.5 mb-2';
    theme.colors.blocks.forEach((color) => {
      const swatch = document.createElement('span');
      swatch.className = `theme-swatch ${this.getSwatchShapeClass(theme.previewShape)}`;
      swatch.style.backgroundColor = color;
      group.appendChild(swatch);
    });
    return group;
  }

  private getSwatchShapeClass(shape?: Theme['previewShape']): string {
    switch (shape) {
      case 'diamond':
        return 'theme-swatch-diamond';
      case 'pill':
        return 'theme-swatch-pill';
      case 'hex':
        return 'theme-swatch-hex';
      case 'spark':
        return 'theme-swatch-spark';
      default:
        return 'theme-swatch-circle';
    }
  }

  private showLockedThemeMessage(themeName: string, cost: number): void {
    const costLabel = cost > 0 ? `for ${cost} diamonds` : 'in the shop';
    alert(`${themeName} is locked. Unlock it ${costLabel}.`);
  }

  /**
   * Select theme
   */
  private selectTheme(themeName: ThemeName): void {
    const state = stateManager.getState();
    if (state.player.selectedTheme === themeName) {
      return;
    }

    stateManager.updatePlayer({ selectedTheme: themeName });
    themeManager.applyTheme(themeName);

    this.render();
    console.log(`Theme changed to: ${themeName}`);
  }

  /**
   * Create audio section
   */
  private createAudioSection(): HTMLElement {
    const card = new Card({
      title: 'Audio',
      subtitle: 'Sound and music settings',
      padding: 'large',
    });

    const audioControls = document.createElement('div');
    audioControls.className = 'space-y-4 mt-4';

    const state = stateManager.getState();

    audioManager.setMusicMuted(state.ui.isMusicMuted);
    audioManager.setSfxMuted(state.ui.isSfxMuted);
    audioManager.setMusicVolume(state.ui.musicVolume);
    audioManager.setSfxVolume(state.ui.sfxVolume);

    // Sound Effects Toggle
    const sfxToggle = this.createToggle('Sound Effects', !state.ui.isSfxMuted, (enabled) => {
      stateManager.updateUI({ isSfxMuted: !enabled });
      audioManager.setSfxMuted(!enabled);
    });
    audioControls.appendChild(sfxToggle);

    // Music Toggle
    const musicToggle = this.createToggle('Background Music', !state.ui.isMusicMuted, (enabled) => {
      stateManager.updateUI({ isMusicMuted: !enabled });
      audioManager.setMusicMuted(!enabled);
    });
    audioControls.appendChild(musicToggle);

    // Music Volume Slider
    const musicSlider = this.createSlider('Music Volume', state.ui.musicVolume, (value) => {
      stateManager.updateUI({ musicVolume: value });
      audioManager.setMusicVolume(value);
    });
    audioControls.appendChild(musicSlider);

    // SFX Volume Slider
    const sfxSlider = this.createSlider('SFX Volume', state.ui.sfxVolume, (value) => {
      stateManager.updateUI({ sfxVolume: value });
      audioManager.setSfxVolume(value);
    });
    audioControls.appendChild(sfxSlider);

    card.appendChild(audioControls);
    return card.element;
  }

  /**
   * Create accessibility section
   */
  private createAccessibilitySection(): HTMLElement {
    const card = new Card({
      title: 'Accessibility',
      subtitle: 'Options for better experience',
      padding: 'large',
    });

    const accessibilityControls = document.createElement('div');
    accessibilityControls.className = 'space-y-4 mt-4';

    // High Contrast Mode
    const highContrastToggle = this.createToggle('High Contrast Mode', false, (enabled) => {
      console.log('High contrast:', enabled);
    });
    accessibilityControls.appendChild(highContrastToggle);

    // Screen Reader Support
    const screenReaderToggle = this.createToggle('Screen Reader Hints', false, (enabled) => {
      console.log('Screen reader:', enabled);
    });
    accessibilityControls.appendChild(screenReaderToggle);

    // Reduced Motion
    const reducedMotionToggle = this.createToggle('Reduced Motion', false, (enabled) => {
      console.log('Reduced motion:', enabled);
    });
    accessibilityControls.appendChild(reducedMotionToggle);

    card.appendChild(accessibilityControls);
    return card.element;
  }

  /**
   * Create account section
   */
  private createAccountSection(): HTMLElement {
    const card = new Card({
      title: 'Account',
      subtitle: 'Manage your data',
      padding: 'large',
    });

    const accountControls = document.createElement('div');
    accountControls.className = 'space-y-3 mt-4';

    const state = stateManager.getState();

    // Player name display
    const nameDisplay = document.createElement('div');
    nameDisplay.className = 'p-3 theme-card-muted rounded-lg';
    nameDisplay.innerHTML = `
      <div class="text-sm theme-text-secondary">Player Name</div>
      <div class="text-lg font-bold theme-text">${state.player.name}</div>
    `;
    accountControls.appendChild(nameDisplay);

    // Clear data button
    const clearDataBtn = new Button('Clear Local Data', {
      variant: 'outline',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.clearData(),
    });
    this.buttons.push(clearDataBtn);
    accountControls.appendChild(clearDataBtn.element);

    // Logout button
    const logoutBtn = new Button('Logout', {
      variant: 'outline',
      size: 'medium',
      fullWidth: true,
      onClick: () => this.logout(),
    });
    this.buttons.push(logoutBtn);
    accountControls.appendChild(logoutBtn.element);

    card.appendChild(accountControls);
    return card.element;
  }

  /**
   * Create toggle switch
   */
  private createToggle(label: string, initialValue: boolean, onChange: (value: boolean) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex items-center justify-between p-3 theme-card-muted rounded-lg';

    const labelElement = document.createElement('span');
    labelElement.className = 'font-medium theme-text';
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'relative inline-flex h-7 w-14 items-center rounded-full transition-transform duration-200 focus-visible:outline-none';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(initialValue));

    const toggleCircle = document.createElement('span');
    toggleCircle.className = 'inline-block h-5 w-5 transform rounded-full shadow-md transition-transform duration-200 ease-out';
    toggle.appendChild(toggleCircle);

    let isEnabled = initialValue;
    const updateVisual = (enabled: boolean): void => {
      toggle.setAttribute('aria-checked', String(enabled));
      toggle.dataset.enabled = enabled ? 'true' : 'false';
      toggle.style.background = enabled
        ? 'linear-gradient(120deg, var(--theme-accent-soft), var(--theme-accent))'
        : 'var(--theme-border-glass)';
      toggle.style.boxShadow = enabled ? '0 20px 35px var(--theme-glow)' : 'inset 0 0 0 1px var(--theme-border-glass)';
      toggleCircle.style.background = enabled ? 'var(--theme-surface)' : 'var(--theme-surface-muted)';
      toggleCircle.style.transform = enabled ? 'translateX(28px)' : 'translateX(2px)';
    };

    const handleToggle = (): void => {
      isEnabled = !isEnabled;
      updateVisual(isEnabled);
      onChange(isEnabled);
    };

    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleToggle();
      }
    });

    updateVisual(isEnabled);
    container.appendChild(toggle);
    return container;
  }

  private createSlider(label: string, initialValue: number, onChange: (value: number) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'space-y-2 p-3 theme-card-muted rounded-lg';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const labelElement = document.createElement('span');
    labelElement.className = 'font-medium theme-text';
    labelElement.textContent = label;

    const valueElement = document.createElement('span');
    valueElement.className = 'text-sm theme-text-secondary';
    valueElement.textContent = `${Math.round(initialValue * 100)}%`;

    header.appendChild(labelElement);
    header.appendChild(valueElement);
    container.appendChild(header);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = `${Math.round(initialValue * 100)}`;
    slider.className = 'w-full';
    slider.style.accentColor = 'var(--theme-accent)';
    slider.addEventListener('input', () => {
      const value = Number(slider.value) / 100;
      valueElement.textContent = `${Math.round(value * 100)}%`;
      onChange(value);
    });

    container.appendChild(slider);
    return container;
  }

  /**
   * Clear local data only
   */
  private async clearData(): Promise<void> {
    if (!confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      return;
    }

    try {
      // Clear local state
      stateManager.setState('player', {
        id: 'local-player',
        name: 'Player',
        highScore: 0,
        specialPoints: 500,
        gamesPlayed: 0,
        totalPlayTime: 0,
        themesUnlocked: [ThemeName.CLASSIC],
        selectedTheme: ThemeName.CLASSIC,
        inventory: createEmptyInventory(),
      });

      // Navigate to menu
      Router.getInstance().navigate(ROUTES.MENU);

      alert('Local data cleared successfully.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    }
  }

  /**
   * Simple logout - clear local state and navigate to menu
   */
  private async logout(): Promise<void> {
    if (!confirm('Are you sure you want to log out?')) {
      return;
    }

    try {
      // Clear local state
      stateManager.setState('player', {
        id: 'local-player',
        name: 'Player',
        highScore: 0,
        specialPoints: 500,
        gamesPlayed: 0,
        totalPlayTime: 0,
        themesUnlocked: [ThemeName.CLASSIC],
        selectedTheme: ThemeName.CLASSIC,
        inventory: createEmptyInventory(),
      });
      
      // Navigate to menu (no login page anymore)
      Router.getInstance().navigate(ROUTES.MENU);
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out. Please try again.');
    }
  }

  public onMount(): void {
    this.element.classList.add('animate-fade-in');
  }

  public onUnmount(): void {
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
  }
}

