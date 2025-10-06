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
  constructor(container: HTMLElement, options: JSConsoleOptions = {}) {
    super();
    this.container = container;
    this.position = options.position || { x: 0, y: 0 };
    
    this.createConsole();
    this.setupConsoleInterceptors();
    this.setupEventListeners();
    this.setupResizing();
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
    // Función mejorada para agregar logs - basada en tu código optimizado
    const addLog = (level: string, msg: string, color: string = '#cfe8ff') => {
      if (!this.consoleBody) return;
      
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
      
      // Auto-mostrar
      this.show();
    };

    // Formatear argumentos - versión optimizada de tu código
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

    // Guardar originales - usando tu estructura más limpia
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
      clear: console.clear.bind(console)
    };

    // Interceptar console methods - usando tu implementación más eficiente
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      addLog('LOG', formatArgs(args), '#87ceeb');
    };

    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      addLog('WARN', formatArgs(args), '#ffd666');
    };

    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      addLog('ERROR', formatArgs(args), '#ff6b6b');
    };

    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      addLog('INFO', formatArgs(args), '#98fb98');
    };

    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      addLog('DEBUG', formatArgs(args), '#dda0dd');
    };

    console.clear = () => {
      this.originalConsole.clear();
      if (this.consoleBody) {
        this.consoleBody.innerHTML = '';
      }
    };

    // Interceptar fetch - usando tu versión mejorada
    this.originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      addLog('NETWORK', `Fetch: ${url}`, '#40e0d0');
      
      try {
        const response = await this.originalFetch(...args);
        const isOk = response.status >= 200 && response.status < 300;
        addLog('NETWORK', `Response: ${url} (${response.status})`, isOk ? '#90ee90' : '#ff6b6b');
        return response;
      } catch (error) {
        addLog('ERROR', `Fetch failed: ${url} — ${error}`, '#ff6b6b');
        throw error;
      }
    };
  }

  private setupEventListeners(): void {
    // Usar tu implementación mejorada de detección de errores
    
    // 1) Errores JS (incluye stack, archivo, línea, col) - tu versión optimizada
    window.addEventListener('error', (event) => {
      // Errores de recurso (img/script/link) vs JS
      if (event.target && event.target !== window) {
        const element = event.target as any;
        const url = element.src || element.href || '(recurso desconocido)';
        this.addLine('ERROR', `Resource failed: ${url}`, '#ff6b6b');
      } else {
        const filename = event.filename || '(desconocido)';
        const message = event.message || 'Error';
        const location = `${filename}:${event.lineno || 0}:${event.colno || 0}`;
        const stack = event.error?.stack ? `\n${event.error.stack}` : '';
        this.addLine('ERROR', `${message}\n  at ${location}${stack}`, '#ff6b6b');
      }
    }, true); // capture=true para no perder errores de recursos

    // 2) Promesas no manejadas - tu implementación mejorada
    window.addEventListener('unhandledrejection', (event) => {
      let message = 'Unhandled Promise Rejection';
      if (event.reason instanceof Error) {
        message = `${event.reason.name}: ${event.reason.message}${event.reason.stack ? `\n${event.reason.stack}` : ''}`;
      } else {
        try {
          message = JSON.stringify(event.reason);
        } catch {
          message = String(event.reason);
        }
      }
      this.addLine('ERROR', message, '#ff6b6b');
    });

    // Atajo de teclado para toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Mensaje inicial de confirmación
    setTimeout(() => {
      this.addLine('INFO', 'Console initialized and ready to capture errors. Press F12 to compare with browser console.', '#98fb98');
    }, 100);
  }

  private addLine(level: string, msg: string, color: string = '#cfe8ff'): void {
    if (!this.consoleBody) return;
    
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
    
    // Auto-mostrar
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

  // Método para capturar errores dentro de iframes del mismo origen
  public attachToFrame(frame: HTMLIFrameElement): void {
    const w = frame.contentWindow;
    if (!w) return;

    const onErr = (event: ErrorEvent) => {
      if (event.target && event.target !== w) {
        // Error de recurso (imagen, script, etc.)
        const element: any = event.target;
        const url = element.src || element.href || 'recurso';
        this.addLine('ERROR', `[IFRAME] Resource failed: ${url}`, '#ff4444');
      } else {
        // Error de JavaScript
        const file = event.filename || 'unknown';
        const line = event.lineno || 0;
        const col = event.colno || 0;
        const msg = event.message || 'Error';
        const stack = (event as any).error?.stack || '';
        this.addLine('ERROR', `[IFRAME] ${msg}\n  at ${file}:${line}:${col}${stack ? '\n' + stack : ''}`, '#ff4444');
      }
    };

    const onRej = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      if (reason instanceof Error) {
        message = `${reason.name}: ${reason.message}${reason.stack ? '\n' + reason.stack : ''}`;
      } else {
        try {
          message = JSON.stringify(reason);
        } catch {
          message = String(reason);
        }
      }
      this.addLine('ERROR', `[IFRAME] ${message}`, '#ff4444');
    };

    w.addEventListener('error', onErr, true);
    w.addEventListener('unhandledrejection', onRej);
    
    this.addLine('INFO', `Attached error listeners to iframe: ${frame.src || 'about:blank'}`, '#98fb98');
  }

  // Método para capturar errores en Web Workers
  public attachToWorker(worker: Worker): void {
    const log = (level: string, msg: string) => this.addLine(level, `[WORKER] ${msg}`, '#ff4444');
    
    worker.addEventListener('error', (event) => {
      log('ERROR', `Worker error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
    });
    
    worker.addEventListener('messageerror', (event) => {
      log('ERROR', `Worker messageerror: ${String((event as any).data)}`);
    });
    
    // Opcional: proxy postMessage para loggear comunicación
    const originalPostMessage = worker.postMessage.bind(worker);
    worker.postMessage = (...args: any[]) => {
      this.addLine('WORKER', 'postMessage enviado', '#40e0d0');
      return originalPostMessage(...args);
    };
    
    this.addLine('INFO', 'Attached error listeners to Web Worker', '#98fb98');
  }

  // Método para escuchar mensajes de iframes de diferente origen
  public setupCrossOriginIframeListener(): void {
    window.addEventListener('message', (event) => {
      // Verificar que el mensaje viene de un iframe y contiene información de error
      if (event.data && typeof event.data === 'object' && event.data.type === 'console-error') {
        const { level, message, color } = event.data;
        this.addLine(level || 'ERROR', `[CROSS-ORIGIN] ${message}`, color || '#ff4444');
      }
    });
    
    this.addLine('INFO', 'Cross-origin iframe error listener setup complete', '#98fb98');
  }

  // Método para inyectar el listener en iframes de diferente origen (código para el iframe)
  public getIframeErrorScript(): string {
    return `
      (function() {
        const sendToParent = (level, message, color = '#ff4444') => {
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'console-error',
              level: level,
              message: message,
              color: color
            }, '*');
          }
        };

        window.addEventListener('error', (event) => {
          if (event.target && event.target !== window) {
            const element = event.target;
            const url = element.src || element.href || 'recurso';
            sendToParent('ERROR', \`Resource failed: \${url}\`);
          } else {
            const file = event.filename || 'unknown';
            const line = event.lineno || 0;
            const col = event.colno || 0;
            const msg = event.message || 'Error';
            const stack = event.error?.stack || '';
            sendToParent('ERROR', \`\${msg}\\n  at \${file}:\${line}:\${col}\${stack ? '\\n' + stack : ''}\`);
          }
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
          const reason = event.reason;
          let message = 'Unhandled Promise Rejection';
          if (reason instanceof Error) {
            message = \`\${reason.name}: \${reason.message}\${reason.stack ? '\\n' + reason.stack : ''}\`;
          } else {
            try {
              message = JSON.stringify(reason);
            } catch {
              message = String(reason);
            }
          }
          sendToParent('ERROR', message);
        });
      })();
    `;
  }

  public destroy(): void {
    // Restaurar funciones originales
    if (this.originalConsole) {
      Object.assign(console, this.originalConsole);
    }
    
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
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
  }
}