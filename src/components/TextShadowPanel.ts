/**
 * TextShadowPanel - Panel de sombras de texto
 * Maneja text-shadow con múltiples sombras, offset X/Y, blur y color
 */

import { ColorPicker } from './ColorPicker';
import './ColorPicker.css';

export interface TextShadow {
  id: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface TextShadowProperties {
  shadows: TextShadow[];
}

export class TextShadowPanel {
  private container: HTMLElement;
  private properties: TextShadowProperties;
  private onChange?: (props: TextShadowProperties) => void;
  private nextId: number = 1;
  private colorPickers: Map<string, ColorPicker> = new Map();

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: TextShadowProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      shadows: []
    };

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'text-shadow-panel';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="text-shadow-container">
        <!-- Add Shadow Button -->
        <button class="text-shadow-add-btn" data-action="add-shadow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add text shadow</span>
        </button>

        <!-- Shadows List -->
        <div class="text-shadow-list">
          ${this.properties.shadows.length === 0 ? `
            <div class="text-shadow-empty">
              <p>No text shadows added yet</p>
              <p class="text-shadow-empty-hint">Click "Add text shadow" to create one</p>
            </div>
          ` : this.properties.shadows.map(shadow => this.renderShadow(shadow)).join('')}
        </div>

        <!-- Presets Section -->
        <div class="text-shadow-presets">
          <h4 class="text-shadow-presets-title">PRESETS</h4>
          <div class="text-shadow-presets-grid">
            ${this.renderPresets()}
          </div>
        </div>
      </div>
    `;
  }

  private renderShadow(shadow: TextShadow): string {
    return `
      <div class="text-shadow-item" data-shadow-id="${shadow.id}">
        <div class="text-shadow-item-header">
          <span class="text-shadow-item-title">Text Shadow</span>
          <button class="text-shadow-remove-btn" data-action="remove-shadow" data-shadow-id="${shadow.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        <div class="text-shadow-controls">
          <!-- Offset X -->
          <div class="text-shadow-control">
            <label class="text-shadow-label">Offset X</label>
            <div class="text-shadow-slider-group">
              <input 
                type="range" 
                class="text-shadow-slider" 
                data-shadow-id="${shadow.id}"
                data-property="offsetX"
                min="-50"
                max="50"
                step="1"
                value="${shadow.offsetX}"
              >
              <input 
                type="text" 
                class="text-shadow-value-input" 
                data-shadow-id="${shadow.id}"
                data-property="offsetX"
                value="${shadow.offsetX}"
              >
            </div>
          </div>

          <!-- Offset Y -->
          <div class="text-shadow-control">
            <label class="text-shadow-label">Offset Y</label>
            <div class="text-shadow-slider-group">
              <input 
                type="range" 
                class="text-shadow-slider" 
                data-shadow-id="${shadow.id}"
                data-property="offsetY"
                min="-50"
                max="50"
                step="1"
                value="${shadow.offsetY}"
              >
              <input 
                type="text" 
                class="text-shadow-value-input" 
                data-shadow-id="${shadow.id}"
                data-property="offsetY"
                value="${shadow.offsetY}"
              >
            </div>
          </div>

          <!-- Blur -->
          <div class="text-shadow-control">
            <label class="text-shadow-label">Blur</label>
            <div class="text-shadow-slider-group">
              <input 
                type="range" 
                class="text-shadow-slider" 
                data-shadow-id="${shadow.id}"
                data-property="blur"
                min="0"
                max="50"
                step="1"
                value="${shadow.blur}"
              >
              <input 
                type="text" 
                class="text-shadow-value-input" 
                data-shadow-id="${shadow.id}"
                data-property="blur"
                value="${shadow.blur}"
              >
            </div>
          </div>

