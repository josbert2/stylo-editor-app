/**
 * SpacingPanel - Panel visual de spacing (margin y padding)
 * Similar al estilo de CssPro
 */

export interface SpacingValue {
  value: number;
  unit: string;
}

export interface SpacingProperties {
  marginTop: SpacingValue;
  marginRight: SpacingValue;
  marginBottom: SpacingValue;
  marginLeft: SpacingValue;
  paddingTop: SpacingValue;
  paddingRight: SpacingValue;
  paddingBottom: SpacingValue;
  paddingLeft: SpacingValue;
}

export class SpacingPanel {
  private container: HTMLElement;
  private properties: SpacingProperties;
  private onChange?: (props: SpacingProperties) => void;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: SpacingProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      marginTop: { value: 0, unit: 'px' },
      marginRight: { value: 0, unit: 'px' },
      marginBottom: { value: 0, unit: 'px' },
      marginLeft: { value: 0, unit: 'px' },
      paddingTop: { value: 0, unit: 'px' },
      paddingRight: { value: 0, unit: 'px' },
      paddingBottom: { value: 0, unit: 'px' },
      paddingLeft: { value: 0, unit: 'px' },
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'spacing-panel spacing-visual-box';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="spacing-visual-container">
        <!-- Indicadores visuales de margin -->
        <div class="spacing-placeholder horizontal top"></div>
        <div class="spacing-placeholder horizontal bottom"></div>
        <div class="spacing-placeholder vertical left"></div>
        <div class="spacing-placeholder vertical right"></div>
        
        <!-- Contenedor de margin -->
        <div class="spacing-margin-container">
          ${this.renderMarginControls()}
          
          <!-- Contenedor de padding -->
          <div class="spacing-padding-container">
            ${this.renderPaddingControls()}
            
            <!-- Elemento central -->
            <div class="spacing-element-preview">
              <div class="spacing-element-info">Element</div>
            </div>
            
            <span class="spacing-label padding-label">Padding</span>
          </div>
          
          <span class="spacing-label margin-label">Margin</span>
        </div>
      </div>
    `;
  }

  private renderMarginControls(): string {
    return `
      <!-- Margin Top -->
      <label class="spacing-control margin-top" data-property="marginTop">
        <span class="spacing-drag-handle" title="Drag to change">⇕</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.marginTop.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.marginTop.unit)}
          </select>
        </div>
      </label>
      
      <!-- Margin Bottom -->
      <label class="spacing-control margin-bottom" data-property="marginBottom">
        <span class="spacing-drag-handle" title="Drag to change">⇕</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.marginBottom.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.marginBottom.unit)}
          </select>
        </div>
      </label>
      
      <!-- Margin Left -->
      <label class="spacing-control margin-left" data-property="marginLeft">
        <span class="spacing-drag-handle" title="Drag to change">⇔</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.marginLeft.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.marginLeft.unit)}
          </select>
        </div>
      </label>
      
      <!-- Margin Right -->
      <label class="spacing-control margin-right" data-property="marginRight">
        <span class="spacing-drag-handle" title="Drag to change">⇔</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.marginRight.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.marginRight.unit)}
          </select>
        </div>
      </label>
    `;
  }

  private renderPaddingControls(): string {
    return `
      <!-- Padding Top -->
      <label class="spacing-control padding-top" data-property="paddingTop">
        <span class="spacing-drag-handle" title="Drag to change">⇕</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.paddingTop.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.paddingTop.unit)}
          </select>
        </div>
      </label>
      
      <!-- Padding Bottom -->
      <label class="spacing-control padding-bottom" data-property="paddingBottom">
        <span class="spacing-drag-handle" title="Drag to change">⇕</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.paddingBottom.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.paddingBottom.unit)}
          </select>
        </div>
      </label>
      
      <!-- Padding Left -->
      <label class="spacing-control padding-left" data-property="paddingLeft">
        <span class="spacing-drag-handle" title="Drag to change">⇔</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.paddingLeft.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.paddingLeft.unit)}
          </select>
        </div>
      </label>
      
      <!-- Padding Right -->
      <label class="spacing-control padding-right" data-property="paddingRight">
        <span class="spacing-drag-handle" title="Drag to change">⇔</span>
        <div class="spacing-input-group">
          <input type="text" value="${this.properties.paddingRight.value}" data-type="value">
          <select data-type="unit">
            ${this.getUnitOptions(this.properties.paddingRight.unit)}
          </select>
        </div>
      </label>
    `;
  }

  private getUnitOptions(selectedUnit: string): string {
    const units = ['px', '%', 'em', 'rem', 'vw', 'vh'];
    return units.map(unit => 
      `<option value="${unit}" ${unit === selectedUnit ? 'selected' : ''}>${unit}</option>`
    ).join('');
  }

  private attachEventListeners(): void {
    // Event listeners para inputs
    this.container.querySelectorAll('input[data-type="value"]').forEach(input => {
      input.addEventListener('input', (e) => this.handleValueChange(e));
    });

    // Event listeners para selects
    this.container.querySelectorAll('select[data-type="unit"]').forEach(select => {
      select.addEventListener('change', (e) => this.handleUnitChange(e));
    });
  }

  private handleValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const label = input.closest('label');
    const property = label?.dataset.property as keyof SpacingProperties;
    
    if (property) {
      const value = parseFloat(input.value) || 0;
      this.properties[property].value = value;
      
      if (this.onChange) {
        this.onChange({ ...this.properties });
      }
    }
  }

  private handleUnitChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const label = select.closest('label');
    const property = label?.dataset.property as keyof SpacingProperties;
    
    if (property) {
      this.properties[property].unit = select.value;
      
      if (this.onChange) {
        this.onChange({ ...this.properties });
      }
    }
  }

  public setProperties(props: Partial<SpacingProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.render();
    this.attachEventListeners();
  }

  public getProperties(): SpacingProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}
