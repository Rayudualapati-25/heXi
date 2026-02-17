/**
 * LobbyModal - Room-based multiplayer lobby
 * Handles player readiness and host match starting
 */

import { Modal } from '@ui/components/Modal';
import { Button } from '@ui/components/Button';
import type { LobbyPlayer } from '../../types/game';

interface LobbyModalOptions {
  roomCode: string;
  players: LobbyPlayer[];
  isHost: boolean;
  localPlayerReady: boolean;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onLeaveLobby: () => void;
}

export class LobbyModal {
  private modal: Modal;
  private options: LobbyModalOptions;
  private contentContainer!: HTMLDivElement;
  private playersContainer!: HTMLDivElement;
  private readyButton!: Button;
  private startButton: Button | null = null;
  private leaveButton!: Button;

  constructor(options: LobbyModalOptions) {
    this.options = options;
    this.modal = new Modal({
      title: `LOBBY - ${options.roomCode}`,
      closeOnBackdrop: false,
      closeOnEscape: false,
    });
    
    this.render();
  }

  private render(): void {
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'space-y-4';

    // Room code display
    const codeSection = document.createElement('div');
    codeSection.className = 'text-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20';
    
    const codeLabel = document.createElement('div');
    codeLabel.className = 'text-xs uppercase tracking-widest theme-text-secondary mb-1';
    codeLabel.textContent = 'Room Code';
    
    const codeValue = document.createElement('div');
    codeValue.className = 'text-2xl font-bold tracking-[0.5em] theme-text';
    codeValue.textContent = this.options.roomCode;
    
    codeSection.appendChild(codeLabel);
    codeSection.appendChild(codeValue);
    this.contentContainer.appendChild(codeSection);

    // Players list
    const playersSection = document.createElement('div');
    playersSection.className = 'space-y-2';
    
    const playersHeader = document.createElement('div');
    playersHeader.className = 'text-sm font-semibold theme-text mb-2';
    playersHeader.textContent = `Players (${this.options.players.length})`;
    playersSection.appendChild(playersHeader);

    this.playersContainer = document.createElement('div');
    this.playersContainer.className = 'space-y-2 max-h-60 overflow-y-auto';
    playersSection.appendChild(this.playersContainer);
    
    this.contentContainer.appendChild(playersSection);
    this.updatePlayersList();

    // Actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'space-y-2 pt-4 border-t border-white/10';

    // Ready button
    this.readyButton = new Button(
      this.options.localPlayerReady ? 'READY ✓' : 'NOT READY',
      {
        variant: this.options.localPlayerReady ? 'primary' : 'outline',
        size: 'medium',
        fullWidth: true,
        onClick: () => {
          this.options.onToggleReady();
        },
      }
    );
    actionsContainer.appendChild(this.readyButton.element);

    // Start button (host only)
    if (this.options.isHost) {
      const allReady = this.options.players.every(p => p.isReady || p.isHost);
      this.startButton = new Button('START MATCH', {
        variant: allReady ? 'primary' : 'ghost',
        size: 'medium',
        fullWidth: true,
        onClick: () => {
          if (allReady) {
            this.options.onStartMatch();
          }
        },
      });
      
      if (!allReady) {
        this.startButton.element.style.opacity = '0.5';
        this.startButton.element.style.cursor = 'not-allowed';
      }
      
      actionsContainer.appendChild(this.startButton.element);
    }

    // Leave button
    this.leaveButton = new Button('LEAVE LOBBY', {
      variant: 'ghost',
      size: 'small',
      fullWidth: true,
      onClick: () => {
        this.options.onLeaveLobby();
      },
    });
    actionsContainer.appendChild(this.leaveButton.element);

    this.contentContainer.appendChild(actionsContainer);
    this.modal.setContent(this.contentContainer);
  }

  private updatePlayersList(): void {
    if (!this.playersContainer) return;
    
    this.playersContainer.innerHTML = '';

    for (const player of this.options.players) {
      const playerCard = document.createElement('div');
      // Apply different styling for players who left
      playerCard.className = player.hasLeft 
        ? 'flex items-center justify-between p-3 theme-card rounded-lg opacity-50'
        : 'flex items-center justify-between p-3 theme-card rounded-lg';

      const playerInfo = document.createElement('div');
      playerInfo.className = 'flex items-center gap-3';

      // Host crown
      if (player.isHost) {
        const crown = document.createElement('span');
        crown.textContent = '👑';
        crown.className = 'text-xl';
        playerInfo.appendChild(crown);
      }

      const playerName = document.createElement('div');
      playerName.className = player.hasLeft 
        ? 'font-semibold theme-text line-through'
        : 'font-semibold theme-text';
      playerName.textContent = player.userName;
      playerInfo.appendChild(playerName);

      const statusBadge = document.createElement('div');
      if (player.hasLeft) {
        statusBadge.className = 'px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400';
        statusBadge.textContent = 'LEFT';
      } else {
        statusBadge.className = `px-2 py-1 rounded text-xs font-bold ${
          player.isReady
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-500/20 text-gray-400'
        }`;
        statusBadge.textContent = player.isReady ? 'READY' : 'NOT READY';
      }

      playerCard.appendChild(playerInfo);
      playerCard.appendChild(statusBadge);
      this.playersContainer.appendChild(playerCard);
    }
  }

  /**
   * Update lobby state
   */
  public update(players: LobbyPlayer[], localPlayerReady: boolean): void {
    this.options.players = players;
    this.options.localPlayerReady = localPlayerReady;
    
    // Update players list
    this.updatePlayersList();
    
    // Update ready button
    this.readyButton.element.textContent = localPlayerReady ? 'READY ✓' : 'NOT READY';
    this.readyButton.element.className = localPlayerReady
      ? 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 focus:ring-cyan-500 w-full'
      : 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base border-2 border-current theme-text hover:bg-white/5 focus:ring-offset-current w-full';
    
    // Update start button (host only)
    if (this.startButton && this.options.isHost) {
      const allReady = players.every(p => p.isReady || p.isHost);
      
      if (allReady) {
        this.startButton.element.style.opacity = '1';
        this.startButton.element.style.cursor = 'pointer';
        this.startButton.element.className = 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-base bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 focus:ring-cyan-500 w-full';
      } else {
        this.startButton.element.style.opacity = '0.5';
        this.startButton.element.style.cursor = 'not-allowed';
        this.startButton.element.className = 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm theme-text-secondary hover:bg-white/5 focus:ring-offset-current w-full';
      }
    }
  }

  public open(): void {
    this.modal.open();
  }

  public close(): void {
    this.modal.close();
    
    // Cleanup buttons
    this.readyButton.destroy();
    if (this.startButton) {
      this.startButton.destroy();
    }
    this.leaveButton.destroy();
  }
}
