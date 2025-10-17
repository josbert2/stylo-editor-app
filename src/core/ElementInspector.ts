import { EventEmitter } from '../utils/EventEmitter';
import { getElementInfo } from '../utils/cssUtils';
import type { ElementInfo, StyloEditorEvents } from '../types';

export class ElementInspector extends EventEmitter<StyloEditorEvents> {
  private isEnabled: boolean = false;
  private selectedElement: HTMLElement | null = null;
  private hoveredElement: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private excludeSelectors: string[] = [];
  
  // Guardar referencias a los handlers para poder removerlos correctamente
  private boundHandleClick: (event: MouseEvent) => void;
  private boundHandleMouseOver: (event: MouseEvent) => void;
  private boundHandleMouseOut: (event: MouseEvent) => void;
  private boundHandleKeyDown: (event: KeyboardEvent) => void;

  constructor() {
    super();
    
    // Crear referencias bound una sola vez
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleMouseOver = this.handleMouseOver.bind(this);
    this.boundHandleMouseOut = this.handleMouseOut.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    
    this.createOverlay();
    this.bindEvents();
  }

  /**
   * Crear el overlay para resaltar elementos
   */
  private createOverlay(): void {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #4AEDFF;
      background: rgba(74, 237, 255, 0.1);
      z-index: 9998;
      transition: all 0.1s ease;
      display: none;
      box-sizing: border-box;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Vincular eventos del DOM
   */
  private bindEvents(): void {
    // Usar las referencias guardadas para poder removerlas después
    document.addEventListener('click', this.boundHandleClick, true);
    document.addEventListener('mouseover', this.boundHandleMouseOver, true);
    document.addEventListener('mouseout', this.boundHandleMouseOut, true);
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Desvincular eventos del DOM
   */
  private unbindEvents(): void {
    // Usar las mismas referencias para remover correctamente
    document.removeEventListener('click', this.boundHandleClick, true);
    document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
    document.removeEventListener('mouseout', this.boundHandleMouseOut, true);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Manejar clicks en elementos
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    let target = event.target as HTMLElement;
    
    // Si el target es un nodo de texto o similar, obtener el elemento padre
    if (target.nodeType !== Node.ELEMENT_NODE) {
      target = target.parentElement as HTMLElement;
    }
    
    // Verificar si el elemento debe ser excluido
    if (this.shouldExcludeElement(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    // Buscar el elemento más específico en el punto del click
    const elementAtPoint = this.getElementAtPoint(event.clientX, event.clientY);
    if (elementAtPoint && !this.shouldExcludeElement(elementAtPoint)) {
      this.selectElement(elementAtPoint);
    } else {
      this.selectElement(target);
    }
  }

  /**
   * Manejar hover sobre elementos
   */
  private handleMouseOver(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    let target = event.target as HTMLElement;
    
    // Si el target es un nodo de texto, obtener el elemento padre
    if (target.nodeType !== Node.ELEMENT_NODE) {
      target = target.parentElement as HTMLElement;
    }
    
    // Verificar si el elemento debe ser excluido
    if (this.shouldExcludeElement(target)) {
      return;
    }

    // Buscar el elemento más específico en el punto del mouse
    const elementAtPoint = this.getElementAtPoint(event.clientX, event.clientY);
    const elementToHighlight = elementAtPoint && !this.shouldExcludeElement(elementAtPoint) ? elementAtPoint : target;

    // No actualizar el overlay si estamos sobre el elemento seleccionado
    // (para que se mantenga el estilo de "seleccionado")
    if (this.selectedElement && elementToHighlight === this.selectedElement) {
      return;
    }

    this.hoveredElement = elementToHighlight;
    this.updateOverlay(elementToHighlight, false);
    this.emit('element:hover', elementToHighlight);
  }

  /**
   * Manejar cuando el mouse sale de un elemento
   */
  private handleMouseOut(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    const target = event.target as HTMLElement;
    
    if (this.hoveredElement === target) {
      this.hoveredElement = null;
      if (!this.selectedElement) {
        this.hideOverlay();
      }
      this.emit('element:hover', null);
    }
  }

  /**
   * Manejar teclas presionadas
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Escape para desactivar el inspector
    if (event.key === 'Escape' && this.isEnabled) {
      this.disable();
    }
    
    // Ctrl+Click para seleccionar elemento padre
    if (event.ctrlKey && this.selectedElement && this.selectedElement.parentElement) {
      this.selectElement(this.selectedElement.parentElement);
    }
  }

  /**
   * Obtener el elemento más específico en un punto dado
   * Esto ayuda a seleccionar el elemento correcto incluso si hay overlays
   */
  private getElementAtPoint(x: number, y: number): HTMLElement | null {
    // Ocultar temporalmente el overlay para obtener el elemento debajo
    const originalDisplay = this.overlay?.style.display;
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    
    const element = document.elementFromPoint(x, y) as HTMLElement;
    
    // Restaurar el overlay
    if (this.overlay && originalDisplay) {
      this.overlay.style.display = originalDisplay;
    }
    
    return element;
  }

  /**
   * Verificar si un elemento debe ser excluido de la selección
   */
  private shouldExcludeElement(element: HTMLElement): boolean {
    if (!element) return true;
    
    // Excluir elementos del propio editor
    for (const selector of this.excludeSelectors) {
      try {
        if (element.matches(selector) || element.closest(selector)) {
          return true;
        }
      } catch (e) {
        // Ignorar errores de selectores inválidos
        continue;
      }
    }
    
    // Excluir elementos del overlay
    if (this.overlay && (element === this.overlay || this.overlay.contains(element))) {
      return true;
    }
    
    // Excluir body y html
    if (element === document.body || element === document.documentElement) {
      return true;
    }
    
    return false;
  }

  /**
   * Actualizar la posición y estilo del overlay
   */
  private updateOverlay(element: HTMLElement, isSelected: boolean = false): void {
    if (!this.overlay || !element) return;

    const rect = element.getBoundingClientRect();
    
    // Diferentes estilos para hover vs seleccionado
    const borderColor = isSelected ? '#10b981' : '#4AEDFF';
    const backgroundColor = isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(74, 237, 255, 0.1)';
    const borderWidth = isSelected ? '3px' : '2px';
    const boxShadow = isSelected ? '0 0 0 2px rgba(16, 185, 129, 0.4), inset 0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none';
    
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none !important;
      border: ${borderWidth} solid ${borderColor};
      background: ${backgroundColor};
      z-index: 9998;
      transition: all 0.15s ease;
      display: block;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      box-shadow: ${boxShadow};
      box-sizing: border-box;
    `;
  }

  /**
   * Ocultar el overlay
   */
  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Seleccionar un elemento
   */
  public selectElement(element: HTMLElement): void {
    this.selectedElement = element;
    this.updateOverlay(element, true);
    
    const elementInfo: ElementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classes: element.className ? element.className.split(' ').filter(c => c.trim()) : [],
      selector: getElementInfo(element)
    };
    
    this.emit('element:selected', element);
    
    // IMPORTANTE: Mantener el cursor en crosshair para poder seguir seleccionando
    if (this.isEnabled) {
      document.body.style.cursor = 'crosshair';
    }
  }

  /**
   * Obtener el elemento seleccionado actualmente
   */
  public getSelectedElement(): HTMLElement | null {
    return this.selectedElement;
  }

  /**
   * Obtener información del elemento seleccionado
   */
  public getSelectedElementInfo(): ElementInfo | null {
    if (!this.selectedElement) return null;
    
    return {
      tagName: this.selectedElement.tagName.toLowerCase(),
      id: this.selectedElement.id || undefined,
      classes: this.selectedElement.className ? 
        this.selectedElement.className.split(' ').filter(c => c.trim()) : [],
      selector: getElementInfo(this.selectedElement)
    };
  }

  /**
   * Activar el modo inspector
   */
  public enable(): void {
    this.isEnabled = true;
    document.body.style.cursor = 'crosshair';
    
    // Asegurar que los event listeners estén activos
    this.unbindEvents();
    this.bindEvents();
    
    this.emit('inspector:toggle', true);
  }

  /**
   * Desactivar el modo inspector
   */
  public disable(): void {
    this.isEnabled = false;
    document.body.style.cursor = '';
    this.hideOverlay();
    this.hoveredElement = null;
    this.selectedElement = null;
    this.emit('inspector:toggle', false);
  }

  /**
   * Alternar el modo inspector
   */
  public toggle(): void {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Verificar si el inspector está activo
   */
  public isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Agregar selectores CSS que deben ser excluidos de la selección
   */
  public addExcludeSelector(selector: string): void {
    if (!this.excludeSelectors.includes(selector)) {
      this.excludeSelectors.push(selector);
    }
  }

  /**
   * Remover un selector de la lista de exclusión
   */
  public removeExcludeSelector(selector: string): void {
    const index = this.excludeSelectors.indexOf(selector);
    if (index > -1) {
      this.excludeSelectors.splice(index, 1);
    }
  }

  /**
   * Limpiar la selección actual
   */
  public clearSelection(): void {
    this.selectedElement = null;
    this.hideOverlay();
  }

  /**
   * Destruir el inspector y limpiar recursos
   */
  public destroy(): void {
    this.disable();
    this.unbindEvents();
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.selectedElement = null;
    this.hoveredElement = null;
    this.overlay = null;
    
    super.destroy();
  }
}