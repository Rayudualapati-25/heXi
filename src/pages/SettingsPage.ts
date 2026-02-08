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
import { ThemeName, themes, availableThemes } from '@config/themes';
import { authService } from '@services/AuthService';
import { appwriteClient } from '@network/AppwriteClient';

export class SettingsPage extends BasePage {
  private buttons: Button[] = [];

  public render(): void {
    this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 md:p-8 overflow-y-auto';

    // Back button
    const backBtn = this.createBackButton('← Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backBtn.style.marginBottom = '1.5rem';
    this.element.appendChild(backBtn);

    // Content container
    const container = document.createElement('div');
    container.className = 'max-w-3xl mx-auto py-4 sm:py-8 space-y-8 sm:space-y-12';

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
    this.element.appendChild(container);
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

    const currentTheme = stateManager.getState().player.selectedTheme;

    availableThemes.forEach((themeName) => {
      const theme = themes[themeName];
      const themeCard = this.createThemeCard(theme, currentTheme === themeName);
      themesGrid.appendChild(themeCard);
    });

    card.appendChild(themesGrid);
    return card.element;
  }

  /**
   * Create theme card
   */
  private createThemeCard(theme: typeof themes[ThemeName], isSelected: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = `
      p-4 rounded-lg border-2 cursor-pointer
      transition-all duration-200
      hover:scale-105 hover:shadow-lg
      ${isSelected ? 'border-black ring-2 ring-black scale-105' : 'border-gray-300'}
    `.trim().replace(/\s+/g, ' ');

    // Theme name
    const name = document.createElement('div');
    name.className = 'font-bold text-center mb-3';
    name.textContent = theme.name;
    card.appendChild(name);

    // Color preview
    const colorPreview = document.createElement('div');
    colorPreview.className = 'flex gap-1 justify-center mb-2';
    
    theme.colors.blocks.forEach((color) => {
      const colorDot = document.createElement('div');
      colorDot.className = 'w-6 h-6 rounded-full border border-gray-300';
      colorDot.style.backgroundColor = color;
      colorPreview.appendChild(colorDot);
    });
    
    card.appendChild(colorPreview);

    // Description
    const description = document.createElement('div');
    description.className = 'text-xs text-gray-600 text-center';
    description.textContent = theme.description;
    card.appendChild(description);

    // Selected indicator
    if (isSelected) {
      const indicator = document.createElement('div');
      indicator.className = 'mt-2 text-center text-sm font-bold';
      indicator.textContent = '✓';
      card.appendChild(indicator);
    }

    // Click handler
    card.addEventListener('click', () => this.selectTheme(theme.id));

    return card;
  }

  /**
   * Select theme
   */
  private selectTheme(themeName: ThemeName): void {
    stateManager.updatePlayer({ selectedTheme: themeName });
    this.render(); // Re-render to show selection
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

    // Sound Effects Toggle
    const sfxToggle = this.createToggle('Sound Effects', !state.ui.isMuted, (enabled) => {
      console.log('Sound effects:', enabled);
      stateManager.updateUI({ isMuted: !enabled });
    });
    audioControls.appendChild(sfxToggle);

    // Music Toggle
    const musicToggle = this.createToggle('Background Music', false, (enabled) => {
      console.log('Music:', enabled);
    });
    audioControls.appendChild(musicToggle);

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
    nameDisplay.className = 'p-3 bg-gray-100 rounded-lg';
    nameDisplay.innerHTML = `
      <div class="text-sm text-gray-600">Player Name</div>
      <div class="text-lg font-bold">${state.player.name}</div>
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
    container.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';

    const labelElement = document.createElement('span');
    labelElement.className = 'font-medium';
    labelElement.textContent = label;
    container.appendChild(labelElement);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `
      relative inline-flex h-6 w-11 items-center rounded-full
      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
      ${initialValue ? 'bg-black' : 'bg-gray-300'}
    `.trim().replace(/\s+/g, ' ');

    const toggleCircle = document.createElement('span');
    toggleCircle.className = `
      inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
      ${initialValue ? 'translate-x-6' : 'translate-x-1'}
    `.trim().replace(/\s+/g, ' ');
    toggle.appendChild(toggleCircle);

    let isEnabled = initialValue;
    toggle.addEventListener('click', () => {
      isEnabled = !isEnabled;
      toggle.className = toggle.className.replace(
        isEnabled ? 'bg-gray-300' : 'bg-black',
        isEnabled ? 'bg-black' : 'bg-gray-300'
      );
      toggleCircle.className = toggleCircle.className.replace(
        isEnabled ? 'translate-x-1' : 'translate-x-6',
        isEnabled ? 'translate-x-6' : 'translate-x-1'
      );
      onChange(isEnabled);
    });

    container.appendChild(toggle);
    return container;
  }

  /**
   * Clear local data (deletes user account and all data)
   */
  private async clearData(): Promise<void> {
    if (!confirm('Are you sure you want to delete your account and all data? This cannot be undone.')) {
      return;
    }

    try {
      const state = stateManager.getState();
      const userId = state.player.id;

      // Delete user from database
      await appwriteClient.deleteUser(userId);

      // Logout and clear session
      await authService.logout();

      // Navigate to login
      Router.getInstance().navigate(ROUTES.ENTRY);

      alert('Account deleted successfully.');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    }
  }

  /**
   * Logout user
   */
  private async logout(): Promise<void> {
    if (!confirm('Are you sure you want to log out?')) {
      return;
    }

    try {
      await authService.logout();
      Router.getInstance().navigate(ROUTES.ENTRY);
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
