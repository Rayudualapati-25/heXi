/**
 * Input component for Hextris
 * Reusable text input field with validation
 */

export interface InputOptions {
  type?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  label?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  errorMessage?: string;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
}

export class Input {
  public container: HTMLDivElement;
  public element: HTMLInputElement;
  private label?: HTMLLabelElement;
  private errorElement?: HTMLDivElement;
  private options: Required<Omit<InputOptions, 'label' | 'pattern' | 'errorMessage' | 'onEnter' | 'minLength'>> & 
    Pick<InputOptions, 'label' | 'pattern' | 'errorMessage' | 'onEnter' | 'minLength'>;
  private isValid: boolean = true;

  constructor(options: InputOptions = {}) {
    this.options = {
      type: options.type || 'text',
      placeholder: options.placeholder || '',
      label: options.label,
      value: options.value || '',
      required: options.required || false,
      disabled: options.disabled || false,
      maxLength: options.maxLength || 100,
      minLength: options.minLength,
      pattern: options.pattern,
      errorMessage: options.errorMessage,
      onChange: options.onChange || (() => {}),
      onEnter: options.onEnter,
    };

    this.container = this.createContainer();
    
    if (this.options.label) {
      this.label = this.createLabel();
      this.container.appendChild(this.label);
    }

    this.element = this.createElement();
    this.container.appendChild(this.element);

    this.errorElement = this.createErrorElement();
    this.container.appendChild(this.errorElement);
  }

  /**
   * Create container
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'w-full';
    return container;
  }

  /**
   * Create label
   */
  private createLabel(): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = 'block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2';
    label.textContent = this.options.label || '';
    return label;
  }

  /**
   * Create input element
   */
  private createElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = this.options.type;
    input.placeholder = this.options.placeholder;
    input.value = this.options.value;
    input.disabled = this.options.disabled;
    input.maxLength = this.options.maxLength;
    
    if (this.options.pattern) {
      input.pattern = this.options.pattern;
    }

    if (this.options.required) {
      input.required = true;
    }

    // Base classes
    input.className = `
      w-full px-3 sm:px-4 py-2 sm:py-3 
      border-2 border-gray-300 rounded-lg
      text-sm sm:text-base
      focus:border-black focus:outline-none
      transition-colors duration-200
      disabled:bg-gray-100 disabled:cursor-not-allowed
    `.trim().replace(/\s+/g, ' ');

    // Event listeners
    input.addEventListener('input', () => {
      this.validate();
      this.options.onChange(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.options.onEnter) {
        e.preventDefault();
        if (this.validate()) {
          this.options.onEnter(input.value);
        }
      }
    });

    return input;
  }

  /**
   * Create error element
   */
  private createErrorElement(): HTMLDivElement {
    const error = document.createElement('div');
    error.className = 'text-sm text-red-500 mt-1 hidden';
    error.textContent = this.options.errorMessage || 'Invalid input';
    return error;
  }

  /**
   * Validate input
   */
  public validate(): boolean {
    const rawValue = this.element.value;
    const value = this.options.type === 'password' ? rawValue : rawValue.trim();

    // Check required
    if (this.options.required && !value) {
      this.showError(this.options.errorMessage || 'This field is required');
      this.isValid = false;
      return false;
    }

    // Check minLength
    if (this.options.minLength && value.length > 0 && value.length < this.options.minLength) {
      this.showError(`Minimum ${this.options.minLength} characters required`);
      this.isValid = false;
      return false;
    }

    // Check pattern
    if (this.options.pattern && value) {
      const regex = new RegExp(this.options.pattern);
      if (!regex.test(value)) {
        this.showError(this.options.errorMessage || 'Invalid format');
        this.isValid = false;
        return false;
      }
    }

    // Check email format for email inputs
    if (this.options.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showError('Please enter a valid email address');
        this.isValid = false;
        return false;
      }
    }

    this.hideError();
    this.isValid = true;
    return true;
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.isValid = false;
    this.element.classList.remove('border-gray-300', 'focus:border-black');
    this.element.classList.add('border-red-500', 'focus:border-red-500');
    
    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.classList.remove('hidden');
    }
  }

  /**
   * Hide error message
   */
  private hideError(): void {
    this.isValid = true;
    this.element.classList.remove('border-red-500', 'focus:border-red-500');
    this.element.classList.add('border-gray-300', 'focus:border-black');
    
    if (this.errorElement) {
      this.errorElement.classList.add('hidden');
    }
  }

  /**
   * Get input value
   */
  public getValue(): string {
    return this.options.type === 'password' ? this.element.value : this.element.value.trim();
  }

  /**
   * Set input value
   */
  public setValue(value: string): void {
    this.element.value = value;
    this.validate();
  }

  /**
   * Clear input
   */
  public clear(): void {
    this.element.value = '';
    this.hideError();
  }

  /**
   * Focus input
   */
  public focus(): void {
    this.element.focus();
  }

  /**
   * Set disabled state
   */
  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.element.disabled = disabled;
  }

  /**
   * Check if input is valid
   */
  public getIsValid(): boolean {
    return this.isValid;
  }

  /**
   * Remove input from DOM
   */
  public destroy(): void {
    this.container.remove();
  }
}
