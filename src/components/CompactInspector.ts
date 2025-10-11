import { EventEmitter } from '../utils/EventEmitter';
import { tailwindClasses } from '../utils/tailwind-classes';
import { useDomClasses } from '../utils/useDomClasses';

interface CompactInspectorOptions {
  onClose: () => void;
  onToggleInspectMode: (enabled: boolean) => void;
  inspectMode: boolean;
  selectedElement: HTMLElement | null;
  elementClasses: string[];
  onToggleClass: (className: string) => void;
  onAddClass: (className: string) => void;
}

export class CompactInspector extends EventEmitter<any> {
  private container: HTMLElement;
  private element: HTMLElement | null = null;
  private options: CompactInspectorOptions;
  private expanded: boolean = true;
  private newClass: string = '';
  private suggestions: string[] = [];
  private selectedSuggestionIndex: number = 0;
  private activeTab: string = 'all';
  private dimensions = { width: 0, height: 0 };
  private inputElement: HTMLInputElement | null = null;
  private suggestionsElement: HTMLElement | null = null;
  private allClasses: string[] = [];

  constructor(container: HTMLElement, options: CompactInspectorOptions) {
    super();
    this.container = container;
    this.options = options;
    this.createElement();
    this.bindEvents();
    this.scanDOMForClasses();
  }

  private scanDOMForClasses(): void {
    const classSet = new Set<string>();
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach((element) => {
      const classList = element.classList;
      if (classList.length > 0) {
        Array.from(classList).forEach((className) => {
          classSet.add(className);
        });
      }
    });

    this.allClasses = Array.from(classSet).sort();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'compact-inspector';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    this.render();
    this.container.appendChild(this.element);
  }

