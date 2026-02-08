/**
 * Shop item configuration for Hextris
 * Defines purchasable items and their effects
 */

export enum ShopItemId {
  CONTINUE = 'continue',
  EXTRA_LIFE = 'extraLife',
  HAMMER = 'hammer',
  SLOWMO = 'slowmo',
  SHIELD = 'shield',
}

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  cost: number; // Cost in special points
  icon: string; // Unicode emoji or symbol
  category: 'consumable' | 'powerup';
  maxQuantity?: number; // Max in inventory (undefined = unlimited)
  effect: string; // Description of the effect
}

export const shopItems: Record<ShopItemId, ShopItem> = {
  [ShopItemId.CONTINUE]: {
    id: ShopItemId.CONTINUE,
    name: 'Continue Game',
    description: 'Resume from game over',
    cost: 500,
    icon: '🔄',
    category: 'consumable',
    maxQuantity: 1,
    effect: 'Resurrect with 1 life after game over',
  },
  [ShopItemId.EXTRA_LIFE]: {
    id: ShopItemId.EXTRA_LIFE,
    name: 'Extra Life',
    description: 'Gain one additional life',
    cost: 300,
    icon: '❤️',
    category: 'consumable',
    effect: 'Immediately adds 1 life (max 5)',
  },
  [ShopItemId.HAMMER]: {
    id: ShopItemId.HAMMER,
    name: 'Hammer',
    description: 'Clear blocks in danger zone',
    cost: 200,
    icon: '🔨',
    category: 'powerup',
    maxQuantity: 3,
    effect: 'Removes 3 blocks of the most common color',
  },
  [ShopItemId.SLOWMO]: {
    id: ShopItemId.SLOWMO,
    name: 'Slow Motion',
    description: 'Slow down time temporarily',
    cost: 150,
    icon: '⏱️',
    category: 'powerup',
    maxQuantity: 3,
    effect: 'Reduces game speed by 50% for 10 seconds',
  },
  [ShopItemId.SHIELD]: {
    id: ShopItemId.SHIELD,
    name: 'Shield',
    description: 'Temporary invulnerability',
    cost: 250,
    icon: '🛡️',
    category: 'powerup',
    maxQuantity: 3,
    effect: 'Blocks cannot cause game over for 5 seconds',
  },
};

/**
 * Get shop item by ID
 */
export function getShopItem(id: ShopItemId): ShopItem {
  return shopItems[id];
}

/**
 * Get all shop items
 */
export function getAllShopItems(): ShopItem[] {
  return Object.values(shopItems);
}

/**
 * Get shop items by category
 */
export function getShopItemsByCategory(category: 'consumable' | 'powerup'): ShopItem[] {
  return getAllShopItems().filter(item => item.category === category);
}

/**
 * Check if player can afford an item
 */
export function canAfford(item: ShopItem, playerPoints: number): boolean {
  return playerPoints >= item.cost;
}
