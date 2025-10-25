import { EventEmitter } from '../utils/EventEmitter';
import { ElementInspector } from './ElementInspector';
import { StyleManager } from './StyleManager';
import { InspectorPanel } from '../components/InspectorPanel';
import type { 
  StyloEditorEvents, 
  PanelOptions, 
  TabType,
  ElementInfo 
} from '../types';

export interface StyloEditorOptions {
  container?: HTMLElement;
  panelOptions?: PanelOptions;
  excludeSelectors?: string[];
  minimized?: boolean; // Nueva opción para inicializar minimizado
}

export class StyloEditor extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private elementInspector: ElementInspector;
  private styleManager: StyleManager;
  private inspectorPanel: InspectorPanel;
  private floatingInstructions: HTMLElement | null = null;

  constructor(options: StyloEditorOptions = {}) {
    super();
    
    this.container = options.container || document.body;
    
    // Configurar opciones del panel con minimized
    const panelOptions: PanelOptions = {
      ...options.panelOptions,
      // Respeta valores explícitos en options.panelOptions.minimized y options.minimized
      // y por defecto inicia minimizado (true) si no se especifica
      minimized: options.panelOptions?.minimized ?? options.minimized ?? true
    };
    
    // Inicializar componentes principales
    this.elementInspector = new ElementInspector();
    this.styleManager = new StyleManager();
    this.inspectorPanel = new InspectorPanel(this.container, panelOptions);
    
    // Configurar selectores de exclusión
    if (options.excludeSelectors) {
      options.excludeSelectors.forEach(selector => {
        this.elementInspector.addExcludeSelector(selector);
      });
    }
    
    // Excluir el panel del inspector por defecto
    this.elementInspector.addExcludeSelector('.stylo-panel');
    
    this.bindEvents();
    this.createFloatingInstructions();
  }

  /**
   * Vincular eventos entre componentes
   */
  private bindEvents(): void {
    // Eventos del inspector de elementos
    this.elementInspector.on('element:selected', (element: HTMLElement) => {
      this.handleElementSelected(element);
    });

    this.elementInspector.on('element:add', (data: { element: HTMLElement }) => {
      this.inspectorPanel.openElementSelector();
    });

    this.elementInspector.on('inspector:toggle', (enabled: boolean) => {
      this.handleInspectorToggle(enabled);
    });

    // Eventos del gestor de estilos
    this.styleManager.on('styles:updated', (styles) => {
      this.inspectorPanel.updateStyleValues(styles);
      this.emit('styles:updated', styles);
    });

    // Eventos del panel
    this.inspectorPanel.on('inspector:toggle', (enabled: boolean) => {
      if (enabled) {
        this.elementInspector.enable();
      } else {
        this.elementInspector.disable();
      }
    });

    this.inspectorPanel.on('tab:changed', (tab: TabType) => {
      this.emit('tab:changed', tab);
    });

    this.inspectorPanel.on('panel:minimized', (minimized: boolean) => {
      this.updateFloatingInstructions();
      this.emit('panel:minimized', minimized);
    });

    // Eventos del Asset Manager (desde el Dock a través del InspectorPanel)
    this.inspectorPanel.on('asset:selected', (asset) => {
      this.emit('asset:selected', asset);
    });

    this.inspectorPanel.on('asset:uploaded', (asset) => {
      this.emit('asset:uploaded', asset);
    });

    this.inspectorPanel.on('asset:deleted', (assetId) => {
      this.emit('asset:deleted', assetId);
    });

    this.inspectorPanel.on('asset-manager:opened', () => {
      this.emit('asset-manager:opened', undefined);
    });

    this.inspectorPanel.on('asset-manager:closed', () => {
      this.emit('asset-manager:closed', undefined);
    });
  }

  /**
   * Manejar selección de elemento
   */
  private handleElementSelected(element: HTMLElement): void {
    // Actualizar el gestor de estilos
    this.styleManager.setCurrentElement(element);
    
    // Obtener información del elemento
    const elementInfo: ElementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classes: element.className ? element.className.split(' ').filter(c => c.trim()) : [],
      selector: this.generateSelector(element)
    };
    
    // Actualizar el panel
    this.inspectorPanel.updateSelectedElement(element, elementInfo);
    
    // Actualizar instrucciones flotantes
    this.updateFloatingInstructions();
    
    // Emitir evento
    this.emit('element:selected', element);
  }

  /**
   * Manejar toggle del inspector
   */
  private handleInspectorToggle(enabled: boolean): void {
    this.updateFloatingInstructions();
    this.emit('inspector:toggle', enabled);
  }

  /**
   * Generar selector CSS para un elemento
   */
  private generateSelector(element: HTMLElement): string {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    return selector;
  }

  /**
   * Crear instrucciones flotantes
   */
  private createFloatingInstructions(): void {
    this.floatingInstructions = document.createElement('div');
    this.floatingInstructions.className = 'stylo-floating-instructions';
    this.floatingInstructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #4AEDFF;
      color: #000;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9997;
      display: none;
      box-shadow: 0 4px 12px rgba(74, 237, 255, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    this.container.appendChild(this.floatingInstructions);
  }

  /**
   * Actualizar instrucciones flotantes
   */
  private updateFloatingInstructions(): void {
    if (!this.floatingInstructions) return;

    const isInspectorActive = this.elementInspector.isActive();
    const hasSelectedElement = this.elementInspector.getSelectedElement() !== null;
    const isPanelMinimized = this.inspectorPanel.getIsMinimized();

    // Solo mostrar si el panel no está minimizado
    if (isPanelMinimized) {
      this.floatingInstructions.style.display = 'none';
      return;
    }

    if (isInspectorActive && !hasSelectedElement) {
      this.floatingInstructions.textContent = '🎯 Inspector Mode: Click any element to inspect its CSS';
      this.floatingInstructions.style.background = '#4AEDFF';
      this.floatingInstructions.style.display = 'block';
    } else if (hasSelectedElement && !isInspectorActive) {
      this.floatingInstructions.innerHTML = '💡 Hold <kbd style="padding: 2px 4px; background: rgba(0,0,0,0.2); border-radius: 2px;">Ctrl</kbd> + Click to select another element';
      this.floatingInstructions.style.background = '#4AFF4A';
      this.floatingInstructions.style.display = 'block';
    } else {
      this.floatingInstructions.style.display = 'none';
    }
  }

  /**
   * Activar el modo inspector
   */
  public enableInspector(): void {
    this.elementInspector.enable();
  }

  /**
   * Desactivar el modo inspector
   */
  public disableInspector(): void {
    this.elementInspector.disable();
  }

  /**
   * Alternar el modo inspector
   */
  public toggleInspector(): void {
    this.elementInspector.toggle();
  }

  /**
   * Obtener el elemento seleccionado actualmente
   */
  public getSelectedElement(): HTMLElement | null {
    return this.elementInspector.getSelectedElement();
  }

  /**
   * Obtener información del elemento seleccionado
   */
  public getSelectedElementInfo(): ElementInfo | null {
    return this.elementInspector.getSelectedElementInfo();
  }

  /**
   * Minimizar el panel
   */
  public minimizePanel(): void {
    this.inspectorPanel.minimize();
  }

  /**
   * Expandir el panel
   */
  public expandPanel(): void {
    this.inspectorPanel.expand();
  }

  /**
   * Cambiar pestaña activa
   */
  public setActiveTab(tab: TabType): void {
    this.inspectorPanel.setActiveTab(tab);
  }

  /**
   * Mostrar el editor
   */
  public show(): void {
    this.inspectorPanel.show();
    if (this.floatingInstructions) {
      this.floatingInstructions.style.display = 'block';
    }
  }

  /**
   * Ocultar el editor
   */
  public hide(): void {
    this.inspectorPanel.hide();
    if (this.floatingInstructions) {
      this.floatingInstructions.style.display = 'none';
    }
  }

  /**
   * Destruir el editor y limpiar recursos
   */
  public destroy(): void {
    this.elementInspector.destroy();
    this.styleManager.destroy();
    this.inspectorPanel.destroy();
    
    if (this.floatingInstructions && this.floatingInstructions.parentNode) {
      this.floatingInstructions.parentNode.removeChild(this.floatingInstructions);
    }
    
    super.destroy();
  }
}