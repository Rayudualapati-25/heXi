/**
 * MultiplayerPage - Room-based multiplayer
 * 
 * Flow:
 * 1. Create Room — enter your name → get room code to share
 * 2. Join Room — enter room code + your name → join lobby
 * 3. Lobby — see all players, ready up, host starts match
 * 4. Game — real-time score sync, quit detection, live leaderboard
 */

import { BasePage } from './BasePage';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Modal } from '@ui/components/Modal';
import { LobbyModal } from '@ui/modals/LobbyModal';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { RoomManager } from '@network/RoomManager';
import type { RoomPlayer, LobbyPlayer } from '../types/game';

type View = 'home' | 'create' | 'join';

export class MultiplayerPage extends BasePage {
  private roomManager = new RoomManager();
  private currentView: View = 'home';
  private contentContainer!: HTMLDivElement;
  private buttons: Button[] = [];
  private lobbyModal: LobbyModal | null = null;

  public render(): void {
    const container = this.initPageLayout({
      align: 'top',
      maxWidthClass: 'max-w-lg',
      paddingClass: 'px-4 sm:px-6 py-8 sm:py-12',
    });

    const header = this.createHeader('MULTIPLAYER', 'Create or join a room to play with friends');
    container.appendChild(header);

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'space-y-4 mt-6';
    container.appendChild(this.contentContainer);

    const backButton = this.createBackButton('\u2190 Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backButton.style.marginTop = '2rem';
    container.appendChild(backButton);

    this.renderView();
    this.mount();
  }

  private renderView(): void {
    this.contentContainer.innerHTML = '';
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];

    switch (this.currentView) {
      case 'home':
        this.renderHome();
        break;
      case 'create':
        this.renderCreateRoom();
        break;
      case 'join':
        this.renderJoinRoom();
        break;
    }
  }

  // --- HOME VIEW ---

  private renderHome(): void {
    const createBtn = new Button('\uD83C\uDFAE  Create Room', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => {
        this.currentView = 'create';
        this.renderView();
      },
    });
    this.buttons.push(createBtn);

    const createDesc = document.createElement('p');
    createDesc.className = 'text-xs theme-text-secondary text-center -mt-2 mb-4';
    createDesc.textContent = 'Create a room and share the code with friends';

    const joinBtn = new Button('\uD83D\uDD17  Join Room', {
      variant: 'outline',
      size: 'large',
      fullWidth: true,
      onClick: () => {
        this.currentView = 'join';
        this.renderView();
      },
    });
    this.buttons.push(joinBtn);

    const joinDesc = document.createElement('p');
    joinDesc.className = 'text-xs theme-text-secondary text-center -mt-2';
    joinDesc.textContent = "Enter a room code to join a friend's game";

    this.contentContainer.appendChild(createBtn.element);
    this.contentContainer.appendChild(createDesc);
    this.contentContainer.appendChild(joinBtn.element);
    this.contentContainer.appendChild(joinDesc);

