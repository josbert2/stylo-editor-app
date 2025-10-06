import { div } from "./utils/dom-libs";
import { StyloEditor as StyloEditorCore } from "./core/StyloEditor";
import type { StyloEditorOptions } from "./core/StyloEditor";

// Importar el sistema global de seguimiento del cursor
import { initializeGlobalCursorTracking } from "./utils/cursorTracking";

// Re-export types for external use
export type { 
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
  ElementInfo,
  TabType,
  PanelOptions
} from "./types";

// Re-export StyloEditorOptions from core
export type { StyloEditorOptions } from "./core/StyloEditor";

// Main StyloEditor class with static init method
export class StyloEditor {
  private static instance: StyloEditorCore | null = null;
  private static cursorTrackingInitialized = false;

  /**
   * Initialize StyloEditor with options
   * @param options Configuration options for the editor
   * @returns StyloEditor instance
   */
  static init(options: StyloEditorOptions = {}): StyloEditorCore {
    // Inicializar el seguimiento global del cursor si no se ha hecho
    if (!StyloEditor.cursorTrackingInitialized) {
      initializeGlobalCursorTracking();
      StyloEditor.cursorTrackingInitialized = true;
    }

    // If there's already an instance, destroy it first
    if (StyloEditor.instance) {
      StyloEditor.instance.destroy();
    }

    // Create new instance
    StyloEditor.instance = new StyloEditorCore(options);
    
    // Show the editor by default
    StyloEditor.instance.show();
    
    return StyloEditor.instance;
  }

  /**
   * Get the current StyloEditor instance
   */
  static getInstance(): StyloEditorCore | null {
    return StyloEditor.instance;
  }

  /**
   * Destroy the current StyloEditor instance
   */
  static destroy(): void {
    if (StyloEditor.instance) {
      StyloEditor.instance.destroy();
      StyloEditor.instance = null;
    }
  }

  /**
   * Check if StyloEditor is currently active
   */
  static isActive(): boolean {
    return StyloEditor.instance !== null;
  }
}

// Export utility functions for manual cursor tracking
export { 
  initializeGlobalCursorTracking, 
  destroyGlobalCursorTracking,
  applyTrackingTo,
  removeTrackingFrom 
} from "./utils/cursorTracking";

export type HelloOptions = { name?: string };

export function hello(opts: HelloOptions = {}) {
  const name = opts.name ?? 'World';
  const element = div(`Hello ${name}!`);
  document.body.appendChild(element);
  return element;
}

// Export the core class as well
export { StyloEditorCore };