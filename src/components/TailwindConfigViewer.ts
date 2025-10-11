import { EventEmitter } from '../utils/EventEmitter';

export interface TailwindConfigViewerOptions {
  container: HTMLElement;
  onClose?: () => void;
}

interface TailwindConfig {
  theme: {
    colors: Record<string, any>;
    spacing: Record<string, string>;
    fontSize: Record<string, any>;
    fontFamily: Record<string, string[]>;
    fontWeight: Record<string, string>;
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    screens: Record<string, string>;
    opacity: Record<string, string>;
    [key: string]: any;
  };
  [key: string]: any;
}

interface ConfigSection {
  title: string;
  key: string;
  data: any;
  type: 'colors' | 'spacing' | 'typography' | 'sizing' | 'effects' | 'layout';
}

export class TailwindConfigViewer extends EventEmitter<any> {
  private container: HTMLElement;
  private element: HTMLElement | null = null;
  private config: TailwindConfig | null = null;
  private activeSection: string = 'colors';
  private onClose?: () => void;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(options: TailwindConfigViewerOptions) {
    super();
    this.container = options.container;
    this.onClose = options.onClose;
    this.loadTailwindConfig();
    this.createElement();
    this.bindEvents();
  }

  private async loadTailwindConfig(): Promise<void> {
    try {
      // Intentar obtener la configuración de Tailwind desde diferentes fuentes
      const config = await this.extractTailwindConfig();
      this.config = config;
      this.renderContent();
    } catch (error) {
      console.warn('No se pudo cargar la configuración de Tailwind:', error);
      this.config = this.getDefaultConfig();
      this.renderContent();
    }
  }

  private async extractTailwindConfig(): Promise<TailwindConfig> {
    // Intentar extraer la configuración de Tailwind del DOM
    const tailwindStyles = document.querySelector('style[data-tailwind]') || 
                          document.querySelector('link[href*="tailwind"]') ||
                          document.querySelector('style');

    if (tailwindStyles) {
      // Extraer variables CSS de Tailwind si están disponibles
      const computedStyle = getComputedStyle(document.documentElement);
      return this.parseConfigFromCSS(computedStyle);
    }

    // Configuración por defecto si no se encuentra
    return this.getDefaultConfig();
  }

  private parseConfigFromCSS(computedStyle: CSSStyleDeclaration): TailwindConfig {
    // Extraer colores de las variables CSS
    const colors: Record<string, any> = {};
    const spacing: Record<string, string> = {};

    // Buscar variables CSS de Tailwind
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (property.startsWith('--tw-')) {
        const value = computedStyle.getPropertyValue(property);
        if (property.includes('color')) {
          colors[property.replace('--tw-', '')] = value;
        }
      }
    }

