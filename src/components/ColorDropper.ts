import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

export interface ColorDropperOptions {
  onColorPicked?: (color: string) => void;
  onActivated?: () => void;
  onDeactivated?: () => void;
  onColorHover?: (color: string) => void;
  enableZoomView?: boolean; // Vista ampliada opcional (por defecto false)
}

export class ColorDropper extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private isActive: boolean = false;
  private colorPreview: HTMLElement | null = null;
  private currentColor: string = '#000000';
  private options: ColorDropperOptions;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private zoomCanvas: HTMLCanvasElement | null = null;
  private zoomCtx: CanvasRenderingContext2D | null = null;
  private customCursor: HTMLElement | null = null;
  
  // Propiedades optimizadas para rendimiento
  private colorCache: Map<string, string> = new Map();
  private lastHoveredColor: string = '';
  private hoverThrottleTimeout: number | null = null;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private readonly UPDATE_THROTTLE = 16; // ~60fps

  constructor(container: HTMLElement, options: ColorDropperOptions = {}) {
    super();
    this.container = container;
    this.options = { enableZoomView: false, ...options }; // Por defecto sin zoom
    this.createColorPreview();
    this.setupCanvas();
    this.createCustomCursor();
  }

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.canvas.style.display = 'none';
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
  }

  private createColorPreview(): void {
    this.colorPreview = document.createElement('div');
    this.colorPreview.id = 'stylo-color-dropper-preview';
    this.colorPreview.className = 'stylo-color-dropper-preview';
    
    // Estilos base optimizados para coincidir con la imagen de referencia
    this.colorPreview.style.cssText = `
      position: fixed;
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      z-index: 99999;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(0, 0, 0);
      transition: opacity 0.15s ease-out;
      will-change: transform, opacity;
      box-shadow: 
        0 8px 25px rgba(0, 0, 0, 0.4),
        0 2px 10px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(8px);
      min-width: 120px;
      contain: layout style paint;
      top: 0;
      left: 0;
    `;

    // Muestra del color - diseño compacto como en la referencia
    const colorSwatch = document.createElement('div');
    colorSwatch.className = 'color-swatch';
    colorSwatch.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      background: ${this.currentColor};
      box-shadow: 
        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
        0 2px 6px rgba(0, 0, 0, 0.2);
      flex-shrink: 0;
      will-change: background-color;
      contain: layout style paint;
    `;

    // Valor del color - estilo compacto
    const colorValue = document.createElement('div');
    colorValue.className = 'color-value';
    colorValue.textContent = this.currentColor.toUpperCase();
    colorValue.style.cssText = `
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      contain: layout style;
    `;

    // Ensamblar el preview
    this.colorPreview.appendChild(colorSwatch);
    this.colorPreview.appendChild(colorValue);

    // No incluir zoom view ni detalles adicionales para mantener el diseño compacto
    document.body.appendChild(this.colorPreview);
  }

  private createCustomCursor(): void {
    this.customCursor = document.createElement('div');
    this.customCursor.className = 'stylo-eyedropper-cursor';
    this.customCursor.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99998;
      display: none;
      box-shadow: 
        0 0 0 1px rgba(0, 0, 0, 0.6),
        0 2px 8px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(1px);
      transition: none;
      will-change: transform;
      top: 0;
      left: 0;
    `;

    // Punto central del cursor - más pequeño y preciso
    const centerDot = document.createElement('div');
    centerDot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1px;
      height: 1px;
      background: #ffffff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.8);
    `;

    this.customCursor.appendChild(centerDot);
    document.body.appendChild(this.customCursor);
  }

  public activate(): void {
    if (this.isActive) return;

    console.log('ColorDropper: Activando...');
    this.isActive = true;

    // Ocultar cursor por defecto
    document.body.style.cursor = 'none';

    // Limpiar caché de colores
    this.colorCache.clear();

    // Crear preview si no existe
    if (!this.colorPreview) {
      this.createColorPreview();
    }

    // Crear cursor personalizado si no existe
    if (!this.customCursor) {
      this.createCustomCursor();
    }

    // Configurar event listeners
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);

    // Mostrar cursor personalizado
    if (this.customCursor) {
      this.customCursor.style.display = 'block';
    }

    // Mostrar preview
    if (this.colorPreview) {
      this.colorPreview.style.display = 'flex';
      this.colorPreview.style.opacity = '1';
    }

    this.emit('activated');
    this.options.onActivated?.();
  }

  public deactivate(): void {
    if (!this.isActive) return;

    console.log('ColorDropper: Desactivando...');
    this.isActive = false;

    // Restaurar cursor por defecto
    document.body.style.cursor = '';

    // Remover event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);

    // Ocultar cursor personalizado
    if (this.customCursor) {
      this.customCursor.style.display = 'none';
    }

    // Ocultar preview
    if (this.colorPreview) {
      this.colorPreview.style.display = 'none';
      this.colorPreview.style.opacity = '0';
    }

    // Limpiar animaciones pendientes
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.hoverThrottleTimeout) {
      clearTimeout(this.hoverThrottleTimeout);
      this.hoverThrottleTimeout = null;
    }

    this.emit('deactivated');
    this.options.onDeactivated?.();
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isActive) return;

    console.log('ColorDropper: Mouse move detectado', e.clientX, e.clientY);

    // Actualizar posición del cursor personalizado - centrado en el mouse
    if (this.customCursor) {
      // Centrar el cursor exactamente en la posición del mouse
      const cursorX = e.clientX - 10; // 10px es la mitad del ancho (20px/2)
      const cursorY = e.clientY - 10; // 10px es la mitad del alto (20px/2)
      this.customCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }

    // Usar requestAnimationFrame para mejor rendimiento
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      // Capturar color y actualizar preview
      this.captureColorFromElement(e.clientX, e.clientY);
      this.positionColorPreview(e.clientX, e.clientY);

      // Actualizar zoom view si está habilitado
      if (this.options.enableZoomView) {
        this.updateZoomView(e.clientX, e.clientY);
      }
    });
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Capturar color final
    this.captureColorFromElement(e.clientX, e.clientY);
    
    // Emitir eventos
    this.options.onColorPicked?.(this.currentColor);
    this.emit('eyedropper:color-picked', this.currentColor);
    
    // Mostrar notificación de captura
    this.showColorCapturedNotification(this.currentColor);
    
    // NO desactivar automáticamente - permitir múltiples capturas
    // this.deactivate(); // Comentado para permitir múltiples capturas
    
    // Opcional: agregar un pequeño feedback visual
    if (this.customCursor) {
      this.customCursor.style.transform += ' scale(1.2)';
      setTimeout(() => {
        if (this.customCursor) {
          this.customCursor.style.transform = this.customCursor.style.transform.replace(' scale(1.2)', '');
        }
      }, 150);
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.deactivate();
    }
  };

  private captureColorFromElement(x: number, y: number): void {
    try {
      // Reducir throttle para mejor responsividad
      const now = performance.now();
      if (now - this.lastUpdateTime < 4) { // Mejorar frecuencia de actualización
        return;
      }
      this.lastUpdateTime = now;

      // Cache más preciso - usar coordenadas exactas para mejor precisión
      const cacheKey = `${Math.floor(x)},${Math.floor(y)}`;
      let color = this.colorCache.get(cacheKey);
      
      if (!color) {
        // Ocultar TODOS los elementos del ColorDropper para evitar interferencias
        const previewDisplay = this.colorPreview?.style.display;
        const cursorDisplay = this.customCursor?.style.display;
        
        if (this.colorPreview) this.colorPreview.style.display = 'none';
        if (this.customCursor) this.customCursor.style.display = 'none';

        // Obtener el elemento exacto en las coordenadas
        const element = document.elementFromPoint(x, y);
        console.log('Elemento detectado:', element, 'en coordenadas:', x, y);
        
        // Intentar múltiples métodos de captura de color
        color = this.getElementColorAdvanced(element, x, y);
        
        // Restaurar elementos inmediatamente
        if (this.colorPreview && previewDisplay !== 'none') {
          this.colorPreview.style.display = previewDisplay || 'flex';
        }
        if (this.customCursor && cursorDisplay !== 'none') {
          this.customCursor.style.display = cursorDisplay || 'block';
        }
        
        // Cache con límite más pequeño para mejor precisión
        if (this.colorCache.size > 50) {
          const keysToDelete = Array.from(this.colorCache.keys()).slice(0, 25);
          keysToDelete.forEach(key => this.colorCache.delete(key));
        }
        this.colorCache.set(cacheKey, color);
      }

      // Actualizar siempre para mejor responsividad
      this.currentColor = color;
      this.updateColorPreview();

      // Callback de hover más responsivo
      if (this.lastHoveredColor !== color) {
        this.lastHoveredColor = color;
        this.options.onColorHover?.(color);
      }

    } catch (error) {
      console.error('Error capturando color:', error);
      this.currentColor = '#ff0000'; // Color de error más visible
      this.updateColorPreview();
    }
  }

  // Nuevo método mejorado para captura de colores
  private getElementColorAdvanced(element: Element | null, x: number, y: number): string {
    if (!element) return this.getSmartFallbackColor(document.body);

    try {
      const computedStyle = window.getComputedStyle(element);
      console.log('Estilos computados:', {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        backgroundImage: computedStyle.backgroundImage
      });
      
      // 1. Prioridad alta: Imágenes y Canvas (colores reales de píxeles)
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        if (img.complete && img.naturalWidth > 0) {
          const imageColor = this.getImageColorAtImproved(img, x, y);
          if (imageColor && imageColor !== '#000000') {
            console.log('Color de imagen capturado:', imageColor);
            return imageColor;
          }
        }
      }

      if (element.tagName === 'CANVAS') {
        const canvas = element as HTMLCanvasElement;
        const canvasColor = this.getCanvasColorAtImproved(canvas, x, y);
        if (canvasColor && canvasColor !== '#000000') {
          console.log('Color de canvas capturado:', canvasColor);
          return canvasColor;
        }
      }

      // 2. Prioridad media: Background colors sólidos
      const backgroundColor = computedStyle.backgroundColor;
      if (this.isValidColor(backgroundColor) && !this.isTransparent(backgroundColor)) {
        const normalizedBg = this.normalizeColor(backgroundColor);
        console.log('Color de fondo capturado:', normalizedBg);
        return normalizedBg;
      }

      // 3. Verificar gradientes y background-image
      const backgroundImage = computedStyle.backgroundImage;
      if (backgroundImage && backgroundImage !== 'none') {
        const gradientColor = this.extractGradientColorImproved(backgroundImage, x, y, element);
        if (gradientColor) {
          console.log('Color de gradiente capturado:', gradientColor);
          return gradientColor;
        }
      }

      // 4. Verificar borders (pueden ser visibles)
      const borderColors = [
        computedStyle.borderTopColor,
        computedStyle.borderRightColor,
        computedStyle.borderBottomColor,
        computedStyle.borderLeftColor,
        computedStyle.borderColor
      ];
      
      for (const borderColor of borderColors) {
        if (this.isValidColor(borderColor) && !this.isTransparent(borderColor)) {
          const normalizedBorder = this.normalizeColor(borderColor);
          console.log('Color de borde capturado:', normalizedBorder);
          return normalizedBorder;
        }
      }

      // 5. Color del texto como último recurso
      const textColor = computedStyle.color;
      if (this.isValidColor(textColor) && !this.isTransparent(textColor)) {
        const normalizedText = this.normalizeColor(textColor);
        console.log('Color de texto capturado:', normalizedText);
        return normalizedText;
      }

      // 6. Buscar en elementos padre con mejor lógica
      return this.getParentElementColorImproved(element, 0);

    } catch (error) {
      console.error('Error obteniendo color del elemento:', error);
      return this.getSmartFallbackColor(element);
    }
  }

  // Método mejorado para captura de colores de imágenes
  private getImageColorAtImproved(img: HTMLImageElement, x: number, y: number): string {
    try {
      if (!this.canvas || !this.ctx) return '#000000';
      
      const rect = img.getBoundingClientRect();
      
      // Calcular coordenadas relativas con mayor precisión
      const relativeX = Math.max(0, Math.min(
        ((x - rect.left) / rect.width) * img.naturalWidth,
        img.naturalWidth - 1
      ));
      const relativeY = Math.max(0, Math.min(
        ((y - rect.top) / rect.height) * img.naturalHeight,
        img.naturalHeight - 1
      ));
      
      console.log('Coordenadas de imagen:', { x, y, relativeX, relativeY, rect });
      
      // Configurar canvas con el tamaño correcto
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      
      // Limpiar canvas y dibujar imagen
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
      
      // Obtener datos del píxel
      const imageData = this.ctx.getImageData(Math.floor(relativeX), Math.floor(relativeY), 1, 1);
      const [r, g, b, a] = imageData.data;
      
      // Verificar si el píxel es transparente
      if (a === 0) return '#000000';
      
      const color = this.rgbToHex(`rgb(${r}, ${g}, ${b})`);
      console.log('Color extraído de imagen:', color, { r, g, b, a });
      return color;
    } catch (error) {
      console.error('Error capturando color de imagen:', error);
      return '#000000';
    }
  }

  // Método mejorado para captura de colores de canvas
  private getCanvasColorAtImproved(canvas: HTMLCanvasElement, x: number, y: number): string {
    try {
      const rect = canvas.getBoundingClientRect();
      
      // Calcular coordenadas relativas con mayor precisión
      const relativeX = Math.max(0, Math.min(
        ((x - rect.left) / rect.width) * canvas.width,
        canvas.width - 1
      ));
      const relativeY = Math.max(0, Math.min(
        ((y - rect.top) / rect.height) * canvas.height,
        canvas.height - 1
      ));
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#000000';
      
      const imageData = ctx.getImageData(Math.floor(relativeX), Math.floor(relativeY), 1, 1);
      const [r, g, b, a] = imageData.data;
      
      // Verificar si el píxel es transparente
      if (a === 0) return '#000000';
      
      return this.rgbToHex(`rgb(${r}, ${g}, ${b})`);
    } catch (error) {
      console.error('Error capturando color de canvas:', error);
      return '#000000';
    }
  }

  // Método mejorado para extracción de colores de gradientes
  private extractGradientColorImproved(backgroundImage: string, x: number, y: number, element: Element): string | null {
    try {
      // Detectar gradientes lineales simples
      const linearGradientMatch = backgroundImage.match(/linear-gradient\(([^)]+)\)/);
      if (linearGradientMatch) {
        const gradientContent = linearGradientMatch[1];
        
        // Extraer colores del gradiente
        const colorMatches = gradientContent.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/gi);
        if (colorMatches && colorMatches.length > 0) {
          // Por simplicidad, devolver el primer color válido
          for (const color of colorMatches) {
            if (this.isValidColor(color) && !this.isTransparent(color)) {
              return this.normalizeColor(color);
            }
          }
        }
      }
      
      // Detectar gradientes radiales
      const radialGradientMatch = backgroundImage.match(/radial-gradient\(([^)]+)\)/);
      if (radialGradientMatch) {
        const gradientContent = radialGradientMatch[1];
        const colorMatches = gradientContent.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/gi);
        if (colorMatches && colorMatches.length > 0) {
          for (const color of colorMatches) {
            if (this.isValidColor(color) && !this.isTransparent(color)) {
              return this.normalizeColor(color);
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extrayendo color de gradiente:', error);
      return null;
    }
  }

  // Método mejorado para buscar colores en elementos padre
  private getParentElementColorImproved(element: Element, depth: number): string {
    if (depth > 5 || !element.parentElement) {
      return this.getSmartFallbackColor(element);
    }

    try {
      const parent = element.parentElement;
      const computedStyle = window.getComputedStyle(parent);
      
      // Verificar background color del padre
      const backgroundColor = computedStyle.backgroundColor;
      if (this.isValidColor(backgroundColor) && !this.isTransparent(backgroundColor)) {
        return this.normalizeColor(backgroundColor);
      }
      
      // Continuar buscando en el siguiente padre
      return this.getParentElementColorImproved(parent, depth + 1);
    } catch (error) {
      return this.getSmartFallbackColor(element);
    }
  }

  private getElementColor(element: Element | null, x: number, y: number): string {
    if (!element) return this.getSmartFallbackColor(document.body);

    try {
      const computedStyle = window.getComputedStyle(element);
      
      // 1. Verificar si es una imagen
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        if (img.complete && img.naturalWidth > 0) {
          const imageColor = this.getImageColorAt(img, x, y);
          if (imageColor !== '#000000') return imageColor;
        }
      }

      // 2. Verificar si es un canvas
      if (element.tagName === 'CANVAS') {
        const canvas = element as HTMLCanvasElement;
        const canvasColor = this.getCanvasColorAt(canvas, x, y);
        if (canvasColor !== '#000000') return canvasColor;
      }

      // 3. Verificar elementos SVG
      if (element.tagName === 'svg' || element.closest('svg')) {
        const svgColor = this.getSVGColor(element, computedStyle);
        if (svgColor) return svgColor;
      }

      // 4. Verificar background-image (gradientes, imágenes)
      const backgroundImage = computedStyle.backgroundImage;
      if (backgroundImage && backgroundImage !== 'none') {
        const gradientColor = this.extractGradientColor(backgroundImage, x, y, element);
        if (gradientColor) return gradientColor;
      }

      // 5. Verificar colores de fondo con mejor prioridad
      const backgroundColor = computedStyle.backgroundColor;
      if (this.isValidColor(backgroundColor) && !this.isTransparent(backgroundColor)) {
        return this.normalizeColor(backgroundColor);
      }

      // 6. Verificar border colors con mejor detección
      const borderColors = [
        computedStyle.borderTopColor,
        computedStyle.borderRightColor,
        computedStyle.borderBottomColor,
        computedStyle.borderLeftColor,
        computedStyle.borderColor
      ];
      
      for (const borderColor of borderColors) {
        if (this.isValidColor(borderColor) && !this.isTransparent(borderColor)) {
          return this.normalizeColor(borderColor);
        }
      }

      // 7. Verificar box-shadow con mejor parsing
      const boxShadow = computedStyle.boxShadow;
      if (boxShadow && boxShadow !== 'none') {
        const shadowColor = this.extractShadowColor(boxShadow);
        if (shadowColor) return shadowColor;
      }

      // 8. Verificar outline
      const outlineColor = computedStyle.outlineColor;
      if (this.isValidColor(outlineColor) && !this.isTransparent(outlineColor)) {
        return this.normalizeColor(outlineColor);
      }

      // 9. Verificar color del texto como último recurso
      const textColor = computedStyle.color;
      if (this.isValidColor(textColor) && !this.isTransparent(textColor)) {
        return this.normalizeColor(textColor);
      }

      // 10. Buscar en elementos padre con límite de profundidad
      return this.getParentElementColor(element, 0);

    } catch (error) {
      console.error('Error obteniendo color del elemento:', error);
      return this.getSmartFallbackColor(element);
    }
  }

  private isTransparent(color: string): boolean {
    if (!color) return true;
    
    const normalized = color.toLowerCase().trim();
    
    // Verificar transparencia explícita
    if (normalized === 'transparent' || normalized === 'rgba(0, 0, 0, 0)') {
      return true;
    }
    
    // Verificar alpha en rgba/hsla
    const rgbaMatch = normalized.match(/rgba?\(([^)]+)\)/);
    if (rgbaMatch) {
      const values = rgbaMatch[1].split(',').map(v => parseFloat(v.trim()));
      if (values.length === 4 && values[3] === 0) {
        return true;
      }
    }
    
    const hslaMatch = normalized.match(/hsla?\(([^)]+)\)/);
    if (hslaMatch) {
      const values = hslaMatch[1].split(',').map(v => parseFloat(v.trim()));
      if (values.length === 4 && values[3] === 0) {
        return true;
      }
    }
    
    return false;
  }

  private isValidColor(color: string): boolean {
    if (!color || color === 'transparent' || color === 'inherit' || color === 'initial' || color === 'unset') {
      return false;
    }
    return true;
  }

  private getImageColorAt(img: HTMLImageElement, x: number, y: number): string {
    try {
      if (!this.canvas || !this.ctx) return '#000000';
      
      const rect = img.getBoundingClientRect();
      const relativeX = ((x - rect.left) / rect.width) * img.naturalWidth;
      const relativeY = ((y - rect.top) / rect.height) * img.naturalHeight;
      
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      this.ctx.drawImage(img, 0, 0);
      
      const imageData = this.ctx.getImageData(relativeX, relativeY, 1, 1);
      const [r, g, b] = imageData.data;
      
      return this.rgbToHex(`rgb(${r}, ${g}, ${b})`);
    } catch (error) {
      return '#000000';
    }
  }

  private getCanvasColorAt(canvas: HTMLCanvasElement, x: number, y: number): string {
    try {
      const rect = canvas.getBoundingClientRect();
      const relativeX = ((x - rect.left) / rect.width) * canvas.width;
      const relativeY = ((y - rect.top) / rect.height) * canvas.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#000000';
      
      const imageData = ctx.getImageData(relativeX, relativeY, 1, 1);
      const [r, g, b] = imageData.data;
      
      return this.rgbToHex(`rgb(${r}, ${g}, ${b})`);
    } catch (error) {
      return '#000000';
    }
  }

  private getSVGColor(element: Element, computedStyle: CSSStyleDeclaration): string | null {
    // Verificar fill
    const fill = computedStyle.fill || element.getAttribute('fill');
    if (fill && fill !== 'none' && this.isValidColor(fill)) {
      return this.normalizeColor(fill);
    }
    
    // Verificar stroke
    const stroke = computedStyle.stroke || element.getAttribute('stroke');
    if (stroke && stroke !== 'none' && this.isValidColor(stroke)) {
      return this.normalizeColor(stroke);
    }
    
    return null;
  }

  private extractGradientColor(backgroundImage: string, x: number, y: number, element: Element): string | null {
    try {
      // Mejorar detección de gradientes lineales y radiales
      const linearMatch = backgroundImage.match(/linear-gradient\([^)]+\)/);
      const radialMatch = backgroundImage.match(/radial-gradient\([^)]+\)/);
      
      const gradient = linearMatch?.[0] || radialMatch?.[0];
      if (!gradient) return null;
      
      // Extraer todos los colores del gradiente
      const colorMatches = gradient.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)/gi);
      if (colorMatches && colorMatches.length > 0) {
        // Filtrar colores válidos y no transparentes
        const validColors = colorMatches
          .filter(color => this.isValidColor(color) && !this.isTransparent(color))
          .map(color => this.normalizeColor(color));
        
        if (validColors.length > 0) {
          // Para gradientes lineales, intentar calcular el color en la posición
          if (linearMatch && validColors.length > 1) {
            const rect = element.getBoundingClientRect();
            const relativeX = (x - rect.left) / rect.width;
            const colorIndex = Math.floor(relativeX * (validColors.length - 1));
            return validColors[Math.min(colorIndex, validColors.length - 1)];
          }
          
          // Retornar el primer color válido
          return validColors[0];
        }
      }
    } catch (error) {
      console.warn('Error extrayendo color de gradiente:', error);
    }
    return null;
  }

  private extractShadowColor(shadow: string): string | null {
    try {
      // Mejorar parsing de box-shadow múltiples
      const shadows = shadow.split(',');
      
      for (const singleShadow of shadows) {
        const colorMatch = singleShadow.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|[a-z]+)/i);
        if (colorMatch && this.isValidColor(colorMatch[0]) && !this.isTransparent(colorMatch[0])) {
          return this.normalizeColor(colorMatch[0]);
        }
      }
    } catch (error) {
      console.warn('Error extrayendo color de sombra:', error);
    }
    return null;
  }

  private getParentElementColor(element: Element, depth: number): string {
    if (depth > 5 || !element.parentElement) {
      return this.getSmartFallbackColor(element);
    }
    
    const parent = element.parentElement;
    const computedStyle = window.getComputedStyle(parent);
    
    const backgroundColor = computedStyle.backgroundColor;
    if (this.isValidColor(backgroundColor) && !this.isTransparent(backgroundColor)) {
      return this.normalizeColor(backgroundColor);
    }
    
    return this.getParentElementColor(parent, depth + 1);
  }

  private getSmartFallbackColor(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    
    // Colores por defecto según el tipo de elemento
    switch (tagName) {
      case 'body':
      case 'html':
        return '#ffffff';
      case 'button':
      case 'input':
        return '#f0f0f0';
      case 'a':
        return '#0066cc';
      case 'code':
      case 'pre':
        return '#f5f5f5';
      default:
        return '#ffffff';
    }
  }

  private normalizeColor(color: string): string {
    if (!color) return '#000000';
    
    const trimmed = color.trim().toLowerCase();
    
    // Si ya es hex, devolverlo
    if (trimmed.startsWith('#')) {
      return trimmed.length === 4 ? 
        `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}` : 
        trimmed;
    }
    
    // Convertir RGB/RGBA
    if (trimmed.startsWith('rgb')) {
      return this.rgbToHex(trimmed) || '#000000';
    }
    
    // Convertir HSL/HSLA
    if (trimmed.startsWith('hsl')) {
      return this.hslToHex(trimmed) || '#000000';
    }
    
    // Colores nombrados básicos
    const namedColors: Record<string, string> = {
      'black': '#000000',
      'white': '#ffffff',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'gray': '#808080',
      'grey': '#808080'
    };
    
    return namedColors[trimmed] || '#000000';
  }

  private hslToHex(hsl: string): string | null {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return null;
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private updateZoomView(x: number, y: number): void {
    if (!this.zoomCanvas || !this.zoomCtx || !this.options.enableZoomView) return;

    try {
      // Limpiar el canvas
      this.zoomCtx.clearRect(0, 0, 60, 60);

      // Crear una cuadrícula de zoom
      const gridSize = 15;
      const cellSize = 60 / gridSize;
      const halfGrid = Math.floor(gridSize / 2);
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const sampleX = x - halfGrid + i;
          const sampleY = y - halfGrid + j;
          
          // Verificar límites de la ventana
          if (sampleX >= 0 && sampleX < window.innerWidth && 
              sampleY >= 0 && sampleY < window.innerHeight) {
            
            const element = document.elementFromPoint(sampleX, sampleY);
            const color = this.getElementColor(element, sampleX, sampleY);
            
            this.zoomCtx.fillStyle = color;
            this.zoomCtx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          } else {
            // Fuera de límites - usar color de borde
            this.zoomCtx.fillStyle = '#e0e0e0';
            this.zoomCtx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }

      // Agregar cuadrícula
      this.drawZoomGrid(gridSize, cellSize);
      
      // Destacar píxel central
      this.highlightCenterPixel(halfGrid, cellSize);

    } catch (error) {
      console.error('Error actualizando zoom view:', error);
      this.drawFallbackZoom();
    }
  }

  private drawZoomGrid(gridSize: number, cellSize: number): void {
    if (!this.zoomCtx) return;

    // Líneas de cuadrícula sutiles
    this.zoomCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.zoomCtx.lineWidth = 0.5;
    
    for (let i = 0; i <= gridSize; i++) {
      // Líneas verticales
      this.zoomCtx.beginPath();
      this.zoomCtx.moveTo(i * cellSize, 0);
      this.zoomCtx.lineTo(i * cellSize, 60);
      this.zoomCtx.stroke();
      
      // Líneas horizontales
      this.zoomCtx.beginPath();
      this.zoomCtx.moveTo(0, i * cellSize);
      this.zoomCtx.lineTo(60, i * cellSize);
      this.zoomCtx.stroke();
    }
  }

  private highlightCenterPixel(halfGrid: number, cellSize: number): void {
    if (!this.zoomCtx) return;

    const centerX = halfGrid * cellSize;
    const centerY = halfGrid * cellSize;
    
    // Borde del píxel central
    this.zoomCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.zoomCtx.lineWidth = 2;
    this.zoomCtx.strokeRect(centerX, centerY, cellSize, cellSize);
    
    // Borde interior negro para contraste
    this.zoomCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    this.zoomCtx.lineWidth = 1;
    this.zoomCtx.strokeRect(centerX + 1, centerY + 1, cellSize - 2, cellSize - 2);
    
    // Punto central pequeño
    const dotSize = Math.max(1, cellSize / 4);
    const dotX = centerX + cellSize/2 - dotSize/2;
    const dotY = centerY + cellSize/2 - dotSize/2;
    
    this.zoomCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.zoomCtx.fillRect(dotX, dotY, dotSize, dotSize);
  }

  private drawFallbackZoom(): void {
    if (!this.zoomCtx) return;
    
    // Dibujar un patrón de fallback
    this.zoomCtx.fillStyle = '#333333';
    this.zoomCtx.fillRect(0, 0, 60, 60);
    
    this.zoomCtx.fillStyle = '#666666';
    for (let i = 0; i < 60; i += 10) {
      for (let j = 0; j < 60; j += 10) {
        if ((i + j) % 20 === 0) {
          this.zoomCtx.fillRect(i, j, 10, 10);
        }
      }
    }
  }

  private updateColorPreview(): void {
    if (!this.colorPreview) return;

    // Actualizar solo la muestra de color y el valor
    const colorSwatch = this.colorPreview.querySelector('.color-swatch') as HTMLElement;
    const colorValue = this.colorPreview.querySelector('.color-value') as HTMLElement;

    if (colorSwatch) {
      colorSwatch.style.background = this.currentColor;
    }

    if (colorValue) {
      const upperColor = this.currentColor.toUpperCase();
      if (colorValue.textContent !== upperColor) {
        colorValue.textContent = upperColor;
      }
    }
  }

  private positionColorPreview(x: number, y: number): void {
    if (!this.colorPreview) {
      console.log('ColorDropper: No hay preview para posicionar');
      return;
    }

    console.log('ColorDropper: Posicionando preview en', x, y);

    // Offset más pequeño para seguir muy cerca del cursor
    const offset = 25; // Aumentado un poco para evitar que tape el cursor
    
    let finalX = x + offset;
    let finalY = y + offset;

    // Obtener dimensiones del preview
    const previewRect = this.colorPreview.getBoundingClientRect();
    const previewWidth = previewRect.width || 120;
    const previewHeight = previewRect.height || 40;

    // Ajustar si se sale de la pantalla
    if (finalX + previewWidth > window.innerWidth - 10) {
      finalX = x - previewWidth - offset;
    }
    
    if (finalY + previewHeight > window.innerHeight - 10) {
      finalY = y - previewHeight - offset;
    }

    // Asegurar que no se vaya fuera de los límites mínimos
    finalX = Math.max(5, finalX);
    finalY = Math.max(5, finalY);

    // Aplicar la posición directamente
    this.colorPreview.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
    
    // Mostrar preview si está oculto
    if (this.colorPreview.style.opacity === '0' || this.colorPreview.style.display === 'none') {
      console.log('ColorDropper: Mostrando preview');
      this.colorPreview.style.display = 'flex';
      this.colorPreview.style.opacity = '1';
    }
  }

  private showColorCapturedNotification(color: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 100000;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 16px; height: 16px; background: ${color}; border-radius: 3px; border: 1px solid rgba(255,255,255,0.3);"></div>
        <span>Color capturado: <strong>${color}</strong></span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100px)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Métodos de utilidad para conversión de colores
  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'Invalid';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r}, ${g}, ${b}`;
  }

  private hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'Invalid';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  }

  // Métodos públicos
  public isActivated(): boolean {
    return this.isActive;
  }

  public getCurrentColor(): string {
    return this.currentColor;
  }

  public setZoomViewEnabled(enabled: boolean): void {
    this.options.enableZoomView = enabled;
    
    // Recrear preview si es necesario
    if (this.colorPreview) {
      document.body.removeChild(this.colorPreview);
      this.createColorPreview();
    }
  }

  public destroy(): void {
    this.deactivate();
    
    // Limpiar timeouts y animation frames
    if (this.hoverThrottleTimeout) {
      clearTimeout(this.hoverThrottleTimeout);
      this.hoverThrottleTimeout = null;
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Limpiar cache
    this.colorCache.clear();
    
    // Remover elementos del DOM
    if (this.colorPreview) {
      this.colorPreview.remove();
      this.colorPreview = null;
    }
    
    if (this.customCursor) {
      this.customCursor.remove();
      this.customCursor = null;
    }
    
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    
    if (this.zoomCanvas) {
      this.zoomCanvas.remove();
      this.zoomCanvas = null;
    }
    
    this.ctx = null;
    this.zoomCtx = null;
  }
}