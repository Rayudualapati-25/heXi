/**
 * MultiplayerPage - Group management (create/join/list)
 */

import { BasePage } from './BasePage';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Modal } from '@ui/components/Modal';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { GroupManager } from '@network/GroupManager';
import type { Group, GroupScore } from '../types/game';

type View = 'list' | 'create' | 'join';

export class MultiplayerPage extends BasePage {
  private groupManager = new GroupManager();
  private currentView: View = 'list';
  private groups: Group[] = [];
  private contentContainer!: HTMLDivElement;
  private buttons: Button[] = [];

  public render(): void {
    this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 p-6 overflow-y-auto';
    this.element.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'w-full max-w-3xl mx-auto space-y-6';

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

    const backButton = this.createBackButton('← Back', () => {
      Router.getInstance().navigate(ROUTES.MENU);
    });
    backButton.style.marginTop = '1rem';
    container.appendChild(backButton);

    this.element.appendChild(container);
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
    return isActive
      ? 'py-2 px-3 rounded-lg bg-black text-white text-sm font-semibold'
      : 'py-2 px-3 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300';
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
    loading.className = 'text-sm text-gray-500';
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
      card.className = 'border-2 border-gray-200 rounded-xl p-4 bg-white space-y-3';

      const header = document.createElement('div');
      header.className = 'flex items-center justify-between';

      const title = document.createElement('div');
      title.className = 'text-lg font-bold text-black';
      title.textContent = group.groupName;
      header.appendChild(title);

      const code = document.createElement('div');
      code.className = 'text-xs font-semibold text-gray-500 tracking-widest';
      code.textContent = group.roomCode;
      header.appendChild(code);

      card.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'text-xs text-gray-600';
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

    const createBtn = new Button('Create Group', {
      variant: 'primary',
      size: 'medium',
      fullWidth: true,
      onClick: async () => {
        if (!nameInput.validate()) return;
        const name = nameInput.getValue();

        try {
          const group = await this.groupManager.createGroup(state.player.id, name, state.player.name);
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

        try {
          const group = await this.groupManager.joinGroup(state.player.id, state.player.name, code);
          this.showMessage('Joined Group', `You joined ${group.groupName}`);
          this.currentView = 'list';
          this.renderView();
        } catch (error: any) {
          this.showMessage('Error', error.message || 'Failed to join group');
        }
      },
    });

    this.buttons.push(joinBtn);
    this.contentContainer.appendChild(joinBtn.element);
  }

  private async showGroupLeaderboard(group: Group): Promise<void> {
    const scores = await this.groupManager.getGroupLeaderboard(group.$id);

    const modal = new Modal({
      title: `Group Leaderboard`,
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: 'lg',
    });

    const content = document.createElement('div');
    content.className = 'space-y-3';

    const title = document.createElement('div');
    title.className = 'text-sm text-gray-600';
    title.textContent = `${group.groupName} (${group.roomCode})`;
    content.appendChild(title);

    content.appendChild(this.renderScoreList(scores));

    modal.setContent(content);
    modal.open();
  }

  private renderScoreList(scores: GroupScore[]): HTMLElement {
    const list = document.createElement('div');
    list.className = 'divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden';

    if (scores.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'p-6 text-center text-sm text-gray-500';
      empty.textContent = 'No scores yet.';
      list.appendChild(empty);
      return list;
    }

    scores.forEach((score, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-3 bg-white';

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3';

      const rank = document.createElement('div');
      rank.className = 'text-xs font-semibold text-gray-500 w-8 text-center';
      rank.textContent = String(index + 1);
      left.appendChild(rank);

      const name = document.createElement('div');
      name.className = 'text-sm font-semibold text-gray-900';
      name.textContent = score.userName;
      left.appendChild(name);

      const value = document.createElement('div');
      value.className = 'text-sm font-bold text-gray-900';
      value.textContent = score.bestScore.toLocaleString();

      row.appendChild(left);
      row.appendChild(value);
      list.appendChild(row);
    });

    return list;
  }

  private playGroup(group: Group): void {
    stateManager.updateUI({ currentGroupId: group.$id, currentGameMode: 'standard' });
    Router.getInstance().navigate(ROUTES.DIFFICULTY);
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
    text.className = 'text-sm text-gray-500';
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
    text.className = 'text-sm text-gray-700';
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
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];
  }
}
