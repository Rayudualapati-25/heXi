/**
 * Card component for Hextris
 * Reusable card container with glassmorphic effect
 */

export interface CardOptions {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'glassmorphic' | 'dark';
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export class Card {
  public element: HTMLDivElement;
  private header?: HTMLDivElement;
  private body: HTMLDivElement;
  private options: Required<Omit<CardOptions, 'title' | 'subtitle'>> & Pick<CardOptions, 'title' | 'subtitle'>;

  constructor(options: CardOptions = {}) {
    this.options = {
      title: options.title,
      subtitle: options.subtitle,
      variant: options.variant || 'default',
      hoverable: options.hoverable || false,
      clickable: options.clickable || false,
      padding: options.padding || 'medium',
      onClick: options.onClick || (() => {}),
    };

    this.element = this.createElement();
    this.body = this.createBody();

    if (this.options.title) {
      this.header = this.createHeader();
      this.element.appendChild(this.header);
    }

    this.element.appendChild(this.body);
  }

  /**
   * Create card element
   */
  private createElement(): HTMLDivElement {
    const card = document.createElement('div');

    // Base classes
    const classes = ['rounded-xl', 'transition-all', 'duration-300'];

    // Variant classes
    switch (this.options.variant) {
      case 'default':
        classes.push('bg-white', 'shadow-lg', 'border', 'border-gray-200');
        break;
      case 'glassmorphic':
        classes.push('bg-white/80', 'backdrop-blur-md', 'shadow-xl', 'border', 'border-white/20');
        break;
      case 'dark':
        classes.push('bg-gray-900', 'text-white', 'shadow-xl', 'border', 'border-gray-800');
        break;
    }

    // Padding classes
    const paddingClass = {
      none: '',
      small: 'p-4',
      medium: 'p-6',
      large: 'p-8',
    }[this.options.padding];

    if (paddingClass) classes.push(paddingClass);

    // Hoverable
    if (this.options.hoverable) {
      classes.push('hover:shadow-xl', 'hover:scale-105');
    }

    // Clickable
    if (this.options.clickable) {
      classes.push('cursor-pointer');
      card.addEventListener('click', this.options.onClick);
    }

    card.className = classes.join(' ');
    return card;
  }

  /**
   * Create header
   */
  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'mb-4';

    if (this.options.title) {
      const title = document.createElement('h3');
      title.className = 'text-xl font-bold text-black';
      if (this.options.variant === 'dark') {
        title.className = 'text-xl font-bold text-white';
      }
      title.textContent = this.options.title;
      header.appendChild(title);
    }

    if (this.options.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'text-sm text-gray-600 mt-1';
      if (this.options.variant === 'dark') {
        subtitle.className = 'text-sm text-gray-400 mt-1';
      }
      subtitle.textContent = this.options.subtitle;
      header.appendChild(subtitle);
    }

    return header;
  }

  /**
   * Create body
   */
  private createBody(): HTMLDivElement {
    const body = document.createElement('div');
    body.className = 'card-body';
    return body;
  }

  /**
   * Set card content
   */
  public setContent(content: string | HTMLElement): void {
    this.body.innerHTML = '';
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else {
      this.body.appendChild(content);
    }
  }

  /**
   * Append element to card body
   */
  public appendChild(element: HTMLElement): void {
    this.body.appendChild(element);
  }

  /**
   * Set title
   */
  public setTitle(title: string): void {
    if (!this.header) {
      this.header = this.createHeader();
      this.element.insertBefore(this.header, this.body);
    }
    const titleElement = this.header.querySelector('h3');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Remove card from DOM
   */
  public destroy(): void {
    this.element.remove();
  }
}
