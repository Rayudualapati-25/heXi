/**
 * Theme configuration for Hextris
 * Defines visual themes with different color schemes
 * NO PURPLE THEME - replaced with modern alternatives
 */

import type { HexColor } from './colors';

export enum ThemeName {
  CLASSIC = 'classic',
  NEON = 'neon',
  DARK = 'dark',
  LIGHT = 'light',
}

export interface Theme {
  id: ThemeName;
  name: string;
  description: string;
  colors: {
    background: HexColor;
    hex: HexColor;
    hexStroke: HexColor;
    blocks: [HexColor, HexColor, HexColor, HexColor]; // 4 block colors
    text: HexColor;
    textSecondary: HexColor;
  };
}

export const themes: Record<ThemeName, Theme> = {
  [ThemeName.CLASSIC]: {
    id: ThemeName.CLASSIC,
    name: 'Classic',
    description: 'Original Hextris color scheme',
    colors: {
      background: '#ecf0f1',
      hex: '#2c3e50',
      hexStroke: '#34495e',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'],
      text: '#2c3e50',
      textSecondary: '#7f8c8d',
    },
  },
  [ThemeName.NEON]: {
    id: ThemeName.NEON,
    name: 'Neon',
    description: 'Vibrant neon colors on dark background',
    colors: {
      background: '#0a0a0a',
      hex: '#1a1a1a',
      hexStroke: '#2a2a2a',
      blocks: ['#ff0080', '#00ff9f', '#00b8ff', '#ffea00'],
      text: '#ffffff',
      textSecondary: '#888888',
    },
  },
  [ThemeName.DARK]: {
    id: ThemeName.DARK,
    name: 'Dark',
    description: 'Sleek dark mode with muted tones',
    colors: {
      background: '#1a1a1a',
      hex: '#2d2d2d',
      hexStroke: '#3d3d3d',
      blocks: ['#c0392b', '#d35400', '#2980b9', '#27ae60'],
      text: '#ecf0f1',
      textSecondary: '#95a5a6',
    },
  },
  [ThemeName.LIGHT]: {
    id: ThemeName.LIGHT,
    name: 'Light',
    description: 'Clean light theme with soft pastels',
    colors: {
      background: '#ffffff',
      hex: '#f0f0f0',
      hexStroke: '#d0d0d0',
      blocks: ['#e57373', '#ffb74d', '#64b5f6', '#81c784'],
      text: '#212121',
      textSecondary: '#757575',
    },
  },
};

export const themePrices: Record<ThemeName, number> = {
  [ThemeName.CLASSIC]: 0,
  [ThemeName.NEON]: 800,
  [ThemeName.DARK]: 600,
  [ThemeName.LIGHT]: 400,
};

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Default theme
 */
export const DEFAULT_THEME = ThemeName.CLASSIC;

/**
 * All available theme names
 */
export const availableThemes = Object.values(ThemeName);

