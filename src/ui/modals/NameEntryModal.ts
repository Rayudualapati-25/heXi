/**
 * NameEntryModal - Modal for entering player display name when joining multiplayer room
 * Allows players to set a custom display name for the game session
 */

import { Modal } from '@ui/components/Modal';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';

interface NameEntryModalOptions {
  roomCode: string;
  defaultName: string;
  onSubmit: (displayName: string) => void;
  onCancel: () => void;
}

export class NameEntryModal {
  private modal: Modal;
  private options: NameEntryModalOptions;
  private nameInput!: Input;
  private submitButton!: Button;
  private cancelButton!: Button;

  constructor(options: NameEntryModalOptions) {
    this.options = options;
    this.modal = new Modal({
      title: 'Enter Player Name',
      closeOnBackdrop: false,
      closeOnEscape: false,
    });
    
    this.render();
  }

  private render(): void {
    const container = document.createElement('div');
    container.className = 'space-y-4';

    // Room code display
    const roomInfo = document.createElement('div');
    roomInfo.className = 'text-center p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20';
    
    const roomLabel = document.createElement('div');
    roomLabel.className = 'text-xs uppercase tracking-widest theme-text-secondary mb-1';
    roomLabel.textContent = 'Joining Room';
    
    const roomCode = document.createElement('div');
    roomCode.className = 'text-xl font-bold tracking-[0.4em] theme-text';
    roomCode.textContent = this.options.roomCode;
    
    roomInfo.appendChild(roomLabel);
    roomInfo.appendChild(roomCode);
    container.appendChild(roomInfo);

    // Instructions
    const instructions = document.createElement('p');
    instructions.className = 'text-sm theme-text-secondary text-center';
    instructions.textContent = 'Enter your display name for this multiplayer session';
    container.appendChild(instructions);

    // Name input
    this.nameInput = new Input({
      label: 'Display Name',
      placeholder: 'Enter your name',
      required: true,
      minLength: 2,
      maxLength: 20,
      value: this.options.defaultName,
    });
    container.appendChild(this.nameInput.container);

    // Actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'flex gap-2 pt-2';

    this.cancelButton = new Button('Cancel', {
      variant: 'ghost',
      size: 'medium',
      fullWidth: true,
      onClick: () => {
        this.options.onCancel();
        this.close();
      },
    });
    actionsContainer.appendChild(this.cancelButton.element);

    this.submitButton = new Button('Join Room', {
      variant: 'primary',
      size: 'medium',
      fullWidth: true,
      onClick: () => {
        if (this.nameInput.validate()) {
          const displayName = this.nameInput.getValue().trim();
          this.options.onSubmit(displayName);
          this.close();
        }
      },
    });
    actionsContainer.appendChild(this.submitButton.element);

    container.appendChild(actionsContainer);

    this.modal.setContent(container);
  }

  public open(): void {
    this.modal.open();
    // Focus on input after modal opens
    setTimeout(() => {
      const inputElement = this.nameInput.container.querySelector('input');
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 100);
  }

  public close(): void {
    this.modal.close();
    
    // Cleanup
    if (this.submitButton) {
      this.submitButton.destroy();
    }
    if (this.cancelButton) {
      this.cancelButton.destroy();
    }
  }
}
