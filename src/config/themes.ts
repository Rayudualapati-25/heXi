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
  WEB_HERO = 'web-hero',
  FASHION_PINK = 'fashion-pink',
  ARENA_NEON = 'arena-neon',
  RETRO_ARCADE = 'retro-arcade',
  STARBLOOM = 'starbloom',
  TURBO_FORGE = 'turbo-forge',
}

export interface ThemeUI {
  surface: HexColor;
  surfaceMuted: HexColor;
  border: HexColor;
  accent: HexColor;
}

export interface Theme {
  id: ThemeName;
  name: string;
  description: string;
  previewShape?: 'circle' | 'diamond' | 'pill' | 'hex' | 'spark';
  colors: {
    background: HexColor;
    hex: HexColor;
    hexStroke: HexColor;
    blocks: [HexColor, HexColor, HexColor, HexColor]; // 4 block colors
    text: HexColor;
    textSecondary: HexColor;
  };
  ui: ThemeUI;
}

export const themes: Record<ThemeName, Theme> = {
  [ThemeName.CLASSIC]: {
    id: ThemeName.CLASSIC,
    name: 'Classic Mono',
    description: 'Classic black and white theme',
    previewShape: 'circle',
    colors: {
      background: '#ffffff',
      hex: '#000000',
      hexStroke: '#333333',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#000000',
      textSecondary: '#666666',
    },
    ui: {
      surface: '#ffffff',
      surfaceMuted: '#f5f5f5',
      border: '#cccccc',
      accent: '#000000',
    },
  },
  [ThemeName.NEON]: {
    id: ThemeName.NEON,
    name: 'Neon Mono',
    description: 'High contrast black and white neon',
    previewShape: 'diamond',
    colors: {
      background: '#000000',
      hex: '#1a1a1a',
      hexStroke: '#ffffff',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#999999',
    },
    ui: {
      surface: '#1a1a1a',
      surfaceMuted: '#0d0d0d',
      border: '#333333',
      accent: '#ffffff',
    },
  },
  [ThemeName.DARK]: {
    id: ThemeName.DARK,
    name: 'Dark Mono',
    description: 'Dark monochromatic theme',
    previewShape: 'hex',
    colors: {
      background: '#1a1a1a',
      hex: '#2d2d2d',
      hexStroke: '#4d4d4d',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#aaaaaa',
    },
    ui: {
      surface: '#2d2d2d',
      surfaceMuted: '#1a1a1a',
      border: '#404040',
      accent: '#ffffff',
    },
  },
  [ThemeName.LIGHT]: {
    id: ThemeName.LIGHT,
    name: 'Light Mono',
    description: 'Clean light monochromatic theme',
    previewShape: 'pill',
    colors: {
      background: '#ffffff',
      hex: '#f0f0f0',
      hexStroke: '#d0d0d0',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#000000',
      textSecondary: '#666666',
    },
    ui: {
      surface: '#ffffff',
      surfaceMuted: '#f9f9f9',
      border: '#e0e0e0',
      accent: '#000000',
    },
  },
  [ThemeName.WEB_HERO]: {
    id: ThemeName.WEB_HERO,
    name: 'Hero Mono',
    description: 'Bold high contrast monochrome',
    previewShape: 'diamond',
    colors: {
      background: '#000000',
      hex: '#1a1a1a',
      hexStroke: '#ffffff',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#cccccc',
    },
    ui: {
      surface: '#0d0d0d',
      surfaceMuted: '#060606',
      border: '#333333',
      accent: '#ffffff',
    },
  },
  [ThemeName.FASHION_PINK]: {
    id: ThemeName.FASHION_PINK,
    name: 'Fashion Mono',
    description: 'Elegant grayscale fashion theme',
    previewShape: 'spark',
    colors: {
      background: '#f8f8f8',
      hex: '#e8e8e8',
      hexStroke: '#666666',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#000000',
      textSecondary: '#666666',
    },
    ui: {
      surface: '#ffffff',
      surfaceMuted: '#f0f0f0',
      border: '#cccccc',
      accent: '#333333',
    },
  },
  [ThemeName.ARENA_NEON]: {
    id: ThemeName.ARENA_NEON,
    name: 'Arena Mono',
    description: 'Competitive high contrast grayscale',
    previewShape: 'hex',
    colors: {
      background: '#000000',
      hex: '#0a0a0a',
      hexStroke: '#ffffff',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#999999',
    },
    ui: {
      surface: '#0a0a0a',
      surfaceMuted: '#050505',
      border: '#1a1a1a',
      accent: '#ffffff',
    },
  },
  [ThemeName.RETRO_ARCADE]: {
    id: ThemeName.RETRO_ARCADE,
    name: 'Retro Mono',
    description: 'Vintage arcade monochrome style',
    previewShape: 'diamond',
    colors: {
      background: '#000000',
      hex: '#1a1a1a',
      hexStroke: '#ffffff',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#cccccc',
    },
    ui: {
      surface: '#0a0a0a',
      surfaceMuted: '#050505',
      border: '#1a1a1a',
      accent: '#ffffff',
    },
  },
  [ThemeName.STARBLOOM]: {
    id: ThemeName.STARBLOOM,
    name: 'Starbloom Mono',
    description: 'Soft grayscale bloom effect',
    previewShape: 'spark',
    colors: {
      background: '#f5f5f5',
      hex: '#e5e5e5',
      hexStroke: '#999999',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#000000',
      textSecondary: '#666666',
    },
    ui: {
      surface: '#ffffff',
      surfaceMuted: '#f0f0f0',
      border: '#cccccc',
      accent: '#333333',
    },
  },
  [ThemeName.TURBO_FORGE]: {
    id: ThemeName.TURBO_FORGE,
    name: 'Turbo Mono',
    description: 'High speed monochrome theme',
    previewShape: 'hex',
    colors: {
      background: '#0a0a0a',
      hex: '#1a1a1a',
      hexStroke: '#ffffff',
      blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Keep colored blocks
      text: '#ffffff',
      textSecondary: '#999999',
    },
    ui: {
      surface: '#0d0d0d',
      surfaceMuted: '#060606',
      border: '#1a1a1a',
      accent: '#ffffff',
    },
  },
};

