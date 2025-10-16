/**
 * Tailwind JIT (Just-In-Time) CSS Generator
 * Genera dinámicamente reglas CSS para clases de Tailwind que no existen
 */

import { tailwindColors } from './tailwindColorsData';

interface CSSRule {
  selector: string;
  properties: Record<string, string>;
}

/**
 * Espaciado de Tailwind (en rem)
 */
const spacing: Record<string, string> = {
  '0': '0px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
};

/**
 * Extraer valor arbitrario de una clase (ej: px-[50px] -> 50px)
 */
function extractArbitraryValue(className: string): string | null {
  const match = className.match(/\[([^\]]+)\]/);
  return match ? match[1] : null;
}

/**
 * Escapar nombre de clase para selector CSS
 * px-[50px] -> px-\\[50px\\]
 */
function escapeClassName(className: string): string {
  return className.replace(/[\[\]]/g, '\\$&');
}

/**
 * Generar regla CSS para clases de color de fondo
 */
function generateBackgroundColor(className: string): CSSRule | null {
  // bg-[#ff0000] o bg-[rgb(255,0,0)]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    return {
      selector: `.${escapeClassName(className)}`,
      properties: { 'background-color': arbitraryValue }
    };
  }

  // bg-slate-500
  const match = className.match(/^bg-([a-z]+)-(\d+)$/);
  if (match) {
    const [, color, shade] = match;
    const colorValue = tailwindColors[color]?.[shade];
    if (colorValue) {
      return {
        selector: `.${className}`,
        properties: { 'background-color': colorValue }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para clases de color de texto
 */
function generateTextColor(className: string): CSSRule | null {
  // text-[#ff0000]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    return {
      selector: `.${escapeClassName(className)}`,
      properties: { 'color': arbitraryValue }
    };
  }

  // text-slate-500
  const match = className.match(/^text-([a-z]+)-(\d+)$/);
  if (match) {
    const [, color, shade] = match;
    const colorValue = tailwindColors[color]?.[shade];
    if (colorValue) {
      return {
        selector: `.${className}`,
        properties: { 'color': colorValue }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para padding
 */
function generatePadding(className: string): CSSRule | null {
  // px-[50px], py-[2rem], p-[1em]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    
    if (className.startsWith('px-')) {
      return {
        selector: `.${escapedClass}`,
        properties: {
          'padding-left': arbitraryValue,
          'padding-right': arbitraryValue
        }
      };
    }
    if (className.startsWith('py-')) {
      return {
        selector: `.${escapedClass}`,
        properties: {
          'padding-top': arbitraryValue,
          'padding-bottom': arbitraryValue
        }
      };
    }
    if (className.startsWith('pt-')) {
      return { selector: `.${escapedClass}`, properties: { 'padding-top': arbitraryValue } };
    }
    if (className.startsWith('pr-')) {
      return { selector: `.${escapedClass}`, properties: { 'padding-right': arbitraryValue } };
    }
    if (className.startsWith('pb-')) {
      return { selector: `.${escapedClass}`, properties: { 'padding-bottom': arbitraryValue } };
    }
    if (className.startsWith('pl-')) {
      return { selector: `.${escapedClass}`, properties: { 'padding-left': arbitraryValue } };
    }
    if (className.startsWith('p-')) {
      return { selector: `.${escapedClass}`, properties: { 'padding': arbitraryValue } };
    }
  }

  // p-4, px-6, py-8, etc.
  const match = className.match(/^p([xytrbl])?-(\d+(?:\.\d+)?)$/);
  if (match) {
    const [, direction, value] = match;
    const spacingValue = spacing[value];
    if (spacingValue) {
      const properties: Record<string, string> = {};
      
      if (!direction || direction === 'x') {
        if (direction === 'x') {
          properties['padding-left'] = spacingValue;
          properties['padding-right'] = spacingValue;
        } else {
          properties['padding'] = spacingValue;
        }
      } else if (direction === 'y') {
        properties['padding-top'] = spacingValue;
        properties['padding-bottom'] = spacingValue;
      } else if (direction === 't') {
        properties['padding-top'] = spacingValue;
      } else if (direction === 'r') {
        properties['padding-right'] = spacingValue;
      } else if (direction === 'b') {
        properties['padding-bottom'] = spacingValue;
      } else if (direction === 'l') {
        properties['padding-left'] = spacingValue;
      }
      
      return { selector: `.${className}`, properties };
    }
  }

  return null;
}

/**
 * Generar regla CSS para margin
 */
function generateMargin(className: string): CSSRule | null {
  // mx-[50px], my-[2rem], m-[1em]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    
    if (className.startsWith('mx-')) {
      return {
        selector: `.${escapedClass}`,
        properties: {
          'margin-left': arbitraryValue,
          'margin-right': arbitraryValue
        }
      };
    }
    if (className.startsWith('my-')) {
      return {
        selector: `.${escapedClass}`,
        properties: {
          'margin-top': arbitraryValue,
          'margin-bottom': arbitraryValue
        }
      };
    }
    if (className.startsWith('mt-')) {
      return { selector: `.${escapedClass}`, properties: { 'margin-top': arbitraryValue } };
    }
    if (className.startsWith('mr-')) {
      return { selector: `.${escapedClass}`, properties: { 'margin-right': arbitraryValue } };
    }
    if (className.startsWith('mb-')) {
      return { selector: `.${escapedClass}`, properties: { 'margin-bottom': arbitraryValue } };
    }
    if (className.startsWith('ml-')) {
      return { selector: `.${escapedClass}`, properties: { 'margin-left': arbitraryValue } };
    }
    if (className.startsWith('m-')) {
      return { selector: `.${escapedClass}`, properties: { 'margin': arbitraryValue } };
    }
  }

  // m-4, mx-6, my-8, m-auto, etc.
  const match = className.match(/^m([xytrbl])?-(\d+(?:\.\d+)?|auto)$/);
  if (match) {
    const [, direction, value] = match;
    const spacingValue = value === 'auto' ? 'auto' : spacing[value];
    if (spacingValue) {
      const properties: Record<string, string> = {};
      
      if (!direction || direction === 'x') {
        if (direction === 'x') {
          properties['margin-left'] = spacingValue;
          properties['margin-right'] = spacingValue;
        } else {
          properties['margin'] = spacingValue;
        }
      } else if (direction === 'y') {
        properties['margin-top'] = spacingValue;
        properties['margin-bottom'] = spacingValue;
      } else if (direction === 't') {
        properties['margin-top'] = spacingValue;
      } else if (direction === 'r') {
        properties['margin-right'] = spacingValue;
      } else if (direction === 'b') {
        properties['margin-bottom'] = spacingValue;
      } else if (direction === 'l') {
        properties['margin-left'] = spacingValue;
      }
      
      return { selector: `.${className}`, properties };
    }
  }

  return null;
}

/**
 * Generar regla CSS para width y height
 */
function generateSizing(className: string): CSSRule | null {
  // w-[50px], h-[100vh]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    const property = className.startsWith('w-') ? 'width' : 'height';
    return {
      selector: `.${escapedClass}`,
      properties: { [property]: arbitraryValue }
    };
  }

  // w-4, h-full, w-screen
  const match = className.match(/^([wh])-(full|screen|auto|min|max|fit|\d+(?:\.\d+)?)$/);
  if (match) {
    const [, type, value] = match;
    const property = type === 'w' ? 'width' : 'height';
    let cssValue: string | undefined;

    if (value === 'full') cssValue = '100%';
    else if (value === 'screen') cssValue = type === 'w' ? '100vw' : '100vh';
    else if (value === 'auto') cssValue = 'auto';
    else if (value === 'min') cssValue = 'min-content';
    else if (value === 'max') cssValue = 'max-content';
    else if (value === 'fit') cssValue = 'fit-content';
    else cssValue = spacing[value];

    if (cssValue) {
      return {
        selector: `.${className}`,
        properties: { [property]: cssValue }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para border
 */
function generateBorder(className: string): CSSRule | null {
  // border-[#ff0000]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    
    if (className.startsWith('border-[')) {
      return {
        selector: `.${escapedClass}`,
        properties: { 'border-color': arbitraryValue }
      };
    }
  }

  // border-slate-500
  const match = className.match(/^border-([a-z]+)-(\d+)$/);
  if (match) {
    const [, color, shade] = match;
    const colorValue = tailwindColors[color]?.[shade];
    if (colorValue) {
      return {
        selector: `.${className}`,
        properties: { 'border-color': colorValue }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para rounded
 */
function generateBorderRadius(className: string): CSSRule | null {
  // rounded-[25px]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    return {
      selector: `.${escapedClass}`,
      properties: { 'border-radius': arbitraryValue }
    };
  }

  return null;
}

/**
 * Generar regla CSS para font-size
 */
function generateFontSize(className: string): CSSRule | null {
  // text-[16px], text-[1.5rem]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    return {
      selector: `.${escapedClass}`,
      properties: { 'font-size': arbitraryValue }
    };
  }

  // text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.
  const fontSizes: Record<string, string> = {
    'xs': '0.75rem',      // 12px
    'sm': '0.875rem',     // 14px
    'base': '1rem',       // 16px
    'lg': '1.125rem',     // 18px
    'xl': '1.25rem',      // 20px
    '2xl': '1.5rem',      // 24px
    '3xl': '1.875rem',    // 30px
    '4xl': '2.25rem',     // 36px
    '5xl': '3rem',        // 48px
    '6xl': '3.75rem',     // 60px
    '7xl': '4.5rem',      // 72px
    '8xl': '6rem',        // 96px
    '9xl': '8rem'         // 128px
  };

  const match = className.match(/^text-([a-z0-9]+)$/);
  if (match) {
    const [, size] = match;
    const fontSize = fontSizes[size];
    if (fontSize) {
      return {
        selector: `.${className}`,
        properties: { 'font-size': fontSize }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para font-weight
 */
function generateFontWeight(className: string): CSSRule | null {
  // font-[500], font-[700]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    return {
      selector: `.${escapedClass}`,
      properties: { 'font-weight': arbitraryValue }
    };
  }

  // font-thin, font-light, font-normal, etc.
  const fontWeights: Record<string, string> = {
    'thin': '100',
    'extralight': '200',
    'light': '300',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'extrabold': '800',
    'black': '900'
  };

  const match = className.match(/^font-([a-z]+)$/);
  if (match) {
    const [, weight] = match;
    const fontWeight = fontWeights[weight];
    if (fontWeight) {
      return {
        selector: `.${className}`,
        properties: { 'font-weight': fontWeight }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para opacity
 */
function generateOpacity(className: string): CSSRule | null {
  // opacity-[0.5], opacity-[50%]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    return {
      selector: `.${escapedClass}`,
      properties: { 'opacity': arbitraryValue }
    };
  }

  // opacity-0, opacity-5, opacity-10, ..., opacity-100
  const match = className.match(/^opacity-(\d+)$/);
  if (match) {
    const [, value] = match;
    const opacity = parseInt(value) / 100;
    if (opacity >= 0 && opacity <= 1) {
      return {
        selector: `.${className}`,
        properties: { 'opacity': opacity.toString() }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para box-shadow
 */
function generateBoxShadow(className: string): CSSRule | null {
  // shadow-[0_4px_6px_rgba(0,0,0,0.1)]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    // Reemplazar guiones bajos con espacios para shadows
    const shadowValue = arbitraryValue.replace(/_/g, ' ');
    return {
      selector: `.${escapedClass}`,
      properties: { 'box-shadow': shadowValue }
    };
  }

  // shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl, shadow-none
  const shadows: Record<string, string> = {
    '2xs': '0 1px rgb(0 0 0 / 0.05)',
    'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'none': '0 0 #0000'
  };

  const match = className.match(/^shadow-([a-z0-9]+)$/);
  if (match) {
    const [, size] = match;
    const shadow = shadows[size];
    if (shadow) {
      return {
        selector: `.${className}`,
        properties: { 'box-shadow': shadow }
      };
    }
  }

  return null;
}

/**
 * Generar regla CSS para z-index
 */
function generateZIndex(className: string): CSSRule | null {
  // z-[100], z-[999]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    return {
      selector: `.${escapedClass}`,
      properties: { 'z-index': arbitraryValue }
    };
  }

  // z-0, z-10, z-20, z-30, z-40, z-50, z-auto
  if (className === 'z-auto') {
    return {
      selector: `.${className}`,
      properties: { 'z-index': 'auto' }
    };
  }

  const match = className.match(/^z-(\d+)$/);
  if (match) {
    const [, value] = match;
    return {
      selector: `.${className}`,
      properties: { 'z-index': value }
    };
  }

  return null;
}

/**
 * Generar regla CSS para gap (flexbox/grid)
 */
function generateGap(className: string): CSSRule | null {
  // gap-[50px], gap-x-[2rem], gap-y-[1em]
  const arbitraryValue = extractArbitraryValue(className);
  if (arbitraryValue) {
    const escapedClass = escapeClassName(className);
    
    if (className.startsWith('gap-x-')) {
      return {
        selector: `.${escapedClass}`,
        properties: { 'column-gap': arbitraryValue }
      };
    }
    if (className.startsWith('gap-y-')) {
      return {
        selector: `.${escapedClass}`,
        properties: { 'row-gap': arbitraryValue }
      };
    }
    if (className.startsWith('gap-')) {
      return {
        selector: `.${escapedClass}`,
        properties: { 'gap': arbitraryValue }
      };
    }
  }

  // gap-4, gap-x-6, gap-y-8
  const match = className.match(/^gap-([xy])?(\d+(?:\.\d+)?)$/);
  if (match) {
    const [, direction, value] = match;
    const gapValue = spacing[value];
    if (gapValue) {
      if (direction === 'x') {
        return {
          selector: `.${className}`,
          properties: { 'column-gap': gapValue }
        };
      } else if (direction === 'y') {
        return {
          selector: `.${className}`,
          properties: { 'row-gap': gapValue }
        };
      } else {
        return {
          selector: `.${className}`,
          properties: { 'gap': gapValue }
        };
      }
    }
  }

  return null;
}

/**
 * Generar CSS para una clase de Tailwind
 */
export function generateTailwindCSS(className: string): string | null {
  let rule: CSSRule | null = null;

  // Intentar generar regla según el tipo de clase
  if (className.startsWith('bg-')) {
    rule = generateBackgroundColor(className);
  } else if (className.startsWith('text-')) {
    // Intentar color primero, luego font-size
    rule = generateTextColor(className) || generateFontSize(className);
  } else if (className.startsWith('font-')) {
    rule = generateFontWeight(className);
  } else if (className.startsWith('opacity-')) {
    rule = generateOpacity(className);
  } else if (className.startsWith('shadow-')) {
    rule = generateBoxShadow(className);
  } else if (className.startsWith('z-')) {
    rule = generateZIndex(className);
  } else if (className.startsWith('gap-')) {
    rule = generateGap(className);
  } else if (className.startsWith('p')) {
    rule = generatePadding(className);
  } else if (className.startsWith('m')) {
    rule = generateMargin(className);
  } else if (className.startsWith('w-') || className.startsWith('h-')) {
    rule = generateSizing(className);
  } else if (className.startsWith('border-')) {
    rule = generateBorder(className);
  } else if (className.startsWith('rounded')) {
    rule = generateBorderRadius(className);
  }

  if (!rule) return null;

  // Convertir regla a CSS
  const properties = Object.entries(rule.properties)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');

  return `${rule.selector} {\n${properties}\n}`;
}

/**
 * Cache de clases CSS inyectadas
 */
const injectedClasses = new Set<string>();

/**
 * Style element para inyectar CSS dinámico
 */
let styleElement: HTMLStyleElement | null = null;

/**
 * Obtener o crear el elemento style para CSS dinámico
 */
function getStyleElement(): HTMLStyleElement {
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'stylo-tailwind-jit';
    styleElement.setAttribute('data-source', 'stylo-editor-jit');
    document.head.appendChild(styleElement);
  }
  return styleElement;
}

/**
 * Inyectar una clase CSS en el DOM si no existe
 */
export function injectTailwindClass(className: string): boolean {
  // Si ya fue inyectada, no hacer nada
  if (injectedClasses.has(className)) {
    return true;
  }

  // Generar CSS para la clase
  const css = generateTailwindCSS(className);
  if (!css) {
    // No se pudo generar CSS para esta clase (probablemente no es una clase que podamos generar)
    return false;
  }

  // Inyectar el CSS
  const style = getStyleElement();
  style.textContent += '\n' + css;
  injectedClasses.add(className);

  console.log(`[Stylo JIT] Generated CSS for: ${className}`);
  console.log(`CSS Rule:\n${css}`);
  return true;
}

/**
 * Verificar si una clase existe en las hojas de estilo del documento
 */
function classExistsInStylesheets(className: string): boolean {
  try {
    // Intentar aplicar la clase a un elemento temporal y verificar si tiene estilos
    const testElement = document.createElement('div');
    testElement.className = className;
    testElement.style.display = 'none';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const hasStyles = computedStyle.length > 0;
    
    document.body.removeChild(testElement);
    return hasStyles;
  } catch (e) {
    return false;
  }
}

/**
 * Limpiar todas las clases CSS inyectadas
 */
export function clearInjectedClasses(): void {
  if (styleElement) {
    styleElement.textContent = '';
  }
  injectedClasses.clear();
}