          <!-- Color -->
          <div class="text-shadow-control">
            <label class="text-shadow-label">Color</label>
            <div class="text-shadow-color-group">
              <div class="text-shadow-color-picker-container" data-shadow-id="${shadow.id}" data-color-picker="${shadow.id}"></div>
              <input 
                type="text" 
                class="text-shadow-color-text" 
                data-shadow-id="${shadow.id}"
                data-property="color"
                value="${shadow.color}"
                readonly
              >
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderPresets(): string {
    const presets = [
      { name: 'Soft', shadows: [{ offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0, 0, 0, 0.3)' }] },
      { name: 'Hard', shadows: [{ offsetX: 3, offsetY: 3, blur: 0, color: 'rgba(0, 0, 0, 0.5)' }] },
      { name: 'Glow', shadows: [{ offsetX: 0, offsetY: 0, blur: 10, color: 'rgba(255, 255, 255, 0.8)' }] },
      { name: 'Double', shadows: [
        { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0, 0, 0, 0.3)' },
        { offsetX: 4, offsetY: 4, blur: 8, color: 'rgba(0, 0, 0, 0.2)' }
      ]},
      { name: '3D', shadows: [
        { offsetX: 1, offsetY: 1, blur: 0, color: '#999' },
        { offsetX: 2, offsetY: 2, blur: 0, color: '#888' },
        { offsetX: 3, offsetY: 3, blur: 0, color: '#777' }
      ]},
      { name: 'Neon', shadows: [
        { offsetX: 0, offsetY: 0, blur: 10, color: '#0ff' },
        { offsetX: 0, offsetY: 0, blur: 20, color: '#0ff' },
        { offsetX: 0, offsetY: 0, blur: 30, color: '#0ff' }
      ]}
    ];

    return presets.map(preset => `
      <button class="text-shadow-preset-btn" data-action="apply-preset" data-preset="${preset.name.toLowerCase()}">
        ${preset.name}
      </button>
    `).join('');
  }

  private rgbToHex(rgb: string): string {
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    
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
    if (!result) return 'rgb(0, 0, 0)';
    
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }

  private attachEventListeners(): void {
    // Add shadow button
    const addBtn = this.container.querySelector('[data-action="add-shadow"]');
    addBtn?.addEventListener('click', () => this.addShadow());

    // Remove shadow buttons
    this.container.querySelectorAll('[data-action="remove-shadow"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const shadowId = (e.currentTarget as HTMLElement).dataset.shadowId;
        if (shadowId) this.removeShadow(shadowId);
      });
    });

    // Sliders
    this.container.querySelectorAll('.text-shadow-slider').forEach(slider => {
      slider.addEventListener('input', (e) => this.handleSliderChange(e));
    });

