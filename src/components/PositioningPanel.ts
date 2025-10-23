/**
 * PositioningPanel - Panel de posicionamiento CSS
 * Maneja position, top, right, bottom, left
 */

export interface PositioningProperties {
  position: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export class PositioningPanel {
  private container: HTMLElement;
  private properties: PositioningProperties;
  private onChange?: (props: PositioningProperties) => void;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: PositioningProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      position: 'static',
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto'
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'positioning-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="positioning-container">
        <!-- Position Type -->
        <div class="positioning-field">
          <label class="positioning-label">Position</label>
          <select class="positioning-select" data-property="position">
            <option value="static" ${this.properties.position === 'static' ? 'selected' : ''}>static</option>
            <option value="relative" ${this.properties.position === 'relative' ? 'selected' : ''}>relative</option>
            <option value="absolute" ${this.properties.position === 'absolute' ? 'selected' : ''}>absolute</option>
            <option value="fixed" ${this.properties.position === 'fixed' ? 'selected' : ''}>fixed</option>
            <option value="sticky" ${this.properties.position === 'sticky' ? 'selected' : ''}>sticky</option>
          </select>
        </div>

        <!-- Offsets Grid -->
        <div class="positioning-offsets-grid">
          <!-- Top -->
          <div class="positioning-offset-field">
            <label class="positioning-offset-label">top</label>
            <input 
              type="text" 
              class="positioning-offset-input" 
              data-property="top"
              value="${this.properties.top}"
              placeholder="auto"
              ${this.properties.position === 'static' ? 'disabled' : ''}
            >
          </div>

          <!-- Right -->
          <div class="positioning-offset-field">
            <label class="positioning-offset-label">right</label>
            <input 
              type="text" 
              class="positioning-offset-input" 
              data-property="right"
              value="${this.properties.right}"
              placeholder="auto"
              ${this.properties.position === 'static' ? 'disabled' : ''}
            >
          </div>

          <!-- Bottom -->
          <div class="positioning-offset-field">
            <label class="positioning-offset-label">bottom</label>
            <input 
              type="text" 
              class="positioning-offset-input" 
              data-property="bottom"
              value="${this.properties.bottom}"
              placeholder="auto"
              ${this.properties.position === 'static' ? 'disabled' : ''}
            >
          </div>

          <!-- Left -->
          <div class="positioning-offset-field">
            <label class="positioning-offset-label">left</label>
            <input 
              type="text" 
              class="positioning-offset-input" 
              data-property="left"
              value="${this.properties.left}"
              placeholder="auto"
              ${this.properties.position === 'static' ? 'disabled' : ''}
            >
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Position select
    const positionSelect = this.container.querySelector('[data-property="position"]') as HTMLSelectElement;
    if (positionSelect) {
      positionSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as PositioningProperties['position'];
        this.properties.position = value;
        
        // Re-render para habilitar/deshabilitar inputs
        this.render();
        this.attachEventListeners();
        
        if (this.onChange) {
          this.onChange({ ...this.properties });
        }
      });
    }

    // Offset inputs
    this.container.querySelectorAll('.positioning-offset-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const inputElement = e.target as HTMLInputElement;
        const property = inputElement.dataset.property as 'top' | 'right' | 'bottom' | 'left';
        
        if (property) {
          let value = inputElement.value.trim();
          
          // Si está vacío, usar 'auto'
          if (value === '') {
            value = 'auto';
          }
          
          // Si es un número sin unidad, agregar 'px'
          if (/^\d+$/.test(value)) {
            value = value + 'px';
          }
          
          this.properties[property] = value;
          
          if (this.onChange) {
            this.onChange({ ...this.properties });
          }
        }
      });
    });
  }

  public setProperties(props: Partial<PositioningProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): PositioningProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}