export const themePrices: Record<ThemeName, number> = {
  [ThemeName.CLASSIC]: 0,
  [ThemeName.NEON]: 800,
  [ThemeName.DARK]: 600,
  [ThemeName.LIGHT]: 400,
  [ThemeName.WEB_HERO]: 1200,
  [ThemeName.FASHION_PINK]: 900,
  [ThemeName.ARENA_NEON]: 1500,
  [ThemeName.RETRO_ARCADE]: 1000,
  [ThemeName.STARBLOOM]: 950,
  [ThemeName.TURBO_FORGE]: 1300,
};

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Get theme price
 */
export function getThemePrice(name: ThemeName): number {
  return themePrices[name] ?? 0;
}

/**
 * Check if a string is a valid theme name
 */
export function isThemeName(value: string): value is ThemeName {
  return Object.values(ThemeName).includes(value as ThemeName);
}

/**
 * Normalize unlocked themes list
 */
export function normalizeThemesUnlocked(unlocked?: string[] | null): ThemeName[] {
  const resolved: ThemeName[] = [];
  const list = unlocked ?? [];
  list.forEach((entry) => {
    if (isThemeName(entry) && !resolved.includes(entry)) {
      resolved.push(entry);
    }
  });

  if (!resolved.includes(DEFAULT_THEME)) {
    resolved.unshift(DEFAULT_THEME);
  }

  return resolved;
}

/**
 * Get theme or fallback to default
 */
export function getThemeOrDefault(name?: string | ThemeName): Theme {
  if (name && isThemeName(name)) {
    return themes[name];
  }
  return themes[DEFAULT_THEME];
}

/**
 * Default theme
 */
export const DEFAULT_THEME = ThemeName.CLASSIC;

/**
 * All available theme names
 */
export const availableThemes = Object.values(ThemeName);

/**
 * Apply theme values to the document
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--theme-bg', theme.colors.background);
  root.style.setProperty('--theme-surface', theme.ui.surface);
  root.style.setProperty('--theme-surface-muted', theme.ui.surfaceMuted);
  root.style.setProperty('--theme-border', theme.ui.border);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--theme-accent', theme.ui.accent);
  root.style.setProperty('--theme-accent-contrast', getContrastColor(theme.ui.accent));
  root.style.setProperty('--theme-surface-contrast', getContrastColor(theme.ui.surface));
  root.style.setProperty('--theme-surface-glass', hexToRgba(theme.ui.surface, 0.78));
  root.style.setProperty('--theme-surface-muted-glass', hexToRgba(theme.ui.surfaceMuted, 0.65));
  root.style.setProperty('--theme-border-glass', hexToRgba(theme.ui.border, 0.45));
  root.style.setProperty('--theme-glass-shadow', `0 25px 60px ${hexToRgba(theme.ui.border, 0.35)}`);
  root.style.setProperty('--theme-glow', hexToRgba(theme.ui.accent, 0.35));
  root.style.setProperty('--theme-glow-strong', hexToRgba(theme.ui.accent, 0.55));
  root.style.setProperty('--theme-accent-strong', adjustColor(theme.ui.accent, 0.15));
  root.style.setProperty('--theme-accent-soft', adjustColor(theme.ui.accent, -0.12));
  root.style.setProperty('--theme-bg-muted', adjustColor(theme.colors.background, 0.08));

  document.body.style.background = theme.colors.background;
  document.body.style.color = theme.colors.text;
}

function normalizeHex(hex: string): string {
  if (!hex) return '#000000';
  const value = hex.replace('#', '');
  if (value.length === 3) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`;
  }
  return `#${value.padEnd(6, '0').slice(0, 6)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}

function adjustColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  const adjust = (channel: number) => {
    if (amount >= 0) {
      return clamp(channel + (255 - channel) * amount);
    }
    return clamp(channel + channel * amount);
  };

  const nr = adjust(r).toString(16).padStart(2, '0');
  const ng = adjust(g).toString(16).padStart(2, '0');
  const nb = adjust(b).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return luminance > 0.55 ? '#0b1120' : '#f8fafc';
}

