/**
 * Shop modal
 * Shows purchasable items and handles purchases.
 */

import { Button } from '@ui/components/Button';
import { Modal } from '@ui/components/Modal';
import { createEmptyInventory, getAllShopItems, ShopItemId } from '@config/shopItems';
import { stateManager } from '@core/StateManager';
import { MAX_LIVES } from '@core/constants';
import { SpecialPointsSystem } from '@systems/SpecialPointsSystem';
import type { InventoryUI } from '@ui/hud/InventoryUI';
import { appwriteClient } from '@network/AppwriteClient';
import { ThemeName, themes, themePrices } from '@config/themes';

export interface ShopModalOptions {
  mode: 'menu' | 'game';
  inventoryUI?: InventoryUI;
  onClose?: () => void;
}

export class ShopModal {
  private modal: Modal;
  private options: ShopModalOptions;
  private pointsSystem = new SpecialPointsSystem();
  private content: HTMLDivElement;
  private pointsLabel: HTMLSpanElement;
  private messageLabel: HTMLParagraphElement;
  private itemsContainer: HTMLDivElement;
  private themesContainer: HTMLDivElement | null = null;

  constructor(options: ShopModalOptions) {
    this.options = options;
    this.modal = new Modal({
      title: 'SHOP',
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: 'lg',
      onClose: () => this.options.onClose?.(),
    });

    this.content = document.createElement('div');
    this.content.className = 'space-y-4';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm text-gray-600';
    subtitle.textContent = this.options.mode === 'game'
      ? 'Buy power-ups and boosts during the run.'
      : 'Stock up before you start a run.';

    const pointsWrap = document.createElement('div');
    pointsWrap.className = 'text-sm font-semibold text-gray-900';
    pointsWrap.innerHTML = '💎 Diamonds: ';

    this.pointsLabel = document.createElement('span');
    this.pointsLabel.className = 'font-bold text-black';
    this.pointsLabel.textContent = this.getPoints().toString();
    pointsWrap.appendChild(this.pointsLabel);

    header.appendChild(subtitle);
    header.appendChild(pointsWrap);

    this.messageLabel = document.createElement('p');
    this.messageLabel.className = 'text-xs text-gray-600 min-h-[1rem]';

    this.itemsContainer = document.createElement('div');
    this.itemsContainer.className = 'grid gap-3 sm:grid-cols-2';

    this.content.appendChild(header);
    this.content.appendChild(this.messageLabel);
    this.content.appendChild(this.itemsContainer);

    if (this.options.mode === 'menu') {
      const themesHeader = document.createElement('div');
      themesHeader.className = 'pt-2 border-t border-gray-200';

      const themesTitle = document.createElement('h3');
      themesTitle.className = 'text-sm font-semibold text-gray-900';
      themesTitle.textContent = 'Themes';
      themesHeader.appendChild(themesTitle);

      this.themesContainer = document.createElement('div');
      this.themesContainer.className = 'grid gap-3 sm:grid-cols-2';

      this.content.appendChild(themesHeader);
      this.content.appendChild(this.themesContainer);
    }

    this.modal.setContent(this.content);
    this.renderItems();
    this.renderThemes();
  }

  public open(): void {
    this.modal.open();
  }

  public close(): void {
    this.modal.close();
  }

