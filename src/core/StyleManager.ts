
import { EventEmitter } from '../utils/EventEmitter';
import { parseSpacingValue, spacingValueToString, generateCSS, applyStylesToElement } from '../utils/cssUtils';
import type { 
  StyleValues, 
  SpacingValues, 
  TypographyValues, 
  BackgroundValues, 
  FiltersValues, 
  ShadowsValues, 
  PositioningValues, 
  BorderValues, 
  DisplayValues, 
  EditableValues,
  StyloEditorEvents,
  SpacingValue
} from '../types';

export class StyleManager extends EventEmitter<StyloEditorEvents> {
  private currentElement: HTMLElement | null = null;
  private styles: StyleValues;

  constructor() {
    super();
    this.styles = this.getDefaultStyles();
  }

  /**
   * Obtener estilos por defecto
   */
  private getDefaultStyles(): StyleValues {
    return {
      spacing: {
        marginTop: { value: 0, unit: 'px' },
        marginRight: { value: 0, unit: 'px' },
        marginBottom: { value: 0, unit: 'px' },
        marginLeft: { value: 0, unit: 'px' },
        paddingTop: { value: 0, unit: 'px' },
        paddingRight: { value: 0, unit: 'px' },
        paddingBottom: { value: 0, unit: 'px' },
        paddingLeft: { value: 0, unit: 'px' }
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontWeight: '400',
        fontSize: { value: 16, unit: 'px' },
        color: '#000000',
        lineHeight: '1.5',
        textAlign: 'left',
        textDecoration: {
          underline: false,
          overline: false,
          lineThrough: false
        },
        fontStyle: 'normal',
        useBackgroundAsText: false
      },
      background: [],
      filters: {
        blur: 0,
        contrast: 1,
        brightness: 1,
        saturate: 1,
        invert: 0,
        grayscale: 0,
        sepia: 0
      },
      shadows: {
        layers: []
      },
      positioning: {
        position: 'static',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto'
      },
      border: {
        color: '#c0d0d7',
        width: 1,
        unit: 'px',
        style: 'solid'
      },
      display: {
        display: 'block',
        opacity: 100
      },
      editable: {
        width: { value: 'auto', unit: 'px' },
        height: { value: 'auto', unit: 'px' },
        borderRadius: { value: '0', unit: 'px' },
        rotate: { value: '0', unit: 'deg' }
      }
    };
  }

  /**
   * Establecer el elemento actual y leer sus estilos
   */
  public setCurrentElement(element: HTMLElement): void {
    this.currentElement = element;
    this.readElementStyles(element);
  }

  /**
   * Leer estilos computados del elemento
   */
  private readElementStyles(element: HTMLElement): void {
    const computedStyles = window.getComputedStyle(element);
    
    // Leer spacing
    this.styles.spacing = {
      marginTop: parseSpacingValue(computedStyles.marginTop),
      marginRight: parseSpacingValue(computedStyles.marginRight),
      marginBottom: parseSpacingValue(computedStyles.marginBottom),
      marginLeft: parseSpacingValue(computedStyles.marginLeft),
      paddingTop: parseSpacingValue(computedStyles.paddingTop),
      paddingRight: parseSpacingValue(computedStyles.paddingRight),
      paddingBottom: parseSpacingValue(computedStyles.paddingBottom),
      paddingLeft: parseSpacingValue(computedStyles.paddingLeft)
    };

    // Leer tipografía
    const fontSizeParsed = parseSpacingValue(computedStyles.fontSize);
    this.styles.typography = {
      fontFamily: computedStyles.fontFamily,
      fontWeight: computedStyles.fontWeight,
      fontSize: fontSizeParsed,
      color: computedStyles.color,
      lineHeight: computedStyles.lineHeight,
      textAlign: computedStyles.textAlign,
      textDecoration: {
        underline: computedStyles.textDecoration.includes('underline'),
        overline: computedStyles.textDecoration.includes('overline'),
        lineThrough: computedStyles.textDecoration.includes('line-through')
      },
      fontStyle: computedStyles.fontStyle,
      useBackgroundAsText: computedStyles.backgroundClip === 'text'
    };

    // Leer background
    this.readBackgroundStyles(computedStyles);

    // Leer filtros (valores por defecto ya que no se pueden leer directamente)
    this.styles.filters = {
      blur: 0,
      contrast: 1,
      brightness: 1,
      saturate: 1,
      invert: 0,
      grayscale: 0,
      sepia: 0
    };

    // Leer sombras de texto
    this.readTextShadowStyles(computedStyles);

    // Leer posicionamiento
    this.styles.positioning = {
      position: computedStyles.position as any,
      top: computedStyles.top,
      right: computedStyles.right,
      bottom: computedStyles.bottom,
      left: computedStyles.left
    };

    // Leer border
    this.readBorderStyles(computedStyles);

    // Leer display
    this.styles.display = {
      display: computedStyles.display,
      opacity: Math.round(parseFloat(computedStyles.opacity) * 100)
    };

    // Leer valores editables
    this.styles.editable = {
      width: this.parseEditableValue(computedStyles.width),
      height: this.parseEditableValue(computedStyles.height),
      borderRadius: this.parseEditableValue(computedStyles.borderRadius),
      rotate: { value: '0', unit: 'deg' } // No se puede leer directamente
    };
  }

