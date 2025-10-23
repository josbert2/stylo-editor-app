/**
 * BorderPanel - Panel de propiedades de borde
 * Maneja border-color, border-width, border-style
 */

import { ColorPicker } from './ColorPicker';
import './ColorPicker.css';

export interface BorderProperties {
  color: string;
  width: number;
  widthUnit: string;
  style: string;
}

export class BorderPanel {
  private container: HTMLElement;
  private properties: BorderProperties;
  private onChange?: (props: BorderProperties) => void;
  private colorPicker: ColorPicker | null = null;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: BorderProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      color: 'rgb(0, 0, 0)',
      width: 1,
      widthUnit: 'px',
      style: 'solid'
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'border-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="border-container">
        <!-- Color -->
        <div class="border-field">
          <label class="border-label">COLOR</label>
          <div class="border-color-group">
            <div class="border-color-picker-container" data-color-picker="main"></div>
          </div>
        </div>

        <!-- Width -->
        <div class="border-field">
          <label class="border-label">WIDTH</label>
          <div class="border-width-group">
            <input 
              type="number" 
              class="border-width-input" 
              data-property="width"
              value="${this.properties.width}"
              min="0"
              step="1"
            >
            <select class="border-unit-select" data-property="widthUnit">
              <option value="px" ${this.properties.widthUnit === 'px' ? 'selected' : ''}>px</option>
              <option value="em" ${this.properties.widthUnit === 'em' ? 'selected' : ''}>em</option>
              <option value="rem" ${this.properties.widthUnit === 'rem' ? 'selected' : ''}>rem</option>
              <option value="%" ${this.properties.widthUnit === '%' ? 'selected' : ''}>%</option>
            </select>
          </div>
        </div>

        <!-- Style -->
        <div class="border-field">
          <label class="border-label">STYLE</label>
          <select class="border-style-select" data-property="style">
            <option value="none" ${this.properties.style === 'none' ? 'selected' : ''}>none</option>
            <option value="solid" ${this.properties.style === 'solid' ? 'selected' : ''}>solid</option>
            <option value="dashed" ${this.properties.style === 'dashed' ? 'selected' : ''}>dashed</option>
            <option value="dotted" ${this.properties.style === 'dotted' ? 'selected' : ''}>dotted</option>
            <option value="double" ${this.properties.style === 'double' ? 'selected' : ''}>double</option>
            <option value="groove" ${this.properties.style === 'groove' ? 'selected' : ''}>groove</option>
            <option value="ridge" ${this.properties.style === 'ridge' ? 'selected' : ''}>ridge</option>
            <option value="inset" ${this.properties.style === 'inset' ? 'selected' : ''}>inset</option>
            <option value="outset" ${this.properties.style === 'outset' ? 'selected' : ''}>outset</option>
          </select>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Initialize ColorPicker
    const colorPickerContainer = this.container.querySelector('[data-color-picker="main"]') as HTMLElement;
    if (colorPickerContainer && !this.colorPicker) {
      this.colorPicker = new ColorPicker({
        container: colorPickerContainer,
        defaultColor: this.properties.color,
        onChange: (color) => {
          this.properties.color = color;
        },
        onSave: (color) => {
          this.properties.color = color;
          if (this.onChange) this.onChange({ ...this.properties });
        }
      });
    } else if (this.colorPicker && colorPickerContainer) {
      this.colorPicker.setColor(this.properties.color);
    }

    // Width input
    const widthInput = this.container.querySelector('.border-width-input') as HTMLInputElement;
    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        this.properties.width = parseFloat((e.target as HTMLInputElement).value) || 0;
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }

    // Unit select
    const unitSelect = this.container.querySelector('.border-unit-select') as HTMLSelectElement;
    if (unitSelect) {
      unitSelect.addEventListener('change', (e) => {
        this.properties.widthUnit = (e.target as HTMLSelectElement).value;
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }

    // Style select
    const styleSelect = this.container.querySelector('.border-style-select') as HTMLSelectElement;
    if (styleSelect) {
      styleSelect.addEventListener('change', (e) => {
        this.properties.style = (e.target as HTMLSelectElement).value;
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }
  }

  public setProperties(props: Partial<BorderProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): BorderProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    if (this.colorPicker) {
      this.colorPicker.destroy();
      this.colorPicker = null;
    }
    this.container.remove();
  }
}
