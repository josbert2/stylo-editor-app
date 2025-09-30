import type { SpacingValue, SpacingValues, StyleValues } from '../types';

// Categorías CSS (copiadas del paquete stylo-editor)
export const CSS_CATEGORIES: { [key: string]: string[] } = {
  spacing: [
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
  ],
  typography: [
    'font-family', 'font-size', 'font-weight', 'line-height', 'color',
    'text-align', 'letter-spacing', 'text-decoration', 'text-transform',
    'text-shadow', 'font-style'
  ],
  background: [
    'background-color', 'background-image', 'background-position',
    'background-size', 'background-repeat', 'background-attachment'
  ],
  border: [
    'border-width', 'border-style', 'border-color', 'border-radius',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
  ],
  display: [
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'overflow', 'overflow-x', 'overflow-y', 'visibility', 'opacity', 'z-index'
  ],
  flexbox: [
    'flex-direction', 'justify-content', 'align-items', 'align-content',
    'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-self'
  ],
  effects: [
    'box-shadow', 'filter', 'transform', 'transition', 'animation',
    'backdrop-filter', 'clip-path'
  ]
};

/**
 * Parsea un valor CSS con unidad (ej: "10px", "1.5em", "auto")
 */
export function parseSpacingValue(value: string): SpacingValue {
  if (!value || value === 'auto' || value === 'inherit' || value === 'initial') {
    return { value: 0, unit: 'px' };
  }
  
  const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
  return match ? { 
    value: parseFloat(match[1]), 
    unit: match[2] || 'px' 
  } : { value: 0, unit: 'px' };
}

/**
 * Convierte un SpacingValue a string CSS
 */
export function spacingValueToString(spacingValue: SpacingValue): string {
  return `${spacingValue.value}${spacingValue.unit}`;
}

/**
 * Genera CSS a partir de los valores de estilo
 */
export function generateCSS(styles: StyleValues, selector: string = '.selected-element'): string {
  const cssRules: string[] = [];
  
  // Spacing
  const spacing = styles.spacing;
  cssRules.push(`margin: ${spacingValueToString(spacing.marginTop)} ${spacingValueToString(spacing.marginRight)} ${spacingValueToString(spacing.marginBottom)} ${spacingValueToString(spacing.marginLeft)};`);
  cssRules.push(`padding: ${spacingValueToString(spacing.paddingTop)} ${spacingValueToString(spacing.paddingRight)} ${spacingValueToString(spacing.paddingBottom)} ${spacingValueToString(spacing.paddingLeft)};`);
  
  // Typography
  const typography = styles.typography;
  cssRules.push(`font-family: ${typography.fontFamily};`);
  cssRules.push(`font-size: ${spacingValueToString(typography.fontSize)};`);
  cssRules.push(`font-weight: ${typography.fontWeight};`);
  cssRules.push(`color: ${typography.color};`);
  cssRules.push(`line-height: ${typography.lineHeight};`);
  cssRules.push(`text-align: ${typography.textAlign};`);
  cssRules.push(`font-style: ${typography.fontStyle};`);
  
  // Text decoration
  const decorations: string[] = [];
  if (typography.textDecoration.underline) decorations.push('underline');
  if (typography.textDecoration.overline) decorations.push('overline');
  if (typography.textDecoration.lineThrough) decorations.push('line-through');
  cssRules.push(`text-decoration: ${decorations.length > 0 ? decorations.join(' ') : 'none'};`);
  
  // Background
  if (styles.background.length > 0) {
    const backgroundLayers = styles.background.filter(layer => layer.enabled);
    if (backgroundLayers.length > 0) {
      const colors = backgroundLayers.filter(layer => layer.type === 'color').map(layer => layer.color);
      const images = backgroundLayers.filter(layer => layer.type === 'image');
      
      if (colors.length > 0) {
        cssRules.push(`background-color: ${colors[0]};`);
      }
      
      if (images.length > 0) {
        const imageUrls = images.map(img => `url("${img.imageUrl}")`).join(', ');
        cssRules.push(`background-image: ${imageUrls};`);
        cssRules.push(`background-repeat: ${images[0].repeat || 'no-repeat'};`);
        cssRules.push(`background-size: ${images[0].size || 'auto'};`);
        cssRules.push(`background-position: ${images[0].position || 'center'};`);
      }
    }
  }
  
  // Filters
  const filters = styles.filters;
  const filterParts: string[] = [];
  if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
  if (filters.contrast !== 1) filterParts.push(`contrast(${filters.contrast})`);
  if (filters.brightness !== 1) filterParts.push(`brightness(${filters.brightness})`);
  if (filters.saturate !== 1) filterParts.push(`saturate(${filters.saturate})`);
  if (filters.invert > 0) filterParts.push(`invert(${filters.invert}%)`);
  if (filters.grayscale > 0) filterParts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) filterParts.push(`sepia(${filters.sepia}%)`);
  
  if (filterParts.length > 0) {
    cssRules.push(`filter: ${filterParts.join(' ')};`);
  }
  
  // Shadows
  if (styles.shadows.layers.length > 0) {
    const shadowCSS = styles.shadows.layers
      .map(shadow => `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`)
      .join(', ');
    cssRules.push(`text-shadow: ${shadowCSS};`);
  }
  
  // Positioning
  const positioning = styles.positioning;
  cssRules.push(`position: ${positioning.position};`);
  if (positioning.position !== 'static') {
    if (positioning.top !== 'auto') cssRules.push(`top: ${positioning.top};`);
    if (positioning.right !== 'auto') cssRules.push(`right: ${positioning.right};`);
    if (positioning.bottom !== 'auto') cssRules.push(`bottom: ${positioning.bottom};`);
    if (positioning.left !== 'auto') cssRules.push(`left: ${positioning.left};`);
  }
  
  // Border
  const border = styles.border;
  cssRules.push(`border: ${border.width}${border.unit} ${border.style} ${border.color};`);
  
  // Display
  const display = styles.display;
  cssRules.push(`display: ${display.display};`);
  cssRules.push(`opacity: ${display.opacity / 100};`);
  
  // Editable values
  const editable = styles.editable;
  if (editable.width.value !== 'auto') {
    cssRules.push(`width: ${editable.width.value}${editable.width.unit};`);
  }
  if (editable.height.value !== 'auto') {
    cssRules.push(`height: ${editable.height.value}${editable.height.unit};`);
  }
  if (editable.borderRadius.value !== '0') {
    cssRules.push(`border-radius: ${editable.borderRadius.value}${editable.borderRadius.unit};`);
  }
  if (editable.rotate.value !== '0') {
    cssRules.push(`transform: rotate(${editable.rotate.value}${editable.rotate.unit});`);
  }
  
  return `${selector} {\n  ${cssRules.join('\n  ')}\n}`;
}