  /**
   * Leer estilos de background
   */
  private readBackgroundStyles(computedStyles: CSSStyleDeclaration): void {
    const layers: BackgroundValues = [];
    const bgImage = computedStyles.backgroundImage;
    const bgColor = computedStyles.backgroundColor;

    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(["']?(.*?)["']?\)/);
      const url = match ? match[1] : '';
      layers.push({
        id: 'img-0',
        type: 'image',
        enabled: true,
        imageUrl: url,
        repeat: computedStyles.backgroundRepeat as any,
        size: computedStyles.backgroundSize as any,
        position: computedStyles.backgroundPosition
      });
    }

    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      layers.push({
        id: 'color-0',
        type: 'color',
        enabled: true,
        color: bgColor
      });
    }

    this.styles.background = layers;
  }

  /**
   * Leer estilos de text-shadow
   */
  private readTextShadowStyles(computedStyles: CSSStyleDeclaration): void {
    const textShadow = computedStyles.textShadow;
    if (textShadow && textShadow !== 'none') {
      // Parsear text-shadow (simplificado)
      const shadowMatch = textShadow.match(/(-?\d+px)\s+(-?\d+px)\s+(-?\d+px)\s+(.*)/);
      if (shadowMatch) {
        this.styles.shadows = {
          layers: [{
            offsetX: parseInt(shadowMatch[1]),
            offsetY: parseInt(shadowMatch[2]),
            blur: parseInt(shadowMatch[3]),
            color: shadowMatch[4]
          }]
        };
      }
    } else {
      this.styles.shadows = { layers: [] };
    }
  }

  /**
   * Leer estilos de border
   */
  private readBorderStyles(computedStyles: CSSStyleDeclaration): void {
    const borderWidth = parseSpacingValue(computedStyles.borderWidth);
    this.styles.border = {
      color: computedStyles.borderColor,
      width: borderWidth.value,
      unit: borderWidth.unit,
      style: computedStyles.borderStyle as any
    };
  }

  /**
   * Parsear valor editable
   */
  private parseEditableValue(value: string): { value: string; unit: string } {
    const match = value.match(/^(\d*\.?\d+)(.*)$/);
    return match ? { 
      value: match[1], 
      unit: match[2] || 'px' 
    } : { value: value, unit: 'px' };
  }

  /**
   * Actualizar spacing
   */
  public updateSpacing(property: keyof SpacingValues, value: SpacingValue): void {
    this.styles.spacing[property] = value;
    this.applySpacingToElement();
    this.emit('style:change', 'spacing', this.styles.spacing);
  }

