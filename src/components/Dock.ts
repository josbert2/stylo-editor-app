import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents, TabType } from '../types';
import { TooltipManager } from './TooltipManager';
import { ColorPalette } from './ColorPalette';
import { ColorDropper } from './ColorDropper';

export class Dock extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private dockElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private activeTab: TabType = 'design';
  private isPaused: boolean = false;
  private colorPalette: ColorPalette | null = null;
  private colorDropper: ColorDropper | null = null;

  constructor(container: HTMLElement) {
    super();
    this.container = container;
    this.createDock();
    this.bindEvents();
  }

  private createDock(): void {
    this.dockElement = document.createElement('div');
    this.dockElement.className = 'stylo-dock';
    this.dockElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: auto;
      height: 60px;
      background: rgba(18, 19, 21, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(74, 237, 255, 0.2);
      border-radius: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(74, 237, 255, 0.1);
      z-index: 9999;
      display: none;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    `;

    this.container.appendChild(this.dockElement);
    this.renderDockContent();
  }

  private renderDockContent(): void {
    if (!this.dockElement) return;

    this.dockElement.innerHTML = `
      <!-- Tabs principales -->
      <div class="dock-tabs" style="display: flex; gap: 8px;">
        <button class="dock-tab ${this.activeTab === 'design' ? 'active' : ''}" data-tab="design" data-tooltip="Design Tools" style="
          background: ${this.activeTab === 'design' ? 'rgba(74, 237, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${this.activeTab === 'design' ? '#4AEDFF' : 'rgba(255, 255, 255, 0.7)'};
          font-size: 14px;
          font-weight: 500;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Design
        </button>
        <button class="dock-tab ${this.activeTab === 'code' ? 'active' : ''}" data-tab="code" data-tooltip="Code Inspector" style="
          background: ${this.activeTab === 'code' ? 'rgba(74, 237, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${this.activeTab === 'code' ? '#4AEDFF' : 'rgba(255, 255, 255, 0.7)'};
          font-size: 14px;
          font-weight: 500;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          Code
        </button>
      </div>

      <div class="dock-divider" style="
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 8px;
      "></div>

      <!-- Herramientas principales -->
      <div class="dock-tools" style="display: flex; gap: 6px;">
        <!-- Pausar Inspector -->
        <button class="dock-tool-btn ${this.isPaused ? 'active' : ''}" data-action="pause" data-tooltip="Pausar Inspector" style="
          background: ${this.isPaused ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: ${this.isPaused ? '#FFC107' : 'rgba(255, 255, 255, 0.7)'};
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            ${this.isPaused ? 
              '<path d="M8 5v14l11-7z"/>' : // Play icon cuando está pausado
              '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' // Pause icon cuando está activo
            }
          </svg>
        </button>

        <!-- CSS Changes -->
        <button class="dock-tool-btn" data-action="css-changes" data-tooltip="CSS Changes" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3l3.5 3.5L7 8l-3.5-3.5L5 3zm6.5 6.5L15 6l3 3-3.5 3.5-3-3zm-7 7L8 13l3 3-3.5 3.5-3-3zm7 0L15 13l3 3-3.5 3.5-3-3z"/>
          </svg>
        </button>

        <!-- HTML Navigator -->
        <button class="dock-tool-btn" data-action="html-navigator" data-tooltip="HTML Navigator" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 2.5L9.5 8.5 4 9.18l4 3.9-.94 5.5L12 16.5l4.94 2.08L16 13.08l4-3.9-5.5-.68L12 4.5z"/>
          </svg>
        </button>

        <!-- Assets -->
        <button class="dock-tool-btn" data-action="assets" data-tooltip="Assets Manager" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </button>

        <!-- Ruler -->
        <button class="dock-tool-btn" data-action="ruler" data-tooltip="Ruler Tool" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.39 18.36l3.16 3.16 1.41-1.41-3.16-3.16L1.39 18.36zm6.61-6.61l-1.41-1.41-1.41 1.41L7.59 14.17 8 13.76l-1.41-1.41L8 10.94l1.41 1.41L8 13.76l1.41 1.41L8 16.59l1.41 1.41L8 19.41l-1.41-1.41L8 16.59z"/>
          </svg>
        </button>

        <!-- Color Palette -->
        <button class="dock-tool-btn" data-action="color-palette" data-tooltip="Color Palette" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9 .83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-5.52-4.48-10-9-10z"/>
            <circle cx="6.5" cy="11.5" r="1.5"/>
            <circle cx="9.5" cy="7.5" r="1.5"/>
            <circle cx="14.5" cy="7.5" r="1.5"/>
            <circle cx="17.5" cy="11.5" r="1.5"/>
          </svg>
        </button>

        <!-- Color Eyedropper -->
        <button class="dock-tool-btn" data-action="eyedropper" data-tooltip="Color Eyedropper" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.91-1.93 3.12-3.12c.4-.4.4-1.02 0-1.41z"/>
          </svg>
        </button>
      </div>

      <div class="dock-divider" style="
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 8px;
      "></div>

      <!-- Herramientas adicionales -->
      <div class="dock-extra-tools" style="display: flex; gap: 6px;">
        <!-- Responsive Mode -->
        <button class="dock-tool-btn" data-action="responsive" data-tooltip="Modo Responsive" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zM7 4V3h10v1H7zm0 14V6h10v12H7zm0 3v-1h10v1H7z"/>
          </svg>
        </button>

        <!-- More Options -->
        <button class="dock-tool-btn" data-action="more" data-tooltip="Más Opciones" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>

        <!-- Close Stylo Editor -->
        <button class="dock-tool-btn" data-action="close-editor" data-tooltip="Apagar Editor Stylo" style="
          background: rgba(220, 53, 69, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(220, 53, 69, 0.8);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
          </svg>
        </button>
      </div>
    `;

    // Inicializar tooltips después de renderizar
    this.initializeTooltips();
  }

  private initializeTooltips(): void {
    if (!this.dockElement) return;
    
    // El TooltipManager funciona automáticamente detectando elementos con data-tooltip
    // No necesitamos registrar manualmente los tooltips
    // Solo necesitamos asegurarnos de que TooltipManager esté inicializado
    TooltipManager.getInstance();
  }

  private bindEvents(): void {
    if (!this.dockElement) return;

    this.dockElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Manejar clicks en tabs del dock
      if (target.classList.contains('dock-tab') || target.closest('.dock-tab')) {
        const tabButton = target.classList.contains('dock-tab') ? target : target.closest('.dock-tab') as HTMLElement;
        const tab = tabButton?.getAttribute('data-tab') as TabType;
        if (tab) {
          this.setActiveTab(tab);
          this.emit('dock:tab-changed', tab);
        }
        return;
      }
      
      // Manejar clicks en herramientas
      if (target.classList.contains('dock-tool-btn') || target.closest('.dock-tool-btn')) {
        const toolButton = target.classList.contains('dock-tool-btn') ? target : target.closest('.dock-tool-btn') as HTMLElement;
        const action = toolButton?.getAttribute('data-action');
        
        this.handleToolAction(action);
        return;
      }
    });

    // Hover effects para las herramientas
    this.dockElement.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const toolBtn = target.closest('.dock-tool-btn') as HTMLElement;
      
      if (toolBtn && !toolBtn.classList.contains('active')) {
        toolBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      }
    });

    this.dockElement.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const toolBtn = target.closest('.dock-tool-btn') as HTMLElement;
      
      if (toolBtn && !toolBtn.classList.contains('active')) {
        toolBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    });
  }

  private handleToolAction(action: string | null): void {
    if (!action) return;

    switch (action) {
      case 'pause':
        this.togglePause();
        break;
      case 'css-changes':
        this.emit('dock:css-changes');
        break;
      case 'html-navigator':
        this.emit('dock:html-navigator');
        break;
      case 'assets':
        this.emit('dock:assets');
        break;
      case 'ruler':
        this.emit('dock:ruler');
        break;
      case 'color-palette':
        this.toggleColorPalette();
        break;
      case 'eyedropper':
        this.toggleColorDropper();
        break;
      case 'responsive':
        this.emit('dock:responsive');
        break;
      case 'more':
        this.emit('dock:more');
        break;
      case 'close-editor':
        this.emit('dock:close-editor');
        break;
    }
  }

  private toggleColorPalette(): void {
    if (!this.colorPalette) {
      // Calcular posición cerca del botón de color palette
      const colorPaletteBtn = this.dockElement?.querySelector('[data-action="color-palette"]') as HTMLElement;
      let position = { x: window.innerWidth / 2 - 170, y: window.innerHeight / 2 - 210 };
      
      if (colorPaletteBtn && this.dockElement) {
        const btnRect = colorPaletteBtn.getBoundingClientRect();
        const dockRect = this.dockElement.getBoundingClientRect();
        
        // Posicionar la paleta arriba del dock, centrada con el botón
        position = {
          x: btnRect.left + (btnRect.width / 2) - 170, // Centrar con el botón (170 es la mitad del ancho de la paleta)
          y: dockRect.top - 440 // Arriba del dock con más espacio
        };
        
        // Ajustar si se sale de la pantalla horizontalmente
        if (position.x < 20) position.x = 20;
        if (position.x + 340 > window.innerWidth - 20) position.x = window.innerWidth - 360;
        
        // Ajustar si se sale de la pantalla verticalmente
        if (position.y < 20) {
          position.y = btnRect.bottom + 10; // Si no cabe arriba, ponerla abajo
        }
      }
      
      this.colorPalette = new ColorPalette(this.container, { position });
      
      // Escuchar eventos de la paleta de colores
      this.colorPalette.on('color-palette:color-applied', (color: string) => {
        this.emit('dock:color-applied', color);
      });
      
      this.colorPalette.on('color-palette:hidden', () => {
        this.updateColorPaletteButtonState(false);
      });
    }
    
    if (this.colorPalette.isShown()) {
      this.colorPalette.hide();
      this.updateColorPaletteButtonState(false);
    } else {
      // Recalcular posición cada vez que se muestra
      const colorPaletteBtn = this.dockElement?.querySelector('[data-action="color-palette"]') as HTMLElement;
      if (colorPaletteBtn && this.dockElement) {
        const btnRect = colorPaletteBtn.getBoundingClientRect();
        const dockRect = this.dockElement.getBoundingClientRect();
        
        let position = {
          x: btnRect.left + (btnRect.width / 2) - 170,
          y: dockRect.top - 440
        };
        
        // Ajustar si se sale de la pantalla
        if (position.x < 20) position.x = 20;
        if (position.x + 340 > window.innerWidth - 20) position.x = window.innerWidth - 360;
        if (position.y < 20) position.y = btnRect.bottom + 10;
        
        this.colorPalette.show(position);
      } else {
        this.colorPalette.show();
      }
      this.updateColorPaletteButtonState(true);
    }
  }

  private updateColorPaletteButtonState(active: boolean): void {
    if (!this.dockElement) return;
    
    const colorPaletteBtn = this.dockElement.querySelector('[data-action="color-palette"]') as HTMLElement;
    if (colorPaletteBtn) {
      if (active) {
        colorPaletteBtn.classList.add('active');
        colorPaletteBtn.style.background = 'rgba(0, 122, 255, 0.3)';
      } else {
        colorPaletteBtn.classList.remove('active');
        colorPaletteBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    }
  }

  private toggleColorDropper(): void {
    if (!this.colorDropper) {
      this.colorDropper = new ColorDropper(this.container, {
        onColorPicked: (color: string) => {
          this.emit('dock:color-applied', color);
          this.updateEyedropperButtonState(false);
        },
        onActivated: () => {
          this.updateEyedropperButtonState(true);
        },
        onDeactivated: () => {
          this.updateEyedropperButtonState(false);
        }
      });

      // Escuchar eventos del color dropper
      this.colorDropper.on('eyedropper:color-picked', (color: string) => {
        this.emit('dock:color-applied', color);
      });
    }

    if (this.colorDropper.isActivated()) {
      this.colorDropper.deactivate();
    } else {
      // Intentar usar la API nativa primero
      if ('EyeDropper' in window) {
        this.colorDropper.useNativeEyeDropper().then((color) => {
          if (color) {
            this.emit('dock:color-applied', color);
          }
        }).catch(() => {
          // Si falla, usar el fallback manual
          this.colorDropper?.activate();
        });
      } else {
        // Usar el método manual
        this.colorDropper.activate();
      }
    }
  }

  private updateEyedropperButtonState(active: boolean): void {
    if (!this.dockElement) return;
    
    const eyedropperBtn = this.dockElement.querySelector('[data-action="eyedropper"]') as HTMLElement;
    if (eyedropperBtn) {
      if (active) {
        eyedropperBtn.classList.add('active');
        eyedropperBtn.style.background = 'rgba(0, 122, 255, 0.3)';
        eyedropperBtn.style.color = '#4A90E2';
      } else {
        eyedropperBtn.classList.remove('active');
        eyedropperBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        eyedropperBtn.style.color = 'rgba(255, 255, 255, 0.7)';
      }
    }
  }

  public show(): void {
    if (!this.dockElement || this.isVisible) return;
    
    this.isVisible = true;
    this.dockElement.style.display = 'flex';
    
    // Animación de entrada
    requestAnimationFrame(() => {
      if (this.dockElement) {
        this.dockElement.style.opacity = '1';
        this.dockElement.style.transform = 'translateX(-50%) translateY(0)';
      }
    });
  }

  public hide(): void {
    if (!this.dockElement || !this.isVisible) return;
    
    this.isVisible = false;
    
    // Animación de salida
    this.dockElement.style.opacity = '0';
    this.dockElement.style.transform = 'translateX(-50%) translateY(20px)';
    
    setTimeout(() => {
      if (this.dockElement) {
        this.dockElement.style.display = 'none';
      }
    }, 300);
  }

  public setActiveTab(tab: TabType): void {
    if (this.activeTab === tab) return;
    
    this.activeTab = tab;
    this.renderDockContent();
  }

  public getActiveTab(): TabType {
    return this.activeTab;
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.renderDockContent();
    this.emit('dock:pause', this.isPaused);
  }

  public setPaused(paused: boolean): void {
    if (this.isPaused !== paused) {
      this.isPaused = paused;
      this.renderDockContent();
    }
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public destroy(): void {
    if (this.colorPalette) {
      this.colorPalette.destroy();
      this.colorPalette = null;
    }
    
    if (this.colorDropper) {
      this.colorDropper.destroy();
      this.colorDropper = null;
    }

    if (this.dockElement) {
      this.dockElement.remove();
      this.dockElement = null;
    }
    
    this.isVisible = false;
    this.removeAllListeners();
  }
}