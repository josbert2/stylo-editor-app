import { EventEmitter } from '../utils/EventEmitter';
import { getElementInfo } from '../utils/cssUtils';
import type { ElementInfo, StyloEditorEvents } from '../types';
import './ElementInspector.css';

export class ElementInspector extends EventEmitter<StyloEditorEvents> {
  private isEnabled: boolean = false;
  private selectedElement: HTMLElement | null = null;
  private hoveredElement: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private actionsTooltip: HTMLElement | null = null;
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
    
    // Agregar selectores de elementos del editor que NO deben ser seleccionables
    this.excludeSelectors = [
      '#stylo-editor-container',
      '.stylo-editor-sidebar',
      '.stylo-inspector-panel',
      '.inspector-panel',
      '.stylo-actions-tooltip',
      '.stylo-action-btn',
      '.background-panel',
      '.spacing-panel',
      '.typography-panel',
      '.filters-panel',
      '.text-shadow-panel',
      '.box-shadow-panel',
      '.positioning-panel',
      '.border-panel',
      '.display-panel',
      '.advanced-color-picker',
      '.bg-picker-popup',
      '.bg-picker-overlay',
      '.bg-preset-actions-tooltip',
      '[class*="stylo-"]',
      '[class*="inspector-"]',
      '[id*="stylo-"]'
    ];
    
    this.createOverlay();
    this.createActionsTooltip();
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
   * Crear el tooltip de acciones rápidas
   */
  private createActionsTooltip(): void {
    if (this.actionsTooltip) return;
    
    this.actionsTooltip = document.createElement('div');
    this.actionsTooltip.className = 'stylo-actions-tooltip';
    this.actionsTooltip.style.cssText = `
      position: fixed;
      display: none;
      flex-direction: row;
      gap: 6px;
      padding: 8px;
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(74, 237, 255, 0.4);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      z-index: 9999;
      animation: fadeInScale 0.2s ease-out;
    `;
    
    this.actionsTooltip.innerHTML = `
      <button class="stylo-action-btn" data-action="copy" title="Copy CSS">
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M224 0c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM64 160c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H288v64H64V224h64V160H64z"></path>
        </svg>
      </button>
      <button class="stylo-action-btn" data-action="edit" title="Edit Element">
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"></path>
        </svg>
      </button>
      <button class="stylo-action-btn" data-action="export" title="Export CSS">
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"></path>
        </svg>
      </button>
      <button class="stylo-action-btn" data-action="comment" title="Add Comment">
        <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
          <path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4l0 0 0 0 0 0 0 0 .3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"></path>
        </svg>
      </button>
      <button class="stylo-action-btn stylo-action-delete" data-action="delete" title="Remove Element">
        <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor">
          <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"></path>
        </svg>
      </button>
      <button class="stylo-action-btn stylo-action-cancel" data-action="cancel" title="Cancel">
        <svg width="14" height="14" viewBox="0 0 320 512" fill="currentColor">
          <path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path>
        </svg>
      </button>
    `;
    
    document.body.appendChild(this.actionsTooltip);
    this.attachTooltipListeners();
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
   * Vincular eventos del tooltip de acciones
   */
  private attachTooltipListeners(): void {
    if (!this.actionsTooltip) return;
    
    const buttons = this.actionsTooltip.querySelectorAll('[data-action]');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (e.currentTarget as HTMLElement).dataset.action;
        if (action) this.handleAction(action);
      });
    });
  }

  /**
   * Mostrar el tooltip de acciones cerca del elemento seleccionado
   */
  private showActionsTooltip(element: HTMLElement): void {
    if (!this.actionsTooltip) return;
    
    const rect = element.getBoundingClientRect();
    const tooltipHeight = 50; // Altura aproximada del tooltip
    const spacing = 10;
    
    // Posicionar arriba del elemento si hay espacio, sino debajo
    let top = rect.top - tooltipHeight - spacing;
    if (top < 0) {
      top = rect.bottom + spacing;
    }
    
    // Centrar horizontalmente
    const left = rect.left + (rect.width / 2) - 120; // 120 = mitad del ancho aproximado del tooltip
    
    this.actionsTooltip.style.top = `${top}px`;
    this.actionsTooltip.style.left = `${Math.max(10, left)}px`;
    this.actionsTooltip.style.display = 'flex';
  }

  /**
   * Ocultar el tooltip de acciones
   */
  private hideActionsTooltip(): void {
    if (this.actionsTooltip) {
      this.actionsTooltip.style.display = 'none';
    }
  }

  /**
   * Manejar acciones del tooltip
   */
  private handleAction(action: string): void {
    if (!this.selectedElement) return;
    
    switch (action) {
      case 'copy':
        this.copyElementCSS();
        break;
      case 'edit':
        // Ya se emite el evento element:selected que abre el inspector
        console.log('Edit element');
        break;
      case 'export':
        this.exportElementCSS();
        break;
      case 'comment':
        console.log('Add comment - Feature coming soon');
        break;
      case 'delete':
        this.deleteElement();
        break;
      case 'cancel':
        this.clearSelection();
        this.hideActionsTooltip();
        break;
    }
  }

  /**
   * Copiar CSS del elemento seleccionado
   */
  private copyElementCSS(): void {
    if (!this.selectedElement) return;
    
    const styles = window.getComputedStyle(this.selectedElement);
    const cssText = styles.cssText;
    
    navigator.clipboard.writeText(cssText).then(() => {
      this.showToast('✅ CSS copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Failed to copy CSS:', err);
      this.showToast('❌ Failed to copy CSS', 'error');
    });
  }

  /**
   * Exportar CSS completo del elemento
   */
  private exportElementCSS(): void {
    if (!this.selectedElement) return;
    
    const selector = getElementInfo(this.selectedElement);
    const styles = window.getComputedStyle(this.selectedElement);
    const cssText = `${selector} {\n  ${styles.cssText}\n}`;
    
    navigator.clipboard.writeText(cssText).then(() => {
      console.log('CSS exported to clipboard');
    }).catch(err => {
      console.error('Failed to export CSS:', err);
    });
  }

  /**
   * Eliminar el elemento seleccionado
   */
  private deleteElement(): void {
    if (!this.selectedElement) return;
    
    if (confirm('Are you sure you want to delete this element?')) {
      this.selectedElement.remove();
      this.clearSelection();
      this.hideActionsTooltip();
    }
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
    this.showActionsTooltip(element);
    
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
    this.hideActionsTooltip();
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
    this.hideActionsTooltip();
  }

  /**
   * Mostrar notificación toast temporal
   */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `stylo-toast stylo-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
      pointer-events: none;
    `;
    
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
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
    
    if (this.actionsTooltip && this.actionsTooltip.parentNode) {
      this.actionsTooltip.parentNode.removeChild(this.actionsTooltip);
    }
    
    this.selectedElement = null;
    this.hoveredElement = null;
    this.overlay = null;
    this.actionsTooltip = null;
    
    super.destroy();
  }
}