  /**
   * Aplicar spacing al elemento actual
   */
  private applySpacingToElement(): void {
    if (!this.currentElement) return;
    
    const spacing = this.styles.spacing;
    this.currentElement.style.setProperty('margin-top', spacingValueToString(spacing.marginTop), 'important');
    this.currentElement.style.setProperty('margin-right', spacingValueToString(spacing.marginRight), 'important');
    this.currentElement.style.setProperty('margin-bottom', spacingValueToString(spacing.marginBottom), 'important');
    this.currentElement.style.setProperty('margin-left', spacingValueToString(spacing.marginLeft), 'important');
    this.currentElement.style.setProperty('padding-top', spacingValueToString(spacing.paddingTop), 'important');
    this.currentElement.style.setProperty('padding-right', spacingValueToString(spacing.paddingRight), 'important');
    this.currentElement.style.setProperty('padding-bottom', spacingValueToString(spacing.paddingBottom), 'important');
    this.currentElement.style.setProperty('padding-left', spacingValueToString(spacing.paddingLeft), 'important');
  }

  /**
   * Actualizar tipografía
   */
  public updateTypography(property: keyof TypographyValues, value: any): void {
    (this.styles.typography as any)[property] = value;
    this.applyTypographyToElement();
    this.emit('style:change', 'typography', this.styles.typography);
  }

  /**
   * Aplicar tipografía al elemento actual
   */
  private applyTypographyToElement(): void {
    if (!this.currentElement) return;
    
    const typography = this.styles.typography;
    this.currentElement.style.setProperty('font-family', typography.fontFamily, 'important');
    this.currentElement.style.setProperty('font-size', spacingValueToString(typography.fontSize), 'important');
    this.currentElement.style.setProperty('font-weight', typography.fontWeight, 'important');
    this.currentElement.style.setProperty('color', typography.color, 'important');
    this.currentElement.style.setProperty('line-height', typography.lineHeight, 'important');
    this.currentElement.style.setProperty('text-align', typography.textAlign, 'important');
    this.currentElement.style.setProperty('font-style', typography.fontStyle, 'important');
    
    // Text decoration
    const decorations: string[] = [];
    if (typography.textDecoration.underline) decorations.push('underline');
    if (typography.textDecoration.overline) decorations.push('overline');
    if (typography.textDecoration.lineThrough) decorations.push('line-through');
    this.currentElement.style.setProperty('text-decoration', decorations.length > 0 ? decorations.join(' ') : 'none', 'important');
  }

  /**
   * Actualizar filtros
   */
  public updateFilters(property: keyof FiltersValues, value: number): void {
    this.styles.filters[property] = value;
    this.applyFiltersToElement();
    this.emit('style:change', 'filters', this.styles.filters);
  }

  /**
   * Aplicar filtros al elemento actual
   */
  private applyFiltersToElement(): void {
    if (!this.currentElement) return;
    
    const filters = this.styles.filters;
    const filterParts: string[] = [];
    filterParts.push(`blur(${filters.blur}px)`);
    filterParts.push(`contrast(${filters.contrast})`);
    filterParts.push(`brightness(${filters.brightness})`);
    filterParts.push(`saturate(${filters.saturate})`);
    filterParts.push(`invert(${filters.invert}%)`);
    filterParts.push(`grayscale(${filters.grayscale}%)`);
    filterParts.push(`sepia(${filters.sepia}%)`);
    
    const filterValue = filterParts.join(' ');
    this.currentElement.style.setProperty('filter', filterValue, 'important');
  }

  /**
   * Actualizar sombras
   */
  public updateShadows(shadows: ShadowsValues): void {
    this.styles.shadows = shadows;
    this.applyShadowsToElement();
    this.emit('style:change', 'shadows', this.styles.shadows);
  }

  /**
   * Aplicar sombras al elemento actual
   */
  private applyShadowsToElement(): void {
    if (!this.currentElement) return;
    
    const css = this.styles.shadows.layers
      .map(shadow => `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`)
      .join(', ');
    this.currentElement.style.setProperty('text-shadow', css || 'none', 'important');
  }

  /**
   * Actualizar posicionamiento
   */
  public updatePositioning(property: keyof PositioningValues, value: string): void {
    this.styles.positioning[property] = value;
    this.applyPositioningToElement();
    this.emit('style:change', 'positioning', this.styles.positioning);
  }

