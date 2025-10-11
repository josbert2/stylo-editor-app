/**
 * Tailwind Inspector - Standalone JavaScript Version
 * Inspecciona y edita clases de Tailwind CSS en cualquier página web
 */

class TailwindInspectorStandalone {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onClose = options.onClose;
    this.element = null;
    this.inspectMode = false;
    this.selectedElement = null;
    this.elementClasses = [];
    this.hoveredElement = null;
    this.hoverRect = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.activeTab = 'all';
    
    // Tailwind classes básicas (puedes expandir esta lista)
    this.tailwindClasses = [
      // Layout
      'block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden',
      'container', 'mx-auto', 'w-full', 'h-full', 'min-h-screen',
      
      // Flexbox & Grid
      'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap', 'items-center', 'items-start', 'items-end',
      'justify-center', 'justify-start', 'justify-end', 'justify-between', 'justify-around',
      'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-12',
      
      // Spacing
      'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12', 'p-16', 'p-20',
      'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12', 'm-16', 'm-20',
      'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8',
      'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-6', 'mx-8', 'my-1', 'my-2', 'my-3', 'my-4', 'my-6', 'my-8',
      
      // Sizing
      'w-0', 'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24',
      'w-32', 'w-40', 'w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
      'h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24',
      'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96', 'h-auto', 'h-screen',
      
      // Colors
      'text-white', 'text-black', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400',
      'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
      'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-purple-500',
      'bg-white', 'bg-black', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400',
      'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      
      // Typography
      'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
      'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
      'text-left', 'text-center', 'text-right', 'text-justify',
      
      // Borders
      'border', 'border-0', 'border-2', 'border-4', 'border-8',
      'border-solid', 'border-dashed', 'border-dotted',
      'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500',
      'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
      
      // Effects
      'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
      'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
      
      // Positioning
      'relative', 'absolute', 'fixed', 'sticky',
      'top-0', 'right-0', 'bottom-0', 'left-0',
      'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
      
      // Display
      'overflow-hidden', 'overflow-visible', 'overflow-scroll', 'overflow-auto',
      'cursor-pointer', 'cursor-default', 'cursor-not-allowed',
      
      // Responsive prefixes
      'sm:block', 'md:block', 'lg:block', 'xl:block', '2xl:block',
      'sm:flex', 'md:flex', 'lg:flex', 'xl:flex', '2xl:flex',
      'sm:hidden', 'md:hidden', 'lg:hidden', 'xl:hidden', '2xl:hidden'
    ];
    