  private renderItems(): void {
    this.itemsContainer.innerHTML = '';

    const items = getAllShopItems();
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'border border-gray-200 rounded-xl p-4 space-y-3 bg-white';

      const titleRow = document.createElement('div');
      titleRow.className = 'flex items-center justify-between';

      const title = document.createElement('div');
      title.className = 'text-base font-bold text-gray-900';
      title.textContent = item.name;

      const icon = this.createItemIcon(item.id);

      titleRow.appendChild(title);
      titleRow.appendChild(icon);

      const description = document.createElement('p');
      description.className = 'text-xs text-gray-600';
      description.textContent = item.description;

      const effect = document.createElement('p');
      effect.className = 'text-xs text-gray-500';
      effect.textContent = item.effect;

      const footer = document.createElement('div');
      footer.className = 'flex items-center justify-between gap-2';

      const cost = document.createElement('span');
      cost.className = 'text-sm font-semibold text-gray-900';
      cost.textContent = `💎 ${item.cost}`;

      const availability = this.getAvailability(item.id);
      const button = new Button(availability.buttonLabel, {
        variant: availability.disabled ? 'outline' : 'primary',
        size: 'small',
        disabled: availability.disabled,
        onClick: () => this.handlePurchase(item.id),
      });

      footer.appendChild(cost);
      footer.appendChild(button.element);

      if (availability.reason) {
        const reason = document.createElement('p');
        reason.className = 'text-[11px] text-gray-500';
        reason.textContent = availability.reason;
        card.appendChild(reason);
      }

      card.appendChild(titleRow);
      card.appendChild(description);
      card.appendChild(effect);
      card.appendChild(footer);

      this.itemsContainer.appendChild(card);
    });
  }

  private getAvailability(itemId: ShopItemId): {
    disabled: boolean;
    reason?: string;
    buttonLabel: string;
  } {
    const points = this.getPoints();

    const inventoryCount = this.getInventoryCount(itemId);
    const maxQuantity = this.getMaxQuantity(itemId);
    if (maxQuantity !== null && inventoryCount >= maxQuantity) {
      return { disabled: true, reason: 'Inventory maxed.', buttonLabel: 'MAX' };
    }

    if (this.isPowerUp(itemId) && this.options.mode === 'game' && !this.options.inventoryUI) {
      return { disabled: true, reason: 'Inventory unavailable.', buttonLabel: 'UNAVAILABLE' };
    }

    if (points < this.getItemCost(itemId)) {
      return { disabled: true, reason: 'Not enough diamonds.', buttonLabel: 'NEED MORE' };
    }

    return { disabled: false, buttonLabel: 'BUY' };
  }

  private handlePurchase(itemId: ShopItemId): void {
    const cost = this.getItemCost(itemId);
    if (!this.pointsSystem.spendPoints(cost)) {
      this.setMessage('Not enough diamonds.', true);
      this.refresh();
      return;
    }

    this.addToInventory(itemId, 1);

    if (itemId === ShopItemId.EXTRA_LIFE) {
      if (this.options.mode === 'game') {
        const used = this.tryUseExtraLife();
        this.setMessage(used ? 'Extra life used!' : 'Extra life added to inventory.', false);
      } else {
        this.setMessage('Extra life added to inventory.', false);
      }
      this.refresh();
      return;
    }

    if (this.isPowerUp(itemId) && this.options.mode === 'game') {
      if (this.options.inventoryUI?.isFull()) {
        this.setMessage('Added to inventory for later.', false);
      } else {
        this.options.inventoryUI?.addPowerUp(itemId);
        this.setMessage('Power-up added to inventory.', false);
      }
      this.refresh();
      return;
    }

    this.setMessage('Item added to inventory.', false);
    this.refresh();
  }

  private refresh(): void {
    this.pointsLabel.textContent = this.getPoints().toString();
    this.renderItems();
    this.renderThemes();
  }

  private setMessage(message: string, isError: boolean): void {
    this.messageLabel.textContent = message;
    this.messageLabel.className = isError
      ? 'text-xs text-red-600 min-h-[1rem]'
      : 'text-xs text-green-600 min-h-[1rem]';
  }

  private getPoints(): number {
    return stateManager.getState().player.specialPoints;
  }

  private isPowerUp(itemId: ShopItemId): boolean {
    return itemId === ShopItemId.HAMMER || itemId === ShopItemId.SLOWMO || itemId === ShopItemId.SHIELD;
  }

  private getItemCost(itemId: ShopItemId): number {
    const item = getAllShopItems().find((entry) => entry.id === itemId);
    return item ? item.cost : 0;
  }

  private createItemIcon(itemId: ShopItemId): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg';

    const iconMap: Record<ShopItemId, { src?: string; emoji: string; label: string }> = {
      [ShopItemId.CONTINUE]: { src: '/images/icons/replay.svg', emoji: '🔁', label: 'Continue' },
      [ShopItemId.EXTRA_LIFE]: { src: '/images/icons/extra-life.svg', emoji: '❤️', label: 'Extra Life' },
      [ShopItemId.HAMMER]: { src: '/images/icons/hammer-drop.svg', emoji: '🛠️', label: 'Hammer' },
      [ShopItemId.SLOWMO]: { emoji: '⏱️', label: 'Slow Motion' },
      [ShopItemId.SHIELD]: { src: '/images/icons/shield-power-up.svg', emoji: '🛡️', label: 'Shield' },
    };

    const asset = iconMap[itemId];
    if (asset.src) {
      const img = document.createElement('img');
      img.src = asset.src;
      img.alt = asset.label;
      img.className = 'w-6 h-6';
      wrapper.appendChild(img);
    } else {
      wrapper.textContent = asset.emoji;
    }

    return wrapper;
  }

  private renderThemes(): void {
    const themesContainer = this.themesContainer;
    if (!themesContainer) {
      return;
    }

    themesContainer.innerHTML = '';

    Object.values(themes).forEach((theme) => {
      const card = document.createElement('div');
      card.className = 'border border-gray-200 rounded-xl p-4 space-y-3 bg-white';

      const titleRow = document.createElement('div');
      titleRow.className = 'flex items-center justify-between';

      const title = document.createElement('div');
      title.className = 'text-base font-bold text-gray-900';
      title.textContent = theme.name;

      const swatch = document.createElement('div');
      swatch.className = 'flex gap-1';
      theme.colors.blocks.slice(0, 4).forEach((color) => {
        const dot = document.createElement('span');
        dot.className = 'w-3 h-3 rounded-full border border-gray-200';
        dot.style.backgroundColor = color;
        swatch.appendChild(dot);
      });

      titleRow.appendChild(title);
      titleRow.appendChild(swatch);

      const description = document.createElement('p');
      description.className = 'text-xs text-gray-600';
      description.textContent = theme.description;

      const footer = document.createElement('div');
      footer.className = 'flex items-center justify-between gap-2';

      const cost = document.createElement('span');
      cost.className = 'text-sm font-semibold text-gray-900';
      cost.textContent = `💎 ${this.getThemeCost(theme.id)}`;

      const action = this.getThemeAction(theme.id);
      const button = new Button(action.label, {
        variant: action.disabled ? 'outline' : 'primary',
        size: 'small',
        disabled: action.disabled,
        onClick: () => this.handleThemeAction(theme.id),
      });

      footer.appendChild(cost);
      footer.appendChild(button.element);

      card.appendChild(titleRow);
      card.appendChild(description);
      card.appendChild(footer);

      if (action.reason) {
        const reason = document.createElement('p');
        reason.className = 'text-[11px] text-gray-500';
        reason.textContent = action.reason;
        card.appendChild(reason);
      }

      themesContainer.appendChild(card);
    });
  }

  private getThemeCost(themeId: ThemeName): number {
    return themePrices[themeId] ?? 0;
  }

  private getThemeAction(themeId: ThemeName): { label: string; disabled: boolean; reason?: string } {
    const player = stateManager.getState().player;
    const isUnlocked = player.themesUnlocked.includes(themeId);
    const isSelected = player.selectedTheme === themeId;

    if (isSelected) {
      return { label: 'EQUIPPED', disabled: true };
    }

    if (isUnlocked) {
      return { label: 'EQUIP', disabled: false };
    }

    const cost = this.getThemeCost(themeId);
    if (player.specialPoints < cost) {
      return { label: 'LOCKED', disabled: true, reason: 'Not enough diamonds.' };
    }

    return { label: 'UNLOCK', disabled: false };
  }

  private async handleThemeAction(themeId: ThemeName): Promise<void> {
    const player = stateManager.getState().player;
    const isUnlocked = player.themesUnlocked.includes(themeId);
    const isSelected = player.selectedTheme === themeId;

    if (isSelected) {
      return;
    }

    if (!isUnlocked) {
      const cost = this.getThemeCost(themeId);
      if (!this.pointsSystem.spendPoints(cost)) {
        this.setMessage('Not enough diamonds.', true);
        this.refresh();
        return;
      }

      const updatedThemes = [...player.themesUnlocked, themeId];
      stateManager.updatePlayer({ themesUnlocked: updatedThemes, selectedTheme: themeId });

      if (player.id) {
        void appwriteClient.updateThemes(player.id, updatedThemes, themeId);
      }

      this.setMessage('Theme unlocked and equipped.', false);
      this.refresh();
      return;
    }

    stateManager.updatePlayer({ selectedTheme: themeId });
    if (player.id) {
      void appwriteClient.updateSelectedTheme(player.id, themeId);
    }

    this.setMessage('Theme equipped.', false);
    this.refresh();
  }

  private getInventoryCount(itemId: ShopItemId): number {
    const inventory = stateManager.getState().player.inventory ?? createEmptyInventory();
    return inventory[itemId] ?? 0;
  }

  private getMaxQuantity(itemId: ShopItemId): number | null {
    const item = getAllShopItems().find((entry) => entry.id === itemId);
    return item?.maxQuantity ?? null;
  }

  private addToInventory(itemId: ShopItemId, delta: number): void {
    const state = stateManager.getState();
    const currentInventory = state.player.inventory ?? createEmptyInventory();
    const currentCount = currentInventory[itemId] ?? 0;
    const nextCount = Math.max(0, currentCount + delta);
    const nextInventory = {
      ...currentInventory,
      [itemId]: nextCount,
    };

    stateManager.updatePlayer({ inventory: nextInventory });
    if (state.player.id) {
      void appwriteClient.updateInventory(state.player.id, nextInventory);
    }
  }

  private tryUseExtraLife(): boolean {
    const state = stateManager.getState();
    if (state.game.lives >= MAX_LIVES) {
      return false;
    }

    const inventory = state.player.inventory ?? createEmptyInventory();
    if ((inventory[ShopItemId.EXTRA_LIFE] ?? 0) <= 0) {
      return false;
    }

    const nextLives = Math.min(MAX_LIVES, state.game.lives + 1);
    const nextInventory = {
      ...inventory,
      [ShopItemId.EXTRA_LIFE]: Math.max(0, (inventory[ShopItemId.EXTRA_LIFE] ?? 0) - 1),
    };

    stateManager.updateGame({ lives: nextLives });
    stateManager.updatePlayer({ inventory: nextInventory });

    if (state.player.id) {
      void appwriteClient.updateInventory(state.player.id, nextInventory);
    }

    return true;
  }
}
