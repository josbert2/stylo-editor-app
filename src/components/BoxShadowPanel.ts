/**
 * BoxShadowPanel - Panel de sombras de caja
 * Muestra una lista visual de presets de box-shadow seleccionables
 */

export interface BoxShadowPreset {
  id: number;
  name: string;
  value: string;
}

export interface BoxShadowProperties {
  currentShadow: string;
}

export class BoxShadowPanel {
  private container: HTMLElement;
  private properties: BoxShadowProperties;
  private onChange?: (props: BoxShadowProperties) => void;
  private selectedPresetId: number | null = null;

  // Presets de box-shadow
  private presets: BoxShadowPreset[] = [
    { id: 0, name: 'None', value: 'none' },
    { id: 1, name: 'Subtle', value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
    { id: 2, name: 'Small', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
    { id: 3, name: 'Medium', value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
    { id: 4, name: 'Large', value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
    { id: 5, name: 'Extra Large', value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    { id: 6, name: 'Inner Small', value: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' },
    { id: 7, name: 'Inner Medium', value: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)' },
    { id: 8, name: 'Glow Soft', value: '0 0 15px rgba(99, 102, 241, 0.5)' },
    { id: 9, name: 'Glow Strong', value: '0 0 30px rgba(99, 102, 241, 0.8)' },
    { id: 10, name: 'Elevated', value: '0 10px 40px -10px rgba(0, 0, 0, 0.3)' }
  ];

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: BoxShadowProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      currentShadow: 'none'
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'box-shadow-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="box-shadow-container">
        <div class="box-shadow-title">Box shadow</div>
        
        <div class="box-shadow-presets-grid">
          ${this.presets.map(preset => this.renderPreset(preset)).join('')}
        </div>
      </div>
    `;
  }

  private renderPreset(preset: BoxShadowPreset): string {
    const isSelected = this.selectedPresetId === preset.id;
    const isNone = preset.value === 'none';
    
    return `
      <div class="box-shadow-preset ${isSelected ? 'selected' : ''}" 
           data-preset-id="${preset.id}"
           data-preset-value="${preset.value}">
        <div class="box-shadow-preview" style="box-shadow: ${preset.value}">
          ${isNone ? '<span class="box-shadow-none-icon">×</span>' : ''}
        </div>
        <div class="box-shadow-preset-label">#${preset.id}</div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Click en presets
    this.container.querySelectorAll('.box-shadow-preset').forEach(preset => {
      preset.addEventListener('click', (e) => {
        const presetElement = e.currentTarget as HTMLElement;
        const presetId = parseInt(presetElement.dataset.presetId || '0');
        const presetValue = presetElement.dataset.presetValue || 'none';
        
        this.applyPreset(presetId, presetValue);
      });
    });
  }

  private applyPreset(presetId: number, value: string): void {
    this.selectedPresetId = presetId;
    this.properties.currentShadow = value;
    
    // Actualizar UI
    this.container.querySelectorAll('.box-shadow-preset').forEach(preset => {
      preset.classList.remove('selected');
    });
    
    const selectedPreset = this.container.querySelector(`[data-preset-id="${presetId}"]`);
    if (selectedPreset) {
      selectedPreset.classList.add('selected');
    }
    
    if (this.onChange) {
      this.onChange({ ...this.properties });
    }
  }

  public setProperties(props: Partial<BoxShadowProperties>): void {
    if (props.currentShadow !== undefined) {
      this.properties.currentShadow = props.currentShadow;
      
      // Encontrar el preset que coincide
      const matchingPreset = this.presets.find(p => p.value === props.currentShadow);
      if (matchingPreset) {
        this.selectedPresetId = matchingPreset.id;
      } else {
        this.selectedPresetId = null;
      }
      
      this.render();
      this.attachEventListeners();
    }
  }

  public getProperties(): BoxShadowProperties {
    return { ...this.properties };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }
}
