/**
 * Button component for Hextris
 * Reusable button with multiple variants and styles
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
  onClick?: (event: MouseEvent) => void;
}

export class Button {
  public element: HTMLButtonElement;
  private options: Required<ButtonOptions>;

  constructor(text: string, options: ButtonOptions = {}) {
    this.options = {
      variant: options.variant || 'primary',
      size: options.size || 'medium',
      fullWidth: options.fullWidth || false,
      disabled: options.disabled || false,
      icon: options.icon || '',
      onClick: options.onClick || (() => {}),
    };

    this.element = this.createElement(text);
  }

  /**
   * Create button element
   */
  private createElement(text: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = this.options.disabled;

    // Base classes
    const classes = [
      'font-semibold',
      'transition-all',
      'duration-200',
      'rounded-lg',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'whitespace-normal',
      'break-words',
    ];

    // Variant classes
    switch (this.options.variant) {
      case 'primary':
        classes.push(
          'bg-black',
          'text-white',
          'hover:bg-gray-800',
          'focus:ring-black'
        );
        break;
      case 'secondary':
        classes.push(
          'bg-white',
          'text-black',
          'border-2',
          'border-black',
          'hover:bg-gray-100',
          'focus:ring-gray-300'
        );
        break;
      case 'outline':
        classes.push(
          'border-2',
          'border-gray-300',
          'text-gray-700',
          'hover:bg-gray-50',
          'focus:ring-gray-200'
        );
        break;
      case 'ghost':
        classes.push(
          'text-gray-700',
          'hover:bg-gray-100',
          'focus:ring-gray-200'
        );
        break;
    }

    // Size classes
    switch (this.options.size) {
      case 'small':
        classes.push('px-3', 'sm:px-4', 'py-1.5', 'sm:py-2', 'text-xs', 'sm:text-sm');
        break;
      case 'medium':
        classes.push('px-4', 'sm:px-6', 'py-2', 'sm:py-3', 'text-sm', 'sm:text-base');
        break;
      case 'large':
        classes.push('px-6', 'sm:px-8', 'py-2.5', 'sm:py-4', 'text-sm', 'sm:text-lg');
        break;
    }

    // Full width
    if (this.options.fullWidth) {
      classes.push('w-full');
    }

    button.className = classes.join(' ');

    // Add content
    if (this.options.icon) {
      const icon = document.createElement('span');
      icon.textContent = this.options.icon;
      icon.className = 'mr-2';
      button.appendChild(icon);
    }

    const textNode = document.createTextNode(text);
    button.appendChild(textNode);

    // Add click handler
    button.addEventListener('click', this.options.onClick);

    return button;
  }

  /**
   * Set button text
   */
  public setText(text: string): void {
    const textNode = this.element.childNodes[this.options.icon ? 1 : 0];
    if (textNode) {
      textNode.textContent = text;
    }
  }

  /**
   * Set disabled state
   */
  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.element.disabled = disabled;
  }

  /**
   * Set loading state
   */
  public  setLoading(loading: boolean): void {
    if (loading) {
      this.element.disabled = true;
      this.element.classList.add('opacity-75', 'cursor-wait');
      const originalText = this.element.textContent;
      this.element.setAttribute('data-original-text', originalText || '');
      this.element.textContent = 'Loading...';
    } else {
      this.element.disabled = this.options.disabled;
      this.element.classList.remove('opacity-75', 'cursor-wait');
      const originalText = this.element.getAttribute('data-original-text');
      if (originalText) {
        this.element.textContent = originalText;
      }
    }
  }

  /**
   * Remove button from DOM
   */
  public destroy(): void {
    this.element.remove();
  }
}
