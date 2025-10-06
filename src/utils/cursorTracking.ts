/**
 * Utilidad global para el seguimiento del cursor en elementos .button-btn-fancy
 */

interface CursorPosition {
  x: number;
  y: number;
}

/**
 * Calcula la posición del cursor relativa al centro del elemento
 */
function getCursorPosition(element: HTMLElement, event: PointerEvent): CursorPosition {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const x = event.clientX - centerX;
  const y = centerY - event.clientY;
  return { x, y };
}

/**
 * Aplica el seguimiento del cursor a un elemento específico
 */
function applyTrackingToElement(element: HTMLElement): void {
  // Evento de seguimiento del cursor
  const handlePointerMove = (event: PointerEvent) => {
    const { x, y } = getCursorPosition(element, event);
    element.style.setProperty('--coord-x', x.toString());
    element.style.setProperty('--coord-y', y.toString());
  };

  // Evento cuando el cursor sale del elemento
  const handlePointerLeave = () => {
    element.style.setProperty('--coord-x', '0');
    element.style.setProperty('--coord-y', '0');
  };

  // Agregar event listeners
  element.addEventListener('pointermove', handlePointerMove);
  element.addEventListener('pointerleave', handlePointerLeave);

  // Almacenar referencias para poder remover los listeners después
  (element as any).__cursorTrackingHandlers = {
    handlePointerMove,
    handlePointerLeave
  };
}

/**
 * Remueve el seguimiento del cursor de un elemento específico
 */
function removeTrackingFromElement(element: HTMLElement): void {
  const handlers = (element as any).__cursorTrackingHandlers;
  if (handlers) {
    element.removeEventListener('pointermove', handlers.handlePointerMove);
    element.removeEventListener('pointerleave', handlers.handlePointerLeave);
    delete (element as any).__cursorTrackingHandlers;
  }
}

/**
 * Inicializa el seguimiento del cursor para todos los elementos .button-btn-fancy existentes
 */
function initializeExistingElements(): void {
  const elements = document.querySelectorAll('.button-btn-fancy') as NodeListOf<HTMLElement>;
  elements.forEach(element => {
    // Solo aplicar si no tiene ya el seguimiento
    if (!(element as any).__cursorTrackingHandlers) {
      applyTrackingToElement(element);
    }
  });
}

/**
 * Observer para detectar nuevos elementos .button-btn-fancy agregados al DOM
 */
let observer: MutationObserver | null = null;

function createMutationObserver(): MutationObserver {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Verificar nodos agregados
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Si el elemento mismo tiene la clase
          if (element.classList?.contains('button-btn-fancy')) {
            applyTrackingToElement(element);
          }
          
          // Buscar elementos hijos con la clase
          const childElements = element.querySelectorAll?.('.button-btn-fancy') as NodeListOf<HTMLElement>;
          childElements?.forEach(childElement => {
            if (!(childElement as any).__cursorTrackingHandlers) {
              applyTrackingToElement(childElement);
            }
          });
        }
      });

      // Verificar nodos removidos para limpiar listeners
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // Si el elemento mismo tiene la clase
          if (element.classList?.contains('button-btn-fancy')) {
            removeTrackingFromElement(element);
          }
          
          // Buscar elementos hijos con la clase
          const childElements = element.querySelectorAll?.('.button-btn-fancy') as NodeListOf<HTMLElement>;
          childElements?.forEach(childElement => {
            removeTrackingFromElement(childElement);
          });
        }
      });
    });
  });
}

/**
 * Inicializa el sistema global de seguimiento del cursor
 */
export function initializeGlobalCursorTracking(): void {
  // Inicializar elementos existentes
  initializeExistingElements();

  // Crear y configurar el observer si no existe
  if (!observer) {
    observer = createMutationObserver();
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

/**
 * Detiene el sistema global de seguimiento del cursor
 */
export function destroyGlobalCursorTracking(): void {
  // Remover tracking de todos los elementos existentes
  const elements = document.querySelectorAll('.button-btn-fancy') as NodeListOf<HTMLElement>;
  elements.forEach(element => {
    removeTrackingFromElement(element);
  });

  // Desconectar el observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Aplica manualmente el seguimiento a un elemento específico
 * Útil para elementos creados dinámicamente
 */
export function applyTrackingTo(element: HTMLElement): void {
  if (element.classList.contains('button-btn-fancy')) {
    applyTrackingToElement(element);
  }
}

/**
 * Remueve manualmente el seguimiento de un elemento específico
 */
export function removeTrackingFrom(element: HTMLElement): void {
  removeTrackingFromElement(element);
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGlobalCursorTracking);
} else {
  // El DOM ya está listo
  initializeGlobalCursorTracking();
}