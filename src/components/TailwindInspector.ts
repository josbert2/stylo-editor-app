import { EventEmitter } from '../utils/EventEmitter';
import { tailwindClasses } from '../utils/tailwindClasses';
import { useDomClasses } from '../utils/useDomClasses';

export interface TailwindInspectorOptions {
  container: HTMLElement;
  onClose?: () => void;
}

export class TailwindInspector extends EventEmitter<any> {
  private container: HTMLElement;
  private element: HTMLElement | null = null;
  private inspectMode: boolean = false;
  private selectedElement: HTMLElement | null = null;
  private elementClasses: string[] = [];
  private panelPosition = { x: 20, y: 20 };
  private hoveredElement: HTMLElement | null = null;
  private hoverRect: DOMRect | null = null;
  private panelRef: HTMLElement | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private domClasses: { allClasses: string[]; cleanup: () => void };
  private onClose?: () => void;

  constructor(options: TailwindInspectorOptions) {
    super();
    this.container = options.container;
    this.onClose = options.onClose;
    this.domClasses = useDomClasses();
    this.createElement();
    this.bindEvents();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'tailwind-inspector';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    this.element.innerHTML = `
      <div class="tailwind-inspector-header" style="
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      ">
        <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Tailwind Classes</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="inspect-toggle" style="
            background: ${this.inspectMode ? '#10b981' : 'rgba(255, 255, 255, 0.1)'};
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            color: white;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            ${this.inspectMode ? 'Stop' : 'Inspect'}
          </button>
          <button class="close-btn" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: color 0.2s;
          ">✕</button>
        </div>
      </div>
      <div class="tailwind-inspector-content" style="
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      ">
        <div class="element-info" style="
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          display: none;
        ">
          <div class="element-tag" style="
            font-size: 12px;
            color: #10b981;
            margin-bottom: 4px;
          "></div>
          <div class="element-dimensions" style="
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
          "></div>
        </div>
        <div class="classes-container">
          <div class="add-class-section" style="margin-bottom: 16px;">
            <input type="text" class="class-input" placeholder="Add class..." style="
              width: 100%;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              padding: 8px 12px;
              color: white;
              font-size: 12px;
              outline: none;
            ">
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
              display: none;
            "></div>
          </div>
          <div class="tabs" style="
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          ">
            <button class="tab-btn active" data-tab="all" style="
              background: none;
              border: none;
              color: white;
              padding: 8px 12px;
              font-size: 11px;
              cursor: pointer;
              border-bottom: 2px solid transparent;
              transition: all 0.2s;
            ">All</button>
            <button class="tab-btn" data-tab="layout" style="
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              padding: 8px 12px;
              font-size: 11px;
              cursor: pointer;
              border-bottom: 2px solid transparent;
              transition: all 0.2s;
            ">Layout</button>
            <button class="tab-btn" data-tab="typography" style="
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              padding: 8px 12px;
              font-size: 11px;
              cursor: pointer;
              border-bottom: 2px solid transparent;
              transition: all 0.2s;
            ">Type</button>
            <button class="tab-btn" data-tab="colors" style="
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              padding: 8px 12px;
              font-size: 11px;
              cursor: pointer;
              border-bottom: 2px solid transparent;
              transition: all 0.2s;
            ">Colors</button>
          </div>
          <div class="classes-list" style="
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          "></div>
        </div>
      </div>
    `;

    this.panelRef = this.element;
    this.container.appendChild(this.element);
  }

