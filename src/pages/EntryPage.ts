/**
 * Entry page - Name entry screen
 * First screen where players enter their name
 */

import { BasePage } from './BasePage';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Card } from '@ui/components/Card';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';

export class EntryPage extends BasePage {
  private nameInput!: Input;
  private submitButton!: Button;

  public render(): void {
    this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto';

    // Create centered card
    const card = new Card({
      variant: 'glassmorphic',
      padding: 'large',
    });

    // Header
    const header = document.createElement('div');
    header.className = 'text-center mb-6 sm:mb-8';
    
    const title = document.createElement('h1');
    title.className = 'text-4xl sm:text-5xl md:text-6xl font-black text-black mb-2 sm:mb-3 tracking-tight';
    title.textContent = 'HEXTRIS';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 text-sm sm:text-base font-medium';
    subtitle.textContent = 'Enter your name to begin your adventure';
    header.appendChild(subtitle);

    card.appendChild(header);

    // Name input
    this.nameInput = new Input({
      label: 'Player Name',
      placeholder: 'Enter your name',
      required: true,
      maxLength: 20,
      pattern: '[a-zA-Z0-9_-]{2,20}',
      errorMessage: 'Name must be 2-20 characters',
      onEnter: () => this.handleSubmit(),
    });

    card.appendChild(this.nameInput.container);

    // Submit button with more spacing
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-6 sm:mt-8';
    
    this.submitButton = new Button('START GAME', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.handleSubmit(),
    });

    buttonContainer.appendChild(this.submitButton.element);
    card.appendChild(buttonContainer);

    // Add card to page with max-width wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-md';
    wrapper.appendChild(card.element);
    
    this.element.appendChild(wrapper);
    this.mount();
  }

  public onMount(): void {
    // Focus on input
    setTimeout(() => this.nameInput.focus(), 100);
  }

  private async handleSubmit(): Promise<void> {
    if (!this.nameInput.validate()) {
      return;
    }

    const playerName = this.nameInput.getValue();
    
    // Set loading state
    this.submitButton.setLoading(true);
    this.nameInput.setDisabled(true);

    try {
      // TODO: Create/fetch user from Appwrite
      // For now, just update state
      stateManager.updatePlayer({
        name: playerName,
        id: `player_${Date.now()}`, // Temporary ID
      });

      // Navigate to main menu
      setTimeout(() => {
        Router.getInstance().navigate(ROUTES.MENU);
      }, 500);
    } catch (error) {
      console.error('Failed to create user:', error);
      this.submitButton.setLoading(false);
      this.nameInput.setDisabled(false);
      // TODO: Show error message
    }
  }

  public onUnmount(): void {
    this.nameInput.destroy();
    this.submitButton.destroy();
  }
}
