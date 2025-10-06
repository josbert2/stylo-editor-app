import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

export interface JSConsoleOptions {
  position?: { x: number; y: number };
  onClose?: () => void;
}

export class JSConsole extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private consoleElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private position: { x: number; y: number };
  private consoleBody: HTMLElement | null = null;
  private clearButton: HTMLElement | null = null;
  private originalConsole: any = null;
  private originalFetch: any = null;
  private originalXHROpen: any = null;
  private originalXHRSend: any = null;
  private resizeHandle: HTMLElement | null = null;
  private isResizing: boolean = false;
  private initialHeight: number = 180;
  private pendingLogs: Array<{level: string, msg: string, color: string}> = [];

  constructor(container: HTMLElement, options: JSConsoleOptions = {}) {
    super();
    this.container = container;
    this.position = options.position || { x: 0, y: 0 };
    
    this.createConsole();
    this.setupConsoleInterceptors();
    this.setupEventListeners();
    this.setupResizing();
    
    // Procesar logs pendientes después de que todo esté listo
    setTimeout(() => this.processPendingLogs(), 0);
  }

  private createConsole(): void {
    this.consoleElement = document.createElement('div');
    this.consoleElement.id = 'inapp-console';
    this.consoleElement.hidden = true;
    this.consoleElement.style.cssText = `
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: ${this.initialHeight}px;
      background: #0b0f14;
      color: #cfe8ff;
      font: 12px/1.4 ui-monospace, Menlo, monospace;
      border-top: 1px solid #233;
      display: flex;
      flex-direction: column;
      z-index: 99999;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
      resize: vertical;
      min-height: 120px;
      max-height: 80vh;
    `;

    this.renderConsoleContent();
    this.container.appendChild(this.consoleElement);
  }

  private renderConsoleContent(): void {
    if (!this.consoleElement) return;

    this.consoleElement.innerHTML = `
      <div id="resize-handle" style="
        height: 4px;
        background: #233;
        cursor: ns-resize;
        border-bottom: 1px solid #233;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 2px;
          background: #555;
          border-radius: 1px;
        "></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;padding:6px 8px;background:#0e1620;border-bottom:1px solid #233">
        <strong>Console (detecta todo)</strong>
        <button id="clear-btn" style="
          margin-left:auto;
          background: #1a1f2e;
          color: #cfe8ff;
          border: 1px solid #233;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        ">Limpiar</button>
        <button id="close-console-btn" style="
          background: #1a1f2e;
          color: #cfe8ff;
          border: 1px solid #233;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        ">✕</button>
      </div>
      <div id="inapp-body" style="
        overflow: auto;
        padding: 6px 8px;
        white-space: pre-wrap;
        flex: 1;
        font-family: ui-monospace, Menlo, 'Courier New', monospace;
        tab-size: 4;
        -moz-tab-size: 4;
      "></div>
    `;

    // Referencias a elementos
    this.consoleBody = this.consoleElement.querySelector('#inapp-body') as HTMLElement;
    this.clearButton = this.consoleElement.querySelector('#clear-btn') as HTMLElement;
    this.resizeHandle = this.consoleElement.querySelector('#resize-handle') as HTMLElement;
    
    // Eventos de botones
    this.clearButton?.addEventListener('click', () => {
      if (this.consoleBody) {
        this.consoleBody.innerHTML = '';
      }
    });

    const closeButton = this.consoleElement.querySelector('#close-console-btn') as HTMLElement;
    closeButton?.addEventListener('click', () => {
      this.hide();
    });

    // Estilos hover para botones
    const buttons = this.consoleElement.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#2a2f3e';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = '#1a1f2e';
      });
    });
  }

  private setupResizing(): void {
    if (!this.resizeHandle || !this.consoleElement) return;

    let startY: number;
    let startHeight: number;

    const handleMouseDown = (e: MouseEvent) => {
      this.isResizing = true;
      startY = e.clientY;
      startHeight = parseInt(window.getComputedStyle(this.consoleElement!).height, 10);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevenir selección de texto durante el resize
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isResizing || !this.consoleElement) return;
      
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(120, Math.min(window.innerHeight * 0.8, startHeight + deltaY));
      
      this.consoleElement.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };

    this.resizeHandle.addEventListener('mousedown', handleMouseDown);
  }

  private setupConsoleInterceptors(): void {
    // Función para agregar líneas de log (mejorada para manejar tabs)
    const addLogLine = (level: string, msg: string, color: string = '#cfe8ff') => {
      if (!this.consoleBody) {
        // Si consoleBody no está listo, guardar en pendientes
        this.pendingLogs.push({level, msg, color});
        return;
      }
      
      const el = document.createElement('div');
      el.style.cssText = `
        color: ${color};
        margin-bottom: 2px;
        font-size: 12px;
        line-height: 1.4;
        border-left: 3px solid ${color};
        padding-left: 8px;
        white-space: pre-wrap;
        tab-size: 4;
        -moz-tab-size: 4;
        font-family: ui-monospace, Menlo, 'Courier New', monospace;
      `;
      
      // Formatear mensaje con tabs preservados
      const timestamp = new Date().toLocaleTimeString();
      const formattedMsg = msg.replace(/\t/g, '    '); // Convertir tabs a espacios para mejor visualización
      el.textContent = `[${timestamp}] ${level} — ${formattedMsg}`;
      
      this.consoleBody.appendChild(el);
      this.consoleBody.scrollTop = this.consoleBody.scrollHeight;
      
      // Auto-mostrar cuando pase algo
      this.show();
    };

    // Guardar referencias originales INMEDIATAMENTE
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
      trace: console.trace.bind(console),
      table: console.table.bind(console),
      group: console.group.bind(console),
      groupEnd: console.groupEnd.bind(console),
      time: console.time.bind(console),
      timeEnd: console.timeEnd.bind(console),
      count: console.count.bind(console),
      clear: console.clear.bind(console)
    };

    // Función helper para formatear argumentos
    const formatArgs = (args: any[]): string => {
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    };

    // Interceptar TODOS los métodos de console INMEDIATAMENTE
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      addLogLine('LOG', formatArgs(args), '#87ceeb');
    };

    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      addLogLine('WARN', formatArgs(args), '#ffd666');
    };

    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      addLogLine('ERROR', formatArgs(args), '#ff9aa2');
    };

    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      addLogLine('INFO', formatArgs(args), '#98fb98');
    };

    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      addLogLine('DEBUG', formatArgs(args), '#dda0dd');
    };

    console.trace = (...args: any[]) => {
      this.originalConsole.trace(...args);
      addLogLine('TRACE', formatArgs(args), '#f0e68c');
    };

    console.table = (data: any, columns?: string[]) => {
      this.originalConsole.table(data, columns);
      addLogLine('TABLE', `Table data: ${formatArgs([data])}`, '#deb887');
    };

    console.group = (...args: any[]) => {
      this.originalConsole.group(...args);
      addLogLine('GROUP', `▼ ${formatArgs(args)}`, '#ffa07a');
    };

    console.groupEnd = () => {
      this.originalConsole.groupEnd();
      addLogLine('GROUP', '▲ Group End', '#ffa07a');
    };

    console.time = (label?: string) => {
      this.originalConsole.time(label);
      addLogLine('TIME', `Timer started: ${label || 'default'}`, '#20b2aa');
    };

    console.timeEnd = (label?: string) => {
      this.originalConsole.timeEnd(label);
      addLogLine('TIME', `Timer ended: ${label || 'default'}`, '#20b2aa');
    };

    console.count = (label?: string) => {
      this.originalConsole.count(label);
      addLogLine('COUNT', `Count: ${label || 'default'}`, '#ff6347');
    };

    console.clear = () => {
      this.originalConsole.clear();
      if (this.consoleBody) {
        this.consoleBody.innerHTML = '';
      }
      addLogLine('CLEAR', 'Console cleared', '#778899');
    };

    // Interceptar fetch
    this.originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      addLogLine('NETWORK', `Fetch request: ${url}`, '#40e0d0');
      
      try {
        const response = await this.originalFetch(...args);
        const status = response.status;
        const color = status >= 200 && status < 300 ? '#90ee90' : '#ff6b6b';
        addLogLine('NETWORK', `Fetch response: ${url} (${status})`, color);
        return response;
      } catch (error) {
        addLogLine('ERROR', `Fetch failed: ${url} - ${error}`, '#ff4444');
        throw error;
      }
    };

    // Interceptar XMLHttpRequest
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._url = url;
      (this as any)._method = method;
      return this.originalXHROpen.call(this, method, url, ...args);
    };
    
    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const url = (this as any)._url;
      const method = (this as any)._method;
      addLogLine('NETWORK', `XHR ${method}: ${url}`, '#40e0d0');
      
      this.addEventListener('load', () => {
        const status = this.status;
        const color = status >= 200 && status < 300 ? '#90ee90' : '#ff6b6b';
        addLogLine('NETWORK', `XHR response: ${url} (${status})`, color);
      });
      
      this.addEventListener('error', () => {
        addLogLine('ERROR', `XHR failed: ${url}`, '#ff4444');
      });
      
      return this.originalXHRSend.call(this, ...args);
    };
  }

  private processPendingLogs(): void {
    if (this.pendingLogs.length > 0 && this.consoleBody) {
      this.pendingLogs.forEach(log => {
        this.addLine(log.level, log.msg, log.color);
      });
      this.pendingLogs = [];
    }
  }

  private setupEventListeners(): void {
    // 1) Errores JS "reales" (runtime errors) - Mejorado para capturar más tipos
    window.addEventListener('error', (ev) => {
      const isResource = ev.target && ev.target !== window && ((ev.target as any).src || (ev.target as any).href);
      if (isResource) {
        const url = (ev.target as any).src || (ev.target as any).href || '(desconocido)';
        this.addLine('ERROR', `Fallo de recurso: ${url}`, '#ff4444');
      } else {
        // Error de JavaScript
        const where = ev.filename ? `${ev.filename}:${ev.lineno}:${ev.colno}` : 'unknown location';
        const stack = ev.error && ev.error.stack ? `\n${ev.error.stack}` : '';
        const errorName = ev.error && ev.error.name ? `${ev.error.name}: ` : '';
        this.addLine('ERROR', `${errorName}${ev.message} @ ${where}${stack}`, '#ff4444');
      }
    }, true);

    // 2) Promesas no manejadas
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = ev.reason instanceof Error ? (ev.reason.stack || ev.reason.message) : JSON.stringify(ev.reason);
      this.addLine('ERROR', `UnhandledRejection: ${reason}`, '#ff4444');
    });

    // 3) Interceptar errores de evaluación de código
    const originalEval = window.eval;
    window.eval = (code: string) => {
      try {
        return originalEval.call(window, code);
      } catch (error) {
        this.addLine('ERROR', `Eval Error: ${error}`, '#ff4444');
        throw error;
      }
    };

    // 4) Interceptar Function constructor para errores dinámicos
    const originalFunction = window.Function;
    window.Function = function(...args: any[]) {
      try {
        return originalFunction.apply(this, args);
      } catch (error) {
        // No mostrar en consola aquí para evitar duplicados
        throw error;
      }
    } as any;

    // 5) Deprecations / Interventions
    if ('ReportingObserver' in window) {
      const ro = new ReportingObserver((reports) => {
        for (const r of reports) {
          this.addLine('WARN', `ReportingObserver: ${r.type} — ${(r.body as any)?.message || ''}`, '#ffaa44');
        }
      }, { types: ['deprecation', 'intervention'], buffered: true });
      ro.observe();
    }

    // 6) Métricas de recursos fallidos vía PerformanceObserver
    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const perfEntry = entry as any;
            if (perfEntry.initiatorType && perfEntry.duration === 0 && perfEntry.responseStatus === 0) {
              this.addLine('WARN', `Posible fallo de carga: ${perfEntry.name} (${perfEntry.initiatorType})`, '#ffaa44');
            }
          }
        });
        po.observe({ type: 'resource', buffered: true });
      } catch (e) {
        // Silenciar errores de PerformanceObserver
      }
    }

    // 7) Interceptar setTimeout y setInterval para errores en callbacks
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;

    window.setTimeout = function(callback: any, delay?: number, ...args: any[]) {
      const wrappedCallback = typeof callback === 'function' ? function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          // Los errores en setTimeout ya son capturados por el event listener 'error'
          // pero asegurémonos de que se propaguen
          throw error;
        }
      } : callback;
      
      return originalSetTimeout.call(window, wrappedCallback, delay, ...args);
    };

    window.setInterval = function(callback: any, delay?: number, ...args: any[]) {
      const wrappedCallback = typeof callback === 'function' ? function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          throw error;
        }
      } : callback;
      
      return originalSetInterval.call(window, wrappedCallback, delay, ...args);
    };

    // 8) Atajo de teclado para abrir/cerrar con "~" o "`"
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle();
      }
    });

    // 9) Interceptar addEventListener para errores en event handlers
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any) {
      if (typeof listener === 'function') {
        const wrappedListener = function(event: Event) {
          try {
            return listener.call(this, event);
          } catch (error) {
            // Los errores en event listeners ya son capturados por el event listener 'error'
            throw error;
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  private addLine(level: string, msg: string, color: string = '#cfe8ff'): void {
    if (!this.consoleBody) {
      this.pendingLogs.push({level, msg, color});
      return;
    }
    
    const el = document.createElement('div');
    el.style.cssText = `
      color: ${color};
      margin-bottom: 2px;
      font-size: 12px;
      line-height: 1.4;
      border-left: 3px solid ${color};
      padding-left: 8px;
      white-space: pre-wrap;
      tab-size: 4;
      -moz-tab-size: 4;
      font-family: ui-monospace, Menlo, 'Courier New', monospace;
    `;
    
    const timestamp = new Date().toLocaleTimeString();
    const formattedMsg = msg.replace(/\t/g, '    ');
    el.textContent = `[${timestamp}] ${level} — ${formattedMsg}`;
    
    this.consoleBody.appendChild(el);
    this.consoleBody.scrollTop = this.consoleBody.scrollHeight;
    
    // Auto-mostrar cuando pase algo
    if (this.consoleElement && this.consoleElement.hidden) {
      this.show();
    }
  }

  public show(): void {
    if (this.consoleElement) {
      this.consoleElement.hidden = false;
      this.isVisible = true;
      this.emit('js-console:shown');
    }
  }

  public hide(): void {
    if (this.consoleElement) {
      this.consoleElement.hidden = true;
      this.isVisible = false;
      this.emit('js-console:hidden');
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public clear(): void {
    if (this.consoleBody) {
      this.consoleBody.innerHTML = '';
    }
  }

  public destroy(): void {
    // Restaurar funciones originales
    if (this.originalConsole) {
      Object.assign(console, this.originalConsole);
    }
    
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }

    // Remover elemento del DOM
    if (this.consoleElement && this.consoleElement.parentNode) {
      this.consoleElement.parentNode.removeChild(this.consoleElement);
    }

    // Limpiar referencias
    this.consoleElement = null;
    this.consoleBody = null;
    this.clearButton = null;
    this.resizeHandle = null;
    this.pendingLogs = [];
  }
}