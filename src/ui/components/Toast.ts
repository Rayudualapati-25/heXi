/**
 * Toast - Simple notification system for in-game events
 * Shows temporary messages for player joins/leaves
 */

export interface ToastOptions {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // milliseconds
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class Toast {
  private static container: HTMLDivElement | null = null;
  private element: HTMLDivElement;
  private timeout: number | null = null;

  constructor(options: ToastOptions) {
    if (!Toast.container) {
      Toast.createContainer();
    }

    this.element = this.createToastElement(options);
    this.show(options.duration ?? 3000);
  }

  private static createContainer(): void {
    Toast.container = document.createElement('div');
    Toast.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
    Toast.container.id = 'toast-container';
    document.body.appendChild(Toast.container);
  }

  private createToastElement(options: ToastOptions): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = `
      pointer-events-auto
      px-4 py-3 rounded-lg
      shadow-lg
      backdrop-blur-sm
      transition-all duration-300
      transform translate-x-full opacity-0
      flex items-center gap-3
      max-w-sm
      ${this.getTypeStyles(options.type ?? 'info')}
    `;

    // Icon
    const icon = document.createElement('span');
    icon.className = 'text-xl flex-shrink-0';
    icon.textContent = this.getIcon(options.type ?? 'info');
    toast.appendChild(icon);

    // Message
    const message = document.createElement('div');
    message.className = 'text-sm font-semibold flex-1';
    message.textContent = options.message;
    toast.appendChild(message);

    return toast;
  }

  private getTypeStyles(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 text-white border border-green-400/50';
      case 'warning':
        return 'bg-yellow-500/90 text-black border border-yellow-400/50';
      case 'error':
        return 'bg-red-500/90 text-white border border-red-400/50';
      case 'info':
      default:
        return 'bg-blue-500/90 text-white border border-blue-400/50';
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  }

  private show(duration: number): void {
    if (!Toast.container) return;

    Toast.container.appendChild(this.element);

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.style.transform = 'translateX(0)';
      this.element.style.opacity = '1';
    });

    // Auto-dismiss after duration
    this.timeout = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  private hide(): void {
    this.element.style.transform = 'translateX(100%)';
    this.element.style.opacity = '0';

    setTimeout(() => {
      if (Toast.container && this.element.parentNode === Toast.container) {
        Toast.container.removeChild(this.element);
      }

      // Clean up container if no more toasts
      if (Toast.container && Toast.container.children.length === 0) {
        document.body.removeChild(Toast.container);
        Toast.container = null;
      }
    }, 300);
  }

  /**
   * Static helper to show a toast
   */
  public static show(message: string, type?: ToastOptions['type'], duration?: number): Toast {
    return new Toast({ message, type, duration });
  }

  /**
   * Static helper for info toast
   */
  public static info(message: string, duration?: number): Toast {
    return Toast.show(message, 'info', duration);
  }

  /**
   * Static helper for success toast
   */
  public static success(message: string, duration?: number): Toast {
    return Toast.show(message, 'success', duration);
  }

  /**
   * Static helper for warning toast
   */
  public static warning(message: string, duration?: number): Toast {
    return Toast.show(message, 'warning', duration);
  }

  /**
   * Static helper for error toast
   */
  public static error(message: string, duration?: number): Toast {
    return Toast.show(message, 'error', duration);
  }
}
