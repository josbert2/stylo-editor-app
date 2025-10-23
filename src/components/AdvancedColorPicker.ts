/**
 * AdvancedColorPicker - Editor avanzado de color y gradientes
 * Portado de CssPro CustomPickColor a vanilla TypeScript
 */

import {
  HSVA,
  RGBA,
  hexToRgba,
  rgbaToHexa,
  rgbaToHsva,
  rgbaToHsvaSafe,
  hsvaToRgba,
  rgbaString,
  hslaStringFromHsva,
  BLEND_MODES,
  BlendMode,
  clamp
} from '../utils/colorHelpers';

export type TabKey = 
  | 'solid'
  | 'linear-gradient'
  | 'radial-gradient'
  | 'conic-gradient'
  | 'image'
  | 'pattern'
  | 'noise';

export type ColorFormat = 'HEXA' | 'RGBA' | 'HSLA';

export interface GradientStop {
  id: string;
  color: string;
  position: number; // 0-100
}

export interface AdvancedColorPickerOptions {
  container: HTMLElement;
  defaultColor?: string;
  defaultSwatches?: string[];
  onChange?: (css: {
    backgroundImage: string;
    backgroundRepeat: string;
    backgroundBlendMode: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  }, clipboardCss: string) => void;
}

export class AdvancedColorPicker {
  private container: HTMLElement;
  private onChange?: AdvancedColorPickerOptions['onChange'];
  
  // Estado de color
  private hsva: HSVA = { h: 180, s: 0.5, v: 0.7, a: 1 };
  private format: ColorFormat = 'HEXA';
  
  // Tabs y opciones
  private activeTab: TabKey = 'solid';
  private blend: BlendMode = 'normal';
  private repeat: boolean = false;
  
  // Gradientes
  private angle: number = 90;
  private stops: GradientStop[] = [
    { id: 'stop-0', color: '#000000', position: 0 },
    { id: 'stop-1', color: '#FFFFFF', position: 100 }
  ];
  private selectedStopId: string | null = 'stop-0';
  
  // Imagen
  private imageUrl: string = '';
  
  // Pattern
  private patternIndex: number = 0; // 0 = none, 1+ = pattern index
  private patternSize: number = 20;
  
  // Noise
  private noiseUrl: string = '';
  private noiseOpacity: number = 0.3;
  
  // Swatches
  private swatches: string[] = [
    '#ff4d4f', '#f759ab', '#9254de', '#597ef7',
    '#40a9ff', '#36cfc9', '#73d13d', '#bae637',
    '#ffd666', '#ffa940', '#ff7a45', '#8c8c8c',
    '#009688', '#FFD439'
  ];
  
  private nextStopId = 2;

  constructor(options: AdvancedColorPickerOptions) {
    this.container = options.container;
    this.onChange = options.onChange;
    
    if (options.defaultColor) {
      const rgba = hexToRgba(options.defaultColor);
      if (rgba) {
        this.hsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a);
      }
    }
    
