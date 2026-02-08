/**
 * Input utilities - Keyboard and touch controls
 * Modern event-driven input system
 */

export type InputCommand = 'rotateLeft' | 'rotateRight' | 'speedUp' | 'pause' | 'restart';

export interface InputHandler {
  onCommand: (command: InputCommand, pressed: boolean) => void;
}

export class InputManager {
  private handlers: Map<InputCommand, ((pressed: boolean) => void)[]> = new Map();
  private pressedKeys = new Set<string>();
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private swipeThreshold: number = 50;
  private enabled: boolean = true;

  constructor() {
    this.initKeyboardListeners();
    this.initTouchListeners();
  }

  /**
   * Register a command handler
   */
  public on(command: InputCommand, handler: (pressed: boolean) => void): void {
    if (!this.handlers.has(command)) {
      this.handlers.set(command, []);
    }
    this.handlers.get(command)!.push(handler);
  }

  /**
   * Unregister a command handler
   */
  public off(command: InputCommand, handler: (pressed: boolean) => void): void {
    const handlers = this.handlers.get(command);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Trigger a command
   */
  private trigger(command: InputCommand, pressed: boolean): void {
    if (!this.enabled) return;
    
    const handlers = this.handlers.get(command);
    if (handlers) {
      handlers.forEach(handler => handler(pressed));
    }
  }

  /**
   * Initialize keyboard event listeners
   */
  private initKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase(); // Normalize key for consistent tracking
      if (this.pressedKeys.has(key)) return; // Prevent key repeat
      this.pressedKeys.add(key);

      switch (key) {
        case 'arrowleft':
        case 'a':
          this.trigger('rotateLeft', true);
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          this.trigger('rotateRight', true);
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          this.trigger('speedUp', true);
          e.preventDefault();
          break;
        case 'p':
        case ' ': // Space
          this.trigger('pause', true);
          e.preventDefault();
          break;
        case 'enter':
          this.trigger('restart', true);
          e.preventDefault();
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase(); // Normalize key for consistent tracking
      this.pressedKeys.delete(key);

      switch (key) {
        case 'arrowleft':
        case 'a':
          this.trigger('rotateLeft', false);
          break;
        case 'arrowright':
        case 'd':
          this.trigger('rotateRight', false);
          break;
        case 'arrowdown':
        case 's':
          this.trigger('speedUp', false);
          break;
        case 'p':
        case ' ':
          this.trigger('pause', false);
          break;
        case 'enter':
          this.trigger('restart', false);
          break;
      }
    });

    // Clear pressed keys on window blur
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
    });
  }

  /**
   * Initialize touch event listeners
   */
  private initTouchListeners(): void {
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      // Prevent scrolling while playing
      if (this.enabled) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // Horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (Math.abs(deltaX) > this.swipeThreshold) {
            if (deltaX > 0) {
              // Swipe right
              this.trigger('rotateRight', true);
              setTimeout(() => this.trigger('rotateRight', false), 50);
            } else {
              // Swipe left
              this.trigger('rotateLeft', true);
              setTimeout(() => this.trigger('rotateLeft', false), 50);
            }
          }
        }
        // Vertical swipe down
        else if (deltaY > this.swipeThreshold) {
          this.trigger('speedUp', true);
        }
        // Tap (no significant movement)
        else if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
          // Determine which side of screen was tapped
          const screenWidth = window.innerWidth;
          if (touch.clientX < screenWidth / 2) {
            // Left tap
            this.trigger('rotateLeft', true);
            setTimeout(() => this.trigger('rotateLeft', false), 50);
          } else {
            // Right tap
            this.trigger('rotateRight', true);
            setTimeout(() => this.trigger('rotateRight', false), 50);
          }
        }
      }
    }, { passive: true });

    // Handle speed up release
    document.addEventListener('touchcancel', () => {
      this.trigger('speedUp', false);
    }, { passive: true });
  }

  /**
   * Enable/disable input processing
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressedKeys.clear();
    }
  }

  /**
   * Check if input is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if a key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  /**
   * Clear all handlers
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Get all pressed keys (for debugging)
   */
  public getPressedKeys(): string[] {
    return Array.from(this.pressedKeys);
  }

  /**
   * Set swipe threshold for touch controls
   */
  public setSwipeThreshold(threshold: number): void {
    this.swipeThreshold = threshold;
  }
}

// Singleton instance
let inputManagerInstance: InputManager | null = null;

/**
 * Get the global InputManager instance
 */
export function getInputManager(): InputManager {
  if (!inputManagerInstance) {
    inputManagerInstance = new InputManager();
  }
  return inputManagerInstance;
}

/**
 * Reset the input manager (useful for testing)
 */
export function resetInputManager(): void {
  inputManagerInstance = null;
}
