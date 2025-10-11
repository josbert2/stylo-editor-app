import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

export interface JSConsoleOptions {
  position?: { x: number; y: number };
  onClose?: () => void;
  autoShow?: boolean; // Nueva opción para controlar el auto-show
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
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
  private autoShow: boolean = false; // Nueva propiedad para controlar el auto-show
  
  constructor(container: HTMLElement, options: JSConsoleOptions = {}) {
    super();
    this.container = container;
    this.position = options.position || { x: 0, y: 0 };
    this.autoShow = options.autoShow ?? false; // Por defecto false
    
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
      //this.show();
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
      let url: string;
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].toString();
      } else if (args[0] instanceof Request) {
        url = args[0].url;
      } else {
        url = 'unknown';
      }
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
    // Enhanced error detection system
    const self = this; // Ensure proper scope binding
    
    // Store references to bound functions for cleanup
    this.errorHandler = (event: ErrorEvent) => {
      // Resource loading errors (img, script, link, etc.)
      if (event.target && event.target !== window) {
        const element = event.target as any;
        const tagName = element.tagName?.toLowerCase() || 'unknown';
        const url = element.src || element.href || element.currentSrc || '(recurso desconocido)';
        const errorType = element.onerror ? 'Script Error' : 'Resource Load Error';
        
        self.addLine('ERROR', `${errorType} [${tagName}]: ${url}\n  Element: ${element.outerHTML?.substring(0, 100) || 'N/A'}`, '#ff6b6b');
      } else {
        // JavaScript runtime errors
        const filename = event.filename || '(unknown file)';
        const message = event.message || 'Unknown error';
        const location = `${filename}:${event.lineno || 0}:${event.colno || 0}`;
        const stack = event.error?.stack ? `\n${event.error.stack}` : '';
        const errorName = event.error?.name ? `[${event.error.name}] ` : '';
        
        self.addLine('ERROR', `${errorName}${message}\n  at ${location}${stack}`, '#ff6b6b');
      }
    };

    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      let message = 'Unhandled Promise Rejection';
      let details = '';
      
      if (event.reason instanceof Error) {
        message = `${event.reason.name || 'Error'}: ${event.reason.message}`;
        details = event.reason.stack ? `\n${event.reason.stack}` : '';
      } else if (typeof event.reason === 'object' && event.reason !== null) {
        try {
          message = `Promise rejected with: ${JSON.stringify(event.reason, null, 2)}`;
        } catch {
          message = `Promise rejected with: ${String(event.reason)}`;
        }
      } else {
        message = `Promise rejected with: ${String(event.reason)}`;
      }
      
      self.addLine('ERROR', `${message}${details}`, '#ff6b6b');
    };
    
    // 1) JavaScript errors with comprehensive stack trace handling
    window.addEventListener('error', this.errorHandler, true); // capture=true to catch all errors including resource errors

    // 2) Unhandled promise rejections with better formatting
    window.addEventListener('unhandledrejection', this.rejectionHandler);

    // 3) Enhanced cross-origin iframe error handling
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'console-error') {
          const { level, message, color, source } = event.data;
          this.addLine(level || 'ERROR', `[${source || 'IFRAME'}] ${message}`, color || '#ff6b6b');
        } else if (event.data.type === 'script-error') {
          this.addLine('ERROR', `[CROSS-ORIGIN] Script error: ${event.data.message}`, '#ff6b6b');
        }
      }
    });

    // 4) Dynamic script loading errors
    const originalCreateElement = document.createElement.bind(document);
    const consoleRef = this;
    document.createElement = function(tagName: string, options?: any) {
      const element = originalCreateElement(tagName, options);
      
      if (tagName.toLowerCase() === 'script') {
        const script = element as HTMLScriptElement;
        const originalOnError = script.onerror;
        
        script.onerror = (event) => {
          const src = script.src || script.innerHTML?.substring(0, 50) || 'inline script';
          consoleRef.addLine('ERROR', `Dynamic script load failed: ${src}`, '#ff6b6b');
          if (originalOnError) originalOnError.call(script, event);
        };
      }
      
      return element;
    };

    // 5) Module loading errors (ES6 modules)
    if ('import' in window) {
      const originalImport = window.import || (window as any).dynamicImport;
      if (originalImport) {
        (window as any).import = async (specifier: string) => {
          try {
            return await originalImport(specifier);
          } catch (error) {
            this.addLine('ERROR', `Module import failed: ${specifier}\n  ${error}`, '#ff6b6b');
            throw error;
          }
        };
      }
    }

    // 6) Enhanced XMLHttpRequest error detection
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._url = url.toString();
      (this as any)._method = method;
      return originalXHROpen.call(this, method, url, ...args);
    };
    
    XMLHttpRequest.prototype.send = function(body?: any) {
      const xhr = this;
      const url = (xhr as any)._url || 'unknown';
      const method = (xhr as any)._method || 'unknown';
      
      const originalOnError = xhr.onerror;
      const originalOnLoad = xhr.onload;
      
      xhr.onerror = function(event) {
        self.addLine('ERROR', `XHR ${method} failed: ${url}\n  Network error or CORS issue`, '#ff6b6b');
        if (originalOnError) originalOnError.call(xhr, event);
      };
      
      xhr.onload = function() {
        if (xhr.status >= 400) {
          self.addLine('ERROR', `XHR ${method} error: ${url}\n  Status: ${xhr.status} ${xhr.statusText}`, '#ff6b6b');
        }
        if (originalOnLoad) originalOnLoad.call(xhr);
      };
      
      return originalXHRSend.call(xhr, body);
    };

    // 7) Web Worker error detection
    const originalWorker = window.Worker;
    if (originalWorker) {
      window.Worker = function(scriptURL: string | URL, options?: WorkerOptions) {
        const worker = new originalWorker(scriptURL, options);
        self.attachToWorker(worker);
        return worker;
      } as any;
    }

    // 8) Keyboard shortcut for console toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle();
      }
    });

    // 9) Performance observer for failed resource loads
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation' && (entry as PerformanceNavigationTiming).type === 'reload') {
              this.addLine('INFO', 'Page reloaded - watching for new errors', '#87ceeb');
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        // PerformanceObserver not supported or failed
      }
    }

    // Setup cross-origin iframe listener
    this.setupCrossOriginIframeListener();

    // Initial message
    setTimeout(() => {
      this.addLine('INFO', 'Enhanced Console initialized - detecting all error types. Press ` to toggle.', '#98fb98');
      
      // Verify error handlers are properly attached
      setTimeout(() => {
        this.addLine('INFO', `Error handlers status: error=${this.errorHandler ? 'active' : 'inactive'}, rejection=${this.rejectionHandler ? 'active' : 'inactive'}`, '#87ceeb');
        
        // Test that new errors are detected
        this.addLine('INFO', 'Testing new error detection...', '#87ceeb');
        setTimeout(() => {
          try {
            // This should trigger an uncaught ReferenceError
            eval('nonExistentVariable123');
          } catch (e) {
            this.addLine('INFO', 'Test error was caught in try-catch (expected)', '#87ceeb');
          }
          
          // This should trigger an uncaught error
          setTimeout(() => {
            try {
              (window as any).eval('undefinedVar456');
            } catch (e) {
              // Ignore - this is just to test
            }
          }, 100);
        }, 200);
      }, 500);
    }, 100);
  }

  private addLine(level: string, msg: string, color: string = '#cfe8ff'): void {
    // Debug logging to browser console
    console.log(`[JSConsole] addLine called: ${level} - ${msg}`);
    
    if (!this.consoleBody) {
      console.error('[JSConsole] consoleBody is null! Cannot add line.');
      console.error('[JSConsole] consoleElement exists:', !!this.consoleElement);
      console.error('[JSConsole] isVisible:', this.isVisible);
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
    
    console.log(`[JSConsole] Line added successfully. Total lines: ${this.consoleBody.children.length}`);
    
    // Solo auto-mostrar si está habilitado
    if (this.autoShow) {
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

  // Enhanced cross-origin iframe error listener
  public setupCrossOriginIframeListener(): void {
    // This is now handled in setupEventListeners for better integration
    // Auto-inject error script into same-origin iframes
    const injectIntoIframes = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          // Try to access iframe content (same-origin only)
          if (iframe.contentWindow && iframe.contentDocument) {
            const script = iframe.contentDocument.createElement('script');
            script.textContent = this.getIframeErrorScript();
            iframe.contentDocument.head.appendChild(script);
            this.addLine('INFO', `Injected error listener into iframe: ${iframe.src || 'about:blank'}`, '#98fb98');
          }
        } catch (e) {
          // Cross-origin iframe - can't inject directly
          this.addLine('INFO', `Cross-origin iframe detected: ${iframe.src} (listening for postMessage)`, '#87ceeb');
        }
      });
    };

    // Inject into existing iframes
    injectIntoIframes();

    // Watch for new iframes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'IFRAME') {
              setTimeout(() => injectIntoIframes(), 100); // Wait for iframe to load
            }
            // Also check for iframes added inside the new element
            const iframes = element.querySelectorAll('iframe');
            if (iframes.length > 0) {
              setTimeout(() => injectIntoIframes(), 100);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Enhanced iframe error injection script
  public getIframeErrorScript(): string {
    return `
      (function() {
        const sendToParent = (level, message, color = '#ff4444', source = 'IFRAME') => {
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'console-error',
              level: level,
              message: message,
              color: color,
              source: source,
              timestamp: new Date().toISOString(),
              url: window.location.href
            }, '*');
          }
        };

        // Enhanced error handling for iframes
        window.addEventListener('error', (event) => {
          if (event.target && event.target !== window) {
            const element = event.target;
            const tagName = element.tagName?.toLowerCase() || 'unknown';
            const url = element.src || element.href || element.currentSrc || 'unknown resource';
            sendToParent('ERROR', \`[\${tagName}] Resource failed: \${url}\`, '#ff6b6b', 'IFRAME-RESOURCE');
          } else {
            const file = event.filename || 'unknown';
            const line = event.lineno || 0;
            const col = event.colno || 0;
            const msg = event.message || 'Unknown error';
            const stack = event.error?.stack || '';
            const errorName = event.error?.name ? \`[\${event.error.name}] \` : '';
            sendToParent('ERROR', \`\${errorName}\${msg}\\n  at \${file}:\${line}:\${col}\${stack ? '\\n' + stack : ''}\`, '#ff6b6b', 'IFRAME-JS');
          }
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
          const reason = event.reason;
          let message = 'Unhandled Promise Rejection';
          if (reason instanceof Error) {
            message = \`\${reason.name || 'Error'}: \${reason.message}\${reason.stack ? '\\n' + reason.stack : ''}\`;
          } else if (typeof reason === 'object' && reason !== null) {
            try {
              message = \`Promise rejected with: \${JSON.stringify(reason, null, 2)}\`;
            } catch {
              message = \`Promise rejected with: \${String(reason)}\`;
            }
          } else {
            message = \`Promise rejected with: \${String(reason)}\`;
          }
          sendToParent('ERROR', message, '#ff6b6b', 'IFRAME-PROMISE');
        });

        // Intercept console methods in iframe
        const originalConsole = {
          log: console.log.bind(console),
          warn: console.warn.bind(console),
          error: console.error.bind(console),
          info: console.info.bind(console)
        };

        console.error = (...args) => {
          originalConsole.error(...args);
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          sendToParent('ERROR', message, '#ff6b6b', 'IFRAME-CONSOLE');
        };

        console.warn = (...args) => {
          originalConsole.warn(...args);
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          sendToParent('WARN', message, '#ffd666', 'IFRAME-CONSOLE');
        };

        // Send confirmation that script was injected
        sendToParent('INFO', 'Error listener injected successfully', '#98fb98', 'IFRAME-SYSTEM');
      })();
    `;
  }

  public destroy(): void {
    // Remover event listeners
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler, true);
      this.errorHandler = null;
    }
    
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = null;
    }

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