    if (options.defaultSwatches) {
      this.swatches = options.defaultSwatches;
    }

    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.className = 'advanced-color-picker';
    this.container.innerHTML = this.getHTML();
  }

  private getHTML(): string {
    return `
      <div class="acp-container">
        <!-- Preview -->
        <div class="acp-preview-section">
          <div class="acp-preview" style="${this.getPreviewStyle()}"></div>
        </div>

        <!-- Tabs -->
        <ul class="acp-tabs" contenteditable="false">
          ${this.renderTab('solid', 'Solid')}
          ${this.renderTab('linear-gradient', 'Linear')}
          ${this.renderTab('radial-gradient', 'Radial')}
          ${this.renderTab('conic-gradient', 'Conic')}
          ${this.renderTab('image', 'Image')}
          ${this.renderTab('pattern', 'Pattern')}
          ${this.renderTab('noise', 'Noise')}
        </ul>

        <!-- Color Picker Area (solo para solid y gradientes) -->
        ${this.shouldShowColorPicker() ? this.renderColorPicker() : ''}

        <!-- Swatches -->
        ${this.renderSwatches()}

        <!-- CSS Output -->
        ${this.renderCSSOutput()}

        <!-- Opciones Globales -->
        ${this.renderGlobalOptions()}

        <!-- Opciones específicas por tab -->
        ${this.renderTabSpecificOptions()}
      </div>
    `;
  }

  private renderTab(tab: TabKey, label: string): string {
    const isActive = this.activeTab === tab;
    const iconContent = this.getTabIcon(tab);
    return `
      <li 
        class="acp-tab ${isActive ? 'active' : ''}" 
        data-tab="${tab}"
        title="${label}"
      >
        ${iconContent}
      </li>
    `;
  }

  private getTabIcon(tab: TabKey): string {
    const highlightColor = 'rgba(99, 102, 241, 1)';
    
    switch(tab) {
      case 'solid':
        return `<span style="background: ${highlightColor};"></span>`;
      
      case 'linear-gradient':
        return `<span style="background: linear-gradient(0deg, rgba(255, 255, 255, 0) 16.67%, ${highlightColor} 100%);"></span>`;
      
      case 'radial-gradient':
        return `<span style="background: radial-gradient(50% 50% at 50% 50%, ${highlightColor} 16.67%, rgba(255, 255, 255, 0) 100%);"></span>`;
      
      case 'conic-gradient':
        return `<span style="background: conic-gradient(from 89.24deg at 50% 50%, ${highlightColor} 0deg, rgba(255, 255, 255, 0) 60deg, ${highlightColor} 360deg);"></span>`;
      
      case 'image':
        return `
          <span>
            <svg style="transform: scale(1.5)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="${highlightColor}">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
            </svg>
          </span>
        `;
      
      case 'pattern':
        return `<span style="background-image: linear-gradient(135deg, ${highlightColor} 25%, transparent 25%), linear-gradient(225deg, ${highlightColor} 25%, transparent 25%), linear-gradient(45deg, ${highlightColor} 25%, transparent 25%), linear-gradient(315deg, ${highlightColor} 25%, #00000000 25%); background-position: 5px 0, 5px 0, 0 0, 0 0; background-size: 10px 10px; background-repeat: repeat;"></span>`;
      
      case 'noise':
        return `<span style="background-image: linear-gradient(${highlightColor}, ${highlightColor}); background-size: 30px; opacity: 0.6;"></span>`;
      
      default:
        return `<span></span>`;
    }
  }

  private shouldShowColorPicker(): boolean {
    return ['solid', 'linear-gradient', 'radial-gradient', 'conic-gradient'].includes(this.activeTab);
  }

  private renderColorPicker(): string {
    const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
    const currentColor = this.getCurrentColorString();

    return `
      <div class="acp-picker-section">
        <!-- SV Area -->
        <div class="acp-sv-area" data-picker="sv">
          <div 
            class="acp-sv-area-gradient" 
            style="background: linear-gradient(to top, #000, transparent), 
                   linear-gradient(to right, #fff, hsl(${this.hsva.h}, 100%, 50%))"
          >
            <div 
              class="acp-sv-cursor" 
              style="left: ${this.hsva.s * 100}%; bottom: ${this.hsva.v * 100}%"
            ></div>
          </div>
        </div>

        <!-- Sliders -->
        <div class="acp-sliders">
          <!-- Hue Slider -->
          <div class="acp-slider-row">
            <label class="acp-slider-label">H</label>
            <div class="acp-slider-track" data-slider="hue">
              <div 
                class="acp-slider-thumb" 
                style="left: ${(this.hsva.h / 360) * 100}%"
              ></div>
            </div>
            <input 
              type="number" 
              class="acp-slider-value" 
              data-input="hue"
              value="${Math.round(this.hsva.h)}"
              min="0"
              max="360"
            >
          </div>

          <!-- Alpha Slider -->
          <div class="acp-slider-row">
            <label class="acp-slider-label">A</label>
            <div class="acp-slider-track acp-alpha-track" data-slider="alpha">
              <div 
                class="acp-slider-gradient"
                style="background: linear-gradient(to right, transparent, ${rgbaString(rgba.r, rgba.g, rgba.b, 1)})"
              ></div>
              <div 
                class="acp-slider-thumb" 
                style="left: ${this.hsva.a * 100}%"
              ></div>
            </div>
            <input 
              type="number" 
              class="acp-slider-value" 
              data-input="alpha"
              value="${Math.round(this.hsva.a * 100)}"
              min="0"
              max="100"
            >
          </div>
        </div>

        <!-- Color Input/Output -->
        <div class="acp-color-io">
          <div class="acp-format-tabs">
            ${this.renderFormatTab('HEXA')}
            ${this.renderFormatTab('RGBA')}
            ${this.renderFormatTab('HSLA')}
          </div>
          <input 
            type="text" 
            class="acp-color-input" 
            data-input="color"
            value="${currentColor}"
          >
        </div>
      </div>
    `;
  }

  private renderFormatTab(format: ColorFormat): string {
    const isActive = this.format === format;
    return `
      <button 
        class="acp-format-tab ${isActive ? 'active' : ''}" 
        data-format="${format}"
      >
        ${format}
      </button>
    `;
  }

  private renderSwatches(): string {
    return `
      <div class="acp-swatches-section">
        <div class="acp-swatches-grid">
          ${this.swatches.map(color => `
            <button 
              class="acp-swatch" 
              style="background: ${color}"
              data-swatch="${color}"
              title="${color}"
            ></button>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderCSSOutput(): string {
    const css = this.getClipboardCSS();
    return `
      <div class="acp-css-output">
        <div class="acp-css-header">
          <span class="acp-css-label">CSS</span>
          <button class="acp-copy-btn" data-action="copy">Copy CSS</button>
        </div>
        <textarea 
          class="acp-css-textarea" 
          data-input="css"
          rows="3"
        >${css}</textarea>
      </div>
    `;
  }

  private renderGlobalOptions(): string {
    return `
      <div class="acp-global-options">
        <div class="acp-option-row">
          <label class="acp-option-label">Blend Mode</label>
          <select class="acp-blend-select" data-select="blend">
            ${BLEND_MODES.map(mode => `
              <option value="${mode}" ${this.blend === mode ? 'selected' : ''}>${mode}</option>
            `).join('')}
          </select>
        </div>

        <label class="acp-checkbox-label">
          <input 
            type="checkbox" 
            class="acp-checkbox" 
            data-checkbox="repeat"
            ${this.repeat ? 'checked' : ''}
          >
          Repeat
        </label>
      </div>
    `;
  }

  private renderTabSpecificOptions(): string {
    switch (this.activeTab) {
      case 'linear-gradient':
      case 'conic-gradient':
        return this.renderAngleOption();
      
      case 'linear-gradient':
      case 'radial-gradient':
      case 'conic-gradient':
        return this.renderGradientStopsEditor();
      
      case 'image':
        return this.renderImageOptions();
      
      case 'pattern':
        return this.renderPatternOptions();
      
      case 'noise':
        return this.renderNoiseOptions();
      
      default:
        return '';
    }
  }

  private renderAngleOption(): string {
    return `
      <div class="acp-option-row">
        <label class="acp-option-label">Angle</label>
        <input 
          type="range" 
          class="acp-range-slider" 
          data-slider="angle"
          min="0"
          max="360"
          value="${this.angle}"
        >
        <span class="acp-option-value">${this.angle}°</span>
      </div>
    `;
  }

  private renderGradientStopsEditor(): string {
    // Construir preview del gradiente para el track
    const gradientPreview = this.buildGradientPreviewForTrack();
    
    return `
      <div class="acp-stops-editor">
        <div class="acp-stops-container">
          <div class="acp-stops-row">
            ${this.stops.map(stop => this.renderStop(stop)).join('')}
          </div>
          <div class="acp-stops-track" data-stops-track>
            <div class="acp-stops-track-bg" style="background: ${gradientPreview}"></div>
          </div>
        </div>
      </div>
    `;
  }

  private buildGradientPreviewForTrack(): string {
    const stopsStr = this.stops
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    return `linear-gradient(to right, ${stopsStr})`;
  }

  private renderStop(stop: GradientStop): string {
    const isSelected = this.selectedStopId === stop.id;
    return `
      <div 
        class="acp-stop ${isSelected ? 'selected' : ''}" 
        data-stop-id="${stop.id}"
        style="left: ${stop.position}%; background: ${stop.color}"
        title="${stop.color} at ${stop.position}%"
      ></div>
    `;
  }

  private renderImageOptions(): string {
    return `
      <div class="acp-image-options">
        <label class="acp-option-label">Image URL</label>
        <input 
          type="text" 
          class="acp-text-input" 
          data-input="image-url"
          value="${this.imageUrl}"
          placeholder="https://..."
        >
      </div>
    `;
  }

  private renderPatternOptions(): string {
    const patterns = this.getPatternPresets();
    
    return `
      <div class="acp-pattern-gallery">
        <label class="acp-option-label">Select Pattern</label>
        <div class="acp-pattern-grid">
          <div class="acp-pattern-item ${!this.patternIndex ? 'selected' : ''}" data-pattern="none">
            <div class="acp-pattern-preview" style="background: rgba(255,255,255,0.1)">
              <span class="acp-pattern-none">×</span>
            </div>
            <span class="acp-pattern-label">None</span>
          </div>
          ${patterns.map((pattern, index) => `
            <div class="acp-pattern-item ${this.patternIndex === index + 1 ? 'selected' : ''}" data-pattern="${index + 1}">
              <div class="acp-pattern-preview" style="${pattern.css}"></div>
              <span class="acp-pattern-label">#${index + 1}</span>
            </div>
          `).join('')}
        </div>
        <div class="acp-option-row">
          <label class="acp-option-label">Pattern Size</label>
          <input 
            type="range" 
            class="acp-range-slider" 
            data-slider="pattern-size"
            min="4"
            max="64"
            value="${this.patternSize}"
          >
          <span class="acp-option-value">${this.patternSize}px</span>
        </div>
      </div>
    `;
  }

  private getPatternPresets(): Array<{name: string, css: string}> {
    return [
      {
        name: 'Grid',
        css: 'background: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 20px 20px;'
      },
      {
        name: 'Dots',
        css: 'background: radial-gradient(circle, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 50%, transparent 50%); background-size: 10px 10px;'
      },
      {
        name: 'Circles',
        css: 'background: radial-gradient(circle, transparent 20%, rgba(255,255,255,0) 20%, rgba(255,255,255,0) 80%, transparent 80%); background-size: 50px 50px;'
      },
      {
        name: 'Diagonal',
        css: 'background: repeating-linear-gradient(45deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 5px, transparent 5px, transparent 25px);'
      },
      {
        name: 'Checkers',
        css: 'background: linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.4) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.4) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;'
      },
      {
        name: 'Cross',
        css: 'background: linear-gradient(rgba(255,255,255,0) 50%, rgba(255,255,255,0.4) 50%), linear-gradient(to right, rgba(255,255,255,0) 50%, rgba(255,255,255,0.4) 50%); background-size: 20px 20px;'
      },
      {
        name: 'Zigzag',
        css: 'background: linear-gradient(135deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.4) 25%, transparent 25%); background-size: 20px 20px; background-position: 10px 0, 10px 0, 0 0, 0 0;'
      },
      {
        name: 'Stripes V',
        css: 'background: linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.4) 5px, transparent 5px, transparent); background-size: 10px 100%;'
      },
      {
        name: 'Stripes H',
        css: 'background: linear-gradient(0deg, transparent 50%, rgba(255,255,255,0.4) 50%); background-size: 10px 10px;'
      },
      {
        name: 'Small Dots',
        css: 'background: radial-gradient(rgba(255,255,255,0.4) 0.5px, transparent 0.5px), radial-gradient(rgba(255,255,255,0.4) 0.5px, transparent 0.5px); background-size: 20px 20px; background-position: 0 0, 10px 10px;'
      },
      {
        name: 'Plus',
        css: 'background: linear-gradient(rgba(255,255,255,0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.4) 2px, transparent 2px); background-size: 50px 50px;'
      },
      {
        name: 'Honeycomb',
        css: 'background: linear-gradient(30deg, rgba(255,255,255,0.4) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.4) 87.5%), linear-gradient(150deg, rgba(255,255,255,0.4) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.4) 87.5%), linear-gradient(30deg, rgba(255,255,255,0.4) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.4) 87.5%), linear-gradient(150deg, rgba(255,255,255,0.4) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.4) 87.5%); background-size: 20px 35px; background-position: 0 0, 0 0, 10px 18px, 10px 18px;'
      }
    ];
  }

  private renderNoiseOptions(): string {
    return `
      <div class="acp-noise-options">
        <label class="acp-option-label">Noise URL</label>
        <input 
          type="text" 
          class="acp-text-input" 
          data-input="noise-url"
          value="${this.noiseUrl}"
          placeholder="noise.png"
        >
        
        <div class="acp-option-row">
          <label class="acp-option-label">Opacity</label>
          <input 
            type="range" 
            class="acp-range-slider" 
            data-slider="noise-opacity"
            min="0"
            max="1"
            step="0.01"
            value="${this.noiseOpacity}"
          >
          <span class="acp-option-value">${Math.round(this.noiseOpacity * 100)}%</span>
        </div>
      </div>
    `;
  }

  private getCurrentColorString(): string {
    const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
    
    switch (this.format) {
      case 'HEXA':
        return rgbaToHexa(rgba.r, rgba.g, rgba.b, rgba.a);
      case 'RGBA':
        return rgbaString(rgba.r, rgba.g, rgba.b, rgba.a);
      case 'HSLA':
        return hslaStringFromHsva(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
      default:
        return rgbaToHexa(rgba.r, rgba.g, rgba.b, rgba.a);
    }
  }

  private getPreviewStyle(): string {
    const css = this.buildCSS();
    return `
      background-image: ${css.backgroundImage};
      background-repeat: ${css.backgroundRepeat};
      background-blend-mode: ${css.backgroundBlendMode};
      ${css.backgroundSize ? `background-size: ${css.backgroundSize};` : ''}
      ${css.backgroundPosition ? `background-position: ${css.backgroundPosition};` : ''}
    `.trim();
  }

  private getClipboardCSS(): string {
    const css = this.buildCSS();
    return `background-image: ${css.backgroundImage};
background-repeat: ${css.backgroundRepeat};
background-blend-mode: ${css.backgroundBlendMode};${css.backgroundSize ? `\nbackground-size: ${css.backgroundSize};` : ''}${css.backgroundPosition ? `\nbackground-position: ${css.backgroundPosition};` : ''}`;
  }

  private buildCSS() {
    const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
    const colorStr = rgbaString(rgba.r, rgba.g, rgba.b, rgba.a);

    let backgroundImage = colorStr;
    let backgroundSize: string | undefined = undefined;
    let backgroundPosition: string | undefined = undefined;

    switch (this.activeTab) {
      case 'solid':
        backgroundImage = colorStr;
        break;
      
      case 'linear-gradient':
        backgroundImage = this.buildLinearGradient();
        break;
      
      case 'radial-gradient':
        backgroundImage = this.buildRadialGradient();
        break;
      
      case 'conic-gradient':
        backgroundImage = this.buildConicGradient();
        break;
      
      case 'image':
        backgroundImage = this.imageUrl ? `url(${this.imageUrl})` : colorStr;
        backgroundSize = 'cover';
        backgroundPosition = 'center';
        break;
      
      case 'pattern':
        backgroundImage = this.buildPattern();
        backgroundSize = `${this.patternSize}px ${this.patternSize}px`;
        break;
      
      case 'noise':
        backgroundImage = this.noiseUrl ? `url(${this.noiseUrl})` : colorStr;
        break;
    }

    return {
      backgroundImage,
      backgroundRepeat: this.repeat ? 'repeat' : 'no-repeat',
      backgroundBlendMode: this.blend,
      backgroundSize,
      backgroundPosition
    };
  }

  private buildLinearGradient(): string {
    const stopsStr = this.stops
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    return `linear-gradient(${this.angle}deg, ${stopsStr})`;
  }

  private buildRadialGradient(): string {
    const stopsStr = this.stops
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    return `radial-gradient(circle, ${stopsStr})`;
  }

  private buildConicGradient(): string {
    const stopsStr = this.stops
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');
    return `conic-gradient(from ${this.angle}deg, ${stopsStr})`;
  }

  private buildPattern(): string {
    const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
    const colorStr = rgbaString(rgba.r, rgba.g, rgba.b, rgba.a);
    // Patrón simple de cuadrícula
    return `repeating-linear-gradient(0deg, ${colorStr} 0px, transparent 1px, transparent ${this.patternSize / 2}px), 
            repeating-linear-gradient(90deg, ${colorStr} 0px, transparent 1px, transparent ${this.patternSize / 2}px)`;
  }

  private attachEventListeners(): void {
    // Tabs
    this.container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab as TabKey;
        this.activeTab = tab;
        this.render();
        this.attachEventListeners();
        this.emitChange();
      });
    });

    // SV Area Drag
    const svArea = this.container.querySelector('[data-picker="sv"]') as HTMLElement;
    if (svArea) {
      svArea.addEventListener('mousedown', (e) => this.handleSVDrag(e));
    }

    // Hue Slider
    const hueSlider = this.container.querySelector('[data-slider="hue"]') as HTMLElement;
    if (hueSlider) {
      hueSlider.addEventListener('mousedown', (e) => this.handleHueSliderDrag(e));
    }

    // Alpha Slider
    const alphaSlider = this.container.querySelector('[data-slider="alpha"]') as HTMLElement;
    if (alphaSlider) {
      alphaSlider.addEventListener('mousedown', (e) => this.handleAlphaSliderDrag(e));
    }

    // Hue Input
    const hueInput = this.container.querySelector('[data-input="hue"]') as HTMLInputElement;
    if (hueInput) {
      hueInput.addEventListener('input', (e) => {
        this.hsva.h = clamp(parseFloat((e.target as HTMLInputElement).value), 0, 360);
        this.updateUI();
      });
    }

    // Alpha Input
    const alphaInput = this.container.querySelector('[data-input="alpha"]') as HTMLInputElement;
    if (alphaInput) {
      alphaInput.addEventListener('input', (e) => {
        this.hsva.a = clamp(parseFloat((e.target as HTMLInputElement).value) / 100, 0, 1);
        this.updateUI();
      });
    }

    // Format Tabs
    this.container.querySelectorAll('[data-format]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.format = (e.currentTarget as HTMLElement).dataset.format as ColorFormat;
        this.render();
        this.attachEventListeners();
      });
    });

    // Color Input
    const colorInput = this.container.querySelector('[data-input="color"]') as HTMLInputElement;
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        const rgba = hexToRgba(value);
        if (rgba) {
          this.hsva = rgbaToHsvaSafe(rgba.r, rgba.g, rgba.b, rgba.a, this.hsva.h);
          this.updateUI();
        }
      });
    }

    // Swatches
    this.container.querySelectorAll('[data-swatch]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = (e.currentTarget as HTMLElement).dataset.swatch;
        if (color) {
          const rgba = hexToRgba(color);
          if (rgba) {
            this.hsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a);
            this.render();
            this.attachEventListeners();
            this.emitChange();
          }
        }
      });
    });

    // Copy CSS Button
    const copyBtn = this.container.querySelector('[data-action="copy"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const css = this.getClipboardCSS();
        navigator.clipboard.writeText(css).then(() => {
          // TODO: Show feedback
          console.log('CSS copied to clipboard');
        });
      });
    }

    // CSS Textarea
    const cssTextarea = this.container.querySelector('[data-input="css"]') as HTMLTextAreaElement;
    if (cssTextarea) {
      cssTextarea.addEventListener('input', (e) => {
        const value = (e.target as HTMLTextAreaElement).value;
        const hexMatch = value.match(/#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
        if (hexMatch) {
          const rgba = hexToRgba(hexMatch[0]);
          if (rgba) {
            this.hsva = rgbaToHsvaSafe(rgba.r, rgba.g, rgba.b, rgba.a, this.hsva.h);
            this.activeTab = 'solid';
            this.render();
            this.attachEventListeners();
            this.emitChange();
          }
        }
      });
    }

    // Blend Mode Select
    const blendSelect = this.container.querySelector('[data-select="blend"]') as HTMLSelectElement;
    if (blendSelect) {
      blendSelect.addEventListener('change', (e) => {
        this.blend = (e.target as HTMLSelectElement).value as BlendMode;
        this.updateUI();
      });
    }

    // Repeat Checkbox
    const repeatCheckbox = this.container.querySelector('[data-checkbox="repeat"]') as HTMLInputElement;
    if (repeatCheckbox) {
      repeatCheckbox.addEventListener('change', (e) => {
        this.repeat = (e.target as HTMLInputElement).checked;
        this.updateUI();
      });
    }

    // Angle Slider (for gradients)
    const angleSlider = this.container.querySelector('[data-slider="angle"]') as HTMLInputElement;
    if (angleSlider) {
      angleSlider.addEventListener('input', (e) => {
        this.angle = parseInt((e.target as HTMLInputElement).value);
        this.updateUI();
      });
    }

    // Click on gradient track to add stop
    const stopsTrack = this.container.querySelector('[data-stops-track]') as HTMLElement;
    if (stopsTrack) {
      stopsTrack.addEventListener('click', (e) => {
        // Solo si no se clickeó en un stop existente
        if ((e.target as HTMLElement).dataset.stopId) return;
        
        const rect = stopsTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const position = Math.round((clickX / rect.width) * 100);
        
        // Crear nuevo stop en esa posición
        const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
        const color = rgbaToHexa(rgba.r, rgba.g, rgba.b, rgba.a);
        const newStop: GradientStop = {
          id: `stop-${this.nextStopId++}`,
          color: color,
          position: Math.max(0, Math.min(100, position))
        };
        this.stops.push(newStop);
        this.stops.sort((a, b) => a.position - b.position);
        this.selectedStopId = newStop.id;
        this.render();
        this.attachEventListeners();
        this.emitChange();
      });
    }

    // Gradient Stops
    this.container.querySelectorAll('[data-stop-id]').forEach(stop => {
      stop.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const stopId = (e.currentTarget as HTMLElement).dataset.stopId;
        if (stopId) {
          this.selectedStopId = stopId;
          this.handleStopDrag(e as MouseEvent, stopId);
        }
      });
      
      stop.addEventListener('click', (e) => {
        e.stopPropagation();
        const stopId = (e.currentTarget as HTMLElement).dataset.stopId;
        if (stopId) {
          this.selectedStopId = stopId;
          const stopData = this.stops.find(s => s.id === stopId);
          if (stopData) {
            const rgba = hexToRgba(stopData.color);
            if (rgba) {
              this.hsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a);
            }
          }
          this.render();
          this.attachEventListeners();
        }
      });
    });

    // Remove Stop Buttons
    this.container.querySelectorAll('[data-action="remove-stop"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stopId = (e.currentTarget as HTMLElement).dataset.stopId;
        if (stopId && this.stops.length > 2) {
          this.stops = this.stops.filter(s => s.id !== stopId);
          if (this.selectedStopId === stopId) {
            this.selectedStopId = this.stops[0].id;
          }
          this.render();
          this.attachEventListeners();
          this.emitChange();
        }
      });
    });

    // Add Stop Button
    const addStopBtn = this.container.querySelector('[data-action="add-stop"]');
    if (addStopBtn) {
      addStopBtn.addEventListener('click', () => {
        const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
        const color = rgbaToHexa(rgba.r, rgba.g, rgba.b, rgba.a);
        const newStop: GradientStop = {
          id: `stop-${this.nextStopId++}`,
          color: color,
          position: 50
        };
        this.stops.push(newStop);
        this.stops.sort((a, b) => a.position - b.position);
        this.selectedStopId = newStop.id;
        this.render();
        this.attachEventListeners();
        this.emitChange();
      });
    }

    // Image URL Input
    const imageUrlInput = this.container.querySelector('[data-input="image-url"]') as HTMLInputElement;
    if (imageUrlInput) {
      imageUrlInput.addEventListener('input', (e) => {
        this.imageUrl = (e.target as HTMLInputElement).value;
        this.updateUI();
      });
    }

    // Pattern Gallery Items
    this.container.querySelectorAll('[data-pattern]').forEach(item => {
      item.addEventListener('click', (e) => {
        const patternValue = (e.currentTarget as HTMLElement).dataset.pattern;
        if (patternValue === 'none') {
          this.patternIndex = 0;
        } else {
          this.patternIndex = parseInt(patternValue || '0');
        }
        this.render();
        this.attachEventListeners();
        this.emitChange();
      });
    });

    // Pattern Size Slider
    const patternSizeSlider = this.container.querySelector('[data-slider="pattern-size"]') as HTMLInputElement;
    if (patternSizeSlider) {
      patternSizeSlider.addEventListener('input', (e) => {
        this.patternSize = parseInt((e.target as HTMLInputElement).value);
        this.updateUI();
      });
    }

    // Noise URL Input
    const noiseUrlInput = this.container.querySelector('[data-input="noise-url"]') as HTMLInputElement;
    if (noiseUrlInput) {
      noiseUrlInput.addEventListener('input', (e) => {
        this.noiseUrl = (e.target as HTMLInputElement).value;
        this.updateUI();
      });
    }

    // Noise Opacity Slider
    const noiseOpacitySlider = this.container.querySelector('[data-slider="noise-opacity"]') as HTMLInputElement;
    if (noiseOpacitySlider) {
      noiseOpacitySlider.addEventListener('input', (e) => {
        this.noiseOpacity = parseFloat((e.target as HTMLInputElement).value);
        this.updateUI();
      });
    }
  }

  private handleSVDrag(e: MouseEvent): void {
    e.preventDefault();
    const svArea = e.currentTarget as HTMLElement;
    const rect = svArea.getBoundingClientRect();

    const move = (cx: number, cy: number) => {
      this.hsva.s = clamp((cx - rect.left) / rect.width, 0, 1);
      this.hsva.v = clamp(1 - (cy - rect.top) / rect.height, 0, 1);
      this.updateUI();
    };

    move(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => move(ev.clientX, ev.clientY);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private handleHueSliderDrag(e: MouseEvent): void {
    e.preventDefault();
    const slider = e.currentTarget as HTMLElement;
    const rect = slider.getBoundingClientRect();

    const move = (cx: number) => {
      this.hsva.h = clamp((cx - rect.left) / rect.width, 0, 1) * 360;
      this.updateUI();
    };

    move(e.clientX);

    const onMove = (ev: MouseEvent) => move(ev.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private handleAlphaSliderDrag(e: MouseEvent): void {
    e.preventDefault();
    const slider = e.currentTarget as HTMLElement;
    const rect = slider.getBoundingClientRect();

    const move = (cx: number) => {
      this.hsva.a = clamp((cx - rect.left) / rect.width, 0, 1);
      this.updateUI();
    };

    move(e.clientX);

    const onMove = (ev: MouseEvent) => move(ev.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private handleStopDrag(e: MouseEvent, stopId: string): void {
    e.preventDefault();
    e.stopPropagation();
    const track = this.container.querySelector('[data-stops-track]') as HTMLElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();

    const move = (cx: number) => {
      const position = clamp((cx - rect.left) / rect.width, 0, 1) * 100;
      const stop = this.stops.find(s => s.id === stopId);
      if (stop) {
        stop.position = position;
        this.stops.sort((a, b) => a.position - b.position);
        this.updateUI();
      }
    };

    const onMove = (ev: MouseEvent) => move(ev.clientX);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private updateUI(): void {
    // Update current color for selected stop
    if (this.selectedStopId && ['linear-gradient', 'radial-gradient', 'conic-gradient'].includes(this.activeTab)) {
      const stop = this.stops.find(s => s.id === this.selectedStopId);
      if (stop) {
        const rgba = hsvaToRgba(this.hsva.h, this.hsva.s, this.hsva.v, this.hsva.a);
        stop.color = rgbaToHexa(rgba.r, rgba.g, rgba.b, rgba.a);
      }
    }

    // Re-render para actualizar UI
    this.render();
    this.attachEventListeners();
    this.emitChange();
  }

  private emitChange(): void {
    if (this.onChange) {
      const css = this.buildCSS();
      const clipboard = this.getClipboardCSS();
      this.onChange(css, clipboard);
    }
  }

  public destroy(): void {
    this.container.innerHTML = '';
  }
}