  private render(): void {
    if (!this.element) return;

    const selectedElement = this.options.selectedElement;
    const elementClasses = this.options.elementClasses;

    // Update dimensions
    if (selectedElement) {
      const rect = selectedElement.getBoundingClientRect();
      this.dimensions = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }

    this.element.innerHTML = `
      <div class="compact-inspector-header" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
          "></div>
          <span style="font-weight: 600;">Tailwind Inspector</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="toggle-expand" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          ">
            ${this.expanded ? '−' : '+'}
          </button>
          <button class="close-inspector" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          ">×</button>
        </div>
      </div>

      ${this.expanded ? `
        <div class="compact-inspector-content" style="padding: 16px;">
          <!-- Inspect Mode Toggle -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
          ">
            <span style="font-size: 13px; color: rgba(255, 255, 255, 0.8);">Inspect Mode</span>
            <label style="
              position: relative;
              display: inline-block;
              width: 44px;
              height: 24px;
            ">
              <input type="checkbox" class="inspect-toggle" ${this.options.inspectMode ? 'checked' : ''} style="
                opacity: 0;
                width: 0;
                height: 0;
              ">
              <span style="
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: ${this.options.inspectMode ? '#10b981' : '#374151'};
                transition: .4s;
                border-radius: 24px;
              ">
                <span style="
                  position: absolute;
                  content: '';
                  height: 18px;
                  width: 18px;
                  left: ${this.options.inspectMode ? '23px' : '3px'};
                  bottom: 3px;
                  background-color: white;
                  transition: .4s;
                  border-radius: 50%;
                "></span>
              </span>
            </label>
          </div>

          ${selectedElement ? `
            <!-- Element Info -->
            <div style="margin-bottom: 16px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
              ">
                <span style="
                  background: #3b82f6;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 600;
                ">${selectedElement.tagName.toLowerCase()}</span>
                <span style="
                  color: rgba(255, 255, 255, 0.6);
                  font-size: 12px;
                ">${this.dimensions.width} × ${this.dimensions.height}px</span>
              </div>
            </div>

            <!-- Add Class Input -->
            <div style="margin-bottom: 16px; position: relative;">
              <input 
                type="text" 
                class="class-input"
                placeholder="Add Tailwind class..."
                value="${this.newClass}"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  background: rgba(255, 255, 255, 0.05);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 13px;
                  outline: none;
                "
              >
              ${this.suggestions.length > 0 ? `
                <div class="suggestions" style="
                  position: absolute;
                  top: 100%;
                  left: 0;
                  right: 0;
                  background: rgba(20, 20, 20, 0.95);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 6px;
                  max-height: 200px;
                  overflow-y: auto;
                  z-index: 1000;
                  margin-top: 4px;
                ">
                  ${this.suggestions.slice(0, 10).map((suggestion, index) => `
                    <div class="suggestion-item ${index === this.selectedSuggestionIndex ? 'selected' : ''}" 
                         data-suggestion="${suggestion}"
                         style="
                      padding: 8px 12px;
                      cursor: pointer;
                      font-size: 12px;
                      background: ${index === this.selectedSuggestionIndex ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
                      color: ${index === this.selectedSuggestionIndex ? 'white' : 'rgba(255, 255, 255, 0.8)'};
                    ">
                      ${suggestion}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Tabs -->
            <div style="
              display: flex;
              gap: 4px;
              margin-bottom: 12px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 6px;
              padding: 2px;
            ">
              ${['all', 'layout', 'typography', 'colors', 'borders', 'effects'].map(tab => `
                <button class="tab-button" data-tab="${tab}" style="
                  flex: 1;
                  padding: 6px 8px;
                  background: ${this.activeTab === tab ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
                  border: none;
                  border-radius: 4px;
                  color: ${this.activeTab === tab ? 'white' : 'rgba(255, 255, 255, 0.6)'};
                  font-size: 11px;
                  cursor: pointer;
                  text-transform: capitalize;
                ">${tab}</button>
              `).join('')}
            </div>

            <!-- Classes List -->
            <div style="max-height: 300px; overflow-y: auto;">
              ${this.getFilteredClasses().map(className => {
                const isActive = !className.endsWith('__inactive');
                const cleanClassName = className.replace('__inactive', '');
                return `
                  <div class="class-item" data-class="${cleanClassName}" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 8px;
                    margin-bottom: 2px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                    cursor: pointer;
                  ">
                    <span style="
                      color: ${isActive ? 'white' : 'rgba(255, 255, 255, 0.4)'};
                      font-size: 12px;
                      text-decoration: ${isActive ? 'none' : 'line-through'};
                    ">${cleanClassName}</span>
                    <button class="toggle-class" data-class="${cleanClassName}" style="
                      background: none;
                      border: none;
                      color: ${isActive ? '#10b981' : 'rgba(255, 255, 255, 0.3)'};
                      cursor: pointer;
                      font-size: 16px;
                    ">${isActive ? '✓' : '○'}</button>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="
              text-align: center;
              padding: 40px 20px;
              color: rgba(255, 255, 255, 0.6);
            ">
              <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
              <p>Click any element to inspect its Tailwind classes</p>
            </div>
          `}
        </div>
      ` : ''}
    `;

    // Re-bind events after render
    this.bindElementEvents();
  }

  private getFilteredClasses(): string[] {
    const elementClasses = this.options.elementClasses;
    
    if (this.activeTab === 'all') {
      return elementClasses;
    }

    const filters: { [key: string]: string[] } = {
      layout: ['flex', 'grid', 'block', 'inline', 'hidden', 'container', 'w-', 'h-', 'p-', 'm-', 'gap-'],
      typography: ['text-', 'font-', 'leading-', 'tracking-', 'uppercase', 'lowercase', 'capitalize'],
      colors: ['text-', 'bg-', 'border-'],
      borders: ['border', 'rounded'],
      effects: ['shadow', 'opacity-', 'transform', 'transition', 'hover:', 'focus:']
    };

    const filterKeywords = filters[this.activeTab] || [];
    return elementClasses.filter(className => {
      const cleanClassName = className.replace('__inactive', '');
      return filterKeywords.some(keyword => cleanClassName.includes(keyword));
    });
  }

  private bindEvents(): void {
    // Handle class suggestions
    this.updateSuggestions();
  }

  private bindElementEvents(): void {
    if (!this.element) return;

    // Close button
    const closeBtn = this.element.querySelector('.close-inspector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.options.onClose();
      });
    }

    // Expand/collapse button
    const expandBtn = this.element.querySelector('.toggle-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        this.expanded = !this.expanded;
        this.render();
      });
    }

    // Inspect mode toggle
    const inspectToggle = this.element.querySelector('.inspect-toggle') as HTMLInputElement;
    if (inspectToggle) {
      inspectToggle.addEventListener('change', () => {
        this.options.onToggleInspectMode(inspectToggle.checked);
      });
    }

    // Class input
    this.inputElement = this.element.querySelector('.class-input') as HTMLInputElement;
    if (this.inputElement) {
      this.inputElement.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.newClass = target.value;
        this.updateSuggestions();
        this.render();
      });

      this.inputElement.addEventListener('keydown', (e) => {
        this.handleInputKeydown(e);
      });
    }

    // Tab buttons
    const tabButtons = this.element.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tab = target.getAttribute('data-tab');
        if (tab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    // Class toggle buttons
    const toggleButtons = this.element.querySelectorAll('.toggle-class');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const className = target.getAttribute('data-class');
        if (className) {
          this.options.onToggleClass(className);
        }
      });
    });

    // Suggestion items
    const suggestionItems = this.element.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const suggestion = target.getAttribute('data-suggestion');
        if (suggestion) {
          this.addClassFromSuggestion(suggestion);
        }
      });
    });
  }

  private updateSuggestions(): void {
    if (this.newClass.trim() === '') {
      this.suggestions = [];
      this.selectedSuggestionIndex = 0;
      return;
    }

    // Filter suggestions based on input
    let prefixMatches: string[] = [];
    if (this.newClass.length === 1) {
      prefixMatches = tailwindClasses.filter((cls) => {
        const parts = cls.split('-');
        return parts[0] === this.newClass || parts[0].startsWith(this.newClass);
      });
    } else if (this.newClass.includes('-')) {
      const prefix = this.newClass.endsWith('-') ? this.newClass : this.newClass + '-';
      prefixMatches = tailwindClasses.filter((cls) => cls.startsWith(prefix));
    }

    const startsWithMatches = tailwindClasses.filter(
      (cls) => !prefixMatches.includes(cls) && cls.toLowerCase().startsWith(this.newClass.toLowerCase())
    );

    const containsMatches = tailwindClasses.filter(
      (cls) =>
        !prefixMatches.includes(cls) &&
        !startsWithMatches.includes(cls) &&
        cls.toLowerCase().includes(this.newClass.toLowerCase())
    );

    const exactMatches = this.allClasses.filter(
      (cls) =>
        !prefixMatches.includes(cls) &&
        !startsWithMatches.includes(cls) &&
        !containsMatches.includes(cls) &&
        cls.toLowerCase().includes(this.newClass.toLowerCase()) &&
        cls.includes('[') &&
        cls.includes(']')
    );

    this.suggestions = [...prefixMatches, ...startsWithMatches, ...containsMatches, ...exactMatches].slice(0, 10);
    this.selectedSuggestionIndex = 0;
  }

  private handleInputKeydown(e: KeyboardEvent): void {
    if (this.suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
        this.render();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
        this.render();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.suggestions[this.selectedSuggestionIndex]) {
          this.addClassFromSuggestion(this.suggestions[this.selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        this.suggestions = [];
        this.render();
        break;
    }
  }

  private addClassFromSuggestion(suggestion: string): void {
    this.options.onAddClass(suggestion);
    this.newClass = '';
    this.suggestions = [];
    this.render();
    
    // Focus back to input
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  public updateOptions(options: Partial<CompactInspectorOptions>): void {
    this.options = { ...this.options, ...options };
    this.render();
  }

  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.removeAllListeners();
  }
}