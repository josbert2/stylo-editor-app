/**
 * BackgroundPanel - Panel avanzado de fondos con sistema de capas múltiples
 * - Agregar/eliminar/reordenar capas (color, gradiente, imagen)
 * - Editar cada capa con AdvancedColorPicker
 * - Controles dedicados para imágenes
 */

import { AdvancedColorPicker } from './AdvancedColorPicker';
import './AdvancedColorPicker.css';

export type BackgroundLayerType = 'color' | 'gradient' | 'image';

export interface BackgroundLayer {
  id: string;
  type: BackgroundLayerType;
  visible: boolean;
  // Para colores/gradientes: datos del AdvancedColorPicker
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundBlendMode?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  // Para imágenes: controles simples
  imageUrl?: string;
  imageRepeat?: string;
  imageSize?: string;
  imagePosition?: string;
}

export interface BackgroundProperties {
  layers: BackgroundLayer[];
}

export class BackgroundPanel {
  private container: HTMLElement;
  private properties: BackgroundProperties;
  private onChange?: (props: BackgroundProperties) => void;
  private nextLayerId: number = 1;
  private selectedLayerId: string | null = null;
  private advancedPicker: AdvancedColorPicker | null = null;
  private selectedPresetIndex: number | null = null;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: BackgroundProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales (sin capas)
    this.properties = {
      layers: []
    };

