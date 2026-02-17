/**
 * GroupLeaderboardModal
 * Displays group leaderboard with actions.
 */

import { Modal } from '@ui/components/Modal';
import { Button } from '@ui/components/Button';
import type { Group, GroupScore } from '@/types/game';

export interface GroupLeaderboardModalOptions {
  group: Group;
  scores: GroupScore[];
  currentUserId?: string;
  onLeave?: () => void;
}

export class GroupLeaderboardModal {
  private modal: Modal;
  private options: GroupLeaderboardModalOptions;

  constructor(options: GroupLeaderboardModalOptions) {
    this.options = options;
    this.modal = new Modal({
      title: 'Group Leaderboard',
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: 'lg',
    });
  }

  public open(): void {
    const content = document.createElement('div');
    content.className = 'space-y-4 theme-text';

    const header = document.createElement('div');
    header.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2';

    const groupInfo = document.createElement('div');
    groupInfo.className = 'text-sm theme-text-secondary';
    groupInfo.textContent = `${this.options.group.groupName} (${this.options.group.roomCode})`;

    const actions = document.createElement('div');
    actions.className = 'flex gap-2 flex-wrap';

    const copyBtn = new Button('Copy Room Code', {
      variant: 'outline',
      size: 'small',
      onClick: () => this.copyRoomCode(),
    });

    const leaveBtn = new Button('Leave Group', {
      variant: 'ghost',
      size: 'small',
      onClick: () => this.options.onLeave?.(),
    });

    actions.appendChild(copyBtn.element);
    actions.appendChild(leaveBtn.element);

    header.appendChild(groupInfo);
    header.appendChild(actions);

    content.appendChild(header);
    content.appendChild(this.renderScores());

    this.modal.setContent(content);
    this.modal.open();
  }

  private renderScores(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'divide-y theme-border rounded-2xl overflow-hidden';

    if (this.options.scores.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'p-6 text-center text-sm theme-text-secondary';
      empty.textContent = 'No scores yet.';
      list.appendChild(empty);
      return list;
    }

    this.options.scores.forEach((score, index) => {
      const row = document.createElement('div');
      const isCurrent = this.options.currentUserId
        ? score.userId === this.options.currentUserId
        : false;

      // Apply opacity for players who left
      const leftClass = score.hasLeft ? 'opacity-60' : '';
      row.className = `flex items-center justify-between p-3 ${isCurrent ? 'theme-card' : 'theme-card-muted'} ${leftClass}`;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-3';

      const rank = document.createElement('div');
      rank.className = 'text-xs font-semibold theme-text-secondary w-8 text-center';
      rank.textContent = this.formatRank(index);
      left.appendChild(rank);

      const name = document.createElement('div');
      name.className = 'text-sm font-semibold theme-text flex items-center gap-2';
      
      const nameText = document.createElement('span');
      nameText.textContent = score.userName;
      name.appendChild(nameText);
      
      // Add "LEFT" badge if player left
      if (score.hasLeft) {
        const leftBadge = document.createElement('span');
        leftBadge.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400';
        leftBadge.textContent = 'LEFT';
        name.appendChild(leftBadge);
      }
      
      left.appendChild(name);

      const value = document.createElement('div');
      value.className = 'text-sm font-bold theme-text';
      value.textContent = score.bestScore.toLocaleString();

      row.appendChild(left);
      row.appendChild(value);
      list.appendChild(row);
    });

    return list;
  }

  private formatRank(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return String(index + 1);
  }

  private copyRoomCode(): void {
    const code = this.options.group.roomCode;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  }
}
