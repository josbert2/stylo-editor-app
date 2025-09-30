import { EventEmitter } from '../utils/EventEmitter';
import { getElementInfo } from '../utils/cssUtils';
import type { ElementInfo, StyloEditorEvents } from '../types';

export class ElementInspector extends EventEmitter<StyloEditorEvents> {
  private isEnabled: boolean = false;
  private selectedElement: HTMLElement | null = null;
  private hoveredElement: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private excludeSelectors: string[] = [];

  constructor() {
    super();
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
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
    document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Desvincular eventos del DOM
   */
  private unbindEvents(): void {
    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Manejar clicks en elementos
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    const target = event.target as HTMLElement;
    
    // Verificar si el elemento debe ser excluido
    if (this.shouldExcludeElement(target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    this.selectElement(target);
  }

  /**
   * Manejar hover sobre elementos
   */
  private handleMouseOver(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    const target = event.target as HTMLElement;
    
    // Verificar si el elemento debe ser excluido
    if (this.shouldExcludeElement(target)) {
      return;
    }

    this.hoveredElement = target;
    this.updateOverlay(target, false);
    this.emit('element:hover', target);
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
   * Verificar si un elemento debe ser excluido de la selección
   */
  private shouldExcludeElement(element: HTMLElement): boolean {
    // Excluir elementos del propio editor
    for (const selector of this.excludeSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }
    
    // Excluir elementos del overlay
    if (this.overlay && (element === this.overlay || this.overlay.contains(element))) {
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
    const borderColor = isSelected ? '#4AEDFF' : '#4AEDFF';
    const backgroundColor = isSelected ? 'rgba(74, 237, 255, 0.15)' : 'rgba(74, 237, 255, 0.1)';
    const borderWidth = isSelected ? '2px' : '2px';
    const boxShadow = isSelected ? '0 0 0 1px rgba(74, 237, 255, 0.3)' : 'none';
    
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: ${borderWidth} solid ${borderColor};
      background: ${backgroundColor};
      z-index: 9998;
      transition: all 0.1s ease;
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