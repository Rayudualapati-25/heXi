/**
 * ThemeManager
 * Manages theme loading, application, and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.availableThemes = window.ThemeConfig || {};
    this.unlockedThemes = ['classic']; // Classic is always unlocked
    this.userId = null;
    
    this.init();
  }

  /**
   * Initialize the theme manager
   */
  init() {
    // Load unlocked themes from localStorage
    const savedUnlocked = localStorage.getItem('unlockedThemes');
    if (savedUnlocked) {
      try {
        this.unlockedThemes = JSON.parse(savedUnlocked);
      } catch (e) {
        console.warn('Failed to parse unlocked themes:', e);
      }
    }

    // Load and apply last selected theme
    const selectedThemeId = localStorage.getItem('selectedTheme') || 'classic';
    this.applyTheme(selectedThemeId);

    // Listen for score changes to unlock themes
    document.addEventListener('scoreUpdated', (e) => {
      this.checkUnlocks(e.detail.totalScore);
    });
  }

  /**
   * Apply a theme to the game
   * @param {string} themeId - The ID of the theme to apply
   */
  applyTheme(themeId) {
    const theme = this.availableThemes[themeId];
    
    if (!theme) {
      console.warn(`Theme ${themeId} not found, falling back to classic`);
      themeId = 'classic';
      return this.applyTheme('classic');
    }

    // Check if theme is unlocked
    if (!this.isUnlocked(themeId)) {
      console.warn(`Theme ${themeId} is locked`);
      return false;
    }

    this.currentTheme = theme;

    // Apply colors to CSS variables
    this.applyColors(theme.colors);

    // Apply background
    this.applyBackground(theme.background);

    // Apply fonts
    this.applyFonts(theme.fonts);

    // Apply particles if enabled
    if (theme.particles && theme.particles.enabled) {
      this.enableParticles(theme.particles);
    } else {
      this.disableParticles();
    }

    // Save selection
    localStorage.setItem('selectedTheme', themeId);

    // Dispatch theme change event
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: theme }
    }));

    console.log(`✅ Theme applied: ${theme.name}`);
    return true;
  }

  /**
   * Apply theme colors to CSS variables
   */
  applyColors(colors) {
    const root = document.documentElement;
    
    root.style.setProperty('--theme-bg', colors.background);
    root.style.setProperty('--theme-hex-outline', colors.hexOutline);
    root.style.setProperty('--theme-text-primary', colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-accent', colors.accent);

    // Update global colors array for game rendering
    if (window.colors) {
      window.colors = colors.blocks.slice(0, 4); // Use first 4 colors for compatibility
    }
    
    // Store all block colors for advanced rendering
    window.currentBlockColors = colors.blocks;
    
    // Update tinted colors mapping if it exists
    if (window.hexColorsToTintedColors && window.rgbColorsToTintedColors) {
      this.updateTintedColors(colors.blocks);
    }
  }

  /**
   * Update tinted colors mapping for theme
   */
  updateTintedColors(blockColors) {
    // Clear existing mappings
    window.hexColorsToTintedColors = {};
    window.rgbColorsToTintedColors = {};
    
    // Create new mappings for each block color
    blockColors.forEach(color => {
      // Create lighter tinted version (add 20% brightness)
      const tinted = this.lightenColor(color, 0.2);
      window.hexColorsToTintedColors[color] = tinted;
      
      // Convert to RGB format as well
      const rgb = this.hexToRgb(color);
      const tintedRgb = this.hexToRgb(tinted);
      if (rgb && tintedRgb) {
        const rgbKey = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const rgbVal = `rgb(${tintedRgb.r}, ${tintedRgb.g}, ${tintedRgb.b})`;
        window.rgbColorsToTintedColors[rgbKey] = rgbVal;
      }
    });
  }

  /**
   * Lighten a hex color by a percentage
   */
  lightenColor(hex, percent) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert hex color to RGB object
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Apply theme background
   */
  applyBackground(background) {
    const canvas = document.getElementById('canvas');
    const container = document.body;

    if (background.type === 'solid') {
      container.style.background = background.value;
    } else if (background.type === 'gradient') {
      container.style.background = background.value;
    }
  }

  /**
   * Apply theme fonts
   */
  applyFonts(fonts) {
    const root = document.documentElement;
    
    root.style.setProperty('--theme-font-primary', fonts.primary);
    root.style.setProperty('--theme-font-score', fonts.score);
  }

  /**
   * Enable particle effects
   */
  enableParticles(particleConfig) {
    window.particleEffectsEnabled = true;
    window.particleConfig = particleConfig;
  }

  /**
   * Disable particle effects
   */
  disableParticles() {
    window.particleEffectsEnabled = false;
    window.particleConfig = null;
  }

  /**
   * Check if a theme is unlocked
   */
  isUnlocked(themeId) {
    return this.unlockedThemes.includes(themeId);
  }

  /**
   * Unlock a theme
   */
  unlockTheme(themeId) {
    if (this.isUnlocked(themeId)) {
      return false; // Already unlocked
    }

    const theme = this.availableThemes[themeId];
    if (!theme) {
      console.warn(`Theme ${themeId} not found`);
      return false;
    }

    this.unlockedThemes.push(themeId);
    localStorage.setItem('unlockedThemes', JSON.stringify(this.unlockedThemes));

    // Show unlock notification
    this.showUnlockNotification(theme);

    // TODO: Update to use new AppwriteClient in future priority
    /*
    if (window.appwriteClient && window.currentUser) {
      window.appwriteClient.updateUnlockedThemes(window.currentUser.$id, this.unlockedThemes)
        .catch(err => console.warn('Failed to sync unlocked themes:', err));
    }
    */

    console.log(`🎉 Theme unlocked: ${theme.name}`);
    return true;
  }

  /**
   * Check score and unlock themes
   */
  checkUnlocks(totalScore) {
    for (const [themeId, theme] of Object.entries(this.availableThemes)) {
      if (themeId === 'classic') continue; // Skip classic, always unlocked

      if (!this.isUnlocked(themeId) && totalScore >= theme.unlockScore) {
        this.unlockTheme(themeId);
      }
    }
  }

  /**
   * Show unlock notification using SweetAlert
   */
  showUnlockNotification(theme) {
    if (typeof swal !== 'undefined') {
      swal({
        title: '🎉 Theme Unlocked!',
        text: `You've unlocked the ${theme.name} theme!\n${theme.description}`,
        type: 'success',
        confirmButtonText: 'Apply Now',
        showCancelButton: true,
        cancelButtonText: 'Later'
      }, (applyNow) => {
        if (applyNow) {
          this.applyTheme(theme.id);
          // Refresh theme selector if open
          if (window.themeSelector) {
            window.themeSelector.refresh();
          }
        }
      });
    }
  }

  /**
   * Get all available themes with unlock status
   */
  getAllThemes() {
    return Object.entries(this.availableThemes).map(([id, theme]) => ({
      ...theme,
      unlocked: this.isUnlocked(id),
      selected: this.currentTheme && this.currentTheme.id === id
    }));
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Load themes from Appwrite user profile
   */
  async loadFromAppwrite(userId) {
    this.userId = userId;

    if (!window.appwriteClient) {
      return;
    }

    try {
      const user = await window.appwriteClient.getUser(userId);
      
      if (user.themesUnlocked && Array.isArray(user.themesUnlocked)) {
        this.unlockedThemes = user.themesUnlocked;
        localStorage.setItem('unlockedThemes', JSON.stringify(this.unlockedThemes));
      }

      if (user.selectedTheme) {
        this.applyTheme(user.selectedTheme);
      }
    } catch (err) {
      console.warn('Failed to load themes from Appwrite:', err);
    }
  }

  /**
   * Save current theme selection to Appwrite
   */
  async saveToAppwrite() {
    // TODO: Refactor to use new AppwriteClient in future priority
    /*
    if (!this.userId || !window.appwriteClient || !this.currentTheme) {
      return;
    }

    try {
      await window.appwriteClient.updateUserTheme(this.userId, this.currentTheme.id);
    } catch (err) {
      console.warn('Failed to save theme to Appwrite:', err);
    }
    */
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  (window as any).ThemeManager = ThemeManager;
  (window as any).themeManager = new ThemeManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