  /**
   * Aplicar posicionamiento al elemento actual
   */
  private applyPositioningToElement(): void {
    if (!this.currentElement) return;
    
    const positioning = this.styles.positioning;
    this.currentElement.style.setProperty('position', positioning.position, 'important');
    
    if (positioning.position !== 'static') {
      if (positioning.top !== 'auto') this.currentElement.style.setProperty('top', positioning.top, 'important');
      if (positioning.right !== 'auto') this.currentElement.style.setProperty('right', positioning.right, 'important');
      if (positioning.bottom !== 'auto') this.currentElement.style.setProperty('bottom', positioning.bottom, 'important');
      if (positioning.left !== 'auto') this.currentElement.style.setProperty('left', positioning.left, 'important');
    }
  }

  /**
   * Actualizar border
   */
  public updateBorder(property: keyof BorderValues, value: any): void {
    (this.styles.border as any)[property] = value;
    this.applyBorderToElement();
    this.emit('style:change', 'border', this.styles.border);
  }

  /**
   * Aplicar border al elemento actual
   */
  private applyBorderToElement(): void {
    if (!this.currentElement) return;
    
    const border = this.styles.border;
    const css = `${border.width}${border.unit} ${border.style} ${border.color}`;
    this.currentElement.style.setProperty('border', css, 'important');
  }

  /**
   * Actualizar display
   */
  public updateDisplay(property: keyof DisplayValues, value: any): void {
    (this.styles.display as any)[property] = value;
    this.applyDisplayToElement();
    this.emit('style:change', 'display', this.styles.display);
  }

  /**
   * Aplicar display al elemento actual
   */
  private applyDisplayToElement(): void {
    if (!this.currentElement) return;
    
    const display = this.styles.display;
    this.currentElement.style.setProperty('display', display.display, 'important');
    this.currentElement.style.setProperty('opacity', String(display.opacity / 100), 'important');
  }

  /**
   * Actualizar valores editables
   */
  public updateEditable(property: keyof EditableValues, value: { value: string; unit: string }): void {
    this.styles.editable[property] = value;
    this.applyEditableToElement();
    this.emit('style:change', 'editable', this.styles.editable);
  }

  /**
   * Aplicar valores editables al elemento actual
   */
  private applyEditableToElement(): void {
    if (!this.currentElement) return;
    
    const editable = this.styles.editable;
    
    if (editable.width.value !== 'auto') {
      this.currentElement.style.setProperty('width', `${editable.width.value}${editable.width.unit}`, 'important');
    }
    if (editable.height.value !== 'auto') {
      this.currentElement.style.setProperty('height', `${editable.height.value}${editable.height.unit}`, 'important');
    }
    if (editable.borderRadius.value !== '0') {
      this.currentElement.style.setProperty('border-radius', `${editable.borderRadius.value}${editable.borderRadius.unit}`, 'important');
    }
    if (editable.rotate.value !== '0') {
      this.currentElement.style.setProperty('transform', `rotate(${editable.rotate.value}${editable.rotate.unit})`, 'important');
    }
  }

  /**
   * Obtener todos los estilos actuales
   */
  public getStyles(): StyleValues {
    return { ...this.styles };
  }

  /**
   * Obtener estilos de una categoría específica
   */
  public getStyleCategory<K extends keyof StyleValues>(category: K): StyleValues[K] {
    return this.styles[category];
  }

  /**
   * Generar CSS completo
   */
  public generateCSS(selector: string = '.selected-element'): string {
    return generateCSS(this.styles, selector);
  }

  /**
   * Resetear estilos a valores por defecto
   */
  public resetStyles(): void {
    this.styles = this.getDefaultStyles();
    if (this.currentElement) {
      this.applyAllStylesToElement();
    }
  }

  /**
   * Aplicar todos los estilos al elemento actual
   */
  private applyAllStylesToElement(): void {
    this.applySpacingToElement();
    this.applyTypographyToElement();
    this.applyFiltersToElement();
    this.applyShadowsToElement();
    this.applyPositioningToElement();
    this.applyBorderToElement();
    this.applyDisplayToElement();
    this.applyEditableToElement();
  }

  /**
   * Destruir el StyleManager
   */
  public destroy(): void {
    this.currentElement = null;
    super.destroy();
  }
}
