/**
 * FiltersPanel - Panel de filtros CSS
 * Maneja blur, contrast, brightness, saturate, invert, grayscale, sepia, hue-rotate, etc.
 */

export interface FilterProperties {
  blur: number;          // 0-20 (px)
  contrast: number;      // 0-200 (%)
  brightness: number;    // 0-200 (%)
  saturate: number;      // 0-200 (%)
  invert: number;        // 0-100 (%)
  grayscale: number;     // 0-100 (%)
  sepia: number;         // 0-100 (%)
  hueRotate: number;     // 0-360 (deg)
  opacity: number;       // 0-100 (%)
}

export class FiltersPanel {
  private container: HTMLElement;
  private properties: FilterProperties;
  private onChange?: (props: FilterProperties) => void;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: FilterProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales (valores por defecto)
    this.properties = {
      blur: 0,
      contrast: 100,
      brightness: 100,
      saturate: 100,
      invert: 0,
      grayscale: 0,
      sepia: 0,
      hueRotate: 0,
      opacity: 100
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'filters-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="filters-container">
        ${this.renderFilterControl('blur', 'Blur', 0, 20, 'px')}
        ${this.renderFilterControl('contrast', 'Contrast', 0, 200, '%')}
        ${this.renderFilterControl('brightness', 'Brightness', 0, 200, '%')}
        ${this.renderFilterControl('saturate', 'Saturate', 0, 200, '%')}
        ${this.renderFilterControl('invert', 'Invert', 0, 100, '%')}
        ${this.renderFilterControl('grayscale', 'Grayscale', 0, 100, '%')}
        ${this.renderFilterControl('sepia', 'Sepia', 0, 100, '%')}
        ${this.renderFilterControl('hueRotate', 'Hue Rotate', 0, 360, 'deg')}
        ${this.renderFilterControl('opacity', 'Opacity', 0, 100, '%')}
      </div>
    `;
  }

  private renderFilterControl(
    property: keyof FilterProperties, 
    label: string, 
    min: number, 
    max: number, 
    unit: string
  ): string {
    const value = this.properties[property];
    const percentage = ((value - min) / (max - min)) * 100;
    
    return `
      <div class="filter-control" data-filter="${property}">
        <div class="filter-header">
          <label class="filter-label">${label}</label>
          <div class="filter-value-display">
            <input 
              type="text" 
              class="filter-value-input" 
              data-property="${property}"
              value="${value}"
            >
            <span class="filter-unit">${unit}</span>
          </div>
        </div>
        <div class="filter-slider-container">
          <input 
            type="range" 
            class="filter-slider" 
            data-property="${property}"
            min="${min}"
            max="${max}"
            step="${this.getStep(property)}"
            value="${value}"
            style="--value-percent: ${percentage}%"
          >
        </div>
      </div>
    `;
  }

  private getStep(property: keyof FilterProperties): number {
    if (property === 'blur') return 0.5;
    if (property === 'hueRotate') return 1;
    return 1;
  }

  private attachEventListeners(): void {
    // Sliders
    this.container.querySelectorAll('.filter-slider').forEach(slider => {
      slider.addEventListener('input', (e) => this.handleSliderChange(e));
    });

    // Value inputs
    this.container.querySelectorAll('.filter-value-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleInputChange(e));
      input.addEventListener('blur', (e) => this.handleInputBlur(e));
    });
  }

  private handleSliderChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const property = slider.dataset.property as keyof FilterProperties;
    
    if (property) {
      const value = parseFloat(slider.value);
      this.properties[property] = value;
      
      // Update value display
      const control = slider.closest('.filter-control');
      const valueInput = control?.querySelector('.filter-value-input') as HTMLInputElement;
      if (valueInput) {
        valueInput.value = String(value);
      }
      
      // Update slider gradient
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const percentage = ((value - min) / (max - min)) * 100;
      slider.style.setProperty('--value-percent', `${percentage}%`);
      
      if (this.onChange) {
        this.onChange({ ...this.properties });
      }
    }
  }

  private handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const property = input.dataset.property as keyof FilterProperties;
    
    if (property) {
      let value = parseFloat(input.value) || 0;
      
      // Get min/max from slider
      const control = input.closest('.filter-control');
      const slider = control?.querySelector('.filter-slider') as HTMLInputElement;
      
      if (slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        
        // Clamp value
        value = Math.max(min, Math.min(max, value));
        
        this.properties[property] = value;
        
        // Update slider
        slider.value = String(value);
        const percentage = ((value - min) / (max - min)) * 100;
        slider.style.setProperty('--value-percent', `${percentage}%`);
      }
    }
  }

  private handleInputBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const property = input.dataset.property as keyof FilterProperties;
    
    if (property) {
      // Update display with clamped value
      input.value = String(this.properties[property]);
      
      if (this.onChange) {
        this.onChange({ ...this.properties });
      }
    }
  }

  public setProperties(props: Partial<FilterProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): FilterProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}
