import { EventEmitter } from '../utils/EventEmitter';

export interface ElementDefinition {
  tag: string;
  title: string;
  icon: string;
  description: string;
  category?: 'layout' | 'text' | 'form' | 'media' | 'semantic';
}

export interface ElementSelectorOptions {
  container: HTMLElement;
  onElementSelect?: (element: ElementDefinition) => void;
}

export class ElementSelector extends EventEmitter<{ 'element:selected': ElementDefinition }> {
  private container: HTMLElement;
  private dropdownElement: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private selectedIndex: number = -1;
  private filteredElements: ElementDefinition[] = [];
  private onElementSelect?: (element: ElementDefinition) => void;

  private elements: ElementDefinition[] = [
    { tag: '', title: 'Duplicate selected element', icon: 'clone', description: 'Duplicate the currently selected element', category: 'layout' },
    { tag: 'div', title: 'Container', icon: 'square', description: 'Generic container element', category: 'layout' },
    { tag: 'div', title: 'Horizontal Stack', icon: 'grip', description: 'Horizontal flex container', category: 'layout' },
    { tag: 'div', title: 'Vertical Stack', icon: 'grip-vertical', description: 'Vertical flex container', category: 'layout' },
    { tag: 'p', title: 'Paragraph', icon: 'paragraph', description: 'Text paragraph', category: 'text' },
    { tag: 'span', title: 'Text', icon: 'font', description: 'Inline text element', category: 'text' },
    { tag: 'a', title: 'Link', icon: 'link', description: 'Hyperlink', category: 'text' },
    { tag: 'img', title: 'Image', icon: 'image', description: 'Image element', category: 'media' },
    { tag: 'h1', title: 'Heading 1', icon: 'heading', description: 'Main heading', category: 'text' },
    { tag: 'h2', title: 'Heading 2', icon: 'heading', description: 'Section heading', category: 'text' },
    { tag: 'h3', title: 'Heading 3', icon: 'heading', description: 'Subsection heading', category: 'text' },
    { tag: 'h4', title: 'Heading 4', icon: 'heading', description: 'Minor heading', category: 'text' },
    { tag: 'h5', title: 'Heading 5', icon: 'heading', description: 'Minor heading', category: 'text' },
    { tag: 'h6', title: 'Heading 6', icon: 'heading', description: 'Minor heading', category: 'text' },
    { tag: 'ul', title: 'Bulleted List', icon: 'list-ul', description: 'Unordered list', category: 'text' },
    { tag: 'ol', title: 'Numbered List', icon: 'list-ol', description: 'Ordered list', category: 'text' },
    { tag: 'input', title: 'Text Input', icon: 'i-cursor', description: 'Text input field', category: 'form' },
    { tag: 'button', title: 'Button', icon: 'hand-pointer', description: 'Button element', category: 'form' },
    { tag: 'select', title: 'Select', icon: 'caret-down', description: 'Dropdown select', category: 'form' },
    { tag: 'textarea', title: 'Textarea', icon: 'keyboard', description: 'Multi-line text input', category: 'form' },
    { tag: 'form', title: 'Form', icon: 'table-list', description: 'Form container', category: 'form' },
    { tag: 'section', title: 'Section', icon: 'square', description: 'Section element', category: 'semantic' },
    { tag: 'header', title: 'Header', icon: 'square', description: 'Header element', category: 'semantic' },
    { tag: 'footer', title: 'Footer', icon: 'square', description: 'Footer element', category: 'semantic' },
    { tag: 'nav', title: 'Navigation', icon: 'bars', description: 'Navigation element', category: 'semantic' },
    { tag: 'article', title: 'Article', icon: 'newspaper', description: 'Article element', category: 'semantic' },
    { tag: 'video', title: 'Video', icon: 'video', description: 'Video element', category: 'media' },
    { tag: 'audio', title: 'Audio', icon: 'music', description: 'Audio element', category: 'media' },
  ];

  constructor(options: ElementSelectorOptions) {
    super();
    this.container = options.container;
    this.onElementSelect = options.onElementSelect;
    this.filteredElements = [...this.elements];
    this.render();
    this.bindEvents();
  }

