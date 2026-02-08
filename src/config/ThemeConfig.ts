
/**
 * Theme Configuration
 * Defines all available themes with their colors, backgrounds, and properties
 */

const ThemeConfig = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'The original Hextris look and feel',
    unlockScore: 0, // Always unlocked
    colors: {
      // Original Hextris colors (purple removed)
      blocks: ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#e67e22'],
      background: '#2c3e50',
      hexOutline: '#34495e',
      textPrimary: '#ecf0f1',
      textSecondary: '#95a5a6',
      accent: '#e74c3c'
    },
    background: {
      type: 'solid',
      value: '#2c3e50'
    },
    fonts: {
      primary: "'Roboto', 'Segoe UI', sans-serif",
      score: "'Orbitron', monospace"
    },
    sounds: {
      // Use default sounds
      match: null,
      gameOver: null,
      powerUp: null
    }
  },

  spiderman: {
    id: 'spiderman',
    name: 'Spider-Man',
    description: 'Your friendly neighborhood web-slinger',
    unlockScore: 10000,
    colors: {
      blocks: ['#e23636', '#1e40af', '#1f2937', '#ffffff', '#dc2626', '#2563eb'],
      background: '#0c0c0c',
      hexOutline: '#dc2626',
      textPrimary: '#ffffff',
      textSecondary: '#ef4444',
      accent: '#dc2626'
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 50% 50%, #1e1e1e 0%, #0c0c0c 100%)'
    },
    fonts: {
      primary: "'Impact', 'Arial Black', sans-serif",
      score: "'Impact', monospace"
    },
    sounds: {
      match: 'web-shoot',
      gameOver: 'spidey-sense',
      powerUp: 'thwip'
    },
    particles: {
      enabled: true,
      type: 'web',
      color: '#ffffff'
    }
  },

  avengers: {
    id: 'avengers',
    name: 'Avengers',
    description: 'Earth\'s Mightiest Heroes',
    unlockScore: 25000,
    colors: {
      blocks: ['#dc2626', '#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'],
      background: '#0a0e27',
      hexOutline: '#fbbf24',
      textPrimary: '#ffd700',
      textSecondary: '#94a3b8',
      accent: '#fbbf24'
    },
    background: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
    },
    fonts: {
      primary: "'Rajdhani', 'Arial', sans-serif",
      score: "'Orbitron', monospace"
    },
    sounds: {
      match: 'energy-blast',
      gameOver: 'assemble',
      powerUp: 'stark-tech'
    },
    particles: {
      enabled: true,
      type: 'energy',
      color: '#fbbf24'
    }
  },

  barbie: {
    id: 'barbie',
    name: 'Barbie',
    description: 'Life in plastic, it\'s fantastic!',
    unlockScore: 15000,
    colors: {
      blocks: ['#ec4899', '#a855f7', '#ffffff', '#fbbf24', '#f472b6', '#e879f9'],
      background: '#fce7f3',
      hexOutline: '#ec4899',
      textPrimary: '#be185d',
      textSecondary: '#db2777',
      accent: '#ec4899'
    },
    background: {
      type: 'gradient',
      value: 'radial-gradient(circle at 30% 20%, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)'
    },
    fonts: {
      primary: "'Pacifico', 'Comic Sans MS', cursive",
      score: "'Pacifico', cursive"
    },
    sounds: {
      match: 'sparkle',
      gameOver: 'barbie-theme',
      powerUp: 'glitter'
    },
    particles: {
      enabled: true,
      type: 'sparkle',
      color: '#ec4899'
    }
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  (window as any).ThemeConfig = ThemeConfig;
}

// Export as module if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeConfig;
}
