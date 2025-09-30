export type EventHandler<T = any> = (data: T) => void;

export class EventEmitter<TEvents extends Record<string, any> = Record<string, any>> {
  private events: Map<keyof TEvents, Set<EventHandler>> = new Map();

  /**
   * Suscribirse a un evento
   */
  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const onceHandler = (data: TEvents[K]) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * Desuscribirse de un evento
   */
  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emitir un evento
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * Remover todos los listeners de un evento específico
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Obtener el número de listeners para un evento
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Obtener todos los eventos que tienen listeners
   */
  eventNames(): (keyof TEvents)[] {
    return Array.from(this.events.keys());
  }

  /**
   * Destruir el EventEmitter y limpiar todos los listeners
   */
  destroy(): void {
    this.events.clear();
  }
}