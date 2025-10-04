import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';
import { TooltipManager } from './TooltipManager';
import { ScrollArea } from './ScrollArea';

export interface ColorPaletteOptions {
  position?: { x: number; y: number };
  colors?: string[];
  onColorSelect?: (color: string) => void;
  onClose?: () => void;
}

export class ColorPalette extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private paletteElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private position: { x: number; y: number };
  private selectedColor: string | null = null;
  private scrollArea: ScrollArea | null = null;
  private hoverPreview: HTMLElement | null = null;
  private activeCategory: string = 'all';

  // Categorías de colores organizadas
  private colorCategories = {
    all: {
      name: 'All',
      colors: [
        '#FF0000', '#FF1744', '#FF5722', '#E53935', '#D32F2F', '#C62828', '#B71C1C', '#FF8A80',
        '#FF5252', '#FF1744', '#D50000', '#FFCDD2', '#FFEBEE', '#FCE4EC', '#F8BBD9', '#E1BEE7',
        '#E91E63', '#AD1457', '#880E4F', '#9C27B0', '#7B1FA2', '#4A148C', '#673AB7', '#512DA8',
        '#3F51B5', '#303F9F', '#1A237E', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5',
        '#2196F3', '#1976D2', '#0D47A1', '#03A9F4', '#0288D1', '#0277BD', '#01579B', '#00BCD4',
        '#0097A7', '#00695C', '#004D40', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00ACC1',
        '#4CAF50', '#388E3C', '#1B5E20', '#8BC34A', '#689F38', '#33691E', '#CDDC39', '#9E9D24',
        '#827717', '#FFEB3B', '#F57F17', '#FF9800', '#E65100', '#FF5722', '#BF360C', '#795548',
        '#FF9800', '#F57C00', '#E65100', '#FF5722', '#D84315', '#BF360C', '#FFEB3B', '#FBC02D',
        '#F57F17', '#CDDC39', '#9E9D24', '#827717', '#8BC34A', '#689F38', '#33691E', '#4CAF50',
        '#FFFFFF', '#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575',
        '#616161', '#424242', '#303030', '#212121', '#000000', '#ECEFF1', '#CFD8DC', '#B0BEC5',
        '#90CAF9', '#81C784', '#FFB74D', '#F06292', '#BA68C8', '#64B5F6', '#4DB6AC', '#AED581',
        '#DCE775', '#FFF176', '#FFD54F', '#FFAB91', '#BCAAA4', '#A1887F', '#8D6E63', '#6D4C41',
        '#00E676', '#00E5FF', '#FF3D00', '#FF6D00', '#FF9100', '#FFAB00', '#FFD600', '#AEEA00',
        '#64DD17', '#00C853', '#00BFA5', '#00B8D4', '#0091EA', '#2979FF', '#3D5AFE', '#651FFF',
        '#1A1A1A', '#2D2D2D', '#404040', '#525252', '#666666', '#7A7A7A', '#8E8E8E', '#A3A3A3',
        '#B8B8B8', '#CCCCCC', '#E1E1E1', '#F6F6F6', '#37474F', '#455A64', '#546E7A', '#607D8B'
      ]
    },
    dark: {
      name: 'Dark',
      colors: [
        '#000000', '#212121', '#303030', '#424242', '#1A1A1A', '#2D2D2D', '#404040', '#525252',
        '#666666', '#1B5E20', '#0D47A1', '#01579B', '#004D40', '#BF360C', '#E65100', '#F57F17',
        '#827717', '#880E4F', '#4A148C', '#1A237E', '#0277BD', '#00695C', '#D84315', '#6D4C41',
        '#37474F', '#455A64', '#546E7A', '#607D8B', '#B71C1C', '#AD1457', '#512DA8', '#303F9F'
      ]
    },
    flats: {
      name: 'Flats',
      colors: [
        '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
        '#F1C40F', '#E8F5E8', '#FFF3E0', '#E3F2FD', '#F3E5F5', '#E0F2F1', '#FFF8E1', '#FCE4EC',
        '#ECEFF1', '#F9FBE7', '#E8EAF6', '#E1F5FE', '#E0F7FA', '#F1F8E9', '#FFF9C4', '#FFECB3',
        '#FFE0B2', '#FFCCBC', '#D7CCC8', '#F5F5F5', '#CFD8DC', '#FFCDD2', '#F8BBD9', '#E1BEE7'
      ]
    },
    bright: {
      name: 'Bright',
      colors: [
        '#FF0000', '#FF1744', '#FF5722', '#FF9800', '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50',
        '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5', '#673AB7', '#9C27B0', '#E91E63', '#FF6D00',
        '#FF3D00', '#00E676', '#00E5FF', '#2979FF', '#3D5AFE', '#651FFF', '#D500F9', '#C51162',
        '#FF5252', '#FF8A80', '#FFB74D', '#FFF176', '#DCE775', '#AED581', '#81C784', '#4DD0E1'
      ]
    },
    pastels: {
      name: 'Pastels',
      colors: [
        '#FFCDD2', '#F8BBD9', '#E1BEE7', '#C5CAE9', '#9FA8DA', '#90CAF9', '#81D4FA', '#80DEEA',
        '#80CBC4', '#A5D6A7', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2',
        '#FFCCBC', '#D7CCC8', '#BCAAA4', '#B0BEC5', '#FFE082', '#FFAB91', '#CE93D8', '#B39DDB',
        '#9575CD', '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784', '#AED581'
      ]
    }
  };

  constructor(container: HTMLElement, options: ColorPaletteOptions = {}) {
    super();
    this.container = container;
    this.position = options.position || { x: 100, y: 100 };
    
    this.createPalette();
    this.bindEvents();
    
    // Inicializar TooltipManager
    TooltipManager.getInstance();
  }

  private createPalette(): void {
    this.paletteElement = document.createElement('div');
    this.paletteElement.className = 'stylo-color-palette';
    this.paletteElement.style.cssText = `
      position: fixed;
      left: ${this.position.x}px;
      top: ${this.position.y}px;
      width: 360px;
      height: 480px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 16px;
      z-index: 10000;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.6),
        0 8px 16px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: scale(0.85) translateY(20px);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
    `;

    this.container.appendChild(this.paletteElement);
    this.renderPaletteContent();
  }

  private renderPaletteContent(): void {
    if (!this.paletteElement) return;

    this.paletteElement.innerHTML = `
      <!-- Estilos CSS personalizados para scrollbar sin flechitas -->
      <style>
        /* Scrollbar personalizada sin flechitas */
        .scroll-area-viewport::-webkit-scrollbar {
          width: 8px;
        }
        * {
            scrollbar-width: thin;
            scrollbar-color: #aaa transparent;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .scroll-area-viewport::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }

        /* Quitar las flechitas del scroll */
        .scroll-area-viewport::-webkit-scrollbar-button {
            display: none;
            scrollbar-width: thin; /* or none */
            scrollbar-color: transparent transparent;   
        }
        
        .scroll-area-viewport::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Para Firefox - scrollbar sin flechitas */
        .scroll-area-viewport {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        /* Tabs de categorías - scrollbar horizontal bonita */
        .color-categories::-webkit-scrollbar {
          height: 6px;
        }
        
        .color-categories::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .color-categories::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        .color-categories::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        /* Quitar flechitas del scroll horizontal */
        .color-categories::-webkit-scrollbar-button {
          display: none;
        }

        /* Grid de colores con animación suave */
        .color-grid {
          display:flex;
          flex-wrap:wrap;
          gap: 8px;
          padding: 4px;
          min-height: 100%;
        }

        /* Efectos hover mejorados para los swatches */
        .color-swatch {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .color-swatch::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0);
          border-radius: 50%;
          transition: all 0.2s ease;
          pointer-events: none;
        }

        .color-swatch:hover::before {
          background: rgba(255, 255, 255, 0.2);
        }

        .color-swatch:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }

        /* Animación para la información del color */
        .color-info {
          transition: all 0.2s ease;
        }

        .selected-color-preview {
          transition: all 0.2s ease;
        }

        .color-code {
          transition: all 0.2s ease;
        }

        /* Tabs con mejor feedback visual */
        .category-tab {
          position: relative;
          overflow: hidden;
        }

        .category-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .category-tab:hover::before {
          left: 100%;
        }

        .category-tab:hover {
          background: #5A9FE7 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(90, 159, 231, 0.3);
        }

        .category-tab.active {
          background: #4A90E2 !important;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.4);
        }

        /* Botón back con efecto glassmorphism */
        .back-btn {
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .back-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .back-btn:hover::before {
          left: 100%;
        }

        .back-btn:hover {
          background: linear-gradient(135deg, #4A4A4A, #3A3A3A) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4) !important;
        }

        /* Animación de entrada para el contenido */
        .color-scroll-container {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Efecto de brillo en la información del color */
        .color-info {
          position: relative;
          overflow: hidden;
        }

        .color-info::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        }
      </style>

      <!-- Tabs de categorías -->
      <div class="color-categories" style="
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
        overflow-x: auto;
        padding-bottom: 4px;
      ">
        ${Object.entries(this.colorCategories).map(([key, category]) => `
          <button class="category-tab ${this.activeCategory === key ? 'active' : ''}" 
                  data-category="${key}" 
                  style="
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: ${this.activeCategory === key ? '#4A90E2' : '#404040'};
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            min-width: fit-content;
          ">
            ${category.name}
          </button>
        `).join('')}
      </div>

      <!-- Área de colores con ScrollArea -->
      <div class="color-scroll-container" style="
        flex: 1;
        background: #2a2a2a;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        min-height: 280px;
      ">
        <div class="color-grid-wrapper" style="
          height: 100%;
          width: 100%;
        ">
          <div class="color-grid">
            ${this.getCurrentCategoryColors().map(color => `
              <button class="color-swatch" data-color="${color}" style="
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 50%;
                background-color: ${color};
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              ">
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Información del color seleccionado -->
      <div class="color-info" style="
        background: #2a2a2a;
        border-radius: 12px;
        padding: 12px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <div class="selected-color-preview" style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${this.selectedColor || '#38c149'};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        "></div>
        
        <div class="color-code" style="
          color: white;
          font-size: 13px;
          font-weight: 500;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        ">${this.selectedColor || '#38c149'}</div>
      </div>

      <!-- Botón Back -->
      <button class="back-btn" style="
        width: 100%;
        background: #404040;
        border: none;
        color: white;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        margin-top: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>
    `;

    // Inicializar ScrollArea después de renderizar el HTML
    setTimeout(() => {
      this.initializeScrollArea();
    }, 0);
    
    // Inicializar tooltips después de renderizar
    this.initializeTooltips();
    
    // Obtener referencia al hover preview (ya no existe, pero mantenemos compatibilidad)
    this.hoverPreview = null;
  }

  private getCurrentCategoryColors(): string[] {
    return this.colorCategories[this.activeCategory]?.colors || this.colorCategories.all.colors;
  }

  private initializeScrollArea(): void {
    const wrapper = this.paletteElement?.querySelector('.color-grid-wrapper') as HTMLElement;
    const colorGrid = this.paletteElement?.querySelector('.color-grid') as HTMLElement;
    
    if (wrapper && colorGrid) {
      try {
        // Crear ScrollArea
        this.scrollArea = new ScrollArea(wrapper, { orientation: 'vertical' });
        
        // Obtener el viewport del ScrollArea y agregar el contenido
        const viewport = this.scrollArea.getViewport();
        if (viewport) {
          // Mover el color-grid al viewport del ScrollArea
          colorGrid.remove();
          viewport.appendChild(colorGrid);
          
          // Asegurar que el viewport tenga el contenido visible
          viewport.style.height = '100%';
          viewport.style.width = '100%';
        }
      } catch (error) {
        console.warn('Error inicializando ScrollArea, usando scroll nativo:', error);
        // Fallback a scroll nativo si ScrollArea falla
        wrapper.style.overflowY = 'auto';
        wrapper.style.height = '100%';
      }
    }
  }

  private getColorName(hex: string): string {
    const colorNames: { [key: string]: string } = {
      '#FF0000': 'Rojo',
      '#00FF00': 'Verde',
      '#0000FF': 'Azul',
      '#FFFF00': 'Amarillo',
      '#FF00FF': 'Magenta',
      '#00FFFF': 'Cian',
      '#FFFFFF': 'Blanco',
      '#000000': 'Negro',
      '#808080': 'Gris',
      '#FFA500': 'Naranja',
      '#800080': 'Púrpura',
      '#FFC0CB': 'Rosa',
      '#A52A2A': 'Marrón',
      '#008000': 'Verde Oscuro',
      '#000080': 'Azul Marino'
    };
    
    return colorNames[hex.toUpperCase()] || 'Color Personalizado';
  }

  private showHoverPreview(color: string): void {
    if (!this.hoverPreview) return;
    
    const preview = this.hoverPreview.querySelector('.hover-color-preview') as HTMLElement;
    const name = this.hoverPreview.querySelector('.hover-color-name') as HTMLElement;
    const code = this.hoverPreview.querySelector('.hover-color-code') as HTMLElement;
    
    if (preview && name && code) {
      preview.style.backgroundColor = color;
      name.textContent = this.getColorName(color);
      code.textContent = color.toUpperCase();
      
      this.hoverPreview.style.opacity = '1';
      this.hoverPreview.style.transform = 'translateY(0)';
    }
  }

  private hideHoverPreview(): void {
    if (!this.hoverPreview) return;
    
    this.hoverPreview.style.opacity = '0';
    this.hoverPreview.style.transform = 'translateY(-5px)';
  }

  private initializeTooltips(): void {
    if (!this.paletteElement) return;
    
    // El TooltipManager funciona automáticamente detectando elementos con data-tooltip
    // Solo necesitamos asegurarnos de que esté inicializado
    TooltipManager.getInstance();
  }

  private bindEvents(): void {
    if (!this.paletteElement) return;

    // Event listeners para tabs de categorías
    this.paletteElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Manejar clicks en tabs de categorías
      if (target.classList.contains('category-tab')) {
        const category = target.dataset.category;
        if (category && category !== this.activeCategory) {
          this.activeCategory = category;
          this.renderPaletteContent();
          this.bindEvents(); // Re-bind events after re-render
        }
      }
      
      // Manejar clicks en color swatches
      if (target.classList.contains('color-swatch')) {
        const color = target.dataset.color;
        if (color) {
          this.selectColor(color);
        }
      }
      
      // Manejar click en botón Back
      if (target.classList.contains('back-btn') || target.closest('.back-btn')) {
        this.hide();
      }
    });

    // Hover effects para color swatches
    this.paletteElement.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('color-swatch')) {
        const color = target.dataset.color;
        if (color) {
          // Mostrar el color en hover en la información del color
          const colorCodeEl = this.paletteElement?.querySelector('.color-code');
          const colorPreviewEl = this.paletteElement?.querySelector('.selected-color-preview') as HTMLElement;
          
          if (colorCodeEl) {
            colorCodeEl.textContent = color.toUpperCase();
            colorCodeEl.style.color = '#4A90E2'; // Cambiar color del texto para indicar hover
          }
          if (colorPreviewEl) {
            colorPreviewEl.style.background = color;
            colorPreviewEl.style.transform = 'scale(1.1)';
            colorPreviewEl.style.boxShadow = `0 4px 12px ${color}40`;
          }
        }
      }
      
      // Hover effect para category tabs
      if (target.classList.contains('category-tab') && !target.classList.contains('active')) {
        target.style.background = '#555';
      }
      
      // Hover effect para back button
      if (target.classList.contains('back-btn') || target.closest('.back-btn')) {
        const btn = target.classList.contains('back-btn') ? target : target.closest('.back-btn') as HTMLElement;
        btn.style.background = '#505050';
      }
    });

    this.paletteElement.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('color-swatch')) {
        // Restaurar información del color seleccionado
        const colorCodeEl = this.paletteElement?.querySelector('.color-code');
        const colorPreviewEl = this.paletteElement?.querySelector('.selected-color-preview') as HTMLElement;
        
        if (this.selectedColor) {
          if (colorCodeEl) {
            colorCodeEl.textContent = this.selectedColor.toUpperCase();
            colorCodeEl.style.color = 'white'; // Restaurar color original
          }
          if (colorPreviewEl) {
            colorPreviewEl.style.background = this.selectedColor;
            colorPreviewEl.style.transform = 'scale(1)';
            colorPreviewEl.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
          }
        } else {
          // Si no hay color seleccionado, mostrar el color por defecto
          if (colorCodeEl) {
            colorCodeEl.textContent = '#38c149';
            colorCodeEl.style.color = 'white';
          }
          if (colorPreviewEl) {
            colorPreviewEl.style.background = '#38c149';
            colorPreviewEl.style.transform = 'scale(1)';
            colorPreviewEl.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
          }
        }
      }
      
      // Restaurar category tabs
      if (target.classList.contains('category-tab') && !target.classList.contains('active')) {
        target.style.background = '#404040';
      }
      
      // Restaurar back button
      if (target.classList.contains('back-btn') || target.closest('.back-btn')) {
        const btn = target.classList.contains('back-btn') ? target : target.closest('.back-btn') as HTMLElement;
        btn.style.background = '#404040';
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (this.isVisible && this.paletteElement && !this.paletteElement.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  private selectColor(color: string): void {
    if (!this.isValidColor(color)) return;
    
    this.selectedColor = color;
    
    // Actualizar la visualización del color seleccionado
    const colorInfo = this.paletteElement?.querySelector('.color-code') as HTMLElement;
    const colorPreview = this.paletteElement?.querySelector('.selected-color-preview') as HTMLElement;
    
    if (colorInfo) colorInfo.textContent = color;
    if (colorPreview) colorPreview.style.background = color;
    
    // Aplicar el color automáticamente
    this.applySelectedColor();
    
    // Emitir evento
    this.emit('color:selected', { color });
  }

  private updateSwatchSelection(selectedColor: string): void {
    if (!this.paletteElement) return;
    
    const swatches = this.paletteElement.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      const swatchColor = swatch.getAttribute('data-color');
      if (swatchColor === selectedColor) {
        (swatch as HTMLElement).style.borderColor = '#007AFF';
        (swatch as HTMLElement).style.borderWidth = '3px';
        (swatch as HTMLElement).style.boxShadow = '0 0 0 2px rgba(0, 122, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)';
        (swatch as HTMLElement).style.transform = 'scale(1.1)';
      } else {
        (swatch as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
        (swatch as HTMLElement).style.borderWidth = '2px';
        (swatch as HTMLElement).style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        (swatch as HTMLElement).style.transform = 'scale(1)';
      }
    });
  }

  private applySelectedColor(): void {
    if (this.selectedColor) {
      this.emit('color-palette:color-applied', this.selectedColor);
      this.hide();
    }
  }

  private isValidColor(color: string): boolean {
    // Validar formato hex
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  public show(position?: { x: number; y: number }): void {
    if (!this.paletteElement) return;
    
    if (position) {
      this.position = position;
      this.paletteElement.style.left = `${position.x}px`;
      this.paletteElement.style.top = `${position.y}px`;
    }
    
    this.isVisible = true;
    this.paletteElement.style.pointerEvents = 'auto';
    
    // Animación de entrada más suave y bonita
    requestAnimationFrame(() => {
      if (this.paletteElement) {
        this.paletteElement.style.opacity = '1';
        this.paletteElement.style.transform = 'scale(1) translateY(0)';
      }
    });
  }

  public hide(): void {
    if (!this.paletteElement) return;
    
    this.isVisible = false;
    this.paletteElement.style.opacity = '0';
    this.paletteElement.style.transform = 'scale(0.85) translateY(20px)';
    
    setTimeout(() => {
      
    }, 400);
    
    this.emit('color-palette:hidden');
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public getSelectedColor(): string | null {
    return this.selectedColor;
  }

  public setSelectedColor(color: string): void {
    if (this.isValidColor(color)) {
      this.selectColor(color);
    }
  }

  public destroy(): void {
    // Destruir ScrollArea
    if (this.scrollArea) {
      this.scrollArea.destroy();
      this.scrollArea = null;
    }
    
    if (this.paletteElement) {
      this.paletteElement.remove();
      this.paletteElement = null;
    }
    
    this.hoverPreview = null;
    this.removeAllListeners();
  }
}