    // Value inputs
    this.container.querySelectorAll('.text-shadow-value-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleValueChange(e));
    });

    // Initialize ColorPickers for each shadow (solo nuevos)
    this.container.querySelectorAll('[data-color-picker]').forEach(container => {
      const shadowId = (container as HTMLElement).dataset.colorPicker;
      if (shadowId && shadowId !== 'main') {
        const shadow = this.properties.shadows.find(s => s.id === shadowId);
        if (shadow) {
          // Solo crear si no existe
          if (!this.colorPickers.has(shadowId)) {
            const picker = new ColorPicker({
              container: container as HTMLElement,
              defaultColor: shadow.color,
              showAlpha: true,
              onChange: (color) => {
                shadow.color = color;
                // Actualizar el input de texto sin disparar onChange
                const textInput = this.container.querySelector(
                  `.text-shadow-color-text[data-shadow-id="${shadowId}"]`
                ) as HTMLInputElement;
                if (textInput) textInput.value = color;
              },
              onSave: (color) => {
                shadow.color = color;
                // Actualizar el input de texto
                const textInput = this.container.querySelector(
                  `.text-shadow-color-text[data-shadow-id="${shadowId}"]`
                ) as HTMLInputElement;
                if (textInput) textInput.value = color;
                
                // Solo disparar onChange en onSave
                if (this.onChange) this.onChange({ ...this.properties });
              }
            });
            
            this.colorPickers.set(shadowId, picker);
          } else {
            // Si ya existe, solo actualizar el color
            const existingPicker = this.colorPickers.get(shadowId);
            if (existingPicker) {
              existingPicker.setColor(shadow.color);
            }
          }
        }
      }
    });
    
    // Limpiar pickers de sombras eliminadas
    const currentShadowIds = this.properties.shadows.map(s => s.id);
    this.colorPickers.forEach((picker, id) => {
      if (!currentShadowIds.includes(id)) {
        picker.destroy();
        this.colorPickers.delete(id);
      }
    });

    // Preset buttons
    this.container.querySelectorAll('[data-action="apply-preset"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).dataset.preset;
        if (preset) this.applyPreset(preset);
      });
    });
  }

  private addShadow(): void {
    const newShadow: TextShadow = {
      id: `shadow-${this.nextId++}`,
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: 'rgba(0, 0, 0, 0.5)'
    };

    this.properties.shadows.push(newShadow);
    this.render();
    this.attachEventListeners();
    
    if (this.onChange) {
      this.onChange({ ...this.properties });
    }
  }

  private removeShadow(shadowId: string): void {
    this.properties.shadows = this.properties.shadows.filter(s => s.id !== shadowId);
    this.render();
    this.attachEventListeners();
    
    if (this.onChange) {
      this.onChange({ ...this.properties });
    }
  }

  private handleSliderChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const shadowId = slider.dataset.shadowId;
    const property = slider.dataset.property as keyof Omit<TextShadow, 'id'>;
    
    if (shadowId && property) {
      const shadow = this.properties.shadows.find(s => s.id === shadowId);
      if (shadow) {
        (shadow as any)[property] = parseFloat(slider.value);
        
        // Update corresponding value input
        const valueInput = this.container.querySelector(
          `.text-shadow-value-input[data-shadow-id="${shadowId}"][data-property="${property}"]`
        ) as HTMLInputElement;
        if (valueInput) {
          valueInput.value = slider.value;
        }
        
        if (this.onChange) {
          this.onChange({ ...this.properties });
        }
      }
    }
  }

  private handleValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const shadowId = input.dataset.shadowId;
    const property = input.dataset.property as keyof Omit<TextShadow, 'id'>;
    
    if (shadowId && property) {
      const shadow = this.properties.shadows.find(s => s.id === shadowId);
      if (shadow) {
        const value = parseFloat(input.value) || 0;
        (shadow as any)[property] = value;
        
        // Update corresponding slider
        const slider = this.container.querySelector(
          `.text-shadow-slider[data-shadow-id="${shadowId}"][data-property="${property}"]`
        ) as HTMLInputElement;
        if (slider) {
          slider.value = String(value);
        }
        
        if (this.onChange) {
          this.onChange({ ...this.properties });
        }
      }
    }
  }



  private applyPreset(presetName: string): void {
    const presets: { [key: string]: Partial<TextShadow>[] } = {
      soft: [{ offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0, 0, 0, 0.3)' }],
      hard: [{ offsetX: 3, offsetY: 3, blur: 0, color: 'rgba(0, 0, 0, 0.5)' }],
      glow: [{ offsetX: 0, offsetY: 0, blur: 10, color: 'rgba(255, 255, 255, 0.8)' }],
      double: [
        { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0, 0, 0, 0.3)' },
        { offsetX: 4, offsetY: 4, blur: 8, color: 'rgba(0, 0, 0, 0.2)' }
      ],
      '3d': [
        { offsetX: 1, offsetY: 1, blur: 0, color: '#999999' },
        { offsetX: 2, offsetY: 2, blur: 0, color: '#888888' },
        { offsetX: 3, offsetY: 3, blur: 0, color: '#777777' }
      ],
      neon: [
        { offsetX: 0, offsetY: 0, blur: 10, color: '#00ffff' },
        { offsetX: 0, offsetY: 0, blur: 20, color: '#00ffff' },
        { offsetX: 0, offsetY: 0, blur: 30, color: '#00ffff' }
      ]
    };

    const preset = presets[presetName];
    if (preset) {
      this.properties.shadows = preset.map((p, i) => ({
        id: `shadow-${this.nextId++}`,
        offsetX: p.offsetX || 0,
        offsetY: p.offsetY || 0,
        blur: p.blur || 0,
        color: p.color || 'rgba(0, 0, 0, 0.5)'
      }));
      
      this.render();
      this.attachEventListeners();
      
      if (this.onChange) {
        this.onChange({ ...this.properties });
      }
    }
  }

  public setProperties(props: Partial<TextShadowProperties>): void {
    if (props.shadows) {
      // Limpiar todos los pickers antes de re-renderizar
      this.colorPickers.forEach(picker => picker.destroy());
      this.colorPickers.clear();
      
      this.properties.shadows = props.shadows.map(s => ({ ...s }));
      this.render();
      this.attachEventListeners();
    }
  }

  public getProperties(): TextShadowProperties {
    return { 
      shadows: this.properties.shadows.map(s => ({ ...s }))
    };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    // Limpiar todos los ColorPickers
    this.colorPickers.forEach(picker => picker.destroy());
    this.colorPickers.clear();
    
    this.container.remove();
  }
}
