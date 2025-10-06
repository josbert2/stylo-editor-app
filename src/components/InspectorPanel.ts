import { EventEmitter } from '../utils/EventEmitter';
import type { 
  StyloEditorEvents, 
  PanelOptions, 
  TabType, 
  StyleValues,
  ElementInfo 
} from '../types';

import { AssetIcon } from '../icons';
import { TooltipManager } from './TooltipManager';
import { ScrollArea } from './ScrollArea';
import { Dock } from './Dock';
import { HTMLNavigator } from './HTMLNavigator';

export class InspectorPanel extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private panelElement: HTMLElement | null = null;
  private isMinimized: boolean = true;
  private isDragging: boolean = false;
  private activeTab: TabType = 'design';
  private position = { x: 20, y: 20 };
  private dragOffset = { x: 0, y: 0 };
  private selectedElement: HTMLElement | null = null;
  private elementInfo: ElementInfo | null = null;
  private styleValues: StyleValues | null = null;
  private logoApp: HTMLElement | null = null;
  private scrollArea: ScrollArea | null = null;
  private dock: Dock | null = null;
  private htmlNavigator: HTMLNavigator | null = null;
  
  // Propiedades para mejorar el drag
  private dragThrottleId: number | null = null;
  private snapThreshold: number = 20;
  private dragStartPosition = { x: 0, y: 0 };
  // RAF-based drag smoothing
  private rafScheduled: boolean = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(container: HTMLElement, options: PanelOptions = {}) {
    super();

    this.container = container;
    this.isMinimized = options.minimized ?? true;
    this.position = options.position || { x: 20, y: 20 };
    
    // Crear el dock
    this.dock = new Dock(container);
    this.bindDockEvents();
    
    this.createLogoApp();
    this.createPanel();
   
    this.bindEvents();
    
    // Inicializar TooltipManager
    TooltipManager.getInstance();
  }

  private createLogoApp(): void {
    this.logoApp = document.createElement('div');
    this.logoApp.className = 'logo-app';
    this.logoApp.innerHTML = `
      <svg 
        version="1.0" 
        xmlns="http://www.w3.org/2000/svg"
        width="60" 
        height="60" 
        viewBox="0 0 1024 1024"
        preserveAspectRatio="xMidYMid meet"
        style="width: 100%; height: 100%;"
      >
        <g 
          transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)"
          fill="#ffffff" 
          stroke="none"
        >
          <path d="M2070 7109 c-506 -56 -917 -442 -1036 -974 -25 -112 -30 -382 -9
-507 49 -297 199 -588 398 -774 90 -84 184 -148 309 -211 l95 -48 -79 -119
c-133 -202 -288 -504 -288 -563 0 -29 15 -39 223 -159 167 -96 191 -106 215
-98 32 11 178 182 263 309 85 126 180 323 229 474 l42 129 99 31 c132 42 215
80 315 146 198 129 375 347 465 572 75 185 118 466 101 651 -4 45 -6 82 -4 82
2 0 21 -15 43 -33 78 -67 212 -117 314 -117 157 0 326 97 370 214 22 58 14 70
-40 55 -61 -17 -143 -4 -256 41 -57 23 -114 47 -128 54 l-25 14 45 22 c106 54
219 207 249 339 22 94 -9 301 -45 301 -8 0 -35 -27 -60 -60 -55 -72 -98 -102
-241 -172 -168 -81 -256 -180 -290 -323 l-11 -50 -51 107 c-65 137 -134 237
-230 332 -107 106 -180 158 -307 221 -216 107 -422 142 -675 114z m900 -974
c60 -31 73 -98 44 -228 -52 -229 -216 -408 -429 -468 -69 -19 -226 -17 -298 4
-31 10 -92 34 -135 54 -69 33 -86 37 -162 37 -81 1 -90 -1 -195 -49 -106 -48
-113 -50 -200 -50 -79 0 -97 4 -144 28 -132 70 -212 208 -241 419 -15 105 -5
173 27 206 22 22 30 24 86 19 34 -3 121 -21 192 -41 187 -51 302 -67 483 -67
215 0 358 21 587 88 223 65 327 78 385 48z m-512 -997 c25 -25 5 -271 -39
-478 -63 -291 -224 -632 -386 -818 l-38 -44 -218 127 c-119 70 -217 133 -217
140 0 7 30 73 68 147 130 256 267 443 497 674 149 150 283 264 309 264 7 0 17
-5 24 -12z"/>
          <path d="M2532 5901 c-148 -52 -336 -180 -330 -225 4 -25 46 -33 79 -15 20 10
25 9 38 -11 39 -57 88 -99 125 -105 74 -14 164 34 193 103 8 20 13 60 12 95
l-3 60 52 23 c60 26 71 44 48 79 -14 22 -24 25 -74 25 -37 0 -86 -10 -140 -29z"/>
          <path d="M1392 5908 c-29 -29 -1 -69 67 -97 29 -13 29 -13 15 -47 -40 -96 11
-195 109 -211 46 -7 102 20 133 66 19 28 31 36 55 36 18 0 36 7 42 16 24 39
-52 104 -226 193 -109 57 -169 70 -195 44z"/>
          <path d="M4565 5784 c-257 -57 -409 -254 -392 -509 9 -134 62 -234 160 -301
65 -45 135 -69 327 -115 277 -65 373 -112 400 -195 40 -121 -73 -214 -265
-217 -106 -2 -177 14 -237 52 -41 26 -55 47 -91 132 -19 44 -37 49 -186 49
-140 0 -146 -4 -138 -95 14 -149 109 -280 256 -353 114 -57 207 -76 371 -77
216 0 370 51 490 161 215 199 185 559 -58 701 -67 40 -160 70 -342 114 -268
64 -350 115 -350 215 0 91 82 152 217 161 156 11 258 -35 298 -132 32 -80 20
-75 189 -75 184 0 186 1 166 88 -18 82 -76 188 -137 247 -62 62 -142 106 -243
135 -101 29 -333 37 -435 14z"/>
          <path d="M7570 5773 c-39 -14 -39 -9 -33 -802 4 -481 9 -771 16 -778 13 -18
278 -18 295 -1 9 9 12 196 12 780 0 755 0 768 -20 788 -18 18 -33 20 -137 19
-65 0 -125 -3 -133 -6z"/>
          <path d="M5697 5602 c-14 -15 -17 -41 -17 -140 l0 -122 -83 0 c-51 0 -88 -5
-95 -12 -8 -8 -12 -49 -12 -120 0 -128 2 -130 117 -127 l76 2 4 -324 c5 -354
10 -390 62 -470 58 -86 156 -118 371 -119 138 0 140 2 140 139 0 75 -4 112
-12 118 -7 6 -50 13 -96 16 -94 6 -116 18 -132 76 -5 20 -10 156 -10 304 l0
268 115 -3 c94 -2 117 0 125 12 5 8 10 59 10 112 0 128 0 128 -141 128 l-109
0 0 124 c0 100 -3 128 -16 140 -12 13 -41 16 -148 16 -116 0 -135 -2 -149 -18z"/>
          <path d="M8512 5359 c-182 -28 -337 -140 -417 -303 -45 -90 -65 -185 -65 -306
0 -192 51 -322 171 -435 117 -110 241 -158 409 -158 170 0 308 52 414 158 121
120 167 240 167 435 0 127 -21 230 -64 315 -39 79 -153 193 -233 233 -111 56
-259 80 -382 61z m219 -286 c39 -20 61 -40 81 -73 77 -128 77 -372 0 -485 -77
-112 -269 -128 -368 -30 -62 62 -79 122 -78 270 0 100 4 130 24 180 26 69 91
139 142 154 67 19 141 13 199 -16z"/>
          <path d="M6342 5328 c-20 -20 -14 -52 34 -180 37 -100 203 -560 330 -914 l26
-71 -23 -48 c-31 -67 -66 -85 -160 -85 -105 0 -109 -5 -109 -148 0 -108 1
-112 25 -128 22 -14 42 -16 129 -10 57 3 127 13 155 22 112 33 189 126 265
320 56 146 297 818 374 1046 56 164 56 167 38 187 -17 19 -30 21 -141 21 -81
0 -127 -4 -138 -12 -15 -12 -192 -549 -230 -699 l-13 -53 -93 275 c-122 356
-156 447 -177 470 -15 17 -32 19 -149 19 -88 0 -135 -4 -143 -12z"/>
          <path d="M1432 3762 c-7 -5 -10 -16 -6 -25 5 -13 1 -17 -17 -17 -40 0 -107
-40 -153 -91 -61 -67 -86 -139 -97 -274 -17 -207 -45 -290 -126 -365 -48 -46
-53 -70 -22 -101 21 -21 29 -21 133 -16 129 6 213 30 329 89 89 46 214 157
254 225 55 95 76 211 52 298 -8 29 -8 40 0 43 6 2 11 12 11 23 0 21 -39 48
-221 153 -128 73 -119 69 -137 58z"/>
        </g>
      </svg>
    `;
    this.logoApp.style.cssText = `
      position: absolute;
      
      border-radius: 4px;
    `;
  }

  /**
   * Crear el panel principal
   */
  private createPanel(): void {
    this.panelElement = document.createElement('div');
    // flex justify-between items-center px-3 w-full h-full rounded border backdrop-blur-md transition-colors select-none cursor-grab active:cursor-grabbing bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] border-secondary-bg group hover:bg-primary-bg/90
    this.panelElement.className = 'stylo-panel';
    this.panelElement.classList.add('cc:flex', 'cc:justify-between', 'cc:items-center',  'cc:w-full', 'cc:h-full', 'cc:rounded', 'cc:border', 'cc:backdrop-blur-md', 'cc:transition-colors', 'cc:select-none', 'cc:cursor-grab', 'cc:active:cursor-grabbing', 'cc:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)]', 'cc:bg-[length:200%_100%]', 'cc:border-secondary-bg', 'cc:group', 'cc:hover:bg-primary-bg/90');
    this.panelElement.style.cssText = `
      position: fixed;
      left: ${this.position.x}px;
      top: ${this.position.y}px;
      width: ${this.isMinimized ? '300px' : '400px'};
      height: ${this.isMinimized ? '44px' : 'calc(100vh - 40px)'};
      min-width: ${this.isMinimized ? '200px' : '400px'};
      min-height: ${this.isMinimized ? '44px' : '400px'};
      max-width: ${this.isMinimized ? '300px' : 'calc(100vw - 40px)'};
      max-height: ${this.isMinimized ? '44px' : 'calc(100vh - 40px)'};
      border-radius: 8px;
      z-index: 9999;
      color: white;
      resize: ${this.isMinimized ? 'none' : 'both'};
      overflow: hidden;
      transition: box-shadow 0.2s ease, transform 0.1s ease;
      will-change: left, top, box-shadow;
      user-select: none;
    `;

    this.renderContent();
    this.container.appendChild(this.panelElement);
  }

  /**
   * Renderizar el contenido del panel
   */
  private renderContent(): void {
    if (!this.panelElement) return;

    if (this.isMinimized) {
      this.renderMinimizedView();
    } else {
      this.renderFullView();
    }
  }

  /**
   * Renderizar vista minimizada
   */
  private renderMinimizedView(): void {
    if (!this.panelElement) return;

    this.panelElement.innerHTML = `
      <div class="minimized-panel cc:px-3" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        cursor: grab;
        border-radius: 8px;
      " data-drag-handle>
        <div style="display: flex; align-items: center; gap: 8px;">
          
          ${this.logoApp ? this.logoApp.outerHTML : ''}
         
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px;">
          <button class="inspector-toggle-btn cc:flex cc:justify-center cc:items-center cc:w-7 cc:h-7 cc:text-white cc:rounded cc:shadow-sm cc:transition-colors cc:duration-200 cc:cursor-pointer cc:bg-secondary-bg cc:hover:bg-pikend-bg/20" title="Activate Inspector"
            data-tooltip="Texto del tooltip"
            data-tooltip-position="bottom"
           >
            ${AssetIcon('expand', { size: 15, className: 'cc:fill-current cc:text-gray-200' } )}
          </button>
          
          <button class="expand-btn cc:flex cc:justify-center cc:items-center cc:w-7 cc:h-7 cc:text-white cc:rounded cc:shadow-sm cc:transition-colors cc:duration-200 cc:cursor-pointer cc:bg-secondary-bg cc:hover:bg-pikend-bg/20" title="Expand Panel" data-tooltip="Expandir Panel" data-tooltip-position="bottom">

          ${AssetIcon('expand2', { size: 15, className: 'cc:fill-current cc:text-gray-200' } )}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar el encabezado del panel
   */
  private renderPanelHeader(): string {
    return `
      <div class="panel-header" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        border-bottom: 1px solid #333;
        cursor: grab;
        position: relative;
        border-radius: 8px 8px 0 0;
      " data-drag-handle>
        <!-- Drag Handle -->
        <div class="absolute top-2 left-1/2 z-10 w-8 h-1 bg-gray-600 rounded-full transition-colors transform -translate-x-1/2 drag-handle cursor-grab hover:bg-gray-500" style="
          position: absolute;
          top: 8px;
          left: 50%;
          z-index: 10;
          width: 32px;
          height: 4px;
          background-color: #4b5563;
          border-radius: 9999px;
          transition: background-color 0.2s ease;
          transform: translateX(-50%);
          cursor: grab;
        " onmouseover="this.style.backgroundColor='#6b7280'" onmouseout="this.style.backgroundColor='#4b5563'"></div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="logo-svg-app" style="
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">${this.logoApp ? this.logoApp.innerHTML : 'S'}</div>
          
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px;">
          <button class="inspector-toggle-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
          " title="Toggle Inspector">🎯</button>
          
          <button class="minimize-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            font-size: 14px;
          " title="Minimize Panel">−</button>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar las pestañas del panel
   */
  private renderPanelTabs(): string {
    return `
      <div class="tw:text-center panel-tabs" style="
        display: flex;
        background: #2a2a2a;
        border-bottom: 1px solid #333;
      ">
        <button class="tab-btn ${this.activeTab === 'design' ? 'active' : ''}" data-tab="design" style="
          flex: 1;
          padding: 12px;
          background: ${this.activeTab === 'design' ? '#4AEDFF' : 'transparent'};
          color: ${this.activeTab === 'design' ? '#000' : '#fff'};
          border: none;
          cursor: pointer;
          font-weight: 500;
        ">Design</button>
        <button class="tab-btn ${this.activeTab === 'code' ? 'active' : ''}" data-tab="code" style="
          flex: 1;
          padding: 12px;
          background: ${this.activeTab === 'code' ? '#4AEDFF' : 'transparent'};
          color: ${this.activeTab === 'code' ? '#000' : '#fff'};
          border: none;
          cursor: pointer;
          font-weight: 500;
        ">Code</button>
        <button class="tab-btn ${this.activeTab === 'html' ? 'active' : ''}" data-tab="html" style="
          flex: 1;
          padding: 12px;
          background: ${this.activeTab === 'html' ? '#4AEDFF' : 'transparent'};
          color: ${this.activeTab === 'html' ? '#000' : '#fff'};
          border: none;
          cursor: pointer;
          font-weight: 500;
        ">HTML</button>
      </div>
    `;
  }

  /**
   * Renderizar el contenido del panel
   */
  private renderPanelContent(): string {
    return `
      <div class="panel-content" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      ">
        ${this.renderTabContent()}
      </div>
    `;
  }

  /**
   * Renderizar vista completa usando componentes
   */
  private renderFullView(): void {
    if (!this.panelElement) return;

    this.panelElement.innerHTML = `
      ${this.renderPanelHeader()}
      ${this.renderPanelTabs()}
      <div class="panel-content-container" style="
        flex: 1;
        position: relative;
        overflow: hidden;
      "></div>
    `;

    // Crear el ScrollArea para el contenido
    const contentContainer = this.panelElement.querySelector('.panel-content-container') as HTMLElement;
    if (contentContainer) {
      // Limpiar ScrollArea anterior si existe
      if (this.scrollArea) {
        this.scrollArea.destroy();
      }
      
      // Crear nuevo ScrollArea
      this.scrollArea = new ScrollArea(contentContainer, {
        className: 'panel-scroll-area',
        orientation: 'vertical'
      });

      // Agregar el contenido al ScrollArea
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `
        padding: 16px;
        min-height: 100%;
      `;
      contentDiv.innerHTML = this.renderTabContent();
      
      this.scrollArea.appendChild(contentDiv);
    }

    // Inicializar HTMLNavigator si la pestaña HTML está activa
    if (this.activeTab === 'html') {
      this.initializeHTMLNavigator();
    }
  }

  /**
   * Inicializar HTMLNavigator
   */
  private initializeHTMLNavigator(): void {
    const container = this.panelElement?.querySelector('#html-navigator-container') as HTMLElement;
    if (container) {
      // Destruir instancia anterior si existe
      if (this.htmlNavigator) {
        this.htmlNavigator.destroy();
      }

      // Crear nueva instancia
      this.htmlNavigator = new HTMLNavigator(container);
      
      // Vincular eventos
      this.htmlNavigator.on('elementSelected', (data) => {
        // Emitir evento para que el editor principal maneje la selección
        this.emit('element:selected', data.element);
      });

      // Escanear HTML inicial
      this.htmlNavigator.scanHTML();
    }
  }

  /**
   * Renderizar contenido de la pestaña activa
   */
  private renderTabContent(): string {
    if (this.activeTab === 'design') {
      return this.renderDesignTab();
    } else if (this.activeTab === 'code') {
      return this.renderCodeTab();
    } else if (this.activeTab === 'html') {
      return this.renderHTMLTab();
    }
    return '';
  }

  /**
   * Renderizar estado vacío
   */
  private renderEmptyState(): string {
    return `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        text-align: center;
        color: #888;
      ">
        <div style="
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4AEDFF 0%, #B794F6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-size: 24px;
        ">🎯</div>
        <h3 style="margin: 0 0 8px 0; color: #fff;">Click the inspector button and select any element to view its CSS properties</h3>
        <p style="margin: 0; font-size: 14px;">Inspector mode: OFF</p>
        <button class="inspector-toggle-btn" style="
          margin-top: 16px;
          background: linear-gradient(135deg, #4AEDFF 0%, #B794F6 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Activate Inspector</button>
      </div>
    `;
  }

  /**
   * Renderizar pestaña de diseño
   */
  private renderDesignTab(): string {
    if (!this.selectedElement || !this.elementInfo) {
      return this.renderEmptyState();
    }

    return `
      <div>
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #4AEDFF;">Selected Element</h3>
          <div style="
            background: #2a2a2a;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #333;
          ">
            <div style="font-family: monospace; color: #fff;">
              &lt;${this.elementInfo.tagName}${this.elementInfo.id ? ` id="${this.elementInfo.id}"` : ''}${this.elementInfo.classes.length ? ` class="${this.elementInfo.classes.join(' ')}"` : ''}&gt;
            </div>
          </div>
        </div>
        
        <div style="color: #888; text-align: center; padding: 40px 0;">
          Design controls will be implemented here
        </div>
      </div>
    `;
  }

  /**
   * Renderizar pestaña de código
   */
  private renderCodeTab(): string {
    if (!this.selectedElement || !this.elementInfo) {
      return this.renderEmptyState();
    }

    return `
      <div>
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #4AEDFF;">CSS Properties</h3>
          <div style="
            background: #2a2a2a;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #333;
            font-family: monospace;
            font-size: 12px;
            color: #fff;
            max-height: 300px;
            overflow-y: auto;
          ">
            <div>/* CSS properties for ${this.elementInfo.selector} */</div>
            <div style="color: #888; margin-top: 8px;">
              Properties will be displayed here when implemented
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderizar pestaña HTML
   */
  private renderHTMLTab(): string {
    return `
      <div class="html-tab-content" style="
        height: 100%;
        display: flex;
        flex-direction: column;
      ">
        <div id="html-navigator-container" style="
          flex: 1;
          overflow: hidden;
        "></div>
      </div>
    `;
  }

  /**
   * Vincular eventos
   */
  private bindEvents(): void {
    if (!this.panelElement) return;

    this.panelElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('minimize-btn')) {
        this.minimize();
      } else if (target.classList.contains('expand-btn')) {
        this.expand();
      } else if (target.classList.contains('tab-btn')) {
        const tab = target.getAttribute('data-tab') as TabType;
        if (tab) {
          this.setActiveTab(tab);
        }
      } else if (target.classList.contains('inspector-toggle-btn')) {
          // Emitir evento de toggle del inspector
          this.emit('inspector:toggle', true);
        }
    });

    // Responder al instante al expand/minimize con mousedown (sin esperar click)
    this.panelElement.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.expand-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.expand();
        return;
      }
      if (target.closest('.minimize-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.minimize();
        return;
      }
    });

    // Eventos globales de arrastre
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Eventos de arrastre en el panel
    this.panelElement.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      // Evitar arrastre si se hizo mousedown sobre elementos interactivos
      if (target.closest('.expand-btn, .minimize-btn, .tab-btn, .inspector-toggle-btn, button, input, select, textarea, [contenteditable="true"]')) {
        return;
      }
      if (target.closest('[data-drag-handle]')) {
        this.handleDragStart(e);
      }
    });
  }

  /**
   * Manejar inicio de arrastre
   */
  private handleDragStart(e: MouseEvent): void {
    if (!this.panelElement) return;

    this.isDragging = true;
    this.dragStartPosition = { x: e.clientX, y: e.clientY };
    
    const rect = this.panelElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Limpiar cualquier transición compleja que pueda interferir con el drag
    this.panelElement.style.transition = 'none';
    this.panelElement.style.transform = 'none';
    this.panelElement.style.filter = 'none';
    
    // Efectos visuales simples para drag
    this.panelElement.style.cursor = 'grabbing';
    this.panelElement.style.zIndex = '10000';

    e.preventDefault();
  }

  /**
   * Función throttle para optimizar rendimiento
   */
  private throttle(func: Function, limit: number) {
    // Conserved in case it's useful elsewhere, but not used for drag now
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Calcular límites de la pantalla
   */
  private calculateBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (!this.panelElement) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const rect = this.panelElement.getBoundingClientRect();
    return {
      minX: 0,
      maxX: window.innerWidth - rect.width,
      minY: 0,
      maxY: window.innerHeight - rect.height
    };
  }

  /**
   * Aplicar snap a los bordes
   */
  private applySnap(x: number, y: number): { x: number; y: number } {
    const bounds = this.calculateBounds();
    
    // Snap horizontal
    if (x < this.snapThreshold) {
      x = 0;
    } else if (x > bounds.maxX - this.snapThreshold) {
      x = bounds.maxX;
    }
    
    // Snap vertical
    if (y < this.snapThreshold) {
      y = 0;
    } else if (y > bounds.maxY - this.snapThreshold) {
      y = bounds.maxY;
    }
    
    return { x, y };
  }

  /**
   * Calcular la esquina más cercana entre:
   * - top-left (0,0)
   * - top-right (maxX,0)
   * - bottom-left (0,maxY)
   * - bottom-right (maxX,maxY)
   */
  private getNearestCorner(x: number, y: number): { x: number; y: number; corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' } {
    const bounds = this.calculateBounds();
    const pad = 20; // separación deseada desde cada borde

    // Calcular posiciones con padding, asegurando que no salgan de los límites
    const leftX = Math.min(pad, bounds.maxX);
    const topY = Math.min(pad, bounds.maxY);
    const rightX = Math.max(0, bounds.maxX - pad);
    const bottomY = Math.max(0, bounds.maxY - pad);

    const corners = [
      { x: leftX,  y: topY,    corner: 'top-left' as const },
      { x: rightX, y: topY,    corner: 'top-right' as const },
      { x: leftX,  y: bottomY, corner: 'bottom-left' as const },
      { x: rightX, y: bottomY, corner: 'bottom-right' as const },
    ];

    let best = corners[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const c of corners) {
      const dx = x - c.x;
      const dy = y - c.y;
      const dist = dx * dx + dy * dy; // distancia euclidiana al cuadrado
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  }

  /**
   * Ajustar el panel a la esquina más cercana
   */
  private snapToNearestCorner(): void {
    if (!this.panelElement) return;
    const rect = this.panelElement.getBoundingClientRect();
    const currentX = rect.left;
    const currentY = rect.top;
    const nearest = this.getNearestCorner(currentX, currentY);

    // Animar el ajuste a la esquina para una mejor UX
    const prevTransition = this.panelElement.style.transition;
    this.panelElement.style.transition = `${prevTransition ? prevTransition + ', ' : ''} left 0.15s ease, top 0.15s ease`;
    this.panelElement.style.left = `${nearest.x}px`;
    this.panelElement.style.top = `${nearest.y}px`;
    this.position = { x: nearest.x, y: nearest.y };

    // Limpiar la transición después de completar la animación
    setTimeout(() => {
      if (!this.panelElement) return;
      // Mantener el resto de transiciones originales (box-shadow, transform)
      this.panelElement.style.transition = prevTransition || 'box-shadow 0.2s ease, transform 0.1s ease';
    }, 180);
  }

  /**
   * Manejar movimiento de arrastre (suave con requestAnimationFrame)
   */
  private handleDragMove = (e: MouseEvent) => {
    if (!this.isDragging || !this.panelElement) return;

    // Guardar última posición del puntero
    this.lastPointer.x = e.clientX;
    this.lastPointer.y = e.clientY;

    // Programar un frame si no hay uno en cola
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      requestAnimationFrame(this.applyDragFrame);
    }
  };

  /**
   * Aplicar el frame de arrastre usando la última posición del puntero
   */
  private applyDragFrame = () => {
    this.rafScheduled = false;
    if (!this.isDragging || !this.panelElement) return;

    const bounds = this.calculateBounds();
    let newX = this.lastPointer.x - this.dragOffset.x;
    let newY = this.lastPointer.y - this.dragOffset.y;

    // Aplicar límites
    newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

    // Durante el drag no aplicamos snap a bordes para evitar "saltos"
    this.position = { x: newX, y: newY };
    this.panelElement.style.left = `${newX}px`;
    this.panelElement.style.top = `${newY}px`;
  };

  /**
   * Manejar fin de arrastre
   */
  private handleDragEnd(): void {
    if (!this.isDragging || !this.panelElement) return;

    this.isDragging = false;

    // Restaurar efectos visuales simples
    this.panelElement.style.cursor = 'grab';
    this.panelElement.style.zIndex = '9999';
    
    // Restaurar transición básica para el panel
    this.panelElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    // Al soltar, auto-posicionar a la esquina más cercana
    this.snapToNearestCorner();

    // Limpiar throttle
    if (this.dragThrottleId) {
      clearTimeout(this.dragThrottleId);
      this.dragThrottleId = null;
    }
  }

  /**
   * Minimizar el panel
   */
  minimize(): void {
    this.clearTooltips();
    this.isMinimized = true;
    
    // Ocultar el dock cuando se minimiza el panel
    if (this.dock) {
      this.dock.hide();
    }
    
    if (this.panelElement) {
      // Remover color de fondo específico al minimizar y aplicar gradiente
      this.panelElement.style.backgroundColor = '';
      this.panelElement.style.backgroundImage = 'linear-gradient(110deg, #000103, 45%, #1e2631, 55%, #000103)';
      
      // Configurar transición suave para la minimización
      this.panelElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      // Animación inicial: scale down con fade
      this.panelElement.style.transform = 'scale(0.95) translateY(2px)';
      this.panelElement.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)';
      this.panelElement.style.filter = 'brightness(0.9)';
      
      // Aplicar nuevas dimensiones con delay para sincronizar
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.updatePanelDimensions();
          
          // Renderizar contenido minimizado
          setTimeout(() => {
            this.renderContent();
          }, 50);
          
        }, 50);
        
        // Efecto de "settle" suave
        setTimeout(() => {
          if (this.panelElement) {
            this.panelElement.style.transform = 'scale(1.02) translateY(-1px)';
            this.panelElement.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)';
          }
        }, 200);
        
        // Estado final estable - IMPORTANTE: limpiar propiedades de animación
        setTimeout(() => {
          if (this.panelElement) {
            this.panelElement.style.transform = 'none';
            this.panelElement.style.boxShadow = '';
            this.panelElement.style.filter = 'none';
            // Restaurar transición normal para drag suave
            this.panelElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          }
        }, 400);
      });
    }
    
    // Emitir evento
    this.emit('panel:minimized', true);
  }

  /**
   * Expandir el panel
   */
  expand(): void {
    this.clearTooltips();
    this.isMinimized = false;
    
    // Mostrar el dock cuando se maximiza el panel
    if (this.dock) {
      this.dock.show();
      this.dock.setActiveTab(this.activeTab);
    }
    
    if (this.panelElement) {
      // Aplicar color de fondo específico cuando está abierto y remover gradiente
      this.panelElement.style.backgroundColor = '#121315';
      this.panelElement.style.backgroundImage = 'none';
      
      // Configurar transición suave para la expansión
      this.panelElement.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      // Animación inicial: pequeño scale up con glow
      this.panelElement.style.transform = 'scale(1.05) translateY(-2px)';
      this.panelElement.style.boxShadow = '0 25px 80px rgba(74, 237, 255, 0.4), 0 0 0 1px rgba(74, 237, 255, 0.2)';
      this.panelElement.style.filter = 'brightness(1.1)';
      
      // Aplicar nuevas dimensiones con delay para sincronizar
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.updatePanelDimensions();
          
          // Animación de "breathing" durante la expansión
          this.panelElement!.style.transform = 'scale(1.02) translateY(-1px)';
          
          // Renderizar contenido mientras se expande
          setTimeout(() => {
            this.renderContent();
          }, 100);
          
        }, 50);
        
        // Efecto de settle final con bounce suave
        setTimeout(() => {
          if (this.panelElement) {
            this.panelElement.style.transform = 'scale(0.98) translateY(1px)';
            this.panelElement.style.boxShadow = '0 15px 40px rgba(74, 237, 255, 0.25), 0 0 0 1px rgba(74, 237, 255, 0.1)';
          }
        }, 300);
        
        // Estado final estable - IMPORTANTE: limpiar propiedades de animación
        setTimeout(() => {
          if (this.panelElement) {
            this.panelElement.style.transform = 'none';
            this.panelElement.style.boxShadow = '';
            this.panelElement.style.filter = 'none';
            // Restaurar transición normal para drag suave
            this.panelElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
          }
        }, 500);
      });
    }
    
    // Emitir evento
    this.emit('panel:minimized', false);
  }

  /**
   * Limpiar tooltips activos para evitar bugs al cambiar el estado del panel
   */
  private clearTooltips(): void {
    // Obtener la instancia del TooltipManager y forzar el ocultado del tooltip
    const tooltipManager = TooltipManager.getInstance();
    if (tooltipManager && (tooltipManager as any).tooltip) {
      const tooltip = (tooltipManager as any).tooltip;
      tooltip.classList.remove('show');
      // Limpiar timeouts
      (tooltipManager as any).clearTimeouts();
    }
  }

  /**
   * Actualizar dimensiones del panel según el estado
   */
  private updatePanelDimensions(): void {
    if (!this.panelElement) return;
    
    const width = this.isMinimized ? '200px' : '400px';
    const height = this.isMinimized ? '44px' : 'calc(100vh - 40px)'; // Altura completa con 20px gap
    const minWidth = this.isMinimized ? '200px' : '400px';
    const minHeight = this.isMinimized ? '44px' : '400px';
    const maxWidth = this.isMinimized ? '300px' : 'calc(100vw - 40px)'; // 20px padding en cada lado
    const maxHeight = this.isMinimized ? '44px' : 'calc(100vh - 40px)'; // 20px padding arriba y abajo
    const resize = this.isMinimized ? 'none' : 'both';
    
    this.panelElement.style.width = width;
    this.panelElement.style.height = height;
    this.panelElement.style.minWidth = minWidth;
    this.panelElement.style.minHeight = minHeight;
    this.panelElement.style.maxWidth = maxWidth;
    this.panelElement.style.maxHeight = maxHeight;
    this.panelElement.style.resize = resize;
  }

  /**
   * Establecer pestaña activa
   */
  setActiveTab(tab: TabType): void {
    if (this.activeTab === tab) return;
    
    this.activeTab = tab;
    
    // Sincronizar con el dock
    if (this.dock) {
      this.dock.setActiveTab(tab);
    }
    
    this.renderContent();
    
    // Inicializar HTMLNavigator cuando se cambie a la pestaña HTML
    if (tab === 'html' && !this.isMinimized) {
      setTimeout(() => {
        this.initializeHTMLNavigator();
      }, 100);
    }
    
    this.emit('tab:changed', tab);
  }

  /**
   * Actualizar elemento seleccionado
   */
  public updateSelectedElement(element: HTMLElement | null, elementInfo: ElementInfo | null): void {
    this.selectedElement = element;
    this.elementInfo = elementInfo;
    this.renderContent();
  }

  /**
   * Actualizar valores de estilo
   */
  public updateStyleValues(styleValues: StyleValues): void {
    this.styleValues = styleValues;
    this.renderContent();
  }

  /**
   * Obtener estado minimizado
   */
  public getIsMinimized(): boolean {
    return this.isMinimized;
  }

  /**
   * Mostrar el panel
   */
  public show(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
  }

  /**
   * Ocultar el panel
   */
  public hide(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Vincular eventos del dock
   */
  private bindDockEvents(): void {
    if (!this.dock) return;

    // Sincronizar tab activo entre panel y dock
    this.dock.on('dock:tab-changed', (tab: TabType) => {
      this.setActiveTab(tab);
    });

    // Ocultar dock
    this.dock.on('dock:hide', () => {
      // El dock se oculta automáticamente
    });

    // Toggle inspector desde el dock
    this.dock.on('dock:inspector-toggle', () => {
      // Aquí puedes agregar lógica adicional si es necesario
      this.emit('dock:inspector-action');
    });

    // Manejar aplicación de colores
    this.dock.on('dock:color-applied', (color: string) => {
      this.applyColorToSelectedElement(color);
    });
  }

  private applyColorToSelectedElement(color: string): void {
    if (!this.selectedElement) {
      console.warn('No hay elemento seleccionado para aplicar el color');
      return;
    }
    
    // Aplicar el color como color de texto por defecto
    // En el futuro se puede expandir para permitir elegir qué propiedad modificar
    this.selectedElement.style.color = color;
    
    // Emitir evento para notificar el cambio
    this.emit('element:style-changed', {
      element: this.selectedElement,
      property: 'color',
      value: color
    });
    
    // Actualizar la vista del panel si está expandido
    if (!this.isMinimized) {
      this.renderContent();
    }
  }

  /**
   * Métodos públicos para controlar el dock
   */
  public getDock(): Dock | null {
    return this.dock;
  }

  public showDock(): void {
    if (this.dock) {
      this.dock.show();
    }
  }

  public hideDock(): void {
    if (this.dock) {
      this.dock.hide();
    }
  }

  /**
   * Obtener instancia del HTMLNavigator
   */
  public getHTMLNavigator(): HTMLNavigator | null {
    return this.htmlNavigator;
  }

  /**
   * Destruir el panel
   */
  override destroy(): void {
    // Limpiar HTMLNavigator
    if (this.htmlNavigator) {
      this.htmlNavigator.destroy();
      this.htmlNavigator = null;
    }
    
    // Limpiar ScrollArea
    if (this.scrollArea) {
      this.scrollArea.destroy();
      this.scrollArea = null;
    }
    
    // Limpiar Dock
    if (this.dock) {
      this.dock.destroy();
      this.dock = null;
    }
    
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }
    
    // Limpiar eventos globales
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
    
    super.destroy();
  }
}