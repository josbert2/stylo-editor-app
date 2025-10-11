import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';
import { tailwindClasses } from '../utils/tailwindClasses';
import { useDomClasses } from '../utils/useDomClasses';

export interface InspectFlowOptions {
  onElementSelected?: (element: HTMLElement) => void;
  onClassToggled?: (className: string, element: HTMLElement) => void;
  onClassAdded?: (className: string, element: HTMLElement) => void;
}

export class InspectFlow extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private inspectFlowElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private inspectMode: boolean = false;
  private selectedElement: HTMLElement | null = null;
  private elementClasses: string[] = [];
  private hoveredElement: HTMLElement | null = null;
  private hoverRect: DOMRect | null = null;
  private panelPosition = { x: 20, y: 20 };
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private newClass = '';
  private suggestions: string[] = [];
  private selectedSuggestionIndex = 0;
  private activeTab = 'all';
  private allClasses: string[] = [];

  constructor(container: HTMLElement, options: InspectFlowOptions = {}) {
    super();
    this.container = container;
    this.createInspectFlow();
    this.bindEvents();
    this.scanDOMForClasses();
  }

  private createInspectFlow(): void {
    this.inspectFlowElement = document.createElement('div');
    this.inspectFlowElement.className = 'stylo-inspect-flow';
    this.inspectFlowElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: none;
    `;

    this.inspectFlowElement.innerHTML = `
      <div class="inspect-flow-toggle" style="
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span class="inspect-mode-text">Inspect Mode</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.inspectFlowElement);
  }

  private createPanel(): void {
    if (this.panelElement) return;

    this.panelElement = document.createElement('div');
    this.panelElement.className = 'stylo-inspect-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      left: ${this.panelPosition.x}px;
      top: ${this.panelPosition.y}px;
      width: 350px;
      max-height: 500px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border-radius: 12px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10001;
      overflow: hidden;
      display: none;
    `;

    this.renderPanelContent();
    this.container.appendChild(this.panelElement);
  }

  private renderPanelContent(): void {
    if (!this.panelElement || !this.selectedElement) return;

    const elementTag = this.selectedElement.tagName.toLowerCase();
    const rect = this.selectedElement.getBoundingClientRect();
    const dimensions = {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };

    this.panelElement.innerHTML = `
      <div class="panel-header drag-handle" style="
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <div style="font-weight: 600; font-size: 14px;">${elementTag}</div>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
            ${dimensions.width} × ${dimensions.height}px
          </div>
        </div>
        <button class="close-panel" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="panel-content" style="padding: 16px; max-height: 400px; overflow-y: auto;">
        <!-- Tabs -->
        <div class="tabs" style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all" style="
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: ${this.activeTab === 'all' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            cursor: pointer;
            font-size: 12px;
          ">All</button>
          <button class="tab-btn ${this.activeTab === 'layout' ? 'active' : ''}" data-tab="layout" style="
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: ${this.activeTab === 'layout' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            cursor: pointer;
            font-size: 12px;
          ">Layout</button>
          <button class="tab-btn ${this.activeTab === 'type' ? 'active' : ''}" data-tab="type" style="
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: ${this.activeTab === 'type' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            cursor: pointer;
            font-size: 12px;
          ">Type</button>
          <button class="tab-btn ${this.activeTab === 'color' ? 'active' : ''}" data-tab="color" style="
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: ${this.activeTab === 'color' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            cursor: pointer;
            font-size: 12px;
          ">Color</button>
        </div>

        <!-- Add Class Input -->
        <div class="add-class-section" style="margin-bottom: 16px;">
          <div style="position: relative;">
            <input 
              type="text" 
              placeholder="Add class..." 
              class="class-input"
              value="${this.newClass}"
              style="
                width: 100%;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
                outline: none;
              "
            />
            ${this.suggestions.length > 0 ? this.renderSuggestions() : ''}
          </div>
        </div>

        <!-- Classes List -->
        <div class="classes-list">
          ${this.renderClassesList()}
        </div>
      </div>
    `;
  }

  private renderSuggestions(): string {
    return `
      <div class="suggestions" style="
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
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
                 font-size: 13px;
                 background: ${index === this.selectedSuggestionIndex ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
                 border-bottom: ${index < this.suggestions.slice(0, 10).length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'};
               ">
            ${suggestion}
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderClassesList(): string {
    const filteredClasses = this.getFilteredClasses();
    
    return filteredClasses.map(className => {
      const isActive = this.selectedElement?.classList.contains(className.replace('__inactive', ''));
      const isInactive = className.endsWith('__inactive');
      const displayName = className.replace('__inactive', '');
      
      return `
        <div class="class-item" data-class="${displayName}" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          cursor: pointer;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 3px;
              background: ${isActive && !isInactive ? '#10b981' : 'rgba(255, 255, 255, 0.2)'};
              border: 1px solid ${isActive && !isInactive ? '#10b981' : 'rgba(255, 255, 255, 0.3)'};
            "></div>
            <span style="
              font-size: 13px;
              color: ${isActive && !isInactive ? 'white' : 'rgba(255, 255, 255, 0.7)'};
            ">${displayName}</span>
          </div>
          <button class="remove-class" data-class="${displayName}" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            padding: 2px;
            opacity: 0;
            transition: opacity 0.2s;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  private getFilteredClasses(): string[] {
    switch (this.activeTab) {
      case 'layout':
        return this.elementClasses.filter(cls => 
          cls.includes('flex') || cls.includes('grid') || cls.includes('block') || 
          cls.includes('inline') || cls.includes('hidden') || cls.includes('w-') || 
          cls.includes('h-') || cls.includes('p-') || cls.includes('m-')
        );
      case 'type':
        return this.elementClasses.filter(cls => 
          cls.includes('text-') || cls.includes('font-') || cls.includes('leading-') || 
          cls.includes('tracking-') || cls.includes('uppercase') || cls.includes('lowercase')
        );
      case 'color':
        return this.elementClasses.filter(cls => 
          cls.includes('bg-') || cls.includes('text-') && (
            cls.includes('red') || cls.includes('blue') || cls.includes('green') || 
            cls.includes('yellow') || cls.includes('purple') || cls.includes('pink') ||
            cls.includes('gray') || cls.includes('black') || cls.includes('white')
          )
        );
      default:
        return this.elementClasses;
    }
  }

  private bindEvents(): void {
    if (!this.inspectFlowElement) return;

    // Toggle inspect mode
    const toggleBtn = this.inspectFlowElement.querySelector('.inspect-flow-toggle');
    toggleBtn?.addEventListener('click', () => {
      this.toggleInspectMode();
    });

    // Global click handler for inspect mode
    document.addEventListener('click', (e) => {
      if (!this.inspectMode) return;
      
      // Don't select elements within our UI
      if (this.inspectFlowElement?.contains(e.target as Node)) return;
      if (this.panelElement?.contains(e.target as Node)) return;

      e.preventDefault();
      e.stopPropagation();

      const element = e.target as HTMLElement;
      this.selectElement(element);
    }, true);

    // Hover effects for inspect mode
    document.addEventListener('mouseover', (e) => {
      if (!this.inspectMode) return;
      
      if (this.inspectFlowElement?.contains(e.target as Node)) return;
      if (this.panelElement?.contains(e.target as Node)) return;

      const element = e.target as HTMLElement;
      this.setHoveredElement(element);
    }, true);

    document.addEventListener('mouseout', () => {
      if (!this.inspectMode) return;
      this.setHoveredElement(null);
    }, true);
  }

  private bindPanelEvents(): void {
    if (!this.panelElement) return;

    // Close panel
    const closeBtn = this.panelElement.querySelector('.close-panel');
    closeBtn?.addEventListener('click', () => {
      this.hidePanel();
    });

    // Tab switching
    const tabBtns = this.panelElement.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).getAttribute('data-tab');
        if (tab) {
          this.activeTab = tab;
          this.renderPanelContent();
          this.bindPanelEvents();
        }
      });
    });

    // Class input
    const classInput = this.panelElement.querySelector('.class-input') as HTMLInputElement;
    classInput?.addEventListener('input', (e) => {
      this.newClass = (e.target as HTMLInputElement).value;
      this.updateSuggestions();
      this.renderPanelContent();
      this.bindPanelEvents();
    });

    classInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.suggestions.length > 0) {
          this.addClass(this.suggestions[this.selectedSuggestionIndex]);
        } else if (this.newClass.trim()) {
          this.addClass(this.newClass.trim());
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
        this.renderPanelContent();
        this.bindPanelEvents();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, 0);
        this.renderPanelContent();
        this.bindPanelEvents();
      }
    });

    // Suggestion clicks
    const suggestionItems = this.panelElement.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const suggestion = (e.target as HTMLElement).getAttribute('data-suggestion');
        if (suggestion) {
          this.addClass(suggestion);
        }
      });
    });

    // Class toggle
    const classItems = this.panelElement.querySelectorAll('.class-item');
    classItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('remove-class')) return;
        
        const className = (e.currentTarget as HTMLElement).getAttribute('data-class');
        if (className) {
          this.toggleClass(className);
        }
      });

      // Show/hide remove button on hover
      item.addEventListener('mouseenter', () => {
        const removeBtn = item.querySelector('.remove-class') as HTMLElement;
        if (removeBtn) removeBtn.style.opacity = '1';
      });

      item.addEventListener('mouseleave', () => {
        const removeBtn = item.querySelector('.remove-class') as HTMLElement;
        if (removeBtn) removeBtn.style.opacity = '0';
      });
    });

    // Remove class buttons
    const removeBtns = this.panelElement.querySelectorAll('.remove-class');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const className = (e.currentTarget as HTMLElement).getAttribute('data-class');
        if (className) {
          this.removeClass(className);
        }
      });
    });

    // Panel dragging
    const dragHandle = this.panelElement.querySelector('.drag-handle');
    dragHandle?.addEventListener('mousedown', (e) => {
      this.startDragging(e as MouseEvent);
    });
  }

  private toggleInspectMode(): void {
    this.inspectMode = !this.inspectMode;
    
    const toggleText = this.inspectFlowElement?.querySelector('.inspect-mode-text');
    if (toggleText) {
      toggleText.textContent = this.inspectMode ? 'Exit Inspect' : 'Inspect Mode';
    }

    if (this.inspectMode) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = '';
      this.setHoveredElement(null);
      this.hidePanel();
    }
  }

  private selectElement(element: HTMLElement): void {
    this.selectedElement = element;
    this.elementClasses = Array.from(element.classList);
    
    // Position panel near the selected element
    const rect = element.getBoundingClientRect();
    this.panelPosition = {
      x: Math.min(window.innerWidth - 370, rect.right + 20),
      y: Math.max(20, rect.top)
    };

    this.showPanel();
    this.emit('element:selected', element);
  }

  private setHoveredElement(element: HTMLElement | null): void {
    // Remove previous hover highlight
    if (this.hoveredElement) {
      this.hoveredElement.style.outline = '';
      this.hoveredElement.style.backgroundColor = '';
    }

    this.hoveredElement = element;
    
    if (element) {
      this.hoverRect = element.getBoundingClientRect();
      element.style.outline = '2px solid #3b82f6';
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    } else {
      this.hoverRect = null;
    }
  }

  private showPanel(): void {
    this.createPanel();
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
      this.panelElement.style.left = `${this.panelPosition.x}px`;
      this.panelElement.style.top = `${this.panelPosition.y}px`;
      this.renderPanelContent();
      this.bindPanelEvents();
    }
  }

  private hidePanel(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
    this.selectedElement = null;
    this.elementClasses = [];
  }

  private updateSuggestions(): void {
    if (this.newClass.trim() === '') {
      this.suggestions = [];
      this.selectedSuggestionIndex = 0;
      return;
    }

    // Filter suggestions based on input
    let matches: string[] = [];
    
    if (this.newClass.length === 1) {
      matches = tailwindClasses.filter(cls => {
        const parts = cls.split('-');
        return parts[0] === this.newClass || parts[0].startsWith(this.newClass);
      });
    } else if (this.newClass.includes('-')) {
      const prefix = this.newClass.endsWith('-') ? this.newClass : this.newClass + '-';
      matches = tailwindClasses.filter(cls => cls.startsWith(prefix));
    }

    const startsWithMatches = tailwindClasses.filter(
      cls => !matches.includes(cls) && cls.toLowerCase().startsWith(this.newClass.toLowerCase())
    );

    const containsMatches = tailwindClasses.filter(
      cls => !matches.includes(cls) && !startsWithMatches.includes(cls) && 
            cls.toLowerCase().includes(this.newClass.toLowerCase())
    );

    const domMatches = this.allClasses.filter(
      cls => !matches.includes(cls) && !startsWithMatches.includes(cls) && 
            !containsMatches.includes(cls) && cls.toLowerCase().includes(this.newClass.toLowerCase())
    );

    this.suggestions = [...matches, ...startsWithMatches, ...containsMatches, ...domMatches].slice(0, 10);
    this.selectedSuggestionIndex = 0;
  }

  private addClass(className: string): void {
    if (!this.selectedElement || !className.trim()) return;

    this.selectedElement.classList.add(className);
    this.elementClasses = Array.from(this.selectedElement.classList);
    this.newClass = '';
    this.suggestions = [];
    this.renderPanelContent();
    this.bindPanelEvents();
    
    this.emit('styles:updated', this.getElementStyles());
  }

  private toggleClass(className: string): void {
    if (!this.selectedElement) return;

    if (this.selectedElement.classList.contains(className)) {
      this.selectedElement.classList.remove(className);
    } else {
      this.selectedElement.classList.add(className);
    }

    this.elementClasses = Array.from(this.selectedElement.classList);
    this.renderPanelContent();
    this.bindPanelEvents();
    
    this.emit('styles:updated', this.getElementStyles());
  }

  private removeClass(className: string): void {
    if (!this.selectedElement) return;

    this.selectedElement.classList.remove(className);
    this.elementClasses = Array.from(this.selectedElement.classList);
    this.renderPanelContent();
    this.bindPanelEvents();
    
    this.emit('styles:updated', this.getElementStyles());
  }

  private startDragging(e: MouseEvent): void {
    if (!this.panelElement) return;

    this.isDragging = true;
    const rect = this.panelElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDragging || !this.panelElement) return;

      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;

      // Keep panel within viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - this.panelElement.offsetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - this.panelElement.offsetHeight));

      this.panelPosition = { x: newX, y: newY };
      this.panelElement.style.left = `${newX}px`;
      this.panelElement.style.top = `${newY}px`;
    };

    const handleMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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

  private getElementStyles(): any {
    if (!this.selectedElement) return {};
    
    const computedStyles = window.getComputedStyle(this.selectedElement);
    return {
      // Return relevant style information
      classes: Array.from(this.selectedElement.classList),
      computedStyles: {
        display: computedStyles.display,
        position: computedStyles.position,
        width: computedStyles.width,
        height: computedStyles.height,
        // Add more as needed
      }
    };
  }

  public show(): void {
    if (this.inspectFlowElement) {
      this.inspectFlowElement.style.display = 'block';
      this.isVisible = true;
    }
  }

  public hide(): void {
    if (this.inspectFlowElement) {
      this.inspectFlowElement.style.display = 'none';
      this.isVisible = false;
    }
    this.hidePanel();
    if (this.inspectMode) {
      this.toggleInspectMode();
    }
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public destroy(): void {
    if (this.inspectFlowElement) {
      this.inspectFlowElement.remove();
      this.inspectFlowElement = null;
    }
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }
    this.removeAllListeners();
  }
}