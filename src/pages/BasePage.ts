/**
 * Base page class for Hextris
 * Abstract class that all pages extend
 */

export abstract class BasePage {
  protected container: HTMLElement;
  protected element: HTMLDivElement;
  protected params: Record<string, string>;

  constructor(container: HTMLElement, params: Record<string, string> = {}) {
    this.container = container;
    this.params = params;
    this.element = this.createPageElement();
  }

  /**
   * Create the page root element
   */
  protected createPageElement(): HTMLDivElement {
    const page = document.createElement('div');
    page.className = 'page min-h-screen w-full';
    return page;
  }

  /**
   * Abstract render method - must be implemented by subclasses
   */
  public abstract render(): void;

  /**
   * Lifecycle: called after page is mounted to DOM
   */
  public onMount?(): void;

  /**
   * Lifecycle: called before page is unmounted from DOM
   */
  public onUnmount?(): void;

  /**
   * Lifecycle: called when window is resized
   */
  public onResize?(): void;

  /**
   * Append the page to container
   */
  protected mount(): void {
    this.container.appendChild(this.element);
  }

  /**
   * Helper: Create a centered container
   */
  protected createCenteredContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex items-center justify-center min-h-screen p-4';
    return container;
  }

  /**
   * Helper: Create a page header
   */
  protected createHeader(title: string, subtitle?: string): HTMLElement {
    const header = document.createElement('header');
    header.className = 'text-center mb-8';

    const titleElement = document.createElement('h1');
    titleElement.className = 'text-6xl font-bold text-black mb-2';
    titleElement.textContent = title;
    header.appendChild(titleElement);

    if (subtitle) {
      const subtitleElement = document.createElement('p');
      subtitleElement.className = 'text-gray-700 text-lg';
      subtitleElement.textContent = subtitle;
      header.appendChild(subtitleElement);
    }

    return header;
  }

  /**
   * Helper: Create a back button
   */
  protected createBackButton(text: string = '← Back', onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `
      fixed top-4 left-4 z-10
      px-4 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100
      transition-colors duration-200
      font-medium
    `.trim().replace(/\s+/g, ' ');
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * Helper: Create a loading spinner
   */
  protected createLoader(): HTMLDivElement {
    const loader = document.createElement('div');
    loader.className = 'flex items-center justify-center min-h-screen';
    loader.innerHTML = `
      <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-black"></div>
    `;
    return loader;
  }

  /**
   * Clean up and remove page
   */
  public destroy(): void {
    this.element.remove();
  }
}
