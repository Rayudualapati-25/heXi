/**
 * MultiplayerPage - Group management (create/join/list)
 */

import { BasePage } from './BasePage';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Modal } from '@ui/components/Modal';
import { Toast } from '@ui/components/Toast';
import { GroupLeaderboardModal } from '@ui/modals/GroupLeaderboardModal';
import { LobbyModal } from '@ui/modals/LobbyModal';
import { NameEntryModal } from '@ui/modals/NameEntryModal';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { GroupManager } from '@network/GroupManager';
import type { Group, LobbyPlayer } from '../types/game';

type View = 'list' | 'create' | 'join';

export class MultiplayerPage extends BasePage {
  private groupManager = new GroupManager();
  private currentView: View = 'list';
  private groups: Group[] = [];
  private contentContainer!: HTMLDivElement;
  private buttons: Button[] = [];
  private lobbyModal: LobbyModal | null = null;
  private currentLobbyGroup: Group | null = null;
  private previousPlayerCount: number = 0;

  public render(): void {
    const container = this.initPageLayout({
      align: 'top',
      maxWidthClass: 'max-w-4xl',
      paddingClass: 'px-2 sm:px-4 py-8 sm:py-12',
    });

    const header = this.createHeader('MULTIPLAYER GROUPS', 'Create or join groups to compare scores');
    container.appendChild(header);

    const tabRow = document.createElement('div');
    tabRow.className = 'grid grid-cols-3 gap-2';

    tabRow.appendChild(this.createTabButton('My Groups', 'list'));
    tabRow.appendChild(this.createTabButton('Create', 'create'));
    tabRow.appendChild(this.createTabButton('Join', 'join'));

    container.appendChild(tabRow);

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'space-y-4';
    container.appendChild(this.contentContainer);

    const backButton = this.createBackButton('<- Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backButton.style.marginTop = '1rem';
    container.appendChild(backButton);

    this.renderView();
    this.mount();
  }

  private createTabButton(label: string, view: View): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = this.getTabClass(this.currentView === view);

    button.addEventListener('click', () => {
      this.currentView = view;
      this.renderView();
    });

    return button;
  }

  private getTabClass(isActive: boolean): string {
    const baseClass = 'theme-tab text-sm font-semibold';
    return isActive ? `${baseClass} theme-tab-active` : baseClass;
  }

  private renderView(): void {
    this.contentContainer.innerHTML = '';
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];