    this.init();
  }

  init() {
    this.createElement();
    this.bindEvents();
    this.bindInspectEvents();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'tailwind-inspector-standalone';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      display: none;
    `;

    this.element.innerHTML = `
      <div class="tailwind-inspector-header" style="
        padding: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
      ">
        <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #10b981;">🎨 Tailwind Inspector</h3>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="inspect-toggle" style="
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            color: white;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
          ">
            🔍 Inspect
          </button>
          <button class="close-btn" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: color 0.2s;
            font-size: 16px;
          ">✕</button>
        </div>
      </div>
      
      <div class="tailwind-inspector-content" style="
        padding: 16px;
        max-height: 500px;
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
            font-weight: 600;
          "></div>
          <div class="element-dimensions" style="
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
          "></div>
        </div>
        
        <div class="add-class-section" style="margin-bottom: 16px; position: relative;">
          <input type="text" class="class-input" placeholder="Agregar clase Tailwind..." style="
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 10px 12px;
            color: white;
            font-size: 12px;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
          ">
          <div class="suggestions" style="
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(20, 20, 20, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            margin-top: 4px;
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
            border-bottom: 2px solid #10b981;
            transition: all 0.2s;
            font-weight: 500;
          ">Todas</button>
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
          <button class="tab-btn" data-tab="colors" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            padding: 8px 12px;
            font-size: 11px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          ">Colores</button>
          <button class="tab-btn" data-tab="typography" style="
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            padding: 8px 12px;
            font-size: 11px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          ">Texto</button>
        </div>
        
        <div class="classes-list" style="
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-height: 40px;
        "></div>
        
        <div class="no-element-selected" style="
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          padding: 20px;
          display: block;
        ">
          👆 Haz clic en "Inspect" y selecciona un elemento para editar sus clases
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    if (!this.element) return;

    // Close button
    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      this.destroy();
      if (this.onClose) this.onClose();
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
        const tab = e.target.dataset.tab;
        this.setActiveTab(tab || 'all');
      });
    });

    // Class input
    const classInput = this.element.querySelector('.class-input');
    classInput?.addEventListener('input', (e) => {
      this.handleClassInput(e.target.value);
    });

    classInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.addClass(e.target.value);
        e.target.value = '';
        this.hideSuggestions();
      } else if (e.key === 'Escape') {
        this.hideSuggestions();
      }
    });

    classInput?.addEventListener('focus', () => {
      classInput.style.borderColor = '#10b981';
    });

    classInput?.addEventListener('blur', () => {
      classInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      setTimeout(() => this.hideSuggestions(), 200);
    });

    // Dragging
    const header = this.element.querySelector('.tailwind-inspector-header');
    header?.addEventListener('mousedown', (e) => {
      this.startDrag(e);
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
  }

  bindInspectEvents() {
    this.handleInspectClick = this.handleInspectClick.bind(this);
    this.handleInspectHover = this.handleInspectHover.bind(this);
    this.handleInspectOut = this.handleInspectOut.bind(this);
    
    document.addEventListener('click', this.handleInspectClick, true);
    document.addEventListener('mouseover', this.handleInspectHover, true);
    document.addEventListener('mouseout', this.handleInspectOut, true);
  }

  handleInspectClick(e) {
    if (!this.inspectMode) return;

    // Don't select elements within our inspector
    if (this.element?.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    this.selectElement(e.target);
  }

  handleInspectHover(e) {
    if (!this.inspectMode) return;
    if (this.element?.contains(e.target)) return;

    this.hoveredElement = e.target;
    this.hoverRect = e.target.getBoundingClientRect();
    this.showHoverOverlay();
  }

  handleInspectOut() {
    if (!this.inspectMode) return;
    this.hoveredElement = null;
    this.hoverRect = null;
    this.hideHoverOverlay();
  }

  showHoverOverlay() {
    if (!this.hoverRect) return;

    let overlay = document.getElementById('tailwind-hover-overlay-standalone');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tailwind-hover-overlay-standalone';
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
      z-index: 999998;
      transition: all 0.1s ease;
      box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
    `;
  }

  hideHoverOverlay() {
    const overlay = document.getElementById('tailwind-hover-overlay-standalone');
    if (overlay) {
      overlay.remove();
    }
  }

  selectElement(element) {
    this.selectedElement = element;
    this.elementClasses = Array.from(element.classList);
    this.updateElementInfo();
    this.updateClassesList();
    this.hideHoverOverlay();
    
    // Hide no element selected message
    const noElementMsg = this.element.querySelector('.no-element-selected');
    if (noElementMsg) {
      noElementMsg.style.display = 'none';
    }
  }

  updateElementInfo() {
    if (!this.selectedElement || !this.element) return;

    const elementInfo = this.element.querySelector('.element-info');
    const elementTag = this.element.querySelector('.element-tag');
    const elementDimensions = this.element.querySelector('.element-dimensions');

    if (elementInfo && elementTag && elementDimensions) {
      const rect = this.selectedElement.getBoundingClientRect();
      
      elementTag.textContent = `<${this.selectedElement.tagName.toLowerCase()}>`;
      elementDimensions.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
      
      elementInfo.style.display = 'block';
    }
  }

  updateClassesList() {
    if (!this.element) return;

    const classesList = this.element.querySelector('.classes-list');
    if (!classesList) return;

    classesList.innerHTML = '';

    if (this.elementClasses.length === 0) {
      classesList.innerHTML = `
        <div style="
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          text-align: center;
          width: 100%;
          padding: 10px;
        ">
          No hay clases CSS aplicadas
        </div>
      `;
      return;
    }

    this.elementClasses.forEach(className => {
      const classChip = document.createElement('div');
      classChip.style.cssText = `
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        color: #10b981;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      `;
      
      classChip.innerHTML = `
        <span>${className}</span>
        <button style="
          background: none;
          border: none;
          color: rgba(16, 185, 129, 0.7);
          cursor: pointer;
          padding: 0;
          font-size: 12px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        " title="Eliminar clase">×</button>
      `;

      // Hover effects
      classChip.addEventListener('mouseenter', () => {
        classChip.style.background = 'rgba(16, 185, 129, 0.3)';
        classChip.style.transform = 'translateY(-1px)';
      });

      classChip.addEventListener('mouseleave', () => {
        classChip.style.background = 'rgba(16, 185, 129, 0.2)';
        classChip.style.transform = 'translateY(0)';
      });

      const removeBtn = classChip.querySelector('button');
      removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeClass(className);
      });

      removeBtn?.addEventListener('mouseenter', () => {
        removeBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        removeBtn.style.color = '#ef4444';
      });

      removeBtn?.addEventListener('mouseleave', () => {
        removeBtn.style.background = 'none';
        removeBtn.style.color = 'rgba(16, 185, 129, 0.7)';
      });

      classesList.appendChild(classChip);
    });
  }

  toggleInspectMode() {
    this.inspectMode = !this.inspectMode;
    
    const inspectToggle = this.element?.querySelector('.inspect-toggle');
    if (inspectToggle) {
      inspectToggle.style.background = this.inspectMode ? '#10b981' : 'rgba(255, 255, 255, 0.1)';
      inspectToggle.innerHTML = this.inspectMode ? '⏹️ Stop' : '🔍 Inspect';
    }

    document.body.style.cursor = this.inspectMode ? 'crosshair' : '';

    if (!this.inspectMode) {
      this.hideHoverOverlay();
    }
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    
    if (!this.element) return;

    const tabBtns = this.element.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tab;
      btn.style.color = isActive ? 'white' : 'rgba(255, 255, 255, 0.6)';
      btn.style.borderBottomColor = isActive ? '#10b981' : 'transparent';
      btn.style.fontWeight = isActive ? '500' : 'normal';
    });
  }

  handleClassInput(value) {
    if (!value.trim()) {
      this.hideSuggestions();
      return;
    }

    const suggestions = this.getSuggestions(value);
    this.showSuggestions(suggestions);
  }

  getSuggestions(input) {
    return this.tailwindClasses
      .filter(cls => cls.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 8);
  }

  showSuggestions(suggestions) {
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
          padding: 10px 12px;
          cursor: pointer;
          font-size: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.1s;
          color: rgba(255, 255, 255, 0.9);
        " data-class="${suggestion}">
          ${suggestion}
        </div>
      `)
      .join('');

    suggestionsEl.style.display = 'block';

    // Add click handlers
    const suggestionItems = suggestionsEl.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const className = item.getAttribute('data-class');
        if (className) {
          this.addClass(className);
          const input = this.element?.querySelector('.class-input');
          if (input) input.value = '';
          this.hideSuggestions();
        }
      });

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(16, 185, 129, 0.1)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
    });
  }

  hideSuggestions() {
    if (!this.element) return;

    const suggestionsEl = this.element.querySelector('.suggestions');
    if (suggestionsEl) {
      suggestionsEl.style.display = 'none';
    }
  }

  addClass(className) {
    if (!this.selectedElement || !className.trim()) return;

    className = className.trim();
    if (!this.elementClasses.includes(className)) {
      this.selectedElement.classList.add(className);
      this.elementClasses.push(className);
      this.updateClassesList();
      
      // Show success feedback
      this.showNotification(`✅ Clase "${className}" agregada`);
    }
  }

  removeClass(className) {
    if (!this.selectedElement) return;

    this.selectedElement.classList.remove(className);
    this.elementClasses = this.elementClasses.filter(cls => cls !== className);
    this.updateClassesList();
    
    // Show success feedback
    this.showNotification(`🗑️ Clase "${className}" eliminada`);
  }

  showNotification(message) {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000000;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  startDrag(e) {
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

  handleDrag(e) {
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

  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  isShown() {
    return this.element && this.element.style.display !== 'none';
  }

  destroy() {
    this.inspectMode = false;
    document.body.style.cursor = '';
    this.hideHoverOverlay();
    
    // Remove event listeners
    document.removeEventListener('click', this.handleInspectClick, true);
    document.removeEventListener('mouseover', this.handleInspectHover, true);
    document.removeEventListener('mouseout', this.handleInspectOut, true);
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Auto-initialize when script is loaded
window.TailwindInspectorStandalone = TailwindInspectorStandalone;

// Función de conveniencia para inicializar rápidamente
window.initTailwindInspector = function(options = {}) {
  const inspector = new TailwindInspectorStandalone(options);
  inspector.show();
  return inspector;
};

// Inicializar automáticamente si se detecta Tailwind CSS
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si Tailwind está presente
  const hasTailwind = document.querySelector('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"], [class*="flex"]');
  
  if (hasTailwind) {
    console.log('🎨 Tailwind CSS detectado! Usa initTailwindInspector() para abrir el inspector.');
    
    // Agregar botón flotante para abrir el inspector
    const floatingBtn = document.createElement('button');
    floatingBtn.innerHTML = '🎨';
    floatingBtn.title = 'Abrir Tailwind Inspector';
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
    `;
    
    floatingBtn.addEventListener('mouseenter', () => {
      floatingBtn.style.transform = 'scale(1.1)';
      floatingBtn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    });
    
    let inspector = null;
    floatingBtn.addEventListener('click', () => {
      if (!inspector || !inspector.isShown()) {
        inspector = initTailwindInspector();
        floatingBtn.style.display = 'none';
      }
    });
    
    document.body.appendChild(floatingBtn);
  }
});