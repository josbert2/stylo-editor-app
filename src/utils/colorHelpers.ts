/**
 * Color Helpers - Utilidades para conversión entre espacios de color
 * Portado de CssPro CustomPickColor
 */

export interface HSVA {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
  a: number; // 0-1
}

export interface RGBA {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

/**
 * Clamp un número entre min y max
 */
export function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Convertir HEX a RGBA
 */
export function hexToRgba(hex: string): RGBA | null {
  const m = hex.trim().replace(/^#/, '');
  if (![3, 4, 6, 8].includes(m.length)) return null;
  
  const to255 = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
  
  const r = to255(m.length <= 4 ? m[0] : m.slice(0, 2));
  const g = to255(m.length <= 4 ? m[1] : m.slice(2, 4));
  const b = to255(m.length <= 4 ? m[2] : m.slice(4, 6));
  const a = m.length === 4 
    ? to255(m[3]) / 255 
    : m.length === 8 
      ? to255(m.slice(6, 8)) / 255 
      : 1;
  
  return { r, g, b, a };
}

/**
 * Convertir RGBA a HEX
 */
export function rgbaToHexa(r: number, g: number, b: number, a = 1): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return (
    '#' + 
    toHex(r) + 
    toHex(g) + 
    toHex(b) + 
    toHex(Math.round(a * 255))
  ).toUpperCase();
}

/**
 * Convertir RGBA a HSVA
 */
export function rgbaToHsva(r: number, g: number, b: number, a = 1): HSVA {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  return { h, s, v, a };
}

/**
 * Convertir RGBA a HSVA preservando hue cuando s=0 (gris)
 */
export function rgbaToHsvaSafe(
  r: number,
  g: number,
  b: number,
  a = 1,
  prevHue?: number
): HSVA {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h: number;
  if (d === 0) {
    // Gris - preservar hue anterior
    h = typeof prevHue === 'number' ? prevHue : 0;
  } else {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }
  
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  return { h, s, v, a };
}

/**
 * Convertir HSVA a RGBA
 */
export function hsvaToRgba(h: number, s: number, v: number, a = 1): RGBA {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x;
  } else if (60 <= h && h < 120) {
    r = x; g = c;
  } else if (120 <= h && h < 180) {
    g = c; b = x;
  } else if (180 <= h && h < 240) {
    g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; b = c;
  } else {
    r = c; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
    a
  };
}

/**
 * Crear string rgba()
 */
export function rgbaString(r: number, g: number, b: number, a = 1): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
}

/**
 * Crear string hsla() desde HSVA
 */
export function hslaStringFromHsva(h: number, s: number, v: number, a: number): string {
  const l = v - (v * s) / 2;
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  
  return `hsla(${Math.round(h)}, ${Math.round(sl * 100)}%, ${Math.round(l * 100)}%, ${+a.toFixed(3)})`;
}

/**
 * Blend modes disponibles
 */
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity'
] as const;

export type BlendMode = typeof BLEND_MODES[number];
