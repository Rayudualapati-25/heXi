/**
 * Main Menu Page - Menu selection screen
 * Shows game mode options and player stats
 */

import { BasePage } from './BasePage';
import { Button } from '@ui/components/Button';
import { Modal } from '@ui/components/Modal';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES, GameStatus } from '@core/constants';
import { appwriteClient } from '@network/AppwriteClient';
import { GroupManager } from '@network/GroupManager';
import { LeaderboardModal } from '@ui/modals/LeaderboardModal';
import { ShopModal } from '@ui/modals/ShopModal';
import { authService } from '@services/AuthService';
import { GroupLeaderboardModal } from '@ui/modals/GroupLeaderboardModal';
import type { Group } from '@/types/game';

export class MenuPage extends BasePage {
  private buttons: Button[] = [];
  private diamondCountEl: HTMLDivElement | null = null;
  private unsubscribeSpecialPoints: (() => void) | null = null;
  private shopModal: ShopModal | null = null;
  private groupManager = new GroupManager();

  public render(): void {
    // Modern black and white background with scroll
    this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 md:p-8 relative overflow-y-auto';

    // Add subtle background elements (grayscale only)
    const bgDecor1 = document.createElement('div');
    bgDecor1.className = 'absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-gray-300/5 rounded-full blur-3xl';
    this.element.appendChild(bgDecor1);

    const bgDecor2 = document.createElement('div');
    bgDecor2.className = 'absolute bottom-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-gray-400/5 rounded-full blur-3xl';
    this.element.appendChild(bgDecor2);

    const container = document.createElement('div');
    container.className = 'w-full max-w-2xl z-10 relative space-y-6 sm:space-y-8';

    // Top section - greeting + title
    const topSection = document.createElement('div');
    topSection.className = 'text-center mb-6 sm:mb-8 animate-fade-in pt-2 sm:pt-4';

    const state = stateManager.getState();
    const greeting = document.createElement('p');
    greeting.className = 'text-gray-600 text-xs font-semibold tracking-widest uppercase mb-2 sm:mb-4 letter-spacing-wide';
    greeting.textContent = `Welcome Back, ${state.player.name}!`;
    topSection.appendChild(greeting);

    const title = document.createElement('h1');
    title.className = 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black mb-2 sm:mb-3 tracking-tighter drop-shadow-lg';
    title.textContent = 'HEXTRIS';
    topSection.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-500 text-sm sm:text-base font-medium';
    subtitle.textContent = 'Master the hexagon. Beat your high score.';
    topSection.appendChild(subtitle);

    container.appendChild(topSection);

    // Stats section - Compressed cards
    const statsSection = document.createElement('div');
    statsSection.className = 'grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-0 sm:px-2 mb-6 sm:mb-8';

    // High Score Card
    const scoreCard = document.createElement('div');
    scoreCard.className = 'bg-white border-2 border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-sm';
    scoreCard.innerHTML = `
      <div class="text-3xl sm:text-4xl font-bold text-black mb-1">${state.player.highScore.toLocaleString()}</div>
      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">High Score</div>
      <div class="text-xs text-gray-500 mt-2">Keep pushing</div>
    `;
    statsSection.appendChild(scoreCard);

    // Diamonds Card
    const diamondsCard = document.createElement('div');
    diamondsCard.className = 'bg-white border-2 border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-sm';
    const diamondsIcon = document.createElement('div');
    diamondsIcon.className = 'text-2xl sm:text-3xl mb-1';
    diamondsIcon.textContent = '💎';

    this.diamondCountEl = document.createElement('div');
    this.diamondCountEl.className = 'text-3xl sm:text-4xl font-bold text-black mb-1';
    this.diamondCountEl.textContent = state.player.specialPoints.toString();

    const diamondsLabel = document.createElement('div');
    diamondsLabel.className = 'text-xs font-semibold text-gray-700 uppercase tracking-wide';
    diamondsLabel.textContent = 'Diamonds';

    const diamondsHint = document.createElement('div');
    diamondsHint.className = 'text-xs text-gray-500 mt-2';
    diamondsHint.textContent = 'Earn by playing';

    diamondsCard.appendChild(diamondsIcon);
    diamondsCard.appendChild(this.diamondCountEl);
    diamondsCard.appendChild(diamondsLabel);
    diamondsCard.appendChild(diamondsHint);
    statsSection.appendChild(diamondsCard);

    // Games Played Card
    const gamesCard = document.createElement('div');
    gamesCard.className = 'bg-white border-2 border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-sm';
    gamesCard.innerHTML = `
      <div class="text-3xl sm:text-4xl font-bold text-black mb-1">${state.player.gamesPlayed}</div>
      <div class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Games Played</div>
      <div class="text-xs text-gray-500 mt-2">On the grind</div>
    `;
    statsSection.appendChild(gamesCard);

    container.appendChild(statsSection);

    // Game modes section
    const modesSection = document.createElement('div');
    modesSection.className = 'mb-6 sm:mb-8';

    const modesTitle = document.createElement('h2');
    modesTitle.className = 'text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4 text-center';
    modesTitle.textContent = 'Choose Your Mode';
    modesSection.appendChild(modesTitle);

    const modesGrid = document.createElement('div');
    modesGrid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 px-0 sm:px-2';

    // Single Player
    const singlePlayerBtn = new Button('SINGLE PLAYER', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => Router.getInstance().navigate(ROUTES.DIFFICULTY),
    });
    this.buttons.push(singlePlayerBtn);
    modesGrid.appendChild(singlePlayerBtn.element);

