/**
 * Daily Challenge Modal - Show challenge preview and completion rewards
 */

import { Modal } from '@ui/components/Modal';
import { Button } from '@ui/components/Button';
import type { DailyChallenge } from '@modes/DailyChallengeMode';

export class DailyChallengeModal {
  private modal: Modal | null = null;

  /**
   * Show challenge preview modal
   */
  public showPreview(challenge: DailyChallenge, streak: number): void {
    this.modal = new Modal({
      title: '📅 TODAY\'S CHALLENGE',
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: 'lg',
    });

    const content = document.createElement('div');
    content.className = 'space-y-5 py-4';

    // Challenge icon and name
    const header = document.createElement('div');
    header.className = 'text-center mb-4';
    header.innerHTML = `
      <div class="text-6xl mb-3">${challenge.icon}</div>
      <h2 class="text-3xl font-bold text-black mb-2">${challenge.name}</h2>
      <p class="text-gray-600 text-sm font-medium">${challenge.description}</p>
    `;
    content.appendChild(header);

    // Difficulty indicator (based on reward)
    const difficulty = document.createElement('div');
    difficulty.className = 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-3 text-center';
    difficulty.innerHTML = `
      <div class="text-xs font-semibold text-blue-700 uppercase tracking-wider">Difficulty</div>
      <div class="text-lg font-bold text-blue-900 mt-1">
        ${challenge.baseReward <= 250 ? '⭐ Easy' : challenge.baseReward <= 500 ? '⭐⭐ Medium' : '⭐⭐⭐ Hard'}
      </div>
    `;
    content.appendChild(difficulty);

    // Rewards section
    const rewardsSection = document.createElement('div');
    rewardsSection.className = 'space-y-2';

    // Base reward
    const baseReward = document.createElement('div');
    baseReward.className = 'flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200';
    baseReward.innerHTML = `
      <span class="text-sm font-semibold text-gray-700">Base Reward</span>
      <span class="text-lg font-bold text-gray-900">${challenge.baseReward} 💎</span>
    `;
    rewardsSection.appendChild(baseReward);

    // Streak bonus (if applicable)
    if (streak >= 7) {
      const bonusReward = document.createElement('div');
      bonusReward.className = 'flex justify-between items-center bg-yellow-50 rounded-lg p-3 border-2 border-yellow-300 animate-pulse';
      bonusReward.innerHTML = `
        <span class="text-sm font-semibold text-yellow-700">🔥 Streak Bonus (${streak} days)</span>
        <span class="text-lg font-bold text-yellow-900">+${challenge.streakBonus} 💎</span>
      `;
      rewardsSection.appendChild(bonusReward);
    }

    // Total reward
    const totalReward = document.createElement('div');
    totalReward.className = 'flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-400';
    totalReward.innerHTML = `
      <span class="text-sm font-bold text-green-700 uppercase tracking-wide">Total Reward</span>
      <span class="text-2xl font-black text-green-900">${challenge.totalReward} 💎</span>
    `;
    rewardsSection.appendChild(totalReward);

    content.appendChild(rewardsSection);

    // Current streak display
    if (streak > 0) {
      const streakDisplay = document.createElement('div');
      streakDisplay.className = 'text-center bg-orange-50 rounded-lg p-3 border border-orange-200';
      streakDisplay.innerHTML = `
        <div class="text-xs font-semibold text-orange-700 uppercase">Current Streak</div>
        <div class="text-3xl font-black text-orange-600 mt-1">🔥 ${streak}</div>
        <div class="text-xs text-orange-600 mt-1">Keep it going!</div>
      `;
      content.appendChild(streakDisplay);
    }

    // Motivational message
    const motivationMessages = [
      'Make every second count!',
      'Challenge yourself to greatness!',
      'You got this! 💪',
      'Time to shine! ✨',
      'Today\'s your day! ⭐',
    ];
    const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

    const motivation = document.createElement('div');
    motivation.className = 'text-center italic text-gray-500 text-sm pt-2';
    motivation.textContent = randomMessage;
    content.appendChild(motivation);

    // Start button
    const startBtn = new Button('Start Challenge', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.modal?.close(),
    });
    content.appendChild(startBtn.element);