    // Generar configuración basada en clases comunes de Tailwind
    return {
      theme: {
        colors: this.generateColors(),
        spacing: this.generateSpacing(),
        fontSize: this.generateFontSizes(),
        fontFamily: this.generateFontFamilies(),
        fontWeight: this.generateFontWeights(),
        borderRadius: this.generateBorderRadius(),
        boxShadow: this.generateBoxShadows(),
        screens: this.generateScreens(),
        opacity: this.generateOpacity()
      }
    };
  }

  private getDefaultConfig(): TailwindConfig {
    return {
      theme: {
        colors: this.generateColors(),
        spacing: this.generateSpacing(),
        fontSize: this.generateFontSizes(),
        fontFamily: this.generateFontFamilies(),
        fontWeight: this.generateFontWeights(),
        borderRadius: this.generateBorderRadius(),
        boxShadow: this.generateBoxShadows(),
        screens: this.generateScreens(),
        opacity: this.generateOpacity()
      }
    };
  }

  private generateColors(): Record<string, any> {
    return {
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      green: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
      }
    };
  }

  private generateSpacing(): Record<string, string> {
    const spacing: Record<string, string> = {};
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
    
    values.forEach(val => {
      if (val === 0) {
        spacing['0'] = '0px';
      } else {
        spacing[val.toString()] = `${val * 0.25}rem`;
      }
    });

    return spacing;
  }

  private generateFontSizes(): Record<string, any> {
    return {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    };
  }

  private generateFontFamilies(): Record<string, string[]> {
    return {
      sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      serif: ['ui-serif', 'Georgia', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'monospace']
    };
  }

  private generateFontWeights(): Record<string, string> {
    return {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    };
  }

  private generateBorderRadius(): Record<string, string> {
    return {
      none: '0px',
      sm: '0.125rem',
      DEFAULT: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px'
    };
  }

  private generateBoxShadows(): Record<string, string> {
    return {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: 'none'
    };
  }

  private generateScreens(): Record<string, string> {
    return {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
  }

  private generateOpacity(): Record<string, string> {
    const opacity: Record<string, string> = {};
    for (let i = 0; i <= 100; i += 5) {
      opacity[i.toString()] = (i / 100).toString();
    }
    return opacity;
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'tailwind-config-viewer';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 800px;
      max-width: 90vw;
      height: 600px;
      max-height: 80vh;
      background: rgba(15, 15, 15, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    this.renderContent();
    this.container.appendChild(this.element);
  }

  private renderContent(): void {
    if (!this.element || !this.config) return;

    const sections = this.getConfigSections();

    this.element.innerHTML = `
      <div class="config-viewer-header" style="
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        background: rgba(0, 0, 0, 0.2);
      ">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #10b981;">
          🎨 Tailwind Config Viewer
        </h3>
        <button class="close-btn" style="
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 16px;
        ">✕</button>
      </div>
      
      <div class="config-viewer-body" style="
        display: flex;
        flex: 1;
        overflow: hidden;
      ">
        <div class="sidebar" style="
          width: 200px;
          background: rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
          padding: 16px 0;
        ">
          ${sections.map(section => `
            <button class="section-btn ${section.key === this.activeSection ? 'active' : ''}" 
                    data-section="${section.key}" style="
              width: 100%;
              background: ${section.key === this.activeSection ? 'rgba(16, 185, 129, 0.2)' : 'none'};
              border: none;
              color: ${section.key === this.activeSection ? '#10b981' : 'rgba(255, 255, 255, 0.7)'};
              padding: 12px 20px;
              text-align: left;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 14px;
              border-left: 3px solid ${section.key === this.activeSection ? '#10b981' : 'transparent'};
            ">
              ${section.title}
            </button>
          `).join('')}
        </div>
        
        <div class="content-area" style="
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        ">
          <div class="section-content">
            ${this.renderSection(this.activeSection)}
          </div>
        </div>
      </div>
    `;

    this.bindContentEvents();
  }

  private getConfigSections(): ConfigSection[] {
    if (!this.config) return [];

    return [
      { title: 'Colors', key: 'colors', data: this.config.theme.colors, type: 'colors' },
      { title: 'Spacing', key: 'spacing', data: this.config.theme.spacing, type: 'spacing' },
      { title: 'Typography', key: 'typography', data: { 
        fontSize: this.config.theme.fontSize,
        fontFamily: this.config.theme.fontFamily,
        fontWeight: this.config.theme.fontWeight
      }, type: 'typography' },
      { title: 'Border Radius', key: 'borderRadius', data: this.config.theme.borderRadius, type: 'sizing' },
      { title: 'Shadows', key: 'boxShadow', data: this.config.theme.boxShadow, type: 'effects' },
      { title: 'Screens', key: 'screens', data: this.config.theme.screens, type: 'layout' },
      { title: 'Opacity', key: 'opacity', data: this.config.theme.opacity, type: 'effects' }
    ];
  }

  private renderSection(sectionKey: string): string {
    if (!this.config) return '<p>Cargando configuración...</p>';

    switch (sectionKey) {
      case 'colors':
        return this.renderColorsSection();
      case 'spacing':
        return this.renderSpacingSection();
      case 'typography':
        return this.renderTypographySection();
      case 'borderRadius':
        return this.renderBorderRadiusSection();
      case 'boxShadow':
        return this.renderShadowsSection();
      case 'screens':
        return this.renderScreensSection();
      case 'opacity':
        return this.renderOpacitySection();
      default:
        return '<p>Sección no encontrada</p>';
    }
  }

  private renderColorsSection(): string {
    const colors = this.config?.theme.colors || {};
    
    return `
      <div class="colors-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Colores</h4>
        ${Object.entries(colors).map(([colorName, colorValue]) => {
          if (typeof colorValue === 'object') {
            return `
              <div class="color-group" style="margin-bottom: 24px;">
                <h5 style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255, 255, 255, 0.8); text-transform: capitalize;">
                  ${colorName}
                </h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">
                  ${Object.entries(colorValue).map(([shade, value]) => `
                    <div class="color-item" style="
                      background: rgba(255, 255, 255, 0.05);
                      border-radius: 8px;
                      padding: 8px;
                      text-align: center;
                    ">
                      <div style="
                        width: 100%;
                        height: 40px;
                        background-color: ${value};
                        border-radius: 4px;
                        margin-bottom: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                      "></div>
                      <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">
                        ${colorName}-${shade}
                      </div>
                      <div style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-top: 2px;">
                        ${value}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            return `
              <div class="color-item" style="
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
              ">
                <div style="
                  width: 40px;
                  height: 40px;
                  background-color: ${colorValue};
                  border-radius: 6px;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                "></div>
                <div>
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">${colorName}</div>
                  <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">${colorValue}</div>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
  }

  private renderSpacingSection(): string {
    const spacing = this.config?.theme.spacing || {};
    
    return `
      <div class="spacing-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Espaciado</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
          ${Object.entries(spacing).map(([key, value]) => `
            <div class="spacing-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 16px;
            ">
              <div style="
                background: #10b981;
                width: ${value};
                height: ${value};
                margin-bottom: 12px;
                border-radius: 4px;
                max-width: 100px;
                max-height: 100px;
              "></div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); margin-bottom: 4px;">
                p-${key}, m-${key}
              </div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                ${value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderTypographySection(): string {
    const fontSize = this.config?.theme.fontSize || {};
    const fontFamily = this.config?.theme.fontFamily || {};
    const fontWeight = this.config?.theme.fontWeight || {};
    
    return `
      <div class="typography-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Tipografía</h4>
        
        <div class="subsection" style="margin-bottom: 32px;">
          <h5 style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">Tamaños de Fuente</h5>
          ${Object.entries(fontSize).map(([key, value]) => {
            const size = Array.isArray(value) ? value[0] : value;
            return `
              <div class="font-size-item" style="
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
              ">
                <div style="font-size: ${size}; color: white;">
                  The quick brown fox
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">text-${key}</div>
                  <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">${size}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="subsection" style="margin-bottom: 32px;">
          <h5 style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">Familias de Fuente</h5>
          ${Object.entries(fontFamily).map(([key, value]) => `
            <div class="font-family-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 8px;
            ">
              <div style="font-family: ${Array.isArray(value) ? value.join(', ') : value}; font-size: 16px; color: white; margin-bottom: 8px;">
                The quick brown fox jumps over the lazy dog
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">font-${key}</div>
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                  ${Array.isArray(value) ? value.join(', ') : value}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="subsection">
          <h5 style="margin: 0 0 16px 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">Pesos de Fuente</h5>
          ${Object.entries(fontWeight).map(([key, value]) => `
            <div class="font-weight-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div style="font-weight: ${value}; font-size: 16px; color: white;">
                The quick brown fox
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">font-${key}</div>
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">${value}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderBorderRadiusSection(): string {
    const borderRadius = this.config?.theme.borderRadius || {};
    
    return `
      <div class="border-radius-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Border Radius</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
          ${Object.entries(borderRadius).map(([key, value]) => `
            <div class="border-radius-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 16px;
              text-align: center;
            ">
              <div style="
                width: 60px;
                height: 60px;
                background: #10b981;
                border-radius: ${value};
                margin: 0 auto 12px auto;
              "></div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); margin-bottom: 4px;">
                rounded${key === 'DEFAULT' ? '' : `-${key}`}
              </div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                ${value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderShadowsSection(): string {
    const boxShadow = this.config?.theme.boxShadow || {};
    
    return `
      <div class="shadows-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Sombras</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
          ${Object.entries(boxShadow).map(([key, value]) => `
            <div class="shadow-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            ">
              <div style="
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                margin: 0 auto 16px auto;
                box-shadow: ${value === 'none' ? 'none' : value};
              "></div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); margin-bottom: 4px;">
                shadow${key === 'DEFAULT' ? '' : `-${key}`}
              </div>
              <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5); word-break: break-all;">
                ${value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderScreensSection(): string {
    const screens = this.config?.theme.screens || {};
    
    return `
      <div class="screens-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Breakpoints</h4>
        <div style="space-y: 12px;">
          ${Object.entries(screens).map(([key, value]) => `
            <div class="screen-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div>
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-bottom: 4px;">
                  ${key.toUpperCase()}
                </div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                  @media (min-width: ${value})
                </div>
              </div>
              <div style="
                background: #10b981;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
              ">
                ${value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderOpacitySection(): string {
    const opacity = this.config?.theme.opacity || {};
    
    return `
      <div class="opacity-section">
        <h4 style="margin: 0 0 20px 0; font-size: 18px; color: #10b981;">Opacidad</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
          ${Object.entries(opacity).map(([key, value]) => `
            <div class="opacity-item" style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              padding: 12px;
              text-align: center;
            ">
              <div style="
                width: 40px;
                height: 40px;
                background: #10b981;
                opacity: ${value};
                border-radius: 4px;
                margin: 0 auto 8px auto;
              "></div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8); margin-bottom: 2px;">
                opacity-${key}
              </div>
              <div style="font-size: 10px; color: rgba(255, 255, 255, 0.5);">
                ${value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    if (!this.element) return;

    // Cerrar
    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      this.hide();
      this.onClose?.();
    });

    // Arrastrar
    const header = this.element.querySelector('.config-viewer-header');
    header?.addEventListener('mousedown', this.startDrag.bind(this));
  }

  private bindContentEvents(): void {
    if (!this.element) return;

    // Navegación de secciones
    const sectionBtns = this.element.querySelectorAll('.section-btn');
    sectionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const section = target.dataset.section;
        if (section) {
          this.activeSection = section;
          this.renderContent();
        }
      });
    });

    // Hover effects para botones
    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn?.addEventListener('mouseenter', () => {
      (closeBtn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
    });
    closeBtn?.addEventListener('mouseleave', () => {
      (closeBtn as HTMLElement).style.background = 'none';
    });
  }

  private startDrag(e: MouseEvent): void {
    if (!this.element) return;

    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    document.addEventListener('mousemove', this.handleDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    e.preventDefault();
  }

  private handleDrag(e: MouseEvent): void {
    if (!this.isDragging || !this.element) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.element.style.left = `${Math.max(0, Math.min(x, window.innerWidth - this.element.offsetWidth))}px`;
    this.element.style.top = `${Math.max(0, Math.min(y, window.innerHeight - this.element.offsetHeight))}px`;
    this.element.style.right = 'auto';
  }

  private stopDrag(): void {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }

  public show(): void {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }

  public hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  public isShown(): boolean {
    return this.element ? this.element.style.display !== 'none' : false;
  }

  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.removeAllListeners();
  }
}