    if (this.currentView === 'list') {
      this.renderGroupList();
    } else if (this.currentView === 'create') {
      this.renderCreateGroup();
    } else {
      this.renderJoinGroup();
    }
  }

  private renderGroupList(): void {
    const state = stateManager.getState();
    if (!state.player.id) {
      this.showInlineMessage('Please log in to manage groups.');
      return;
    }

    const loading = document.createElement('div');
    loading.className = 'text-sm theme-inline-message';
    loading.textContent = 'Loading groups...';
    this.contentContainer.appendChild(loading);

    void this.loadGroups();
  }

  private async loadGroups(): Promise<void> {
    const state = stateManager.getState();
    if (!state.player.id) return;

    this.groups = await this.groupManager.getUserGroups(state.player.id);
    this.contentContainer.innerHTML = '';

    if (this.groups.length === 0) {
      this.showInlineMessage('No groups yet. Create or join one to get started.');
      return;
    }

    this.groups.forEach((group) => {
      const card = document.createElement('div');
      card.className = 'theme-card rounded-2xl p-4 space-y-3';

      const header = document.createElement('div');
      header.className = 'flex items-center justify-between';

      const title = document.createElement('div');
      title.className = 'text-lg font-bold theme-text';
      title.textContent = group.groupName;
      header.appendChild(title);

      const code = document.createElement('div');
      code.className = 'text-xs font-semibold theme-text-secondary tracking-[0.6em] uppercase';
      code.textContent = group.roomCode;
      header.appendChild(code);

      card.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'text-xs theme-text-secondary';
      meta.textContent = `Members: ${group.memberCount}`;
      card.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'flex flex-wrap gap-2';

      const leaderboardBtn = new Button('View Leaderboard', {
        variant: 'outline',
        size: 'small',
        onClick: () => this.showGroupLeaderboard(group),
      });
      this.buttons.push(leaderboardBtn);
      actions.appendChild(leaderboardBtn.element);

      const playBtn = new Button('Play In Group', {
        variant: 'primary',
        size: 'small',
        onClick: () => this.playGroup(group),
      });
      this.buttons.push(playBtn);
      actions.appendChild(playBtn.element);

      const leaveBtn = new Button('Leave', {
        variant: 'ghost',
        size: 'small',
        onClick: () => this.confirmLeaveGroup(group),
      });
      this.buttons.push(leaveBtn);
      actions.appendChild(leaveBtn.element);

      card.appendChild(actions);
      this.contentContainer.appendChild(card);
    });
  }

  private renderCreateGroup(): void {
    const state = stateManager.getState();
    if (!state.player.id) {
      this.showInlineMessage('Please log in to create groups.');
      return;
    }

    const nameInput = new Input({
      label: 'Group Name',
      placeholder: 'Enter group name',
      required: true,
      maxLength: 50,
    });

    this.contentContainer.appendChild(nameInput.container);

    const playerNameInput = new Input({
      label: 'Your Display Name',
      placeholder: 'Enter your display name',
      required: true,
      maxLength: 20,
      minLength: 2,
      value: state.player.name,
    });

    this.contentContainer.appendChild(playerNameInput.container);

    const createBtn = new Button('Create Group', {
      variant: 'primary',
      size: 'medium',
      fullWidth: true,
      onClick: async () => {
        if (!nameInput.validate() || !playerNameInput.validate()) return;
        const groupName = nameInput.getValue();
        const displayName = playerNameInput.getValue();

        try {
          const group = await this.groupManager.createGroup(state.player.id, groupName, displayName);
          this.showMessage('Group Created', `Room code: ${group.roomCode}`);
          this.currentView = 'list';
          this.renderView();
        } catch (error: any) {
          this.showMessage('Error', error.message || 'Failed to create group');
        }
      },
    });

    this.buttons.push(createBtn);
    this.contentContainer.appendChild(createBtn.element);
  }

  private renderJoinGroup(): void {
    const state = stateManager.getState();
    if (!state.player.id) {
      this.showInlineMessage('Please log in to join groups.');
      return;
    }

    const codeInput = new Input({
      label: 'Room Code',
      placeholder: 'Enter room code',
      required: true,
      maxLength: 6,
      onChange: (value) => {
        codeInput.setValue(value.toUpperCase());
      },
    });

    this.contentContainer.appendChild(codeInput.container);

    const joinBtn = new Button('Join Group', {
      variant: 'primary',
      size: 'medium',
      fullWidth: true,
      onClick: async () => {
        if (!codeInput.validate()) return;
        const code = codeInput.getValue().toUpperCase();

        // Show name entry modal before joining
        this.showNameEntryModal(code);
      },
    });

    this.buttons.push(joinBtn);
    this.contentContainer.appendChild(joinBtn.element);
  }

  private showNameEntryModal(roomCode: string): void {
    const state = stateManager.getState();
    if (!state.player.id) return;

    const nameEntryModal = new NameEntryModal({
      roomCode,
      defaultName: state.player.name,
      onSubmit: async (displayName: string) => {
        try {
          // Join the group with the custom display name
          const group = await this.groupManager.joinGroup(state.player.id, displayName, roomCode);
          this.showMessage('Joined Group', `You joined ${group.groupName} as ${displayName}`);
          this.currentView = 'list';
          this.renderView();
        } catch (error: any) {
          this.showMessage('Error', error.message || 'Failed to join group');
        }
      },
      onCancel: () => {
        // User cancelled - do nothing
      },
    });

    nameEntryModal.open();
  }

  private async showGroupLeaderboard(group: Group): Promise<void> {
    const scores = await this.groupManager.getGroupLeaderboard(group.$id);

    const modal = new GroupLeaderboardModal({
      group,
      scores,
      currentUserId: stateManager.getState().player.id,
      onLeave: () => this.confirmLeaveGroup(group),
    });

    modal.open();
  }


  private playGroup(group: Group): void {
    const state = stateManager.getState();
    if (!state.player.id) return;
    
    this.currentLobbyGroup = group;
    
    // Determine if creating or joining lobby
    const isHost = group.createdBy === state.player.id;
    
    if (isHost) {
      this.createLobby(group);
    } else {
      this.joinLobby(group);
    }
  }
  
  private async createLobby(group: Group): Promise<void> {
    const state = stateManager.getState();
    if (!state.player.id) return;
    
    try {
      // Setup lobby
      await this.groupManager.createLobby(
        state.player.id,
        state.player.name,
        group.$id,
        group.roomCode,
        (players: LobbyPlayer[]) => this.handleLobbyUpdate(players),
        () => this.handleMatchStart()
      );
      
      // Initialize player count tracker
      this.previousPlayerCount = 1;
      
      // Update state
      stateManager.updateMultiplayer({
        roomId: group.$id,
        roomCode: group.roomCode,
        players: this.groupManager.getLobbyPlayers(),
        isInLobby: true,
        localPlayerReady: false,
      });
      
      // Open lobby modal
      this.openLobbyModal(group, true);
      
    } catch (error: any) {
      this.showMessage('Error', error.message || 'Failed to create lobby');
    }
  }
  
  private async joinLobby(group: Group): Promise<void> {
    const state = stateManager.getState();
    if (!state.player.id) return;
    
    try {
      // Join lobby
      await this.groupManager.joinLobby(
        state.player.id,
        state.player.name,
        group.$id,
        (players: LobbyPlayer[]) => this.handleLobbyUpdate(players),
        () => this.handleMatchStart()
      );
      
      // Initialize player count tracker
      const lobbyPlayers = this.groupManager.getLobbyPlayers();
      this.previousPlayerCount = lobbyPlayers.filter(p => !p.hasLeft).length;
      
      // Update state
      stateManager.updateMultiplayer({
        roomId: group.$id,
        roomCode: group.roomCode,
        players: lobbyPlayers,
        isInLobby: true,
        localPlayerReady: false,
      });
      
      // Open lobby modal
      this.openLobbyModal(group, false);
      
    } catch (error: any) {
      this.showMessage('Error', error.message || 'Failed to join lobby');
    }
  }
  
  private openLobbyModal(group: Group, isHost: boolean): void {
    const state = stateManager.getState();
    
    this.lobbyModal = new LobbyModal({
      roomCode: group.roomCode,
      players: state.multiplayer.players,
      isHost,
      localPlayerReady: state.multiplayer.localPlayerReady,
      onToggleReady: () => this.toggleReady(),
      onStartMatch: () => this.startMatch(),
      onLeaveLobby: () => this.leaveLobby(),
    });
    
    this.lobbyModal.open();
  }
  
  private toggleReady(): void {
    this.groupManager.toggleReady();
    
    const currentReady = stateManager.getState().multiplayer.localPlayerReady;
    stateManager.updateMultiplayer({ localPlayerReady: !currentReady });
    
    // Update lobby modal
    if (this.lobbyModal) {
      const players = this.groupManager.getLobbyPlayers();
      this.lobbyModal.update(players, !currentReady);
    }
  }
  
  private startMatch(): void {
    this.groupManager.startMatch();
    // handleMatchStart will be called via callback
  }
  
  private handleLobbyUpdate(players: LobbyPlayer[]): void {
    // Detect new players joining
    const activePlayers = players.filter(p => !p.hasLeft);
    if (activePlayers.length > this.previousPlayerCount && this.previousPlayerCount > 0) {
      const newPlayers = activePlayers.filter(p => {
        const state = stateManager.getState();
        return !state.multiplayer.players.some(existing => existing.userId === p.userId);
      });
      
      newPlayers.forEach(player => {
        Toast.success(`${player.userName} joined the lobby`, 3000);
      });
    }
    
    // Detect players leaving
    const state = stateManager.getState();
    const leftPlayers = state.multiplayer.players.filter(existing => 
      !activePlayers.some(p => p.userId === existing.userId)
    );
    
    leftPlayers.forEach(player => {
      Toast.warning(`${player.userName} left the lobby`, 3000);
    });
    
    this.previousPlayerCount = activePlayers.length;
    
    // Update state
    stateManager.updateMultiplayer({ players });
    
    // Update lobby modal
    if (this.lobbyModal) {
      const localReady = stateManager.getState().multiplayer.localPlayerReady;
      this.lobbyModal.update(players, localReady);
    }
  }
  
  private handleMatchStart(): void {
    console.log('[MultiplayerPage] Match starting!');
    
    // Close lobby modal
    if (this.lobbyModal) {
      this.lobbyModal.close();
      this.lobbyModal = null;
    }
    
    // Set game mode and navigate to difficulty selection
    const groupId = stateManager.getState().multiplayer.roomId;
    stateManager.updateUI({ 
      currentGroupId: groupId ?? undefined, 
      currentGameMode: 'multiplayerRace', 
      multiplayerMode: 'race' 
    });
    
    Router.getInstance().navigate(ROUTES.DIFFICULTY);
  }
  
  private leaveLobby(): void {
    this.groupManager.leaveLobby();
    
    // Reset state
    stateManager.updateMultiplayer({
      roomId: null,
      roomCode: null,
      players: [],
      isInLobby: false,
      localPlayerReady: false,
    });
    
    // Close modal
    if (this.lobbyModal) {
      this.lobbyModal.close();
      this.lobbyModal = null;
    }
    
    this.currentLobbyGroup = null;
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
    text.className = 'text-sm theme-text-secondary';
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
        this.renderView();
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

  private showInlineMessage(message: string): void {
    const text = document.createElement('div');
    text.className = 'text-sm theme-inline-message';
    text.textContent = message;
    this.contentContainer.appendChild(text);
  }

  private showMessage(title: string, message: string): void {
    const modal = new Modal({
      title,
      closeOnBackdrop: true,
      closeOnEscape: true,
    });

    const content = document.createElement('div');
    content.className = 'space-y-4';

    const text = document.createElement('p');
    text.className = 'text-sm theme-text-secondary';
    text.textContent = message;
    content.appendChild(text);

    const closeBtn = new Button('OK', {
      variant: 'primary',
      size: 'small',
      fullWidth: true,
      onClick: () => modal.close(),
    });
    this.buttons.push(closeBtn);
    content.appendChild(closeBtn.element);

    modal.setContent(content);
    modal.open();
  }

  public onUnmount(): void {
    // Cleanup lobby if active
    if (this.lobbyModal) {
      this.groupManager.leaveLobby();
      this.lobbyModal.close();
      this.lobbyModal = null;
    }
    
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];
  }
}