    this.modal.setContent(content);
    this.modal.open();
  }

  /**
   * Show completion reward modal (displayed at game over)
   */
  public showCompletion(challenge: DailyChallenge, streak: number, score: number): void {
    this.modal = new Modal({
      title: '',
      closeOnBackdrop: false,
      closeOnEscape: false,
      maxWidth: 'lg',
    });

    const content = document.createElement('div');
    content.className = 'space-y-6 py-6 text-center';

    // Celebration animation
    const celebration = document.createElement('div');
    celebration.className = 'text-7xl mb-4 animate-bounce';
    celebration.textContent = '🎉';
    content.appendChild(celebration);

    // Title
    const title = document.createElement('h2');
    title.className = 'text-3xl font-black text-black mb-2';
    title.textContent = 'CHALLENGE COMPLETE!';
    content.appendChild(title);

    // Challenge info
    const info = document.createElement('div');
    info.className = 'bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-2';
    info.innerHTML = `
      <div class="text-4xl mb-2">${challenge.icon}</div>
      <div class="text-xl font-bold text-blue-900">${challenge.name}</div>
      <div class="text-sm text-blue-700 mt-1">Score: ${score.toLocaleString()}</div>
    `;
    content.appendChild(info);

    // Reward breakdown
    const rewardBreakdown = document.createElement('div');
    rewardBreakdown.className = 'space-y-2 mb-4';

    const baseRewardEl = document.createElement('div');
    baseRewardEl.className = 'flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200';
    baseRewardEl.innerHTML = `
      <span class="font-semibold text-gray-700">Base Reward</span>
      <span class="font-bold text-gray-900">+${challenge.baseReward} 💎</span>
    `;
    rewardBreakdown.appendChild(baseRewardEl);

    if (challenge.streakBonus > 0) {
      const bonusEl = document.createElement('div');
      bonusEl.className = 'flex justify-between items-center bg-yellow-50 rounded-lg p-3 border-2 border-yellow-300 animate-pulse';
      bonusEl.innerHTML = `
        <span class="font-semibold text-yellow-700">🔥 Streak Bonus (${streak} days)</span>
        <span class="font-bold text-yellow-900">+${challenge.streakBonus} 💎</span>
      `;
      rewardBreakdown.appendChild(bonusEl);
    }

    // Total reward (animated)
    const totalRewardEl = document.createElement('div');
    totalRewardEl.className = 'flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-400 scale-105';
    totalRewardEl.innerHTML = `
      <span class="text-sm font-bold text-green-700 uppercase tracking-wide">Reward Earned</span>
      <span class="text-3xl font-black text-green-900 animate-pulse">+${challenge.totalReward} 💎</span>
    `;
    rewardBreakdown.appendChild(totalRewardEl);

    content.appendChild(rewardBreakdown);

    // New streak display if streak updated
    if (streak >= 7) {
      const streakAlert = document.createElement('div');
      streakAlert.className = 'bg-orange-100 rounded-lg p-4 border-2 border-orange-400';
      streakAlert.innerHTML = `
        <div class="text-2xl mb-2">🔥 AMAZING!</div>
        <div class="text-lg font-bold text-orange-900 mb-1">${streak}-Day Streak!</div>
        <div class="text-sm text-orange-700">You're on fire! Keep the streak alive!</div>
      `;
      content.appendChild(streakAlert);
    }

    // Continue button
    const continueBtn = new Button('Continue', {
      variant: 'primary',
      size: 'large',
      fullWidth: true,
      onClick: () => this.modal?.close(),
    });
    content.appendChild(continueBtn.element);

    this.modal.setContent(content);
    this.modal.open();
  }

  /**
   * Close modal if open
   */
  public close(): void {
    if (this.modal) {
      this.modal.close();
      this.modal = null;
    }
  }
}
