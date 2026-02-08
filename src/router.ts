/**
 * Hash-based SPA router for Hextris
 * Manages page navigation and lifecycle
 */

import type { BasePage } from '@/pages/BasePage';
import { authService } from '@services/AuthService';
import { stateManager } from '@core/StateManager';

export interface Route {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: new (...args: any[]) => BasePage;
  requiresAuth?: boolean;
}

export class Router {
  private static instance: Router;
  private routes: Map<string, Route>;
  private currentPage: BasePage | null;
  private container: HTMLElement;

  private constructor(container: HTMLElement) {
    this.routes = new Map();
    this.currentPage = null;
    this.container = container;
    this.setupEventListeners();
  }

  /**
   * Initialize router
   */
  public static init(container: HTMLElement): Router {
    if (!Router.instance) {
      Router.instance = new Router(container);
    }
    return Router.instance;
  }

  /**
   * Get router instance
   */
  public static getInstance(): Router {
    if (!Router.instance) {
      throw new Error('Router must be initialized with Router.init()');
    }
    return Router.instance;
  }

  /**
   * Register a route
   */
  public register(route: Route): void {
    this.routes.set(route.path, route);
  }

  /**
   * Register multiple routes
   */
  public registerRoutes(routes: Route[]): void {
    routes.forEach(route => this.register(route));
  }

  /**
   * Navigate to a path
   */
  public navigate(path: string, params?: Record<string, string>): void {
    // Update URL hash
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    window.location.hash = path + queryString;
  }

  /**
   * Go back to previous page
   */
  public back(): void {
    window.history.back();
  }

  /**
   * Handle route change
   */
  private async handleRouteChange(): Promise<void> {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

    const route = this.routes.get(path);

    if (!route) {
      console.warn(`Route not found: ${path}`);
      this.navigate('/'); // Redirect to entry
      return;
    }

    // Check authentication requirement
    if (route.requiresAuth) {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        console.warn('Authentication required, redirecting to login');
        this.navigate('/'); // Redirect to login
        return;
      }
    }

    // Unmount current page
    if (this.currentPage) {
      this.currentPage.onUnmount?.();
    }

    // Clear container
    this.container.innerHTML = '';

    // Create and mount new page
    this.currentPage = new route.page(this.container, params);
    this.currentPage.render();
    this.currentPage.onMount?.();

    // Update UI state
    stateManager.updateUI({ currentRoute: path });

    // Trigger resize for responsive layouts
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.currentPage?.onResize?.();
    });

    // Don't call handleRouteChange here - let it be triggered after routes are registered
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return window.location.hash.slice(1) || '/';
  }

  /**
   * Get query parameters
   */
  public getQueryParams(): Record<string, string> {
    const hash = window.location.hash.slice(1);
    const queryString = hash.split('?')[1];
    return queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};
  }
}

// Export singleton getter
export const getRouter = () => Router.getInstance();
