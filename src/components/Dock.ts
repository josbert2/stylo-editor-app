import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents, TabType } from '../types';
import { TooltipManager } from './TooltipManager';
import { ColorPalette } from './ColorPalette';
import { ColorDropper } from './ColorDropper';
import { Ruler } from './Ruler';
import { AssetManager } from './AssetManager';
import { HTMLNavigatorWindow } from './HTMLNavigatorWindow';
import { HTMLNavigator } from './HTMLNavigator';
import { JSConsole } from './JSConsole';
import { TailwindInspector } from './TailwindInspector';

import { FancyButton } from '../components/FancyButton';

export class Dock extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private dockElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private activeTab: TabType = 'design';
  private isPaused: boolean = false;
  private colorPalette: ColorPalette | null = null;
  private colorDropper: ColorDropper | null = null;
  private ruler: Ruler | null = null;
  private assetManager: AssetManager | null = null;
  private htmlNavigatorWindow: HTMLNavigatorWindow | null = null;
  private pauseButton: FancyButton | null = null;
  private jsConsole: JSConsole | null = null;
  private tailwindInspector: TailwindInspector | null = null;
  private tailwindConfigViewer: any | null = null;

  constructor(container: HTMLElement) {
    super();
    this.container = container;
    this.createDock();
    this.bindEvents();
    
    // Initialize JSConsole immediately for error detection
    this.initializeJSConsole();
  }

  private createDock(): void {
    this.dockElement = document.createElement('div');
    this.dockElement.className = 'stylo-dock'

    this.container.appendChild(this.dockElement);
    this.renderDockContent();
  }

  private renderDockContent(): void {
    if (!this.dockElement) return;

    this.dockElement.innerHTML = `
      <button class="button-btn-fancy cc:rounded-full" style="--coord-x: 0; --coord-y: 0;">
        <div class="inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12V8.44c0-4.42 3.13-6.23 6.96-4.02l3.09 1.78 3.09 1.78c3.83 2.21 3.83 5.83 0 8.04l-3.09 1.78-3.09 1.78C7.13 21.79 4 19.98 4 15.56V12Z" stroke="#777777" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </div>
      </button>
      <div class="dock-content dock-container">
        <!-- Controles principales -->
        <div class="dock-main-controls" style="display: flex;">
          
          <!-- Pause/Play -->
          <div id="fancy-pause-button" style="margin-right: 8px;"></div>

          <!-- CSS Changes -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="css-changes" data-tooltip="Ver Cambios CSS">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
          </button>

          <!-- HTML Navigator -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="html-navigator" data-tooltip="Navegador HTML">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
            </div>
          </button>

          <!-- Tailwind Inspector -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="tailwind-inspector" data-tooltip="Tailwind Inspector">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7.29C13.89,7.88 14.5,8.9 14.5,10.05V12A2.5,2.5 0 0,1 12,14.5A2.5,2.5 0 0,1 9.5,12V10.05C9.5,8.9 10.11,7.88 11,7.29V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M12,3.5A0.5,0.5 0 0,0 11.5,4A0.5,0.5 0 0,0 12,4.5A0.5,0.5 0 0,0 12.5,4A0.5,0.5 0 0,0 12,3.5M12,8.5A1.5,1.5 0 0,0 10.5,10.05V12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12V10.05A1.5,1.5 0 0,0 12,8.5Z" />
              </svg>
            </div>
          </button>

          <!-- Tailwind Config Viewer -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="tailwind-config-viewer" data-tooltip="Tailwind Config Viewer">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 21a9 9 0 0 1 0 -18c5 0 9 4 9 9a4.5 4.5 0 0 1 -4.5 4.5h-2.5a2 2 0 0 0 -2 2a1.5 1.5 0 0 1 -3 0a9 9 0 0 1 0 -9" />
                <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              </svg>
            </div>
          </button>

          <!-- Color Palette -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="color-palette" data-tooltip="Paleta de Colores">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,0.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z" />
              </svg>
            </div>
          </button>

          <!-- JavaScript Console -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="console-js" data-tooltip="Consola JavaScript">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
              </svg>
            </div>
          </button>

          <!-- Color Dropper -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="color-dropper" data-tooltip="Cuentagotas de Color">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35,10.04C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.04C2.34,8.36 0,10.91 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.04Z" />
              </svg>
            </div>
          </button>

          <!-- Ruler -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="ruler" data-tooltip="Regla">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1,5H3V19H1V5M5,5H7V19H5V5M9,5H11V19H9V5M13,5H15V19H13V5M17,5H19V19H17V5M21,5H23V19H21V5Z" />
              </svg>
            </div>
          </button>

          <!-- Asset Manager -->
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="asset-manager" data-tooltip="Gestor de Assets">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
          </button>
        </div>

        

    
        
      </div>
      <div class="dock-close-controls" style="display: flex; gap: 6px;">
          <button style="border:none;width:46px;height:46px;" class="dock-tool-btn button-btn-fancy" data-action="close-editor" data-tooltip="Apagar Editor Stylo">
            <div class="inner" style="background:#212121">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
              </svg>
            </div>
          </button>
        </div>
    `;

    // Inicializar el FancyButton después de crear el HTML
    this.initializeFancyPauseButton();

    // Inicializar tooltips después de renderizar
    this.initializeTooltips();
  }

  private initializeFancyPauseButton(): void {
    const container = this.dockElement?.querySelector('#fancy-pause-button') as HTMLElement;
    if (!container) return;

    // Crear el FancyButton
    this.pauseButton = new FancyButton(container, {
      text: this.isPaused ? 'Resume' : 'Pause',
      variant: this.isPaused ? 'success' : 'cancel',
      size: 'small'
    });

    // Aplicar estilos específicos para el dock
    this.customizePauseButtonForDock();

    // Manejar el evento de click
    this.pauseButton.on('click', () => {
      this.togglePause();
    });
  }


  private customizePauseButtonForDock(): void {
    if (!this.pauseButton) return;

    const buttonElement = this.pauseButton['buttonElement'];
    if (buttonElement) {
      // ✨ Estilos DARK personalizados para el dock
      buttonElement.style.cssText = `
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        min-height: 32px !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        padding: 0 !important;
        margin: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        
        /* 🌙 TEMA DARK */
        background: ${this.isPaused ? 
          'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))' : 
          'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))'
        } !important;
        
        border: 1px solid ${this.isPaused ? 
          'rgba(34, 197, 94, 0.3)' : 
          'rgba(251, 191, 36, 0.3)'
        } !important;
        
        color: ${this.isPaused ? 
          'rgba(34, 197, 94, 0.9)' : 
          'rgba(251, 191, 36, 0.9)'
        } !important;
        
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
      `;

      // ✨ Efectos hover DARK mejorados
      buttonElement.addEventListener('mouseenter', () => {
        buttonElement.style.transform = 'scale(1.1) translateY(-1px)';
        buttonElement.style.boxShadow = `
          0 4px 16px rgba(0, 0, 0, 0.6),
          0 0 20px ${this.isPaused ? 
            'rgba(34, 197, 94, 0.3)' : 
            'rgba(251, 191, 36, 0.3)'
          },
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `;
        buttonElement.style.background = this.isPaused ? 
          'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1))' : 
          'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.1))';
      });

      buttonElement.addEventListener('mouseleave', () => {
        buttonElement.style.transform = 'scale(1) translateY(0)';
        buttonElement.style.boxShadow = `
          0 2px 8px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `;
        buttonElement.style.background = this.isPaused ? 
          'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))' : 
          'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))';
      });

      // ✨ Efecto de click DARK
      buttonElement.addEventListener('mousedown', () => {
        buttonElement.style.transform = 'scale(0.95) translateY(1px)';
        buttonElement.style.boxShadow = `
          0 1px 4px rgba(0, 0, 0, 0.8),
          inset 0 2px 4px rgba(0, 0, 0, 0.3)
        `;
      });

      buttonElement.addEventListener('mouseup', () => {
        buttonElement.style.transform = 'scale(1.1) translateY(-1px)';
      });
    }
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
        this.toggleHTMLNavigator();
        break;
      case 'tailwind-inspector':
        this.toggleTailwindInspector();
        break;
      case 'tailwind-config-viewer':
        this.toggleTailwindConfigViewer();
        break;
      case 'console-js':
        this.toggleJSConsole();
        break;
      case 'assets':
      case 'asset-manager':
        this.toggleAssetManager();
        break;
      case 'ruler':
        this.toggleRuler();
        break;
      case 'color-palette':
        this.toggleColorPalette();
        break;
      case 'eyedropper':
      case 'color-dropper':
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

  private async toggleTailwindConfigViewer(): Promise<void> {
    if (!this.tailwindConfigViewer) {
      // Lazy import del TailwindConfigViewer
      const { TailwindConfigViewer } = await import('./TailwindConfigViewer');
      
      // Calcular posición cerca del botón del config viewer
      const configViewerBtn = this.dockElement?.querySelector('[data-action="tailwind-config-viewer"]') as HTMLElement;
      let position = { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 250 };
      
      if (configViewerBtn && this.dockElement) {
        const btnRect = configViewerBtn.getBoundingClientRect();
        const dockRect = this.dockElement.getBoundingClientRect();
        
        // Posicionar el viewer arriba del dock, centrado con el botón
        position = {
          x: btnRect.left + (btnRect.width / 2) - 300, // Centrar con el botón
          y: dockRect.top - 520 // Arriba del dock con espacio suficiente
        };
        
        // Ajustar si se sale de la pantalla horizontalmente
        if (position.x < 20) position.x = 20;
        if (position.x + 600 > window.innerWidth - 20) position.x = window.innerWidth - 620;
        
        // Ajustar si se sale de la pantalla verticalmente
        if (position.y < 20) {
          position.y = btnRect.bottom + 10; // Si no cabe arriba, ponerla abajo
        }
      }
      
      this.tailwindConfigViewer = new TailwindConfigViewer(this.container, { position });
      
      // Escuchar eventos del config viewer
      this.tailwindConfigViewer.on('tailwind-config-viewer:hidden', () => {
        this.updateConfigViewerButtonState(false);
      });

      this.tailwindConfigViewer.on('tailwind-config-viewer:shown', () => {
        this.updateConfigViewerButtonState(true);
      });
    }
    
    if (this.tailwindConfigViewer.isShown()) {
      this.tailwindConfigViewer.hide();
      this.updateConfigViewerButtonState(false);
    } else {
      this.tailwindConfigViewer.show();
      this.updateConfigViewerButtonState(true);
    }
  }

  private updateConfigViewerButtonState(active: boolean): void {
    const configViewerBtn = this.dockElement?.querySelector('[data-action="tailwind-config-viewer"]') as HTMLElement;
    if (configViewerBtn) {
      const indicator = configViewerBtn.querySelector('.dock-active-indicator') as HTMLElement;
      if (active) {
        configViewerBtn.classList.add('active');
        configViewerBtn.style.background = 'rgba(59, 130, 246, 0.2)';
        configViewerBtn.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        if (indicator) indicator.style.opacity = '1';
      } else {
        configViewerBtn.classList.remove('active');
        configViewerBtn.style.background = '';
        configViewerBtn.style.borderColor = '';
        if (indicator) indicator.style.opacity = '0';
      }
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
      const indicator = colorPaletteBtn.querySelector('.dock-active-indicator') as HTMLElement;
      if (active) {
        colorPaletteBtn.classList.add('active');
        colorPaletteBtn.style.background = 'rgba(0, 122, 255, 0.3)';
        if (indicator) indicator.style.opacity = '1';
      } else {
        colorPaletteBtn.classList.remove('active');
        colorPaletteBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        if (indicator) indicator.style.opacity = '0';
      }
    }
  }

  private toggleAssetManager(): void {
    if (!this.assetManager) {
      this.assetManager = new AssetManager(this.container, {
        onAssetSelected: (asset) => {
          this.emit('dock:asset-selected', asset);
        },
        onAssetDeleted: (assetId) => {
          this.emit('dock:asset-deleted', assetId);
        }
      });
      
      // Listen to asset manager events
      this.assetManager.on('asset-manager:opened', () => {
        this.updateAssetManagerButtonState(true);
      });
      
      this.assetManager.on('asset-manager:closed', () => {
        this.updateAssetManagerButtonState(false);
      });
    }
    
    if (this.assetManager.isOpen()) {
      this.assetManager.hide();
      this.updateAssetManagerButtonState(false);
    } else {
      this.assetManager.show();
      this.updateAssetManagerButtonState(true);
    }
  }

  private updateAssetManagerButtonState(active: boolean): void {
    const assetBtn = this.dockElement?.querySelector('[data-action="assets"], [data-action="asset-manager"]') as HTMLElement;
    if (assetBtn) {
      const indicator = assetBtn.querySelector('.dock-active-indicator') as HTMLElement;
      if (active) {
        assetBtn.classList.add('active');
        assetBtn.style.background = 'rgba(156, 39, 176, 0.2)';
        assetBtn.style.borderColor = 'rgba(156, 39, 176, 0.4)';
        if (indicator) indicator.style.opacity = '1';
      } else {
        assetBtn.classList.remove('active');
        assetBtn.style.background = '';
        assetBtn.style.borderColor = '';
        if (indicator) indicator.style.opacity = '0';
      }
    }
  }

  private toggleRuler(): void {
    if (!this.ruler) {
      this.ruler = new Ruler(this.container, {
        onMeasurement: (measurement) => {
          this.emit('dock:measurement', measurement);
        },
        onActivated: () => {
          this.updateRulerButtonState(true);
        },
        onDeactivated: () => {
          this.updateRulerButtonState(false);
        }
      });
    }
    
    if (this.ruler.isActivated()) {
      this.ruler.deactivate();
      this.updateRulerButtonState(false);
    } else {
      this.ruler.activate();
      this.updateRulerButtonState(true);
    }
  }

  private updateRulerButtonState(active: boolean): void {
    const rulerBtn = this.dockElement?.querySelector('[data-action="ruler"]') as HTMLElement;
    if (rulerBtn) {
      if (active) {
        rulerBtn.classList.add('active');
        rulerBtn.style.background = 'rgba(255, 193, 7, 0.2)';
        rulerBtn.style.borderColor = 'rgba(255, 193, 7, 0.4)';
      } else {
        rulerBtn.classList.remove('active');
        rulerBtn.style.background = '';
        rulerBtn.style.borderColor = '';
      }
    }
  }

  private initializeJSConsole(): void {
    if (!this.jsConsole) {
      this.jsConsole = new JSConsole(this.container);
      
      // Escuchar eventos de la consola
      this.jsConsole.on('js-console:hidden', () => {
        this.updateConsoleButtonState(false);
      });

      this.jsConsole.on('js-console:shown', () => {
        this.updateConsoleButtonState(true);
      });
      
      // Keep console hidden initially, but error detection is now active
      this.jsConsole.hide();
    }
  }

  private toggleJSConsole(): void {
    if (!this.jsConsole) {
      this.initializeJSConsole();
    }
    
    if (this.jsConsole!.isShown()) {
      this.jsConsole!.hide();
      this.updateConsoleButtonState(false);
    } else {
      this.jsConsole!.show();
      this.updateConsoleButtonState(true);
    }
  }

  private updateConsoleButtonState(active: boolean): void {
    const consoleBtn = this.dockElement?.querySelector('[data-action="console-js"]') as HTMLElement;
    if (consoleBtn) {
      if (active) {
        consoleBtn.classList.add('active');
        consoleBtn.style.background = 'rgba(34, 197, 94, 0.2)';
        consoleBtn.style.borderColor = 'rgba(34, 197, 94, 0.4)';
      } else {
        consoleBtn.classList.remove('active');
        consoleBtn.style.background = '';
        consoleBtn.style.borderColor = '';
      }
    }
  }

  private toggleHTMLNavigator(): void {
    if (!this.htmlNavigatorWindow) {
      this.htmlNavigatorWindow = new HTMLNavigatorWindow(this.container, {
        onClose: () => {
          this.updateHTMLNavigatorButtonState(false);
        }
      });
    }
    
    if (this.htmlNavigatorWindow.isShown()) {
      this.htmlNavigatorWindow.hide();
      this.updateHTMLNavigatorButtonState(false);
    } else {
      this.htmlNavigatorWindow.show();
      this.updateHTMLNavigatorButtonState(true);
    }
  }

  private updateHTMLNavigatorButtonState(active: boolean): void {
    const htmlNavBtn = this.dockElement?.querySelector('[data-action="html-navigator"]') as HTMLElement;
    if (htmlNavBtn) {
      if (active) {
        htmlNavBtn.classList.add('active');
        htmlNavBtn.style.background = 'rgba(59, 130, 246, 0.2)';
        htmlNavBtn.style.borderColor = 'rgba(59, 130, 246, 0.4)';
      } else {
        htmlNavBtn.classList.remove('active');
        htmlNavBtn.style.background = '';
        htmlNavBtn.style.borderColor = '';
      }
    }
  }

  private toggleColorDropper(): void {
    if (!this.colorDropper) {
      this.colorDropper = new ColorDropper(this.container, {
        onColorPicked: (color: string) => {
          this.emit('dock:color-picked', color);
        },
        onActivated: () => {
          this.updateColorDropperButtonState(true);
        },
        onDeactivated: () => {
          this.updateColorDropperButtonState(false);
        },
        enableZoomView: true
      });
    }
    
    if (this.colorDropper.isActivated()) {
      this.colorDropper.deactivate();
      this.updateColorDropperButtonState(false);
    } else {
      this.colorDropper.activate();
      this.updateColorDropperButtonState(true);
    }
  }

  private updateColorDropperButtonState(active: boolean): void {
    const dropperBtn = this.dockElement?.querySelector('[data-action="color-dropper"], [data-action="eyedropper"]') as HTMLElement;
    if (dropperBtn) {
      if (active) {
        dropperBtn.classList.add('active');
        dropperBtn.style.background = 'rgba(236, 72, 153, 0.2)';
        dropperBtn.style.borderColor = 'rgba(236, 72, 153, 0.4)';
      } else {
        dropperBtn.classList.remove('active');
        dropperBtn.style.background = '';
        dropperBtn.style.borderColor = '';
      }
    }
  }

  private toggleTailwindInspector(): void {
    if (!this.tailwindInspector) {
      this.tailwindInspector = new TailwindInspector(this.container, {
        onClose: () => {
          this.updateTailwindInspectorButtonState(false);
        }
      });
      this.tailwindInspector.show();
      this.updateTailwindInspectorButtonState(true);
    } else {
      // Toggle visibility - TailwindInspector doesn't have isShown(), so we toggle by showing/hiding
      this.tailwindInspector.hide();
      this.updateTailwindInspectorButtonState(false);
      // Destroy and recreate on next toggle
      this.tailwindInspector = null;
    }
  }

  private updateTailwindInspectorButtonState(active: boolean): void {
    const tailwindBtn = this.dockElement?.querySelector('[data-action="tailwind-inspector"]') as HTMLElement;
    if (tailwindBtn) {
      if (active) {
        tailwindBtn.classList.add('active');
        tailwindBtn.style.background = 'rgba(6, 182, 212, 0.2)';
        tailwindBtn.style.borderColor = 'rgba(6, 182, 212, 0.4)';
      } else {
        tailwindBtn.classList.remove('active');
        tailwindBtn.style.background = '';
        tailwindBtn.style.borderColor = '';
      }
    }
  }

  public getHTMLNavigatorWindow(): HTMLNavigatorWindow | null {
    return this.htmlNavigatorWindow;
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
    
    // ✨ Actualizar el FancyButton en lugar de re-renderizar todo
    if (this.pauseButton) {
      this.pauseButton.setText(this.isPaused ? '▶️' : '⏸️');
      this.pauseButton.setVariant(this.isPaused ? 'success' : 'warning');
      // Re-aplicar estilos dark después del cambio
      this.customizePauseButtonForDock();
    }
    
    this.emit('dock:pause', this.isPaused);
  }

  public setPaused(paused: boolean): void {
    if (this.isPaused !== paused) {
      this.isPaused = paused;
      
      // ✨ Actualizar el FancyButton
      if (this.pauseButton) {
        this.pauseButton.setText(this.isPaused ? '▶️' : '⏸️');
        this.pauseButton.setVariant(this.isPaused ? 'success' : 'warning');
        // Re-aplicar estilos dark después del cambio
        this.customizePauseButtonForDock();
      }
    }
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public destroy(): void {
    if (this.pauseButton) {
      this.pauseButton.destroy();
      this.pauseButton = null;
    }

    if (this.colorPalette) {
      this.colorPalette.destroy();
      this.colorPalette = null;
    }

    if (this.colorDropper) {
      this.colorDropper.destroy();
      this.colorDropper = null;
    }

    if (this.ruler) {
      this.ruler.destroy();
      this.ruler = null;
    }

    if (this.assetManager) {
      this.assetManager.destroy();
      this.assetManager = null;
    }

    if (this.htmlNavigatorWindow) {
      this.htmlNavigatorWindow.destroy();
      this.htmlNavigatorWindow = null;
    }

    if (this.jsConsole) {
      this.jsConsole.destroy();
      this.jsConsole = null;
    }

    if (this.tailwindInspector) {
      this.tailwindInspector.destroy();
      this.tailwindInspector = null;
    }

    if (this.tailwindConfigViewer) {
      this.tailwindConfigViewer.destroy();
      this.tailwindConfigViewer = null;
    }

    if (this.dockElement) {
      this.dockElement.remove();
      this.dockElement = null;
    }

    this.isVisible = false;
    this.removeAllListeners();
  }
}