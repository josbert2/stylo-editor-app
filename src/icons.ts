type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

const VARIANT_COLORS: Record<Variant, string> = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#eab308',
  danger: '#dc2626',
  muted: '#6b7280',
};

// Catálogo ampliado de SVGs como plantilla (usa currentColor)
const ICON_TEMPLATES = {
  expand: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-maximize ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
  <path d="M4 16v2a2 2 0 0 0 2 2h2" />
  <path d="M16 4h2a2 2 0 0 1 2 2v2" />
  <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
</svg>`.trim(),

 expand2: (size:number, strokeWidth: number, className = '') => `

    <svg  xmlns="http://www.w3.org/2000/svg"  width="${size}"  height="${size}"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="${strokeWidth}"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-maximize ${className}"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /><path d="M16 20l4 0l0 -4" /><path d="M14 14l6 6" /><path d="M8 4l-4 0l0 4" /><path d="M4 4l6 6" /></svg>
  `,

  collapse: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-minimize ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M5 9l4 0l0 -4" />
  <path d="M3 3l6 6" />
  <path d="M5 15l4 0l0 4" />
  <path d="M3 21l6 -6" />
  <path d="M19 9l-4 0l0 -4" />
  <path d="M15 9l6 -6" />
  <path d="M19 15l-4 0l0 4" />
  <path d="M15 15l6 6" />
</svg>`.trim(),

  check: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-check ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M5 12l5 5l10 -10" />
</svg>`.trim(),

  x: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-x ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M18 6l-12 12" />
  <path d="M6 6l12 12" />
</svg>`.trim(),

  plus: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-plus ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M12 5l0 14" />
  <path d="M5 12l14 0" />
</svg>`.trim(),

  minus: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-minus ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M5 12l14 0" />
</svg>`.trim(),

  chevronDown: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-chevron-down ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M6 9l6 6l6 -6" />
</svg>`.trim(),

  chevronUp: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-chevron-up ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M6 15l6 -6l6 6" />
</svg>`.trim(),

  chevronLeft: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-chevron-left ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M15 6l-6 6l6 6" />
</svg>`.trim(),

  chevronRight: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-chevron-right ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M9 6l6 6l-6 6" />
</svg>`.trim(),

  search: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-search ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
  <path d="M21 21l-6 -6" />
</svg>`.trim(),

  settings: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-settings ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
</svg>`.trim(),

  user: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-user ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
  <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
</svg>`.trim(),

  home: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-home ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
  <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
</svg>`.trim(),

  mail: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-mail ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
  <path d="M3 7l9 6l9 -6" />
</svg>`.trim(),

  heart: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-heart ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
</svg>`.trim(),

  star: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-star ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
</svg>`.trim(),

  info: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-info-circle ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
  <path d="M12 9h.01" />
  <path d="M11 12h1v4h1" />
</svg>`.trim(),

  alert: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-alert-triangle ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M12 9v4" />
  <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
  <path d="M12 16h.01" />
</svg>`.trim(),

  bell: (size: number, strokeWidth: number, className = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"
  class="icon icon-tabler icon-tabler-bell ${className}">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
  <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
</svg>`.trim(),
} as const;

type IconName = keyof typeof ICON_TEMPLATES;

type IconOptions = {
  variant?: Variant;
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  wrapWithColor?: boolean;
};

export function AssetIcon(name: IconName, opts: IconOptions = {}) {
  const {
    variant,
    color,
    size = 24,
    strokeWidth = 2,
    className = '',
    wrapWithColor = false,
  } = opts;

  const resolvedColor = color ?? (variant ? VARIANT_COLORS[variant] : 'currentColor');

  // Genera el SVG base con currentColor
  const svg = ICON_TEMPLATES[name](size, strokeWidth, className);

  if (wrapWithColor) {
    return `<span style="color:${resolvedColor}">${svg}</span>`;
  }

  return svg
    .replace(/stroke="currentColor"/g, `stroke="${resolvedColor}"`)
    .replace(/fill="currentColor"/g, `fill="${resolvedColor}"`);
}