  private render(): void {
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.className = 'element-selector-dropdown';
    this.dropdownElement.innerHTML = `
      <input 
        type="text" 
        placeholder="Search elements" 
        class="element-selector-search"
      />
      <div class="element-selector-content">
        <ul class="element-selector-list"></ul>
        <div class="element-selector-details">
          <div class="element-selector-details-title">
            <span class="element-selector-details-title-text">Select an element</span>
            <span class="element-selector-details-title-tag"></span>
          </div>
          <div class="element-selector-details-description">
            Choose an element from the list to add to the page
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.dropdownElement);
    this.searchInput = this.dropdownElement.querySelector('.element-selector-search');
    this.renderList();
  }

  private renderList(): void {
    const listElement = this.dropdownElement?.querySelector('.element-selector-list');
    if (!listElement) return;

    listElement.innerHTML = '';

    this.filteredElements.forEach((element, index) => {
      const li = document.createElement('li');
      li.className = 'element-selector-item';
      li.dataset.index = index.toString();
      li.tabIndex = -1;

      const iconMap: Record<string, string> = {
        'clone': '📋',
        'square': '⬜',
        'grip': '⋮⋮',
        'grip-vertical': '⋮',
        'paragraph': '¶',
        'font': 'A',
        'link': '🔗',
        'image': '🖼️',
        'heading': 'H',
        'list-ul': '•',
        'list-ol': '1.',
        'i-cursor': 'I',
        'hand-pointer': '👆',
        'caret-down': '▼',
        'keyboard': '⌨️',
        'table-list': '📋',
        'bars': '☰',
        'newspaper': '📰',
        'video': '🎥',
        'music': '🎵',
      };

      li.innerHTML = `
        <div class="element-selector-item-icon">${iconMap[element.icon] || '▪'}</div>
        <div class="element-selector-item-content">
          <span class="element-selector-item-title">${element.title}</span>
          ${element.tag ? `<span class="element-selector-item-tag">${element.tag}</span>` : ''}
        </div>
      `;

      li.addEventListener('click', () => this.selectElement(element));
      li.addEventListener('mouseenter', () => this.updateDetails(element, index));

      listElement.appendChild(li);
    });
  }

  private bindEvents(): void {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        this.filterElements(query);
      });

      this.searchInput.addEventListener('keydown', (e) => {
        this.handleKeydown(e as KeyboardEvent);
      });
    }
  }

  private filterElements(query: string): void {
    if (!query) {
      this.filteredElements = [...this.elements];
    } else {
      this.filteredElements = this.elements.filter(el => 
        el.title.toLowerCase().includes(query) || 
        el.tag.toLowerCase().includes(query) ||
        el.description.toLowerCase().includes(query)
      );
    }
    this.selectedIndex = -1;
    this.renderList();
  }

  private handleKeydown(e: KeyboardEvent): void {
    const items = this.dropdownElement?.querySelectorAll('.element-selector-item');
    if (!items) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredElements.length - 1);
        this.highlightItem(this.selectedIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.highlightItem(this.selectedIndex);
        break;

      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredElements.length) {
          this.selectElement(this.filteredElements[this.selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.searchInput?.blur();
        break;
    }
  }

  private highlightItem(index: number): void {
    const items = this.dropdownElement?.querySelectorAll('.element-selector-item');
    if (!items) return;

    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        this.updateDetails(this.filteredElements[i], i);
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private updateDetails(element: ElementDefinition, index: number): void {
    this.selectedIndex = index;
    const details = this.dropdownElement?.querySelector('.element-selector-details');
    if (!details) return;

    const titleText = details.querySelector('.element-selector-details-title-text');
    const titleTag = details.querySelector('.element-selector-details-title-tag');
    const description = details.querySelector('.element-selector-details-description');

    if (titleText) titleText.textContent = element.title;
    if (titleTag) titleTag.textContent = element.tag ? `<${element.tag}>` : '';
    if (description) description.textContent = element.description;
  }

  private selectElement(element: ElementDefinition): void {
    this.emit('element:selected', element);
    if (this.onElementSelect) {
      this.onElementSelect(element);
    }
    
    // Reset search
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.filterElements('');
  }

  public destroy(): void {
    if (this.dropdownElement && this.dropdownElement.parentNode) {
      this.dropdownElement.parentNode.removeChild(this.dropdownElement);
    }
    super.destroy();
  }
}
