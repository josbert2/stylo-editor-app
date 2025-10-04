import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

export interface ColorDropperOptions {
  onColorPicked?: (color: string) => void;
  onActivated?: () => void;
  onDeactivated?: () => void;
}

export class ColorDropper extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private isActive: boolean = false;
  private colorPreview: HTMLElement | null = null;
  private currentColor: string = '#000000';
  private options: ColorDropperOptions;

  constructor(container: HTMLElement, options: ColorDropperOptions = {}) {
    super();
    this.container = container;
    this.options = options;
    this.createColorPreview();
  }

  private createColorPreview(): void {
    this.colorPreview = document.createElement('div');
    this.colorPreview.className = 'stylo-color-dropper-preview';
    this.colorPreview.style.cssText = `
      position: fixed;
      width: 80px;
      height: 50px;
      border: 2px solid #ffffff;
      border-radius: 8px;
      z-index: 10001;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.8) translateY(10px);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 3px 10px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Área del color
    const colorArea = document.createElement('div');
    colorArea.className = 'color-area';
    colorArea.style.cssText = `
      flex: 1;
      background: ${this.currentColor};
      position: relative;
      transition: background-color 0.1s ease;
    `;

    // Crosshair en el centro del área de color
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    `;

    // Líneas del crosshair
    const horizontalLine = document.createElement('div');
    horizontalLine.style.cssText = `
      position: absolute;
      top: 50%;
      left: 2px;
      right: 2px;
      height: 1px;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    `;

    const verticalLine = document.createElement('div');
    verticalLine.style.cssText = `
      position: absolute;
      left: 50%;
      top: 2px;
      bottom: 2px;
      width: 1px;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    `;

    crosshair.appendChild(horizontalLine);
    crosshair.appendChild(verticalLine);
    colorArea.appendChild(crosshair);

    // Información del color
    const colorInfo = document.createElement('div');
    colorInfo.className = 'color-info';
    colorInfo.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      padding: 4px 6px;
      line-height: 1;
      letter-spacing: 0.5px;
    `;
    colorInfo.textContent = this.currentColor;

    this.colorPreview.appendChild(colorArea);
    this.colorPreview.appendChild(colorInfo);
    this.container.appendChild(this.colorPreview);
  }

  public activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    document.body.style.cursor = 'crosshair';
    
    if (this.colorPreview) {
      this.colorPreview.style.opacity = '1';
      this.colorPreview.style.transform = 'scale(1) translateY(0)';
    }

    // Agregar event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);

    // Emitir evento de activación
    this.emit('eyedropper:activated');
    this.options.onActivated?.();
  }

  public deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    document.body.style.cursor = '';
    
    if (this.colorPreview) {
      this.colorPreview.style.opacity = '0';
      this.colorPreview.style.transform = 'scale(0.8) translateY(10px)';
    }

    // Remover event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    // Emitir evento de desactivación
    this.emit('eyedropper:deactivated');
    this.options.onDeactivated?.();
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isActive || !this.colorPreview) return;

    // Posicionar el preview cerca del cursor
    const offsetX = 15;
    const offsetY = -70;
    let x = e.clientX + offsetX;
    let y = e.clientY + offsetY;

    // Ajustar si se sale de la pantalla
    if (x + 80 > window.innerWidth) {
      x = e.clientX - 80 - offsetX;
    }
    if (y < 10) {
      y = e.clientY + 20;
    }
    
    this.colorPreview.style.left = `${x}px`;
    this.colorPreview.style.top = `${y}px`;

    // Capturar el color en la posición del mouse
    this.captureColorAtPosition(e.clientX, e.clientY);
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Capturar el color final y emitir evento
    this.captureColorAtPosition(e.clientX, e.clientY);
    this.emit('eyedropper:color-picked', this.currentColor);
    this.options.onColorPicked?.(this.currentColor);
    
    // Desactivar el dropper
    this.deactivate();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.deactivate();
    }
  };

  private captureColorAtPosition(x: number, y: number): void {
    // Usar la API EyeDropper si está disponible
    if ('EyeDropper' in window) {
      // La API nativa se maneja en el método activate
      return;
    }

    // Fallback: capturar color del elemento bajo el cursor
    const element = document.elementFromPoint(x, y) as HTMLElement;
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      let color = computedStyle.backgroundColor;
      
      // Si el fondo es transparente, intentar con el color del texto
      if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        color = computedStyle.color;
      }
      
      // Convertir a formato hex si es posible
      const hexColor = this.rgbToHex(color);
      this.currentColor = hexColor || color;
      
      // Actualizar la vista previa
      this.updateColorPreview();
    }
  }

  private updateColorPreview(): void {
    if (!this.colorPreview) return;

    const colorArea = this.colorPreview.querySelector('.color-area') as HTMLElement;
    const colorInfo = this.colorPreview.querySelector('.color-info') as HTMLElement;

    if (colorArea) {
      colorArea.style.backgroundColor = this.currentColor;
    }

    if (colorInfo) {
      colorInfo.textContent = this.currentColor.toUpperCase();
    }
  }

  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }



  public isActivated(): boolean {
    return this.isActive;
  }

  public getCurrentColor(): string {
    return this.currentColor;
  }

  public destroy(): void {
    this.deactivate();
    if (this.colorPreview) {
      this.colorPreview.remove();
      this.colorPreview = null;
    }
  }

  // Método para usar la API nativa EyeDropper si está disponible
  public async useNativeEyeDropper(): Promise<string | null> {
    if (!('EyeDropper' in window)) {
      console.warn('EyeDropper API no está disponible en este navegador');
      return null;
    }

    try {
      // @ts-ignore - EyeDropper API
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      
      if (result && result.sRGBHex) {
        this.currentColor = result.sRGBHex;
        this.emit('eyedropper:color-picked', this.currentColor);
        this.options.onColorPicked?.(this.currentColor);
        return result.sRGBHex;
      }
    } catch (error) {
      console.error('Error usando EyeDropper API:', error);
    }
    
    return null;
  }
}