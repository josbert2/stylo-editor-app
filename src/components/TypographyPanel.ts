/**
 * TypographyPanel - Panel de propiedades de tipografía
 * Maneja font family, weight, size, color, line height, text align, decorations
 */

import { ColorPicker } from './ColorPicker';
import './ColorPicker.css';

export interface TypographyProperties {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  fontSizeUnit: 'px' | 'em' | 'rem' | '%';
  color: string;
  lineHeight: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  useBackgroundAsTextColor: boolean;
}

export class TypographyPanel {
  private container: HTMLElement;
  private properties: TypographyProperties;
  private onChange?: (props: TypographyProperties) => void;
  private colorPicker: ColorPicker | null = null;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: TypographyProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 16,
      fontSizeUnit: 'px',
      color: 'rgb(255, 255, 255)',
      lineHeight: '24px',
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      useBackgroundAsTextColor: false
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'typography-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="typography-container">
        <!-- Font Family -->
        <div class="typography-field">
          <label class="typography-label">Font Family</label>
          <select class="typography-select" data-property="fontFamily">
            ${this.getFontFamilyOptions()}
          </select>
        </div>

        <!-- Weight & Size Row -->
        <div class="typography-row">
          <!-- Weight -->
          <div class="typography-field">
            <label class="typography-label">Weight</label>
            <select class="typography-select" data-property="fontWeight">
              ${this.getFontWeightOptions()}
            </select>
          </div>

          <!-- Size -->
          <div class="typography-field">
            <label class="typography-label">Size</label>
            <div class="typography-input-group">
              <button class="typography-btn-minus" data-action="decrease-size">−</button>
              <input 
                type="text" 
                class="typography-input" 
                data-property="fontSize"
                value="${this.properties.fontSize}"
              >
              <button class="typography-btn-plus" data-action="increase-size">+</button>
              <select class="typography-unit-select" data-property="fontSizeUnit">
                <option value="px" ${this.properties.fontSizeUnit === 'px' ? 'selected' : ''}>px</option>
                <option value="em" ${this.properties.fontSizeUnit === 'em' ? 'selected' : ''}>em</option>
                <option value="rem" ${this.properties.fontSizeUnit === 'rem' ? 'selected' : ''}>rem</option>
                <option value="%" ${this.properties.fontSizeUnit === '%' ? 'selected' : ''}>%</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Color & Line Height Row -->
        <div class="typography-row">
          <!-- Color -->
          <div class="typography-field">
            <label class="typography-label">Color</label>
            <div class="typography-color-group">
              <div class="typography-color-picker-container" data-color-picker="main"></div>
              <input 
                type="text" 
                class="typography-color-text" 
                data-property="colorText"
                value="${this.properties.color}"
                readonly
              >
            </div>
          </div>

          <!-- Line Height -->
          <div class="typography-field">
            <label class="typography-label">Line Height</label>
            <input 
              type="text" 
              class="typography-input" 
              data-property="lineHeight"
              value="${this.properties.lineHeight}"
            >
          </div>
        </div>

