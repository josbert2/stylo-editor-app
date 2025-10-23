/**
 * DisplayPanel - Panel de propiedades de display
 * Maneja display y opacity
 */

export interface DisplayProperties {
  display: string;
  opacity: number;
}

export class DisplayPanel {
  private container: HTMLElement;
  private properties: DisplayProperties;
  private onChange?: (props: DisplayProperties) => void;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: DisplayProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      display: 'block',
      opacity: 100
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'display-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="display-container">
        <!-- Display -->
        <div class="display-field">
          <label class="display-label">Display</label>
          <select class="display-select" data-property="display">
            <option value="block" ${this.properties.display === 'block' ? 'selected' : ''}>block</option>
            <option value="inline" ${this.properties.display === 'inline' ? 'selected' : ''}>inline</option>
            <option value="inline-block" ${this.properties.display === 'inline-block' ? 'selected' : ''}>inline-block</option>
            <option value="flex" ${this.properties.display === 'flex' ? 'selected' : ''}>flex</option>
            <option value="inline-flex" ${this.properties.display === 'inline-flex' ? 'selected' : ''}>inline-flex</option>
            <option value="grid" ${this.properties.display === 'grid' ? 'selected' : ''}>grid</option>
            <option value="inline-grid" ${this.properties.display === 'inline-grid' ? 'selected' : ''}>inline-grid</option>
            <option value="none" ${this.properties.display === 'none' ? 'selected' : ''}>none</option>
          </select>
        </div>

        <!-- Opacity -->
        <div class="display-field">
          <label class="display-label">Opacity</label>
          <div class="display-opacity-group">
            <input 
              type="range" 
              class="display-opacity-slider" 
              data-property="opacity"
              min="0"
              max="100"
              step="1"
              value="${this.properties.opacity}"
            >
            <input 
              type="number" 
              class="display-opacity-value" 
              data-property="opacity-value"
              min="0"
              max="100"
              step="1"
              value="${this.properties.opacity}"
            >
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Display select
    const displaySelect = this.container.querySelector('.display-select') as HTMLSelectElement;
    if (displaySelect) {
      displaySelect.addEventListener('change', (e) => {
        this.properties.display = (e.target as HTMLSelectElement).value;
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }

    // Opacity slider
    const opacitySlider = this.container.querySelector('.display-opacity-slider') as HTMLInputElement;
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        this.properties.opacity = parseFloat((e.target as HTMLInputElement).value);
        
        // Actualizar el input de valor
        const valueInput = this.container.querySelector('.display-opacity-value') as HTMLInputElement;
        if (valueInput) valueInput.value = this.properties.opacity.toString();
        
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }

    // Opacity value input
    const opacityValue = this.container.querySelector('.display-opacity-value') as HTMLInputElement;
    if (opacityValue) {
      opacityValue.addEventListener('input', (e) => {
        let value = parseFloat((e.target as HTMLInputElement).value);
        value = Math.max(0, Math.min(100, value)); // Clamp entre 0 y 100
        this.properties.opacity = value;
        
        // Actualizar el slider
        const slider = this.container.querySelector('.display-opacity-slider') as HTMLInputElement;
        if (slider) slider.value = value.toString();
        
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }
  }

  public setProperties(props: Partial<DisplayProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): DisplayProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}
