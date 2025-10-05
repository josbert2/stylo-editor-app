import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

export interface RulerOptions {
  onMeasurement?: (measurement: RulerMeasurement) => void;
  onActivated?: () => void;
  onDeactivated?: () => void;
  units?: 'px' | 'rem' | 'em' | '%';
  showGrid?: boolean;
  snapToElements?: boolean;
}

export interface RulerMeasurement {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  distance: number;
  angle: number;
  units: string;
}

export class Ruler extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private isActive: boolean = false;
  private isDrawing: boolean = false;
  private options: RulerOptions;
  
  // Elementos del ruler
  private rulerOverlay: HTMLElement | null = null;
  private rulerLine: HTMLElement | null = null;
  private startPoint: HTMLElement | null = null;
  private endPoint: HTMLElement | null = null;
  private measurementLabel: HTMLElement | null = null;
  private gridOverlay: HTMLElement | null = null;
  
  // Estado de medición
  private startPosition = { x: 0, y: 0 };
  private endPosition = { x: 0, y: 0 };
  private currentMeasurement: RulerMeasurement | null = null;
  
  // Elementos para snap
  private highlightedElements: HTMLElement[] = [];
  private snapThreshold = 10; // píxeles
  
  constructor(container: HTMLElement, options: RulerOptions = {}) {
    super();
    this.container = container;
    this.options = {
      units: 'px',
      showGrid: false,
      snapToElements: true,
      ...options
    };
    
    this.createRulerElements();
  }

  private createRulerElements(): void {
    // Crear overlay principal
    this.rulerOverlay = document.createElement('div');
    this.rulerOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;

    // Crear línea de medición
    this.rulerLine = document.createElement('div');
    this.rulerLine.style.cssText = `
      position: absolute;
      background: #007acc;
      pointer-events: none;
      transform-origin: 0 50%;
      display: none;
      box-shadow: 0 0 4px rgba(0, 122, 204, 0.5);
    `;

    // Crear punto de inicio
    this.startPoint = document.createElement('div');
    this.startPoint.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: #007acc;
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
      display: none;
      animation: pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(0, 122, 204, 0.6);
    `;

    // Crear punto final
    this.endPoint = document.createElement('div');
    this.endPoint.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: #007acc;
      border: 2px solid white;
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
      display: none;
      animation: pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(0, 122, 204, 0.6);
    `;

    // Crear etiqueta de medición
    this.measurementLabel = document.createElement('div');
    this.measurementLabel.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      white-space: nowrap;
      transform: translate(-50%, -100%);
      margin-top: -8px;
      display: none;
      z-index: 1000001;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    // Agregar elementos al overlay
    if (this.rulerOverlay) {
      this.rulerOverlay.appendChild(this.rulerLine);
      this.rulerOverlay.appendChild(this.startPoint);
      this.rulerOverlay.appendChild(this.endPoint);
      this.rulerOverlay.appendChild(this.measurementLabel);
    }

    // Crear grid si está habilitado
    if (this.options.showGrid) {
      this.createGrid();
    }

    // Agregar al DOM con validación
    if (document.body && this.rulerOverlay) {
      document.body.appendChild(this.rulerOverlay);
    } else {
      console.error('Ruler: No se pudo agregar el overlay al DOM');
    }
  }

  private createGrid(): void {
    this.gridOverlay = document.createElement('div');
    this.gridOverlay.className = 'stylo-ruler-grid';
    this.gridOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.3;
      background-image: 
        linear-gradient(rgba(0, 123, 255, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 123, 255, 0.2) 1px, transparent 1px);
      background-size: 20px 20px;
      display: none;
    `;
  }

  public activate(): void {
    if (this.isActive) return;

    console.log('Ruler: Activando herramienta');
    this.isActive = true;

    // Crear elementos si no existen
    if (!this.rulerOverlay) {
      this.createRulerElements();
    }

    // Validar que los elementos existen antes de usarlos
    if (this.rulerOverlay) {
      this.rulerOverlay.style.display = 'block';
      // Permitir eventos solo en el overlay, no en los elementos hijos
      this.rulerOverlay.style.pointerEvents = 'none';
    }

    if (this.gridOverlay && this.options.showGrid) {
      this.gridOverlay.style.display = 'block';
    }

    // Cambiar cursor
    document.body.style.cursor = 'crosshair';

    // Agregar event listeners con opciones específicas
    document.body.addEventListener('mousedown', this.handleMouseDown, { 
      passive: false, 
      capture: true 
    });
    document.body.addEventListener('mousemove', this.handleMouseMove, { 
      passive: true 
    });
    document.body.addEventListener('mouseup', this.handleMouseUp, { 
      passive: false, 
      capture: true 
    });
    document.addEventListener('keydown', this.handleKeyDown, { 
      passive: false, 
      capture: true 
    });

    // Emitir evento y callback
    this.emit('ruler:activated');
    this.options.onActivated?.();
  }

  public deactivate(): void {
    if (!this.isActive) return;

    console.log('Ruler: Desactivando herramienta');
    this.isActive = false;
    this.isDrawing = false;

    // Ocultar elementos con validación
    if (this.rulerOverlay) {
      this.rulerOverlay.style.display = 'none';
      this.rulerOverlay.style.pointerEvents = 'none';
    }

    if (this.gridOverlay) {
      this.gridOverlay.style.display = 'none';
    }

    this.hideRulerElements();
    this.clearElementHighlights();

    // Restaurar cursor
    document.body.style.cursor = '';

    // Remover event listeners con las mismas opciones que se agregaron
    document.body.removeEventListener('mousedown', this.handleMouseDown, true);
    document.body.removeEventListener('mousemove', this.handleMouseMove);
    document.body.removeEventListener('mouseup', this.handleMouseUp, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    // Emitir evento y callback
    this.emit('ruler:deactivated');
    this.options.onDeactivated?.();
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.isActive || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    
    this.isDrawing = true;

    // Obtener posición inicial (con snap si está habilitado)
    const position = this.getSnappedPosition(e.clientX, e.clientY);
    this.startPosition = position;
    this.endPosition = position;

    // Mostrar punto de inicio
    this.showStartPoint(position.x, position.y);
    
    console.log('Ruler: Iniciando medición en', position);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isActive) return;

    if (this.isDrawing && this.startPosition) {
      // Obtener posición con snap
      const position = this.getSnappedPosition(e.clientX, e.clientY);
      this.endPosition = position;

      // Actualizar display con validación
      this.updateRulerDisplay();
      
      // Resaltar elementos cercanos si el snap está habilitado
      if (this.options.snapToElements) {
        this.highlightNearbyElements(e.clientX, e.clientY);
      }
    } else if (this.options.snapToElements) {
      // Solo resaltar elementos cuando no estamos dibujando
      this.highlightNearbyElements(e.clientX, e.clientY);
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isActive || !this.isDrawing) return;

    e.preventDefault();
    e.stopPropagation();
    
    this.isDrawing = false;

    // Calcular medición final
    const measurement = this.calculateMeasurement();
    
    // Mostrar medición completa
    this.showCompleteMeasurement();
    
    // Emitir evento de medición
    this.emit('ruler:measurement', measurement);
    this.options.onMeasurement?.(measurement);
    
    console.log('Ruler: Medición completada:', measurement);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      if (this.isDrawing) {
        // Cancelar medición actual
        this.cancelCurrentMeasurement();
      } else {
        // Desactivar ruler
        this.deactivate();
      }
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      // Copiar medición al clipboard
      this.copyMeasurementToClipboard();
    }
  };

  private getSnappedPosition(x: number, y: number): { x: number; y: number } {
    if (!this.options.snapToElements) {
      return { x, y };
    }

    // Buscar elementos cercanos para snap
    const element = document.elementFromPoint(x, y);
    if (!element || element === this.rulerOverlay) {
      return { x, y };
    }

    const rect = element.getBoundingClientRect();
    const snapPoints = [
      { x: rect.left, y: rect.top },           // Top-left
      { x: rect.right, y: rect.top },          // Top-right
      { x: rect.left, y: rect.bottom },        // Bottom-left
      { x: rect.right, y: rect.bottom },       // Bottom-right
      { x: rect.left + rect.width / 2, y: rect.top },    // Top-center
      { x: rect.left + rect.width / 2, y: rect.bottom }, // Bottom-center
      { x: rect.left, y: rect.top + rect.height / 2 },   // Left-center
      { x: rect.right, y: rect.top + rect.height / 2 },  // Right-center
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } // Center
    ];

    // Encontrar el punto más cercano
    let closestPoint = { x, y };
    let minDistance = this.snapThreshold;

    for (const point of snapPoints) {
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    return closestPoint;
  }

  private showStartPoint(x: number, y: number): void {
    if (!this.startPoint) return;

    this.startPoint.style.left = `${x}px`;
    this.startPoint.style.top = `${y}px`;
    this.startPoint.style.display = 'block';
  }

  private updateRulerDisplay(): void {
    if (!this.startPosition || !this.endPosition || !this.rulerLine || !this.startPoint || !this.endPoint || !this.measurementLabel) {
      console.warn('Ruler: Elementos no disponibles para actualizar display');
      return;
    }

    const dx = this.endPosition.x - this.startPosition.x;
    const dy = this.endPosition.y - this.startPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Actualizar línea
    this.rulerLine.style.left = `${this.startPosition.x}px`;
    this.rulerLine.style.top = `${this.startPosition.y}px`;
    this.rulerLine.style.width = `${distance}px`;
    this.rulerLine.style.height = '2px';
    this.rulerLine.style.transform = `rotate(${angle}deg)`;
    this.rulerLine.style.display = 'block';

    // Actualizar puntos
    this.startPoint.style.left = `${this.startPosition.x}px`;
    this.startPoint.style.top = `${this.startPosition.y}px`;
    this.startPoint.style.display = 'block';

    this.endPoint.style.left = `${this.endPosition.x}px`;
    this.endPoint.style.top = `${this.endPosition.y}px`;
    this.endPoint.style.display = 'block';

    // Calcular y mostrar medición
    const measurement = this.calculateMeasurement();
    const labelText = this.formatMeasurement(measurement.distance, measurement.width, measurement.height);
    
    this.measurementLabel.textContent = labelText;
    this.measurementLabel.style.left = `${(this.startPosition.x + this.endPosition.x) / 2}px`;
    this.measurementLabel.style.top = `${(this.startPosition.y + this.endPosition.y) / 2}px`;
    this.measurementLabel.style.display = 'block';

    this.currentMeasurement = measurement;
  }

  private showCompleteMeasurement(): void {
    // Agregar animación de confirmación
    if (this.startPoint && this.endPoint) {
      this.startPoint.style.animation = 'pulse 0.3s ease-in-out';
      this.endPoint.style.animation = 'pulse 0.3s ease-in-out';
      
      setTimeout(() => {
        if (this.startPoint && this.endPoint) {
          this.startPoint.style.animation = '';
          this.endPoint.style.animation = '';
        }
      }, 300);
    }

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      if (this.isActive && !this.isDrawing) {
        this.hideRulerElements();
      }
    }, 5000);
  }

  private calculateMeasurement(): RulerMeasurement {
    const { startPosition, endPosition } = this;
    const width = Math.abs(endPosition.x - startPosition.x);
    const height = Math.abs(endPosition.y - startPosition.y);
    const distance = Math.sqrt(width * width + height * height);
    const angle = Math.atan2(endPosition.y - startPosition.y, endPosition.x - startPosition.x) * 180 / Math.PI;

    return {
      startX: startPosition.x,
      startY: startPosition.y,
      endX: endPosition.x,
      endY: endPosition.y,
      width: this.convertUnits(width),
      height: this.convertUnits(height),
      distance: this.convertUnits(distance),
      angle,
      units: this.options.units || 'px'
    };
  }

  private convertUnits(pixels: number): number {
    switch (this.options.units) {
      case 'rem':
        return pixels / 16; // Asumiendo 16px = 1rem
      case 'em':
        return pixels / 16; // Simplificado
      case '%':
        return (pixels / window.innerWidth) * 100; // Relativo al viewport
      default:
        return Math.round(pixels);
    }
  }

  private formatMeasurement(distance: number, width: number, height: number): string {
    const unit = this.options.units || 'px';
    const d = this.convertUnits(distance);
    const w = this.convertUnits(width);
    const h = this.convertUnits(height);

    if (width < 5 && height < 5) {
      return `${d.toFixed(1)}${unit}`;
    } else if (width < 5) {
      return `${h.toFixed(1)}${unit}`;
    } else if (height < 5) {
      return `${w.toFixed(1)}${unit}`;
    } else {
      return `${w.toFixed(1)} × ${h.toFixed(1)}${unit}`;
    }
  }

  private highlightNearbyElements(x: number, y: number): void {
    // Limpiar highlights anteriores
    this.clearElementHighlights();

    if (!this.options.snapToElements) return;

    const element = document.elementFromPoint(x, y);
    if (!element || element === this.rulerOverlay) return;

    // Agregar highlight al elemento
    const highlight = document.createElement('div');
    highlight.className = 'stylo-ruler-highlight';
    highlight.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px dashed #007bff;
      background: rgba(0, 123, 255, 0.1);
      z-index: 99996;
    `;

    const rect = element.getBoundingClientRect();
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    document.body.appendChild(highlight);
    this.highlightedElements.push(highlight);
  }

  private clearElementHighlights(): void {
    this.highlightedElements.forEach(highlight => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    });
    this.highlightedElements = [];
  }

  private hideRulerElements(): void {
    if (this.rulerLine) this.rulerLine.style.display = 'none';
    if (this.startPoint) this.startPoint.style.display = 'none';
    if (this.endPoint) this.endPoint.style.display = 'none';
    if (this.measurementLabel) this.measurementLabel.style.display = 'none';
  }

  private cancelCurrentMeasurement(): void {
    console.log('Ruler: Cancelando medición actual');
    this.isDrawing = false;
    this.hideRulerElements();
    this.clearElementHighlights();
    this.currentMeasurement = null;
  }

  private copyMeasurementToClipboard(): void {
    if (!this.currentMeasurement) return;

    const text = `Width: ${this.currentMeasurement.width}${this.currentMeasurement.units}, Height: ${this.currentMeasurement.height}${this.currentMeasurement.units}, Distance: ${this.currentMeasurement.distance}${this.currentMeasurement.units}`;
    
    navigator.clipboard.writeText(text).then(() => {
      console.log('Ruler: Medición copiada al clipboard');
      // Mostrar notificación temporal
      this.showNotification('Medición copiada al clipboard');
    }).catch(err => {
      console.error('Error copiando al clipboard:', err);
    });
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 123, 255, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 100000;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // Métodos públicos
  public isActivated(): boolean {
    return this.isActive;
  }

  public getCurrentMeasurement(): RulerMeasurement | null {
    return this.currentMeasurement;
  }

  public setUnits(units: 'px' | 'rem' | 'em' | '%'): void {
    this.options.units = units;
    if (this.currentMeasurement) {
      // Recalcular medición con nuevas unidades
      this.currentMeasurement = this.calculateMeasurement();
      if (this.measurementLabel) {
        this.measurementLabel.textContent = this.formatMeasurement(
          this.currentMeasurement.distance,
          this.currentMeasurement.width,
          this.currentMeasurement.height
        );
      }
    }
  }

  public toggleGrid(): void {
    this.options.showGrid = !this.options.showGrid;
    
    if (this.options.showGrid && !this.gridOverlay) {
      this.createGrid();
      if (this.rulerOverlay && this.gridOverlay) {
        this.rulerOverlay.appendChild(this.gridOverlay);
      }
    }

    if (this.gridOverlay) {
      this.gridOverlay.style.display = this.options.showGrid ? 'block' : 'none';
    }
  }

  public toggleSnapToElements(): void {
    this.options.snapToElements = !this.options.snapToElements;
    if (!this.options.snapToElements) {
      this.clearElementHighlights();
    }
  }

  public forceDeactivate(): void {
    console.log('Ruler: Forzando desactivación');
    
    // Resetear todos los estados
    this.isActive = false;
    this.isDrawing = false;
    this.currentMeasurement = null;

    // Ocultar todos los elementos
    if (this.rulerOverlay) {
      this.rulerOverlay.style.display = 'none';
      this.rulerOverlay.style.pointerEvents = 'none';
    }

    if (this.gridOverlay) {
      this.gridOverlay.style.display = 'none';
    }

    this.hideRulerElements();
    this.clearElementHighlights();

    // Restaurar cursor
    document.body.style.cursor = '';

    // Remover TODOS los event listeners posibles
    document.body.removeEventListener('mousedown', this.handleMouseDown);
    document.body.removeEventListener('mousedown', this.handleMouseDown, true);
    document.body.removeEventListener('mousemove', this.handleMouseMove);
    document.body.removeEventListener('mouseup', this.handleMouseUp);
    document.body.removeEventListener('mouseup', this.handleMouseUp, true);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    // Emitir evento y callback
    this.emit('ruler:deactivated');
    this.options.onDeactivated?.();
  }

  public destroy(): void {
    this.deactivate();
    
    if (this.rulerOverlay && this.rulerOverlay.parentNode) {
      this.rulerOverlay.parentNode.removeChild(this.rulerOverlay);
    }
    
    this.clearElementHighlights();
    this.removeAllListeners();
  }
}