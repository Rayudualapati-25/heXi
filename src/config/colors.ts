/**
 * Color palette for Hextris
 * Black & White UI with game colors for blocks/hex only
 * NO PURPLE anywhere in the design
 */

export type HexColor = `#${string}`;

export interface ColorPalette {
  ui: UIColors;
  game: GameColors;
  status: StatusColors;
}

export interface UIColors {
  black: HexColor;
  gray50: HexColor;
  gray100: HexColor;
  gray200: HexColor;
  gray300: HexColor;
  gray700: HexColor;
  gray800: HexColor;
  gray900: HexColor;
  white: HexColor;
}

export interface GameColors {
  red: HexColor;
  yellow: HexColor;
  blue: HexColor;
  green: HexColor;
  hexDark: HexColor;
  hexLight: HexColor;
  background: HexColor;
}

export interface StatusColors {
  success: HexColor;
  warning: HexColor;
  error: HexColor;
  info: HexColor;
}

/**
 * Main color palette - Black & White UI theme
 * Purple colors completely removed
 */
export const colors: ColorPalette = {
  ui: {
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    white: '#ffffff',
  },
  game: {
    red: '#e74c3c',
    yellow: '#f1c40f',
    blue: '#3498db',
    green: '#2ecc71',
    hexDark: '#2c3e50',
    hexLight: '#34495e',
    background: '#ecf0f1',
  },
  status: {
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },
};

/**
 * Block colors array (used in game logic)
 * Preserves the original game color scheme
 */
export const blockColors: HexColor[] = [
  colors.game.red,
  colors.game.yellow,
  colors.game.blue,
  colors.game.green,
];

/**
 * Get a random block color
 */
export function getRandomBlockColor(): HexColor {
  return blockColors[Math.floor(Math.random() * blockColors.length)];
}
