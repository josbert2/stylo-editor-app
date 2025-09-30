import { div } from "./utils/dom-libs";
import { StyloEditor as StyloEditorCore } from "./core/StyloEditor";
import type { StyloEditorOptions } from "./core/StyloEditor";

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

  /**
   * Initialize StyloEditor with options
   * @param options Configuration options for the editor
   * @returns StyloEditor instance
   */
  static init(options: StyloEditorOptions = {}): StyloEditorCore {
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
   * @returns Current instance or null if not initialized
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

// Legacy exports for backward compatibility
export type HelloOptions = { name?: string };

export function hello(opts: HelloOptions = {}) {
  const name = opts.name ?? "World";
  const boxing = div();
  boxing.innerHTML = `Hello, ${name}!`;
  document.body.appendChild(boxing);
  return boxing;
}

// (opcional) helper que podría usar Popper si quisieras extender
export function noop() {}

// Export the core class as well for advanced usage
export { StyloEditorCore };