    this.render();
  }

  private render(): void {
    this.container.className = 'background-panel';
    this.container.innerHTML = this.getHTML();
    this.attachEventListeners();
  }

  private getHTML(): string {
    return `
      <div class="background-container">
        <!-- Header con botones -->
        <div class="background-header">
          <span class="background-title">Background</span>
          <div class="background-actions">
            <button class="bg-add-btn" data-action="add-image" title="Add Image Layer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Add image layer
            </button>
            <button class="bg-add-btn" data-action="add-color" title="Add Color Layer">
              + Add color layer
            </button>
          </div>
        </div>

        <!-- Gradient Presets Gallery -->
        <div class="background-presets-section">
          <div class="background-presets-header">
            <span class="background-presets-title">Quick Gradients</span>
            <span class="background-presets-hint">Click to add layer</span>
          </div>
          <div class="background-presets-grid">
            ${this.renderGradientPresets()}
          </div>
        </div>

        <!-- Layers List -->
        <div class="background-layers">
          ${this.properties.layers.length === 0 ? `
            <div class="background-empty">
              <p>No background layers</p>
              <p class="background-empty-hint">Click buttons above to add layers</p>
            </div>
          ` : this.properties.layers.map(layer => this.renderLayer(layer)).join('')}
        </div>

        <!-- Floating Tooltip/Popup (se muestra al hacer click en pelotita) -->
        <div class="bg-picker-popup" id="bg-picker-popup" style="display: none;">
          <div class="bg-picker-popup-header">
            <span class="bg-picker-popup-title">Edit Layer</span>
            <button class="bg-picker-popup-close" data-action="close-popup">×</button>
          </div>
          <div class="bg-picker-popup-content" id="bg-picker-popup-content"></div>
        </div>
        <div class="bg-picker-overlay" id="bg-picker-overlay" style="display: none;" data-action="close-popup"></div>

        <!-- Preset Actions Tooltip -->
        <div class="bg-preset-actions-tooltip" id="bg-preset-actions-tooltip" style="display: none;">
          <button class="bg-preset-action" data-preset-action="copy" title="Copy CSS">
            <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
              <path d="M224 0c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM64 160c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H288v64H64V224h64V160H64z"></path>
            </svg>
          </button>
          <button class="bg-preset-action" data-preset-action="add" title="Add as Layer">
            <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"></path>
            </svg>
          </button>
          <button class="bg-preset-action" data-preset-action="replace" title="Replace All">
            <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
              <path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"></path>
            </svg>
          </button>
          <button class="bg-preset-action bg-preset-action-cancel" data-preset-action="cancel" title="Cancel">
            <svg width="14" height="14" viewBox="0 0 320 512" fill="currentColor">
              <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private renderLayer(layer: BackgroundLayer): string {
    const isSelected = this.selectedLayerId === layer.id;
    const typeLabel = layer.type === 'image' ? 'image' : 
                     (layer.backgroundImage?.includes('gradient') ? 'gradient' : 'color');
    
    // Preview visual (pelotita)
    let previewStyle = '';
    let tooltipText = '';
    
    if (layer.type === 'image') {
      if (layer.imageUrl) {
        previewStyle = `background-image: url(${layer.imageUrl}); background-size: cover; background-position: center;`;
        tooltipText = `Image: ${layer.imageUrl}`;
      } else {
        previewStyle = 'background: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px;';
        tooltipText = 'Image (no URL)';
      }
    } else if (layer.backgroundImage) {
      previewStyle = `background: ${layer.backgroundImage};`;
      tooltipText = layer.backgroundImage;
      if (layer.backgroundImage.includes('gradient')) {
        tooltipText = `Gradient: ${layer.backgroundImage.substring(0, 80)}${layer.backgroundImage.length > 80 ? '...' : ''}`;
      } else {
        tooltipText = `Color: ${layer.backgroundImage}`;
      }
    } else {
      previewStyle = 'background: rgba(255, 255, 255, 0.1);';
      tooltipText = 'Empty layer';
    }

    return `
      <div class="bg-layer ${!layer.visible ? 'hidden' : ''} ${isSelected ? 'selected' : ''}" data-layer-id="${layer.id}">
        <div class="bg-layer-header">
          <button class="bg-layer-toggle" data-action="toggle-layer" data-layer-id="${layer.id}" title="Toggle visibility">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${layer.visible ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'}
            </svg>
          </button>
          <button class="bg-layer-preview-ball" style="${previewStyle}" data-action="select-layer" data-layer-id="${layer.id}" title="Click to edit - ${tooltipText}"></button>
          <div class="bg-layer-info">
            <span class="bg-layer-type">${typeLabel}</span>
          </div>
          <div class="bg-layer-actions">
            <button class="bg-layer-action" data-action="move-up" data-layer-id="${layer.id}" title="Move up">↑</button>
            <button class="bg-layer-action" data-action="move-down" data-layer-id="${layer.id}" title="Move down">↓</button>
            <button class="bg-layer-action bg-layer-remove" data-action="remove-layer" data-layer-id="${layer.id}" title="Remove">×</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderGradientPresets(): string {
    const presets = [
      { name: 'Purple Dream', css: 'linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)' },
      { name: 'Ocean Blue', css: 'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)' },
      { name: 'Pink Sunset', css: 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
      { name: 'Aqua Splash', css: 'linear-gradient(0deg, #08AEEA 0%, #2AF598 100%)' },
      { name: 'Purple Magic', css: 'linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)' },
      { name: 'Sunset Fire', css: 'linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)' },
      { name: 'Mint Fresh', css: 'linear-gradient(90deg, #74EBD5 0%, #9FACE6 100%)' },
      { name: 'Royal Purple', css: 'linear-gradient(220.55deg, #A531DC 0%, #4300B1 100%)' },
      { name: 'Fire Red', css: 'linear-gradient(220.55deg, #FF896D 0%, #D02020 100%)' },
      { name: 'Deep Blue', css: 'linear-gradient(220.55deg, #3793FF 0%, #0017E4 100%)' },
      { name: 'Golden Sun', css: 'linear-gradient(220.55deg, #FFD439 0%, #FF7A00 100%)' },
      { name: 'Sky Blue', css: 'linear-gradient(220.55deg, #7CF7FF 0%, #4B73FF 100%)' },
      { name: 'Pink Lemon', css: 'linear-gradient(220.55deg, #FFED46 0%, #FF7EC7 100%)' },
      { name: 'Instagram', css: 'radial-gradient(circle at 30% 110%, #ffdb8b 0%,#ee653d 25%,#d42e81 50%,#a237b6 75%,#3e5fbc 100%)' },
      { name: 'Rainbow', css: 'linear-gradient(115deg,#4fcf70,#fad648,#a767e5,#12bcfe,#44ce7b)' },
      { name: 'Sea Wave', css: 'linear-gradient(180deg,#04e2f7, #1448d8)' },
      { name: 'Purple Pink', css: 'linear-gradient(180deg,#11AEEB, #c13af1)' },
      { name: 'Mint Green', css: 'linear-gradient(180deg,#11AEEB, #35F39D)' },
      { name: 'Cotton Candy', css: 'linear-gradient(180deg,#E3FFFD, #FFEDFB)' },
      { name: 'Peach', css: 'linear-gradient(180deg,#FB1834, #FB2B90)' },
      { name: 'Night Sky', css: 'linear-gradient(180deg,#2C3E50, #4CA0AE)' },
      { name: 'Electric Blue', css: 'linear-gradient(180deg,#0C52C4, #00B1F3)' },
      { name: 'Coral Reef', css: 'linear-gradient(to right, rgb(255, 91, 87), rgb(170, 228, 215))' },
      { name: 'Sunset Gradient', css: 'linear-gradient(to right, rgb(254, 190, 88), rgb(222, 43, 174))' },
      { name: 'Forest Green', css: 'radial-gradient(at center bottom, rgb(120, 53, 15), rgb(252, 211, 77))' },
      { name: 'Violet Dream', css: 'radial-gradient(at center center, rgb(88, 28, 135), rgb(99, 102, 241))' },
      { name: 'Dark Violet', css: 'linear-gradient(rgb(17, 24, 39), rgb(88, 28, 135), rgb(124, 58, 237))' },
      { name: 'Warm Flame', css: 'conic-gradient(at right center, rgb(127, 29, 29), rgb(221, 214, 254), rgb(249, 115, 22))' },
      { name: 'Orange Sky', css: 'linear-gradient(to top, rgb(251, 146, 60), rgb(56, 189, 248))' },
      { name: 'Purple Haze', css: 'linear-gradient(to right top, rgb(139, 92, 246), rgb(253, 186, 116))' },
    ];

    return presets.map((preset, index) => `
      <div class="bg-preset" data-preset-index="${index}" title="${preset.name}">
        <div class="bg-preset-preview" style="background: ${preset.css}"></div>
      </div>
    `).join('');
  }

  private openPickerPopup(layerId: string): void {
    this.selectedLayerId = layerId;
    const layer = this.properties.layers.find(l => l.id === layerId);
    if (!layer) return;

    const popup = this.container.querySelector('#bg-picker-popup') as HTMLElement;
    const overlay = this.container.querySelector('#bg-picker-overlay') as HTMLElement;
    const content = this.container.querySelector('#bg-picker-popup-content') as HTMLElement;

    if (!popup || !overlay || !content) return;

    // Limpiar contenido anterior
    content.innerHTML = '';
    if (this.advancedPicker) {
      this.advancedPicker.destroy();
      this.advancedPicker = null;
    }

    if (layer.type === 'image') {
      // Mostrar controles de imagen
      content.innerHTML = this.renderImageEditorContent(layer);
      this.attachImageEditorListeners();
    } else {
      // Mostrar AdvancedColorPicker
      const pickerContainer = document.createElement('div');
      pickerContainer.id = 'floating-advanced-picker-container';
      content.appendChild(pickerContainer);

      this.advancedPicker = new AdvancedColorPicker({
        container: pickerContainer,
        defaultColor: layer.backgroundImage?.match(/#[0-9a-f]{6}/i)?.[0] || '#ffffff',
        onChange: (css, clipboardCss) => {
          this.updateSelectedLayerFromPicker(css);
        }
      });
    }

    // Mostrar popup y overlay
    popup.style.display = 'block';
    overlay.style.display = 'block';

    // Actualizar visual de la lista
    this.updateLayerSelection();
  }

  private closePickerPopup(): void {
    const popup = this.container.querySelector('#bg-picker-popup') as HTMLElement;
    const overlay = this.container.querySelector('#bg-picker-overlay') as HTMLElement;

    if (popup) popup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';

    if (this.advancedPicker) {
      this.advancedPicker.destroy();
      this.advancedPicker = null;
    }

    this.selectedLayerId = null;
    this.updateLayerSelection();
  }

  private showPresetActionsTooltip(presetIndex: number, rect: DOMRect): void {
    this.selectedPresetIndex = presetIndex;
    const tooltip = this.container.querySelector('#bg-preset-actions-tooltip') as HTMLElement;
    if (!tooltip) return;

    const containerRect = this.container.getBoundingClientRect();
    const left = rect.left - containerRect.left + rect.width / 2 - 100;
    const top = rect.top - containerRect.top - 50;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = 'flex';

    this.attachPresetTooltipListeners();
  }

  private hidePresetActionsTooltip(): void {
    const tooltip = this.container.querySelector('#bg-preset-actions-tooltip') as HTMLElement;
    if (tooltip) tooltip.style.display = 'none';
    this.selectedPresetIndex = null;
  }

  private attachPresetTooltipListeners(): void {
    const actions = ['copy', 'add', 'replace', 'cancel'] as const;
    
    actions.forEach(action => {
      const btn = this.container.querySelector(`[data-preset-action="${action}"]`);
      if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
          if (action === 'cancel') {
            this.hidePresetActionsTooltip();
          } else {
            this.handlePresetAction(action);
          }
        });
      }
    });
  }

  private handlePresetAction(action: 'copy' | 'add' | 'replace'): void {
    if (this.selectedPresetIndex === null) return;

    const presets = this.getPresetsArray();
    const preset = presets[this.selectedPresetIndex];
    if (!preset) return;

    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(preset.css).then(() => {
          console.log('CSS copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy CSS:', err);
        });
        break;

      case 'add':
        this.addLayerFromPreset(this.selectedPresetIndex, true);
        break;

      case 'replace':
        this.addLayerFromPreset(this.selectedPresetIndex, false);
        break;
    }

    this.hidePresetActionsTooltip();
  }

  private getPresetsArray() {
    return [
      { name: 'Purple Dream', css: 'linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)' },
      { name: 'Ocean Blue', css: 'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)' },
      { name: 'Pink Sunset', css: 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
      { name: 'Aqua Splash', css: 'linear-gradient(0deg, #08AEEA 0%, #2AF598 100%)' },
      { name: 'Purple Magic', css: 'linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)' },
      { name: 'Sunset Fire', css: 'linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)' },
      { name: 'Mint Fresh', css: 'linear-gradient(90deg, #74EBD5 0%, #9FACE6 100%)' },
      { name: 'Royal Purple', css: 'linear-gradient(220.55deg, #A531DC 0%, #4300B1 100%)' },
      { name: 'Fire Red', css: 'linear-gradient(220.55deg, #FF896D 0%, #D02020 100%)' },
      { name: 'Deep Blue', css: 'linear-gradient(220.55deg, #3793FF 0%, #0017E4 100%)' },
      { name: 'Golden Sun', css: 'linear-gradient(220.55deg, #FFD439 0%, #FF7A00 100%)' },
      { name: 'Sky Blue', css: 'linear-gradient(220.55deg, #7CF7FF 0%, #4B73FF 100%)' },
      { name: 'Pink Lemon', css: 'linear-gradient(220.55deg, #FFED46 0%, #FF7EC7 100%)' },
      { name: 'Instagram', css: 'radial-gradient(circle at 30% 110%, #ffdb8b 0%,#ee653d 25%,#d42e81 50%,#a237b6 75%,#3e5fbc 100%)' },
      { name: 'Rainbow', css: 'linear-gradient(115deg,#4fcf70,#fad648,#a767e5,#12bcfe,#44ce7b)' },
      { name: 'Sea Wave', css: 'linear-gradient(180deg,#04e2f7, #1448d8)' },
      { name: 'Purple Pink', css: 'linear-gradient(180deg,#11AEEB, #c13af1)' },
      { name: 'Mint Green', css: 'linear-gradient(180deg,#11AEEB, #35F39D)' },
      { name: 'Cotton Candy', css: 'linear-gradient(180deg,#E3FFFD, #FFEDFB)' },
      { name: 'Peach', css: 'linear-gradient(180deg,#FB1834, #FB2B90)' },
      { name: 'Night Sky', css: 'linear-gradient(180deg,#2C3E50, #4CA0AE)' },
      { name: 'Electric Blue', css: 'linear-gradient(180deg,#0C52C4, #00B1F3)' },
      { name: 'Coral Reef', css: 'linear-gradient(to right, rgb(255, 91, 87), rgb(170, 228, 215))' },
      { name: 'Sunset Gradient', css: 'linear-gradient(to right, rgb(254, 190, 88), rgb(222, 43, 174))' },
      { name: 'Forest Green', css: 'radial-gradient(at center bottom, rgb(120, 53, 15), rgb(252, 211, 77))' },
      { name: 'Violet Dream', css: 'radial-gradient(at center center, rgb(88, 28, 135), rgb(99, 102, 241))' },
      { name: 'Dark Violet', css: 'linear-gradient(rgb(17, 24, 39), rgb(88, 28, 135), rgb(124, 58, 237))' },
      { name: 'Warm Flame', css: 'conic-gradient(at right center, rgb(127, 29, 29), rgb(221, 214, 254), rgb(249, 115, 22))' },
      { name: 'Orange Sky', css: 'linear-gradient(to top, rgb(251, 146, 60), rgb(56, 189, 248))' },
      { name: 'Purple Haze', css: 'linear-gradient(to right top, rgb(139, 92, 246), rgb(253, 186, 116))' },
    ];
  }

  private updateLayerSelection(): void {
    // Actualizar clases 'selected' en la lista de capas
    this.container.querySelectorAll('.bg-layer').forEach(el => {
      const layerId = (el as HTMLElement).dataset.layerId;
      if (layerId === this.selectedLayerId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  private renderImageEditorContent(layer: BackgroundLayer): string {
    return `
      <div class="bg-image-controls">
        <div class="bg-field">
          <label class="bg-label">Image URL</label>
          <input 
            type="text" 
            class="bg-input" 
            data-input="image-url"
            placeholder="https://..."
            value="${layer.imageUrl || ''}"
          >
        </div>
        <div class="bg-field-row">
          <div class="bg-field">
            <label class="bg-label">Repeat</label>
            <select class="bg-select" data-select="image-repeat">
              <option value="no-repeat" ${layer.imageRepeat === 'no-repeat' ? 'selected' : ''}>No Repeat</option>
              <option value="repeat" ${layer.imageRepeat === 'repeat' ? 'selected' : ''}>Repeat</option>
              <option value="repeat-x" ${layer.imageRepeat === 'repeat-x' ? 'selected' : ''}>Repeat X</option>
              <option value="repeat-y" ${layer.imageRepeat === 'repeat-y' ? 'selected' : ''}>Repeat Y</option>
            </select>
          </div>
          <div class="bg-field">
            <label class="bg-label">Size</label>
            <select class="bg-select" data-select="image-size">
              <option value="cover" ${layer.imageSize === 'cover' ? 'selected' : ''}>Cover</option>
              <option value="contain" ${layer.imageSize === 'contain' ? 'selected' : ''}>Contain</option>
              <option value="auto" ${layer.imageSize === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </div>
          <div class="bg-field">
            <label class="bg-label">Position</label>
            <select class="bg-select" data-select="image-position">
              <option value="center" ${layer.imagePosition === 'center' ? 'selected' : ''}>Center</option>
              <option value="top" ${layer.imagePosition === 'top' ? 'selected' : ''}>Top</option>
              <option value="bottom" ${layer.imagePosition === 'bottom' ? 'selected' : ''}>Bottom</option>
              <option value="left" ${layer.imagePosition === 'left' ? 'selected' : ''}>Left</option>
              <option value="right" ${layer.imagePosition === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Add layer buttons
    this.container.querySelectorAll('[data-action="add-image"]').forEach(btn => {
      btn.addEventListener('click', () => this.addLayer('image'));
    });

    this.container.querySelectorAll('[data-action="add-color"]').forEach(btn => {
      btn.addEventListener('click', () => this.addLayer('color'));
    });

    // Gradient presets
    this.container.querySelectorAll('[data-preset-index]').forEach(preset => {
      preset.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).dataset.presetIndex || '0');
        this.addLayerFromPreset(index);
      });
    });

    // Layer actions
    this.container.querySelectorAll('[data-action="toggle-layer"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerId = (e.currentTarget as HTMLElement).dataset.layerId;
        if (layerId) this.toggleLayer(layerId);
      });
    });

    this.container.querySelectorAll('[data-action="select-layer"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerId = (e.currentTarget as HTMLElement).dataset.layerId;
        if (layerId) this.openPickerPopup(layerId);
      });
    });

    // Close popup actions
    this.container.querySelectorAll('[data-action="close-popup"]').forEach(btn => {
      btn.addEventListener('click', () => this.closePickerPopup());
    });

    this.container.querySelectorAll('[data-action="remove-layer"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerId = (e.currentTarget as HTMLElement).dataset.layerId;
        if (layerId) this.removeLayer(layerId);
      });
    });

    this.container.querySelectorAll('[data-action="move-up"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerId = (e.currentTarget as HTMLElement).dataset.layerId;
        if (layerId) this.moveLayer(layerId, -1);
      });
    });

    this.container.querySelectorAll('[data-action="move-down"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerId = (e.currentTarget as HTMLElement).dataset.layerId;
        if (layerId) this.moveLayer(layerId, 1);
      });
    });

  }

  private attachImageEditorListeners(): void {
    const popup = this.container.querySelector('#bg-picker-popup');
    if (!popup) return;

    // Image URL input
    const imageUrlInput = popup.querySelector('[data-input="image-url"]') as HTMLInputElement;
    if (imageUrlInput) {
      imageUrlInput.addEventListener('input', (e) => {
        this.updateSelectedLayerImage('url', (e.target as HTMLInputElement).value);
      });
    }

    // Image selects
    ['repeat', 'size', 'position'].forEach(prop => {
      const select = popup.querySelector(`[data-select="image-${prop}"]`) as HTMLSelectElement;
      if (select) {
        select.addEventListener('change', (e) => {
          this.updateSelectedLayerImage(prop, (e.target as HTMLSelectElement).value);
        });
      }
    });
  }



  private addLayer(type: BackgroundLayerType): void {
    const layer: BackgroundLayer = {
      id: `layer-${this.nextLayerId++}`,
      type: type,
      visible: true
    };

    if (type === 'image') {
      layer.imageUrl = '';
      layer.imageRepeat = 'no-repeat';
      layer.imageSize = 'cover';
      layer.imagePosition = 'center';
    } else {
      // Default color
      layer.backgroundImage = 'rgba(255, 255, 255, 1)';
      layer.backgroundRepeat = 'no-repeat';
      layer.backgroundBlendMode = 'normal';
    }

    this.properties.layers.unshift(layer);
    this.selectedLayerId = layer.id;
    this.render();
    this.emitChange();
  }

  private addLayerFromPreset(presetIndex: number, addMode: boolean = true): void {
    const presets = [
      { name: 'Purple Dream', css: 'linear-gradient(43deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)' },
      { name: 'Ocean Blue', css: 'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)' },
      { name: 'Pink Sunset', css: 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
      { name: 'Aqua Splash', css: 'linear-gradient(0deg, #08AEEA 0%, #2AF598 100%)' },
      { name: 'Purple Magic', css: 'linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)' },
      { name: 'Sunset Fire', css: 'linear-gradient(147deg, #FFE53B 0%, #FF2525 74%)' },
      { name: 'Mint Fresh', css: 'linear-gradient(90deg, #74EBD5 0%, #9FACE6 100%)' },
      { name: 'Royal Purple', css: 'linear-gradient(220.55deg, #A531DC 0%, #4300B1 100%)' },
      { name: 'Fire Red', css: 'linear-gradient(220.55deg, #FF896D 0%, #D02020 100%)' },
      { name: 'Deep Blue', css: 'linear-gradient(220.55deg, #3793FF 0%, #0017E4 100%)' },
      { name: 'Golden Sun', css: 'linear-gradient(220.55deg, #FFD439 0%, #FF7A00 100%)' },
      { name: 'Sky Blue', css: 'linear-gradient(220.55deg, #7CF7FF 0%, #4B73FF 100%)' },
      { name: 'Pink Lemon', css: 'linear-gradient(220.55deg, #FFED46 0%, #FF7EC7 100%)' },
      { name: 'Instagram', css: 'radial-gradient(circle at 30% 110%, #ffdb8b 0%,#ee653d 25%,#d42e81 50%,#a237b6 75%,#3e5fbc 100%)' },
      { name: 'Rainbow', css: 'linear-gradient(115deg,#4fcf70,#fad648,#a767e5,#12bcfe,#44ce7b)' },
      { name: 'Sea Wave', css: 'linear-gradient(180deg,#04e2f7, #1448d8)' },
      { name: 'Purple Pink', css: 'linear-gradient(180deg,#11AEEB, #c13af1)' },
      { name: 'Mint Green', css: 'linear-gradient(180deg,#11AEEB, #35F39D)' },
      { name: 'Cotton Candy', css: 'linear-gradient(180deg,#E3FFFD, #FFEDFB)' },
      { name: 'Peach', css: 'linear-gradient(180deg,#FB1834, #FB2B90)' },
      { name: 'Night Sky', css: 'linear-gradient(180deg,#2C3E50, #4CA0AE)' },
      { name: 'Electric Blue', css: 'linear-gradient(180deg,#0C52C4, #00B1F3)' },
      { name: 'Coral Reef', css: 'linear-gradient(to right, rgb(255, 91, 87), rgb(170, 228, 215))' },
      { name: 'Sunset Gradient', css: 'linear-gradient(to right, rgb(254, 190, 88), rgb(222, 43, 174))' },
      { name: 'Forest Green', css: 'radial-gradient(at center bottom, rgb(120, 53, 15), rgb(252, 211, 77))' },
      { name: 'Violet Dream', css: 'radial-gradient(at center center, rgb(88, 28, 135), rgb(99, 102, 241))' },
      { name: 'Dark Violet', css: 'linear-gradient(rgb(17, 24, 39), rgb(88, 28, 135), rgb(124, 58, 237))' },
      { name: 'Warm Flame', css: 'conic-gradient(at right center, rgb(127, 29, 29), rgb(221, 214, 254), rgb(249, 115, 22))' },
      { name: 'Orange Sky', css: 'linear-gradient(to top, rgb(251, 146, 60), rgb(56, 189, 248))' },
      { name: 'Purple Haze', css: 'linear-gradient(to right top, rgb(139, 92, 246), rgb(253, 186, 116))' },
    ];

    const preset = presets[presetIndex];
    if (!preset) return;

    const layer: BackgroundLayer = {
      id: `layer-${this.nextLayerId++}`,
      type: 'gradient',
      visible: true,
      backgroundImage: preset.css,
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'normal',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };

    if (addMode) {
      // Añadir nueva capa
      this.properties.layers.unshift(layer);
    } else {
      // Reemplazar todas las capas
      this.properties.layers = [layer];
    }
    
    this.selectedLayerId = layer.id;
    this.render();
    this.emitChange();
  }

  private toggleLayer(layerId: string): void {
    const layer = this.properties.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this.render();
      this.emitChange();
    }
  }



  private removeLayer(layerId: string): void {
    this.properties.layers = this.properties.layers.filter(l => l.id !== layerId);
    if (this.selectedLayerId === layerId) {
      this.selectedLayerId = this.properties.layers.length > 0 ? this.properties.layers[0].id : null;
    }
    this.render();
    this.emitChange();
  }

  private moveLayer(layerId: string, direction: number): void {
    const index = this.properties.layers.findIndex(l => l.id === layerId);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.properties.layers.length) return;

    const [layer] = this.properties.layers.splice(index, 1);
    this.properties.layers.splice(newIndex, 0, layer);

    this.render();
    this.emitChange();
  }

  private updateSelectedLayerFromPicker(css: {
    backgroundImage: string;
    backgroundRepeat: string;
    backgroundBlendMode: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  }): void {
    const layer = this.properties.layers.find(l => l.id === this.selectedLayerId);
    if (!layer || layer.type === 'image') return;

    layer.backgroundImage = css.backgroundImage;
    layer.backgroundRepeat = css.backgroundRepeat;
    layer.backgroundBlendMode = css.backgroundBlendMode;
    layer.backgroundSize = css.backgroundSize;
    layer.backgroundPosition = css.backgroundPosition;

    this.emitChange();
  }

  private updateSelectedLayerImage(prop: string, value: string): void {
    const layer = this.properties.layers.find(l => l.id === this.selectedLayerId);
    if (!layer || layer.type !== 'image') return;

    switch (prop) {
      case 'url':
        layer.imageUrl = value;
        break;
      case 'repeat':
        layer.imageRepeat = value;
        break;
      case 'size':
        layer.imageSize = value;
        break;
      case 'position':
        layer.imagePosition = value;
        break;
    }

    this.emitChange();
  }

  private emitChange(): void {
    if (this.onChange) {
      this.onChange({ ...this.properties });
    }
  }

  public setProperties(props: Partial<BackgroundProperties>): void {
    if (props.layers) {
      this.properties.layers = props.layers.map(l => ({ ...l }));
      this.render();
    }
  }

  public getProperties(): BackgroundProperties {
    return { layers: this.properties.layers.map(l => ({ ...l })) };
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    if (this.advancedPicker) {
      this.advancedPicker.destroy();
      this.advancedPicker = null;
    }
    this.container.remove();
  }
}
