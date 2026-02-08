/**
 * LeaderboardModal - Displays global and timer attack leaderboards
 */

import { Modal } from '@ui/components/Modal';
import type { LeaderboardEntry } from '@network/AppwriteClient';

export interface LeaderboardModalOptions {
  globalEntries: LeaderboardEntry[];
  timerEntries?: LeaderboardEntry[];
  currentPlayerName?: string;
}

export class LeaderboardModal {
  private modal: Modal;
  private options: LeaderboardModalOptions;
  private activeTab: 'global' | 'timer' = 'global';

  constructor(options: LeaderboardModalOptions) {
    this.options = options;
    this.modal = new Modal({
      title: 'Leaderboard',
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: 'lg',
    });
  }

  public open(): void {
    const content = document.createElement('div');
    content.className = 'space-y-4';

    const tabs = this.createTabs();
    content.appendChild(tabs);

    const listContainer = document.createElement('div');
    listContainer.className = 'max-h-96 overflow-y-auto';
    listContainer.appendChild(this.renderList());
    content.appendChild(listContainer);

    this.modal.setContent(content);
    this.modal.open();
  }

  private createTabs(): HTMLElement {
    const tabRow = document.createElement('div');
    tabRow.className = 'flex gap-2';

    const globalBtn = this.createTabButton('Global', 'global');
    const timerBtn = this.createTabButton('Timer Attack', 'timer');

    tabRow.appendChild(globalBtn);
    tabRow.appendChild(timerBtn);

    return tabRow;
  }

  private createTabButton(label: string, tab: 'global' | 'timer'): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = this.getTabClass(tab === this.activeTab);

    btn.addEventListener('click', () => {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
      this.updateContent();
    });

    return btn;
  }

  private updateContent(): void {
    const body = this.modal.element.querySelector('.modal-container .p-6');
    if (!body) return;

    const tabButtons = Array.from(body.querySelectorAll('button')) as HTMLButtonElement[];
    tabButtons.forEach((btn) => {
      const isActive = btn.textContent === (this.activeTab === 'global' ? 'Global' : 'Timer Attack');
      btn.className = this.getTabClass(isActive);
    });

    const listContainer = body.querySelector('.max-h-96');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    listContainer.appendChild(this.renderList());
  }

  private renderList(): HTMLElement {
    const entries = this.activeTab === 'global'
      ? this.options.globalEntries
      : this.options.timerEntries || [];

    const list = document.createElement('div');
    list.className = 'divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden';

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'p-6 text-center text-sm text-gray-500';
      empty.textContent = 'No scores yet. Be the first to play.';
      list.appendChild(empty);
      return list;
    }

    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      const isCurrent = this.options.currentPlayerName
        ? entry.name === this.options.currentPlayerName
        : false;

      row.className = `flex items-center justify-between p-3 ${isCurrent ? 'bg-gray-100' : 'bg-white'}`;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3';

      const rank = document.createElement('div');
      rank.className = 'text-xs font-semibold text-gray-500 w-8 text-center';
      rank.textContent = String(entry.rank || index + 1);
      left.appendChild(rank);

      const name = document.createElement('div');
      name.className = 'text-sm font-semibold text-gray-900';
      name.textContent = entry.name;
      left.appendChild(name);

      const score = document.createElement('div');
      score.className = 'text-sm font-bold text-gray-900';
      score.textContent = entry.score.toLocaleString();

      row.appendChild(left);
      row.appendChild(score);
      list.appendChild(row);
    });

    return list;
  }

  private getTabClass(isActive: boolean): string {
    return isActive
      ? 'flex-1 py-2 px-3 rounded-lg bg-black text-white text-sm font-semibold'
      : 'flex-1 py-2 px-3 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300';
  }
}