    const howItWorks = document.createElement('div');
    howItWorks.className = 'mt-8 theme-card rounded-2xl p-5 space-y-3';
    howItWorks.innerHTML = `
      <h3 class="text-sm font-bold theme-text uppercase tracking-wider">How It Works</h3>
      <div class="space-y-2 text-xs theme-text-secondary">
        <div class="flex items-start gap-2">
          <span class="text-cyan-400 font-bold">1.</span>
          <span>Create a room and share the <strong class="theme-text">6-character code</strong> with friends</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-cyan-400 font-bold">2.</span>
          <span>Each player enters the code and their <strong class="theme-text">display name</strong></span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-cyan-400 font-bold">3.</span>
          <span>Everyone readies up, then the host starts the match</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-cyan-400 font-bold">4.</span>
          <span>Play simultaneously with a <strong class="theme-text">live leaderboard</strong> \u2014 if someone quits, they show as "LEFT"</span>
        </div>
      </div>
    `;
    this.contentContainer.appendChild(howItWorks);
  }

  // --- CREATE ROOM VIEW ---

  private renderCreateRoom(): void {
    const backBtn = document.createElement('button');
    backBtn.className = 'text-xs theme-text-secondary hover:theme-text mb-2 cursor-pointer';
    backBtn.textContent = '\u2190 Back to menu';
    backBtn.addEventListener('click', () => {
      this.currentView = 'home';
      this.renderView();
    });
    this.contentContainer.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'text-xl font-bold theme-text mb-4';
    title.textContent = 'Create a Room';
    this.contentContainer.appendChild(title);

    const nameInput = new Input({
      label: 'Your Display Name',
      placeholder: 'Enter your name',
      required: true,
      maxLength: 20,
    });
    this.contentContainer.appendChild(nameInput.container);

    const errorEl = document.createElement('div');
    errorEl.className = 'text-red-400 text-sm hidden';
    this.contentContainer.appendChild(errorEl);

    const createBtn = new Button('Create Room', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: async () => {
        if (!nameInput.validate()) return;
        const name = nameInput.getValue().trim();
        if (!name) return;

        errorEl.classList.add('hidden');
        createBtn.element.textContent = 'Creating...';
        createBtn.element.setAttribute('disabled', 'true');

        try {
          const { room, roomCode } = await this.roomManager.createRoom(name);

          stateManager.updateMultiplayer({
            roomId: room.$id,
            roomCode,
            localPlayerId: this.roomManager.getLocalId(),
            localPlayerName: name,
            isInLobby: true,
            isHost: true,
          });
          stateManager.updatePlayer({ name, id: this.roomManager.getLocalId()! });

          this.openLobby(roomCode, true);
        } catch (err: any) {
          const msg = err.message || String(err);
          if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
            errorEl.textContent = 'Cannot reach Appwrite. Add "localhost" as a Web platform in your Appwrite Console → Settings → Platforms.';
          } else if (msg.includes('collection') || msg.includes('not found') || msg.includes('404')) {
            errorEl.textContent = 'Database collections not found. Run: npx tsx scripts/setup-collections.ts';
          } else {
            errorEl.textContent = msg;
          }
          errorEl.classList.remove('hidden');
          createBtn.element.textContent = 'Create Room';
          createBtn.element.removeAttribute('disabled');
        }
      },
    });
    this.buttons.push(createBtn);
    this.contentContainer.appendChild(createBtn.element);
  }

  // --- JOIN ROOM VIEW ---

  private renderJoinRoom(): void {
    const backBtn = document.createElement('button');
    backBtn.className = 'text-xs theme-text-secondary hover:theme-text mb-2 cursor-pointer';
    backBtn.textContent = '\u2190 Back to menu';
    backBtn.addEventListener('click', () => {
      this.currentView = 'home';
      this.renderView();
    });
    this.contentContainer.appendChild(backBtn);

    const title = document.createElement('h2');
    title.className = 'text-xl font-bold theme-text mb-4';
    title.textContent = 'Join a Room';
    this.contentContainer.appendChild(title);

    const codeInput = new Input({
      label: 'Room Code',
      placeholder: 'e.g. ABC123',
      required: true,
      maxLength: 6,
      onChange: (value) => {
        codeInput.setValue(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      },
    });
    this.contentContainer.appendChild(codeInput.container);

    const nameInput = new Input({
      label: 'Your Display Name',
      placeholder: 'Enter your name',
      required: true,
      maxLength: 20,
    });
    this.contentContainer.appendChild(nameInput.container);

    const errorEl = document.createElement('div');
    errorEl.className = 'text-red-400 text-sm hidden';
    this.contentContainer.appendChild(errorEl);

    const joinBtn = new Button('Join Room', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: async () => {
        if (!codeInput.validate() || !nameInput.validate()) return;
        const code = codeInput.getValue().toUpperCase().trim();
        const name = nameInput.getValue().trim();
        if (!code || !name) return;

        errorEl.classList.add('hidden');
        joinBtn.element.textContent = 'Joining...';
        joinBtn.element.setAttribute('disabled', 'true');

        try {
          const { room } = await this.roomManager.joinRoom(code, name);

          stateManager.updateMultiplayer({
            roomId: room.$id,
            roomCode: code,
            localPlayerId: this.roomManager.getLocalId(),
            localPlayerName: name,
            isInLobby: true,
            isHost: false,
          });
          stateManager.updatePlayer({ name, id: this.roomManager.getLocalId()! });

          this.openLobby(code, false);
        } catch (err: any) {
          const msg = err.message || String(err);
          if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
            errorEl.textContent = 'Cannot reach Appwrite. Add your hostname as a Web platform in Appwrite Console → Settings → Platforms.';
          } else {
            errorEl.textContent = msg;
          }
          errorEl.classList.remove('hidden');
          joinBtn.element.textContent = 'Join Room';
          joinBtn.element.removeAttribute('disabled');
        }
      },
    });
    this.buttons.push(joinBtn);
    this.contentContainer.appendChild(joinBtn.element);
  }

  // --- LOBBY ---

  private openLobby(roomCode: string, isHost: boolean): void {
    const initialPlayers: LobbyPlayer[] = [{
      userId: this.roomManager.getLocalId()!,
      userName: stateManager.getState().multiplayer.localPlayerName || 'Player',
      isReady: isHost,
      isHost,
    }];

    this.lobbyModal = new LobbyModal({
      roomCode,
      players: initialPlayers,
      isHost,
      localPlayerReady: isHost,
      onToggleReady: () => this.handleToggleReady(),
      onStartMatch: () => this.handleStartMatch(),
      onLeaveLobby: () => this.handleLeaveLobby(),
    });

    this.lobbyModal.open();

    this.roomManager.subscribeLobby(
      (roomPlayers: RoomPlayer[]) => this.handleLobbyUpdate(roomPlayers),
      () => this.handleMatchStarted(),
    );
  }

  private async handleToggleReady(): Promise<void> {
    try {
      const isReady = await this.roomManager.toggleReady();
      stateManager.updateMultiplayer({ localPlayerReady: isReady });

      const roomId = this.roomManager.getRoomId();
      if (roomId) {
        const players = await this.roomManager.fetchRoomPlayers(roomId);
        const lobbyPlayers = this.roomManager.toLobbyPlayers(players);
        if (this.lobbyModal) {
          this.lobbyModal.update(lobbyPlayers, isReady);
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle ready:', err);
    }
  }

  private async handleStartMatch(): Promise<void> {
    try {
      await this.roomManager.startMatch();
    } catch (err: any) {
      this.showMessage('Cannot Start', err.message || 'Failed to start match');
    }
  }

  private handleLobbyUpdate(roomPlayers: RoomPlayer[]): void {
    const lobbyPlayers = this.roomManager.toLobbyPlayers(roomPlayers);
    const localReady = stateManager.getState().multiplayer.localPlayerReady;

    stateManager.updateMultiplayer({ players: lobbyPlayers });

    if (this.lobbyModal) {
      this.lobbyModal.update(lobbyPlayers, localReady);
    }
  }

  private handleMatchStarted(): void {
    if (this.lobbyModal) {
      this.lobbyModal.close();
      this.lobbyModal = null;
    }

    stateManager.updateUI({
      currentGroupId: this.roomManager.getRoomId() ?? undefined,
      currentGameMode: 'multiplayerRace',
      multiplayerMode: 'race',
    });

    // Store roomManager reference for GamePage via window 
    (window as any).__hexi_roomManager = this.roomManager;

    Router.getInstance().navigate(ROUTES.DIFFICULTY);
  }

  private async handleLeaveLobby(): Promise<void> {
    await this.roomManager.leaveRoom();

    stateManager.updateMultiplayer({
      roomId: null,
      roomCode: null,
      players: [],
      isInLobby: false,
      localPlayerReady: false,
      localPlayerId: null,
      localPlayerName: null,
    });

    if (this.lobbyModal) {
      this.lobbyModal.close();
      this.lobbyModal = null;
    }

    this.currentView = 'home';
    this.renderView();
  }

  // --- UTILITIES ---

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

  public getRoomManager(): RoomManager {
    return this.roomManager;
  }

  public onUnmount(): void {
    const state = stateManager.getState();
    if (state.ui.currentGameMode?.startsWith('multiplayer')) {
      if (this.lobbyModal) {
        this.lobbyModal.close();
        this.lobbyModal = null;
      }
    } else {
      if (this.lobbyModal) {
        void this.roomManager.leaveRoom();
        this.lobbyModal.close();
        this.lobbyModal = null;
      }
    }

    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];
  }
}
