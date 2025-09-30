
// Tipos para valores de spacing
export interface SpacingValue {
  value: number;
  unit: string;
}

export interface SpacingValues {
  marginTop: SpacingValue;
  marginRight: SpacingValue;
  marginBottom: SpacingValue;
  marginLeft: SpacingValue;
  paddingTop: SpacingValue;
  paddingRight: SpacingValue;
  paddingBottom: SpacingValue;
  paddingLeft: SpacingValue;
}

// Tipos para decoración de texto
export interface TextDecorationValues {
  underline: boolean;
  overline: boolean;
  lineThrough: boolean;
}

// Tipos para tipografía
export interface TypographyValues {
  fontFamily: string;
  fontWeight: string;
  fontSize: SpacingValue;
  color: string;
  lineHeight: string;
  textAlign: string;
  textDecoration: TextDecorationValues;
  fontStyle: string;
  useBackgroundAsText: boolean;
}

// Tipos para capas de fondo
export interface BackgroundLayer {
  id: string;
  type: 'color' | 'image' | 'gradient';
  enabled: boolean;
  color?: string;
  imageUrl?: string;
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  size?: 'auto' | 'cover' | 'contain' | 'custom';
  position?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    stops: Array<{ color: string; position: number }>;
  };
}

export type BackgroundValues = BackgroundLayer[];

// Tipos para filtros
export interface FiltersValues {
  blur: number;
  contrast: number;
  brightness: number;
  saturate: number;
  invert: number;
  grayscale: number;
  sepia: number;
}

// Tipos para sombras
export interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface ShadowsValues {
  layers: Shadow[];
}

// Tipos para posicionamiento
export interface PositioningValues {
  position: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// Tipos para bordes
export interface BorderValues {
  color: string;
  width: number;
  unit: string;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
}

// Tipos para display
export interface DisplayValues {
  display: string;
  opacity: number;
}

// Tipos para valores editables
export interface EditableValues {
  width: { value: string; unit: string };
  height: { value: string; unit: string };
  borderRadius: { value: string; unit: string };
  rotate: { value: string; unit: string };
}

// Tipos combinados para estilos
export interface StyleValues {
  spacing: SpacingValues;
  typography: TypographyValues;
  background: BackgroundValues;
  filters: FiltersValues;
  shadows: ShadowsValues;
  positioning: PositioningValues;
  border: BorderValues;
  display: DisplayValues;
  editable: EditableValues;
}

// Tipos para información de elementos
export interface ElementInfo {
  tagName: string;
  id?: string;
  classes: string[];
  selector: string;
}

// Tipos para propiedades CSS
export interface CSSProperty {
  name: string;
  value: string;
  isDefault?: boolean;
}

export interface PropertySection {
  title: string;
  properties: CSSProperty[];
  expanded: boolean;
}

// Tipos para tabs y panel
export type TabType = 'design' | 'code' | 'html' | 'chat';

export interface PanelOptions {
  minimized?: boolean;
  position?: { x: number; y: number };
}

// Tipos para eventos
export interface StyloEditorEvents {
  'element:selected': HTMLElement;
  'element:hover': HTMLElement | null;
  'inspector:toggle': boolean;
  'styles:updated': StyleValues;
  'tab:changed': TabType;
  'panel:minimized': boolean;
}
