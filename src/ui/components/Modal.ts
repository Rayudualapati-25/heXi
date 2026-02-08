/**
 * Modal component for Hextris
 * Reusable modal dialog with backdrop and animations
 */

export interface ModalOptions {
  title?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

export class Modal {
  public element: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private content: HTMLDivElement;
  private header?: HTMLDivElement;
  private body: HTMLDivElement;
  private isOpen: boolean = false;
  private options: Required<ModalOptions>;

  constructor(options: ModalOptions = {}) {
    this.options = {
      title: options.title || '',
      showCloseButton: options.showCloseButton !== false,
      closeOnBackdrop: options.closeOnBackdrop !== false,
      closeOnEscape: options.closeOnEscape !== false,
      maxWidth: options.maxWidth || 'md',
      onClose: options.onClose || (() => {}),
    };

    this.element = document.createElement('div');
    this.backdrop = this.createBackdrop();
    this.content = this.createContent();
    this.body = this.createBody();

    if (this.options.title) {
      this.header = this.createHeader();
    }

    this.setupModal();
  }

  /**
   * Create backdrop
   */
  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 opacity-0 transition-opacity duration-300';
    
    if (this.options.closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.close();
        }
      });
    }

    return backdrop;
  }

  /**
   * Create content container
   */
  private createContent(): HTMLDivElement {
    const content = document.createElement('div');
    
    const maxWidthClass = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    }[this.options.maxWidth];

    content.className = `
      fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
      bg-white rounded-2xl shadow-2xl
      ${maxWidthClass} w-[calc(100%-2rem)] sm:w-full mx-2 sm:mx-4
      opacity-0 scale-95 transition-all duration-300
      z-50 max-h-[90vh] overflow-y-auto
    `.trim().replace(/\s+/g, ' ');

    return content;
  }

  /**
   * Create header
   */
  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between p-4 sm:p-6 border-b border-gray-200';

    // Title
    const title = document.createElement('h2');
    title.className = 'text-lg sm:text-2xl font-bold text-black';
    title.textContent = this.options.title;
    header.appendChild(title);

    // Close button
    if (this.options.showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'text-gray-500 hover:text-black transition-colors';
      closeBtn.innerHTML = '✕';
      closeBtn.style.fontSize = '24px';
      closeBtn.addEventListener('click', () => this.close());
      header.appendChild(closeBtn);
    }

    return header;
  }

  /**
   * Create body
   */
  private createBody(): HTMLDivElement {
    const body = document.createElement('div');
    body.className = 'p-4 sm:p-6';
    return body;
  }

  /**
   * Setup modal structure
   */
  private setupModal(): void {
    this.element.className = 'modal-container';
    this.element.appendChild(this.backdrop);
    
    if (this.header) {
      this.content.appendChild(this.header);
    }
    this.content.appendChild(this.body);
    this.element.appendChild(this.content);

    // Escape key handler
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscape);
    }
  }

  /**
   * Handle escape key
   */
  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  /**
   * Open modal
   */
  public open(): void {
    if (this.isOpen) return;

    document.body.appendChild(this.element);
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Trigger animations
    requestAnimationFrame(() => {
      this.backdrop.classList.remove('opacity-0');
      this.backdrop.classList.add('opacity-100');
      this.content.classList.remove('opacity-0', 'scale-95');
      this.content.classList.add('opacity-100', 'scale-100');
    });
  }

  /**
   * Close modal
   */
  public close(): void {
    if (!this.isOpen) return;

    this.backdrop.classList.remove('opacity-100');
    this.backdrop.classList.add('opacity-0');
    this.content.classList.remove('opacity-100', 'scale-100');
    this.content.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
      this.element.remove();
      document.body.style.overflow = '';
      this.isOpen = false;
      this.options.onClose();
    }, 300);
  }

  /**
   * Set modal content (HTML string or element)
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
   * Check if modal is open
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Destroy modal and clean up
   */
  public destroy(): void {
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this.handleEscape);
    }
    this.element.remove();
    document.body.style.overflow = '';
  }
}