    // Multiplayer
    const multiplayerBtn = new Button('MULTIPLAYER', {
      variant: 'secondary',
      size: 'large',
      fullWidth: true,
      onClick: () => Router.getInstance().navigate(ROUTES.MULTIPLAYER),
    });
    this.buttons.push(multiplayerBtn);
    modesGrid.appendChild(multiplayerBtn.element);

    // Daily Challenge
    const dailyChallengeBtn = new Button('DAILY CHALLENGE', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.startDailyChallenge(),
    });
    this.buttons.push(dailyChallengeBtn);
    modesGrid.appendChild(dailyChallengeBtn.element);

    // Timer Attack
    const timerAttackBtn = new Button('TIMER ATTACK', {
      variant: 'secondary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.startTimerAttack(),
    });
    this.buttons.push(timerAttackBtn);
    modesGrid.appendChild(timerAttackBtn.element);

    modesSection.appendChild(modesGrid);
    container.appendChild(modesSection);

    // Bottom action buttons
    const actionSection = document.createElement('div');
    actionSection.className = 'flex gap-2 sm:gap-3 justify-center flex-wrap px-0 sm:px-2 pb-2 sm:pb-4';

    const settingsBtn = new Button('Settings', {
      variant: 'outline',
      size: 'medium',
      onClick: () => Router.getInstance().navigate(ROUTES.SETTINGS),
    });
    this.buttons.push(settingsBtn);
    actionSection.appendChild(settingsBtn.element);

    const shopBtn = new Button('🛒 Shop', {
      variant: 'outline',
      size: 'medium',
      onClick: () => this.openShop(),
    });
    this.buttons.push(shopBtn);
    actionSection.appendChild(shopBtn.element);

    const leaderboardBtn = new Button('Leaderboard', {
      variant: 'outline',
      size: 'medium',
      onClick: () => this.showLeaderboard(),
    });
    this.buttons.push(leaderboardBtn);
    actionSection.appendChild(leaderboardBtn.element);

    const logoutBtn = new Button('Logout', {
      variant: 'ghost',
      size: 'small',
      onClick: () => this.logout(),
    });
    this.buttons.push(logoutBtn);
    actionSection.appendChild(logoutBtn.element);

    container.appendChild(actionSection);

    this.element.appendChild(container);
    this.mount();

    this.unsubscribeSpecialPoints = stateManager.subscribe('specialPointsChanged', (points) => {
      if (this.diamondCountEl) {
        this.diamondCountEl.textContent = points.toString();
      }
    });
  }

  /**
   * Show coming soon modal
   */
  /**
   * Logout user
   */
  private async logout(): Promise<void> {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      stateManager.setState('status', GameStatus.ENTRY);
      Router.getInstance().navigate(ROUTES.ENTRY);
    }
  }

  private openShop(): void {
    if (this.shopModal) {
      return;
    }

    stateManager.updateUI({ isShopOpen: true });
    this.shopModal = new ShopModal({
      mode: 'menu',
      onClose: () => {
        this.shopModal = null;
        stateManager.updateUI({ isShopOpen: false });
      },
    });
    this.shopModal.open();
  }

  /**
   * Start daily challenge mode
   */
  private startDailyChallenge(): void {
    stateManager.updateUI({ currentGameMode: 'dailyChallenge', timerDuration: undefined });
    Router.getInstance().navigate(ROUTES.GAME, { mode: 'daily' });
  }

  /**
   * Start timer attack mode
   */
  private async startTimerAttack(): Promise<void> {
    const duration = await this.showTimerDurationSelector();
    if (!duration) return;

    stateManager.updateUI({ currentGameMode: 'timerAttack', timerDuration: duration });
    Router.getInstance().navigate(ROUTES.GAME, { mode: 'timer' });
  }

  private showTimerDurationSelector(): Promise<number | null> {
    return new Promise((resolve) => {
      const modal = new Modal({
        title: 'TIMER ATTACK',
        closeOnBackdrop: true,
        closeOnEscape: true,
      });

      const content = document.createElement('div');
      content.className = 'space-y-3 py-2';

      const subtitle = document.createElement('p');
      subtitle.className = 'text-sm text-gray-600 text-center';
      subtitle.textContent = 'Choose your duration';
      content.appendChild(subtitle);

      const durations = [60, 120, 180];
      durations.forEach((seconds) => {
        const button = new Button(`${seconds} SECONDS`, {
          variant: 'primary',
          size: 'medium',
          fullWidth: true,
          onClick: () => {
            modal.close();
            resolve(seconds);
          },
        });
        content.appendChild(button.element);
      });

      const cancelButton = new Button('Cancel', {
        variant: 'ghost',
        size: 'small',
        fullWidth: true,
        onClick: () => {
          modal.close();
          resolve(null);
        },
      });
      content.appendChild(cancelButton.element);

      modal.setContent(content);
      modal.open();
    });
  }

  public onUnmount(): void {
    if (this.unsubscribeSpecialPoints) {
      this.unsubscribeSpecialPoints();
      this.unsubscribeSpecialPoints = null;
    }

    if (this.shopModal) {
      this.shopModal.close();
      this.shopModal = null;
    }

    // Clean up buttons
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
  }

  /**
   * Show leaderboard modal
   */
  private async showLeaderboard(): Promise<void> {
    const state = stateManager.getState();

    const groupPromise = state.player.id
      ? this.groupManager.getUserGroups(state.player.id)
      : Promise.resolve([]);

    const [globalEntries, timerEntries, groups] = await Promise.all([
      appwriteClient.getGlobalLeaderboard(100),
      appwriteClient.getTimerAttackLeaderboard(100),
      groupPromise,
    ]);

    const modal = new LeaderboardModal({
      globalEntries,
      timerEntries,
      groups,
      currentPlayerName: state.player.name,
      onOpenGroup: (group) => {
        void this.openGroupLeaderboard(group);
      },
    });

    modal.open();
  }

  private async openGroupLeaderboard(group: Group): Promise<void> {
    const scores = await this.groupManager.getGroupLeaderboard(group.$id);

    const modal = new GroupLeaderboardModal({
      group,
      scores,
      currentUserId: stateManager.getState().player.id,
      onLeave: () => this.confirmLeaveGroup(group),
    });

    modal.open();
  }

  private confirmLeaveGroup(group: Group): void {
    const modal = new Modal({
      title: 'Leave Group',
      closeOnBackdrop: true,
      closeOnEscape: true,
    });

    const content = document.createElement('div');
    content.className = 'space-y-4';

    const text = document.createElement('p');
    text.className = 'text-sm text-gray-700';
    text.textContent = `Leave ${group.groupName}?`;
    content.appendChild(text);

    const leaveBtn = new Button('Leave', {
      variant: 'ghost',
      size: 'small',
      fullWidth: true,
      onClick: async () => {
        const state = stateManager.getState();
        if (!state.player.id) return;

        await this.groupManager.leaveGroup(state.player.id, group.$id);
        modal.close();
      },
    });
    this.buttons.push(leaveBtn);
    content.appendChild(leaveBtn.element);

    const cancelBtn = new Button('Cancel', {
      variant: 'outline',
      size: 'small',
      fullWidth: true,
      onClick: () => modal.close(),
    });
    this.buttons.push(cancelBtn);
    content.appendChild(cancelBtn.element);

    modal.setContent(content);
    modal.open();
  }

  public onMount(): void {
    // Add animations
    this.element.classList.add('animate-fade-in');
  }

}