  private bindEvents(): void {
    if (!this.element) return;

    // Close button
    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      this.destroy();
      this.onClose?.();
    });

    // Inspect toggle
    const inspectToggle = this.element.querySelector('.inspect-toggle');
    inspectToggle?.addEventListener('click', () => {
      this.toggleInspectMode();
    });

    // Tab buttons
    const tabBtns = this.element.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tab = target.dataset.tab;
        this.setActiveTab(tab || 'all');
      });
    });

    // Class input
    const classInput = this.element.querySelector('.class-input') as HTMLInputElement;
    classInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleClassInput(target.value);
    });

    classInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLInputElement;
        this.addClass(target.value);
        target.value = '';
        this.hideSuggestions();
      }
    });

    // Dragging
    const header = this.element.querySelector('.tailwind-inspector-header');
    header?.addEventListener('mousedown', (e) => {
      this.startDrag(e as MouseEvent);
    });

    // Global mouse events for dragging
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.handleDrag(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Inspect mode events
    this.bindInspectEvents();
  }

  private bindInspectEvents(): void {
    document.addEventListener('click', this.handleInspectClick.bind(this), true);
    document.addEventListener('mouseover', this.handleInspectHover.bind(this), true);
    document.addEventListener('mouseout', this.handleInspectOut.bind(this), true);
  }

  private handleInspectClick(e: MouseEvent): void {
    if (!this.inspectMode) return;

    // Don't select elements within our inspector
    if (this.element?.contains(e.target as Node)) return;

    e.preventDefault();
    e.stopPropagation();

    const element = e.target as HTMLElement;
    this.selectElement(element);
  }

  private handleInspectHover(e: MouseEvent): void {
    if (!this.inspectMode) return;
    if (this.element?.contains(e.target as Node)) return;

    const element = e.target as HTMLElement;
    this.hoveredElement = element;
    this.hoverRect = element.getBoundingClientRect();
    this.showHoverOverlay();
  }

  private handleInspectOut(): void {
    this.hoveredElement = null;
    this.hoverRect = null;
    this.hideHoverOverlay();
  }

  private showHoverOverlay(): void {
    if (!this.hoverRect) return;

    let overlay = document.getElementById('tailwind-hover-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tailwind-hover-overlay';
      document.body.appendChild(overlay);
    }

    overlay.style.cssText = `
      position: fixed;
      top: ${this.hoverRect.top}px;
      left: ${this.hoverRect.left}px;
      width: ${this.hoverRect.width}px;
      height: ${this.hoverRect.height}px;
      background: rgba(16, 185, 129, 0.2);
      border: 2px solid #10b981;
      pointer-events: none;
      z-index: 9999;
      transition: all 0.1s ease;
    `;
  }

  private hideHoverOverlay(): void {
    const overlay = document.getElementById('tailwind-hover-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  private selectElement(element: HTMLElement): void {
    this.selectedElement = element;
    this.elementClasses = Array.from(element.classList);
    this.updateElementInfo();
    this.updateClassesList();
    this.hideHoverOverlay();
  }

  private updateElementInfo(): void {
    if (!this.selectedElement || !this.element) return;

    const elementInfo = this.element.querySelector('.element-info');
    const elementTag = this.element.querySelector('.element-tag');
    const elementDimensions = this.element.querySelector('.element-dimensions');

    if (elementInfo && elementTag && elementDimensions) {
      const rect = this.selectedElement.getBoundingClientRect();
      
      elementTag.textContent = this.selectedElement.tagName.toLowerCase();
      elementDimensions.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
      
      (elementInfo as HTMLElement).style.display = 'block';
    }
  }

  private updateClassesList(): void {
    if (!this.element) return;

    const classesList = this.element.querySelector('.classes-list');
    if (!classesList) return;

    classesList.innerHTML = '';

    this.elementClasses.forEach(className => {
      const classChip = document.createElement('div');
      classChip.style.cssText = `
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        color: #10b981;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      `;
      
      classChip.innerHTML = `
        <span>${className}</span>
        <button style="
          background: none;
          border: none;
          color: rgba(16, 185, 129, 0.7);
          cursor: pointer;
          padding: 0;
          font-size: 10px;
        ">×</button>
      `;

      const removeBtn = classChip.querySelector('button');
      removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeClass(className);
      });

      classesList.appendChild(classChip);
    });
  }

  private toggleInspectMode(): void {
    this.inspectMode = !this.inspectMode;
    
    const inspectToggle = this.element?.querySelector('.inspect-toggle');
    if (inspectToggle) {
      (inspectToggle as HTMLElement).style.background = this.inspectMode ? '#10b981' : 'rgba(255, 255, 255, 0.1)';
      inspectToggle.textContent = this.inspectMode ? 'Stop' : 'Inspect';
    }

    document.body.style.cursor = this.inspectMode ? 'crosshair' : '';

    if (!this.inspectMode) {
      this.hideHoverOverlay();
    }
  }

  private setActiveTab(tab: string): void {
    if (!this.element) return;

    const tabBtns = this.element.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tab;
      (btn as HTMLElement).style.color = isActive ? 'white' : 'rgba(255, 255, 255, 0.6)';
      (btn as HTMLElement).style.borderBottomColor = isActive ? '#10b981' : 'transparent';
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private handleClassInput(value: string): void {
    if (!value.trim()) {
      this.hideSuggestions();
      return;
    }

    const suggestions = this.getSuggestions(value);
    this.showSuggestions(suggestions);
  }

  private getSuggestions(input: string): string[] {
    const allClasses = [...tailwindClasses, ...this.domClasses.allClasses];
    
    return allClasses
      .filter(cls => cls.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 10);
  }

  private showSuggestions(suggestions: string[]): void {
    if (!this.element) return;

    const suggestionsEl = this.element.querySelector('.suggestions');
    if (!suggestionsEl) return;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    suggestionsEl.innerHTML = suggestions
      .map(suggestion => `
        <div class="suggestion-item" style="
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.1s;
        " data-class="${suggestion}">
          ${suggestion}
        </div>
      `)
      .join('');

    (suggestionsEl as HTMLElement).style.display = 'block';

    // Add click handlers
    const suggestionItems = suggestionsEl.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const className = item.getAttribute('data-class');
        if (className) {
          this.addClass(className);
          const input = this.element?.querySelector('.class-input') as HTMLInputElement;
          if (input) input.value = '';
          this.hideSuggestions();
        }
      });

      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
      });

      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.background = 'transparent';
      });
    });
  }

  private hideSuggestions(): void {
    if (!this.element) return;

    const suggestionsEl = this.element.querySelector('.suggestions');
    if (suggestionsEl) {
      (suggestionsEl as HTMLElement).style.display = 'none';
    }
  }

  private addClass(className: string): void {
    if (!this.selectedElement || !className.trim()) return;

    className = className.trim();
    if (!this.elementClasses.includes(className)) {
      this.selectedElement.classList.add(className);
      this.elementClasses.push(className);
      this.updateClassesList();
    }
  }

  private removeClass(className: string): void {
    if (!this.selectedElement) return;

    this.selectedElement.classList.remove(className);
    this.elementClasses = this.elementClasses.filter(cls => cls !== className);
    this.updateClassesList();
  }

  private startDrag(e: MouseEvent): void {
    this.isDragging = true;
    const rect = this.element?.getBoundingClientRect();
    if (rect) {
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.preventDefault();
  }

  private handleDrag(e: MouseEvent): void {
    if (!this.element) return;

    const newX = e.clientX - this.dragOffset.x;
    const newY = e.clientY - this.dragOffset.y;

    // Keep within viewport
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;

    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    this.element.style.left = `${clampedX}px`;
    this.element.style.top = `${clampedY}px`;
    this.element.style.right = 'auto';
  }

  public show(): void {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  public hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  public destroy(): void {
    this.inspectMode = false;
    document.body.style.cursor = '';
    this.hideHoverOverlay();
    
    // Remove event listeners
    document.removeEventListener('click', this.handleInspectClick.bind(this), true);
    document.removeEventListener('mouseover', this.handleInspectHover.bind(this), true);
    document.removeEventListener('mouseout', this.handleInspectOut.bind(this), true);
    
    this.domClasses.cleanup();
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    
    this.removeAllListeners();
  }
}