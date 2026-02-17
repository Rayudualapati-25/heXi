/**
 * Main entry point for Hextris TypeScript version
 * Initializes the application and sets up routing
 */

import './tailwind.css';
import { Router } from './router';
import { MenuPage } from './pages/MenuPage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { DifficultyPage } from './pages/DifficultyPage';
import { SettingsPage } from './pages/SettingsPage';
import { GamePage } from './pages/GamePage';
import { ROUTES } from './core/constants';
import { stateManager } from '@core/StateManager';
import { ThemeName } from '@config/themes';
import { createEmptyInventory } from '@config/shopItems';
import { themeManager } from '@/managers/ThemeManager';
import { client } from './lib/appwrite';


/**
 * Initialize the application
 */
async function init(): Promise<void> {
  // Verify Appwrite connection
  try {
    await client.ping();
    console.log('✅ Appwrite connection verified');
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
  }

  // Get app container
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    throw new Error('App container not found');
  }

  // Initialize router
  const router = Router.init(appContainer);

  //Register routes
  router.registerRoutes([
    {
      path: ROUTES.MENU,
      page: MenuPage,
      requiresAuth: false,
    },
    {
      path: ROUTES.DIFFICULTY,
      page: DifficultyPage,
      requiresAuth: false,
    },
    {
      path: ROUTES.GAME,
      page: GamePage,
      requiresAuth: false,
    },
    {
      path: ROUTES.SETTINGS,
      page: SettingsPage,
      requiresAuth: false,
    },
    {
      path: ROUTES.MULTIPLAYER,
      page: MultiplayerPage,
      requiresAuth: false,
    },
  ]);

  // Set default theme
  const cachedTheme = themeManager.getCurrentTheme();
  stateManager.updatePlayer({ 
    id: 'local-player',
    name: 'Player',
    highScore: 0,
    specialPoints: 500,
    gamesPlayed: 0,
    totalPlayTime: 0,
    themesUnlocked: [ThemeName.CLASSIC],
    selectedTheme: cachedTheme,
    inventory: createEmptyInventory(),
  });
  themeManager.applyTheme(cachedTheme);

  // Navigate to current route or menu as default
  const currentPath = window.location.hash.slice(1) || '/';
  if (currentPath === '/') {
    // If at root path, navigate to menu
    router.navigate(ROUTES.MENU);
  } else {
    // Trigger route change for the current path
    window.dispatchEvent(new Event('hashchange'));
  }

  console.log('Hextris initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  showErrorNotification('An unexpected error occurred', event.error?.message || 'Unknown error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showErrorNotification('Promise Error', event.reason?.message || 'An async operation failed');
});

/**
 * Show error notification to user
 */
function showErrorNotification(title: string, message: string): void {
  // Create error notification element
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-[9999]
    max-w-md p-4 rounded-lg shadow-2xl
    bg-red-600 text-white border-2 border-red-800
    animate-slide-down
  `;
  
  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold text-lg mb-1';
  titleEl.textContent = title;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'text-sm opacity-90';
  messageEl.textContent = message;
  
  notification.appendChild(titleEl);
  notification.appendChild(messageEl);
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('animate-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