        <!-- Text Align -->
        <div class="typography-field">
          <label class="typography-label">Text Align</label>
          <div class="typography-align-group">
            <button 
              class="typography-align-btn ${this.properties.textAlign === 'left' ? 'active' : ''}" 
              data-align="left"
              title="Align Left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="17" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="17" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
            <button 
              class="typography-align-btn ${this.properties.textAlign === 'center' ? 'active' : ''}" 
              data-align="center"
              title="Align Center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="10" x2="6" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="18" y1="18" x2="6" y2="18"></line>
              </svg>
            </button>
            <button 
              class="typography-align-btn ${this.properties.textAlign === 'right' ? 'active' : ''}" 
              data-align="right"
              title="Align Right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="10" x2="7" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
              </svg>
            </button>
            <button 
              class="typography-align-btn ${this.properties.textAlign === 'justify' ? 'active' : ''}" 
              data-align="justify"
              title="Justify"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Decorations -->
        <div class="typography-field">
          <label class="typography-label">Decorations</label>
          <div class="typography-decoration-group">
            <button 
              class="typography-decoration-btn ${this.properties.fontStyle === 'italic' ? 'active' : ''}" 
              data-decoration="italic"
              title="Italic"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button 
              class="typography-decoration-btn ${this.properties.textDecoration === 'underline' ? 'active' : ''}" 
              data-decoration="underline"
              title="Underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            <button 
              class="typography-decoration-btn ${this.properties.textDecoration === 'line-through' ? 'active' : ''}" 
              data-decoration="line-through"
              title="Strikethrough"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
                <path d="M14 12a4 4 0 0 1 0 8H6"></path>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Use Background as Text Color -->
        <div class="typography-field">
          <label class="typography-checkbox-label">
            <input 
              type="checkbox" 
              class="typography-checkbox" 
              data-property="useBackgroundAsTextColor"
              ${this.properties.useBackgroundAsTextColor ? 'checked' : ''}
            >
            <span>Use background as text color</span>
          </label>
        </div>
      </div>
    `;
  }

  private getFontFamilyOptions(): string {
    const fonts = [
      'Inter',
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Courier New',
      'Verdana',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'system-ui'
    ];

    return fonts.map(font => 
      `<option value="${font}" ${this.properties.fontFamily === font ? 'selected' : ''}>${font}</option>`
    ).join('');
  }

  private getFontWeightOptions(): string {
    const weights = [
      { value: '100', label: '100 - Thin' },
      { value: '200', label: '200 - Extra Light' },
      { value: '300', label: '300 - Light' },
      { value: '400', label: '400 - Normal' },
      { value: '500', label: '500 - Medium' },
      { value: '600', label: '600 - Semi Bold' },
      { value: '700', label: '700 - Bold' },
      { value: '800', label: '800 - Extra Bold' },
      { value: '900', label: '900 - Black' }
    ];

    return weights.map(weight => 
      `<option value="${weight.value}" ${this.properties.fontWeight === weight.value ? 'selected' : ''}>${weight.label}</option>`
    ).join('');
  }

  private rgbToHex(rgb: string): string {
    // Si ya es hex, retornar
    if (rgb.startsWith('#')) return rgb;
    
    // Extraer valores RGB
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#ffffff';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgb(255, 255, 255)';
    
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }

  private attachEventListeners(): void {
    // Selects
    this.container.querySelectorAll('select[data-property]').forEach(select => {
      select.addEventListener('change', (e) => this.handleSelectChange(e));
    });

    // Inputs
    this.container.querySelectorAll('input[data-property]').forEach(input => {
      input.addEventListener('input', (e) => this.handleInputChange(e));
    });

    // Initialize ColorPicker (solo si no existe)
    const colorPickerContainer = this.container.querySelector('[data-color-picker="main"]') as HTMLElement;
    if (colorPickerContainer && !this.colorPicker) {
      this.colorPicker = new ColorPicker({
        container: colorPickerContainer,
        defaultColor: this.properties.color,
        showAlpha: true,
        onChange: (color) => {
          this.properties.color = color;
          // Actualizar el input de texto sin disparar onChange
          const textInput = this.container.querySelector('.typography-color-text') as HTMLInputElement;
          if (textInput) textInput.value = color;
        },
        onSave: (color) => {
          this.properties.color = color;
          // Actualizar el input de texto
          const textInput = this.container.querySelector('.typography-color-text') as HTMLInputElement;
          if (textInput) textInput.value = color;
          
          // Solo disparar onChange en onSave, no en onChange
          if (this.onChange) this.onChange({ ...this.properties });
        }
      });
    } else if (this.colorPicker && colorPickerContainer) {
      // Si ya existe, solo actualizar el color
      this.colorPicker.setColor(this.properties.color);
    }

    // Size buttons
    const decreaseBtn = this.container.querySelector('[data-action="decrease-size"]');
    const increaseBtn = this.container.querySelector('[data-action="increase-size"]');
    
    decreaseBtn?.addEventListener('click', () => this.changeFontSize(-1));
    increaseBtn?.addEventListener('click', () => this.changeFontSize(1));

    // Align buttons
    this.container.querySelectorAll('.typography-align-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAlignClick(e));
    });

    // Decoration buttons
    this.container.querySelectorAll('.typography-decoration-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDecorationClick(e));
    });

    // Checkbox
    const checkbox = this.container.querySelector('.typography-checkbox') as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.properties.useBackgroundAsTextColor = (e.target as HTMLInputElement).checked;
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }
  }

  private handleSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const property = select.dataset.property as keyof TypographyProperties;
    
    if (property) {
      (this.properties as any)[property] = select.value;
      if (this.onChange) this.onChange({ ...this.properties });
    }
  }

  private handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const property = input.dataset.property;
    
    if (property === 'fontSize') {
      this.properties.fontSize = parseFloat(input.value) || 16;
    } else if (property === 'lineHeight') {
      this.properties.lineHeight = input.value;
    } else if (property === 'colorText') {
      this.properties.color = input.value;
    }
    
    if (this.onChange) this.onChange({ ...this.properties });
  }



  private changeFontSize(delta: number): void {
    this.properties.fontSize = Math.max(1, this.properties.fontSize + delta);
    
    // Update input
    const input = this.container.querySelector('[data-property="fontSize"]') as HTMLInputElement;
    if (input) {
      input.value = String(this.properties.fontSize);
    }
    
    if (this.onChange) this.onChange({ ...this.properties });
  }

  private handleAlignClick(event: Event): void {
    const btn = event.currentTarget as HTMLElement;
    const align = btn.dataset.align as TypographyProperties['textAlign'];
    
    if (align) {
      this.properties.textAlign = align;
      
      // Update active states
      this.container.querySelectorAll('.typography-align-btn').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      
      if (this.onChange) this.onChange({ ...this.properties });
    }
  }

  private handleDecorationClick(event: Event): void {
    const btn = event.currentTarget as HTMLElement;
    const decoration = btn.dataset.decoration;
    
    if (decoration === 'italic') {
      this.properties.fontStyle = this.properties.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (decoration === 'underline' || decoration === 'line-through') {
      this.properties.textDecoration = this.properties.textDecoration === decoration ? 'none' : decoration;
    }
    
    // Re-render to update active states
    this.render();
    this.attachEventListeners();
    
    if (this.onChange) this.onChange({ ...this.properties });
  }

  public setProperties(props: Partial<TypographyProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): TypographyProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    // Limpiar ColorPicker
    if (this.colorPicker) {
      this.colorPicker.destroy();
      this.colorPicker = null;
    }
    
    this.container.remove();
  }
}