/**
 * Aplica estilos directamente a un elemento
 */
export function applyStylesToElement(element: HTMLElement, styles: Partial<StyleValues>): void {
  if (styles.spacing) {
    const spacing = styles.spacing;
    element.style.setProperty('margin-top', spacingValueToString(spacing.marginTop), 'important');
    element.style.setProperty('margin-right', spacingValueToString(spacing.marginRight), 'important');
    element.style.setProperty('margin-bottom', spacingValueToString(spacing.marginBottom), 'important');
    element.style.setProperty('margin-left', spacingValueToString(spacing.marginLeft), 'important');
    element.style.setProperty('padding-top', spacingValueToString(spacing.paddingTop), 'important');
    element.style.setProperty('padding-right', spacingValueToString(spacing.paddingRight), 'important');
    element.style.setProperty('padding-bottom', spacingValueToString(spacing.paddingBottom), 'important');
    element.style.setProperty('padding-left', spacingValueToString(spacing.paddingLeft), 'important');
  }
  
  if (styles.typography) {
    const typography = styles.typography;
    element.style.setProperty('font-family', typography.fontFamily, 'important');
    element.style.setProperty('font-size', spacingValueToString(typography.fontSize), 'important');
    element.style.setProperty('font-weight', typography.fontWeight, 'important');
    element.style.setProperty('color', typography.color, 'important');
    element.style.setProperty('line-height', typography.lineHeight, 'important');
    element.style.setProperty('text-align', typography.textAlign, 'important');
    element.style.setProperty('font-style', typography.fontStyle, 'important');
    
    // Text decoration
    const decorations: string[] = [];
    if (typography.textDecoration.underline) decorations.push('underline');
    if (typography.textDecoration.overline) decorations.push('overline');
    if (typography.textDecoration.lineThrough) decorations.push('line-through');
    element.style.setProperty('text-decoration', decorations.length > 0 ? decorations.join(' ') : 'none', 'important');
  }
  
  // Continuar con otros estilos según sea necesario...
}

/**
 * Obtiene información de un elemento para mostrar en el inspector
 */
export function getElementInfo(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className ? `.${element.className.split(' ').filter(c => c.trim()).join('.')}` : '';
  return `${tagName}${id}${classes}`;
}