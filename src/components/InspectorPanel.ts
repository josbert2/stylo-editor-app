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
import { TransformPanel, type TransformProperties } from './TransformPanel';
import { SpacingPanel, type SpacingProperties } from './SpacingPanel';
import './SpacingPanel.css';
import { TypographyPanel, type TypographyProperties } from './TypographyPanel';
import './TypographyPanel.css';
import { FiltersPanel, type FilterProperties } from './FiltersPanel';
import './FiltersPanel.css';
import { TextShadowPanel, type TextShadowProperties } from './TextShadowPanel';
import './TextShadowPanel.css';
import { BoxShadowPanel, type BoxShadowProperties } from './BoxShadowPanel';
import './BoxShadowPanel.css';
import { PositioningPanel, type PositioningProperties } from './PositioningPanel';
import './PositioningPanel.css';
import { BorderPanel, type BorderProperties } from './BorderPanel';
import './BorderPanel.css';
import { DisplayPanel, type DisplayProperties } from './DisplayPanel';
import './DisplayPanel.css';
import { BackgroundPanel, type BackgroundProperties } from './BackgroundPanel';
import './BackgroundPanel.css';
import './InspectorAccordion.css';
import { ElementSelector, type ElementDefinition } from './ElementSelector';
import './ElementSelector.css';
import { tailwindClasses } from '../utils/tailwindClasses';
import { injectTailwindClass } from '../utils/tailwindJIT';
import { tailwindColors } from '../utils/tailwindColorsData';

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
  private transformPanel: TransformPanel | null = null;
  private spacingPanel: SpacingPanel | null = null;
  private typographyPanel: TypographyPanel | null = null;
  private filtersPanel: FiltersPanel | null = null;
  private textShadowPanel: TextShadowPanel | null = null;
  private boxShadowPanel: BoxShadowPanel | null = null;
  private positioningPanel: PositioningPanel | null = null;
  private borderPanel: BorderPanel | null = null;
  private displayPanel: DisplayPanel | null = null;
  private backgroundPanel: BackgroundPanel | null = null;
  private elementSelector: ElementSelector | null = null;
  
  // Tailwind: Rastrear clases deshabilitadas (exist en la lista pero no aplicadas al elemento)
  private disabledTailwindClasses: Set<string> = new Set();
  
  // Tailwind: Índice de sugerencia seleccionada para navegación con teclado
  private selectedSuggestionIndex: number = -1;
  
  // Tailwind: Bandera para evitar duplicar event listeners
  private tailwindEventsBound: boolean = false;
  
  // Tailwind: Referencias a funciones de eventos para poder removerlas
  private tailwindInputHandler: ((e: Event) => void) | null = null;
  private tailwindKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private tailwindPanelClickHandler: ((e: Event) => void) | null = null;
  private tailwindPanelMouseoverHandler: ((e: Event) => void) | null = null;
  
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
      border-radius: 24px;
      z-index: 9999;
      color: white;
      resize: none;
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

    // Re-vincular eventos de Tailwind si estamos en esa tab
    if (this.activeTab === 'tailwind' && !this.isMinimized) {
      // Usar setTimeout para asegurar que el DOM esté listo
      setTimeout(() => {
        this.bindTailwindSearchEvents();
      }, 50);
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
      <div style=" padding: 20px;">
      <div class="tw:text-center panel-tabs cc:rounded-lg cc:px-2 cc:py-2" style="
        display: flex;
        background:#343131a3
      
 
      ">
        <button class="tab-btn button-btn-fancy fancy-wfull ${this.activeTab === 'design' ? 'active' : ''}" data-tab="design" style="--coord-x: 0; --coord-y: 0;">
          <div class="inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path stroke="#7a7a7a" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.81 3.94c-1.54 3.84-5.4 9.06-8.63 11.65l-1.97 1.58c-.25.18-.5.34-.78.45 0-.18-.01-.38-.04-.57-.11-.84-.49-1.62-1.16-2.29-.68-.68-1.51-1.08-2.36-1.19-.2-.01-.4-.03-.6-.01.11-.31.28-.6.49-.84l1.56-1.97c2.58-3.23 7.82-7.11 11.65-8.64.59-.22 1.16-.06 1.52.31.38.37.56.94.32 1.52z"></path>
            <path stroke="#7a7a7a" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.43 17.62c0 1.1-.42 2.15-1.21 2.95-.61.61-1.44 1.03-2.43 1.16L4.33 22c-1.34.15-2.49-.99-2.33-2.35l.27-2.46c.24-2.19 2.07-3.59 4.01-3.63.2-.01.41 0 .6.01.85.11 1.68.5 2.36 1.19.67.67 1.05 1.45 1.16 2.29.01.19.03.38.03.57zM14.24 14.47c0-2.61-2.12-4.73-4.73-4.73"></path>
            <path stroke="#7a7a7a" stroke-linecap="round" stroke-width="1.5" d="M20.12 12.73l.74.73c1.49 1.49 1.49 2.96 0 4.45l-2.96 2.96c-1.47 1.47-2.96 1.47-4.43 0M3.11 10.51c-1.47-1.49-1.47-2.96 0-4.45L6.07 3.1c1.47-1.47 2.96-1.47 4.43 0l.74.74M11.25 3.85l-3.7 3.7M20.12 12.73l-2.96 2.95"></path></svg>
            Design  
          </div>
        </button>
        <button class="tab-btn button-btn-fancy fancy-wfull ${this.activeTab === 'code' ? 'active' : ''}" data-tab="code" style="--coord-x: 0; --coord-y: 0;">
          <div class="inner">Code</div>
        </button>
        <button class="tab-btn button-btn-fancy fancy-wfull ${this.activeTab === 'html' ? 'active' : ''}" data-tab="html" style="--coord-x: 0; --coord-y: 0;">
          <div class="inner">HTML</div>
        </button>
        <button class="tab-btn button-btn-fancy fancy-wfull ${this.activeTab === 'tailwind' ? 'active' : ''}" data-tab="tailwind" style="--coord-x: 0; --coord-y: 0;">
          <div class="inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 54 33" fill="none" style="margin-right: 4px;">
              <path fill="#38bdf8" fill-rule="evenodd" d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" clip-rule="evenodd"/>
            </svg>
            Tailwind
          </div>
        </button>
      </div>
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
    
    // Inicializar todos los paneles si la pestaña Design está activa
    if (this.activeTab === 'design' && this.selectedElement) {
      this.initializeElementSelector();
      this.initializeTransformPanel();
      this.initializePositioningPanel();
      this.initializeSpacingPanel();
      this.initializeBorderPanel();
      this.initializeDisplayPanel();
      this.initializeBackgroundPanel();
      this.initializeTypographyPanel();
      this.initializeFiltersPanel();
      this.initializeTextShadowPanel();
      this.initializeBoxShadowPanel();
      // Inicializar acordeones después de que todo esté renderizado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.initializeAccordions();
        });
      });
    }
  }

  /**
   * Inicializar acordeones del inspector
   */
  private initializeAccordions(): void {
    const accordionTriggers = this.panelElement?.querySelectorAll('[data-accordion-trigger]');
    
    if (!accordionTriggers) return;

    // Abrir el primer acordeón por defecto
    const firstItem = this.panelElement?.querySelector('.accordion-item');
    if (firstItem) {
      firstItem.classList.add('active');
    }

    accordionTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const button = e.currentTarget as HTMLElement;
        const panelName = button.dataset.accordionTrigger;
        const accordionItem = button.closest('.accordion-item');
        
        if (accordionItem) {
          // Toggle active state
          const isActive = accordionItem.classList.contains('active');
          
          // Opción 1: Solo un panel abierto a la vez (descomentar si prefieres esto)
          // this.panelElement?.querySelectorAll('.accordion-item').forEach(item => {
          //   item.classList.remove('active');
          // });
          
          // Opción 2: Múltiples paneles abiertos (comportamiento actual)
          if (isActive) {
            accordionItem.classList.remove('active');
          } else {
            accordionItem.classList.add('active');
          }
        }
      });
    });
  }

  /**
   * Inicializar ElementSelector
   */
  private initializeElementSelector(): void {
    // Destruir instancia anterior si existe
    if (this.elementSelector) {
      this.elementSelector.destroy();
      this.elementSelector = null;
    }

    // Crear contenedor flotante para el ElementSelector
    const container = document.createElement('div');
    container.className = 'element-selector-floating';
    container.style.cssText = `
      position: fixed;
      display: none;
      z-index: 10000;
      max-width: 500px;
      min-width: 400px;
    `;
    document.body.appendChild(container);

    // Crear nueva instancia
    this.elementSelector = new ElementSelector({
      container: container,
      onElementSelect: (element) => {
        this.handleElementAdd(element);
        // Cerrar dropdown después de seleccionar
        container.style.display = 'none';
      }
    });

    // Guardar referencia al contenedor para poder limpiarlo
    (this.elementSelector as any)._floatingContainer = container;

    // Cerrar dropdown al hacer clic fuera
    const closeDropdown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!container.contains(target) && !target.closest('.stylo-add-button')) {
        container.style.display = 'none';
      }
    };

    // Usar setTimeout para evitar que el clic cierre inmediatamente
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 0);

    // Limpiar listener cuando se destruya el panel
    this.elementSelector.on('destroy', () => {
      document.removeEventListener('click', closeDropdown);
    });
  }

  /**
   * Manejar la adición de un nuevo elemento
   */
  private handleElementAdd(element: ElementDefinition): void {
    if (!this.selectedElement) return;

    // Si es duplicar elemento
    if (element.tag === '') {
      const cloned = this.selectedElement.cloneNode(true) as HTMLElement;
      this.selectedElement.parentNode?.insertBefore(cloned, this.selectedElement.nextSibling);
      console.log('Element duplicated');
      return;
    }

    // Crear el nuevo elemento
    const newElement = document.createElement(element.tag);
    
    // Configuración por defecto según el tipo
    switch (element.tag) {
      case 'div':
        if (element.title.includes('Horizontal')) {
          newElement.style.display = 'flex';
          newElement.style.flexDirection = 'row';
          newElement.style.gap = '10px';
        } else if (element.title.includes('Vertical')) {
          newElement.style.display = 'flex';
          newElement.style.flexDirection = 'column';
          newElement.style.gap = '10px';
        }
        newElement.textContent = 'Container';
        break;
      case 'p':
        newElement.textContent = 'Paragraph text';
        break;
      case 'span':
        newElement.textContent = 'Text';
        break;
      case 'a':
        newElement.textContent = 'Link';
        (newElement as HTMLAnchorElement).href = '#';
        break;
      case 'img':
        (newElement as HTMLImageElement).src = 'https://via.placeholder.com/150';
        (newElement as HTMLImageElement).alt = 'Image';
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        newElement.textContent = element.title;
        break;
      case 'button':
        newElement.textContent = 'Button';
        break;
      case 'input':
        (newElement as HTMLInputElement).placeholder = 'Enter text...';
        if (element.title.includes('Email')) {
          (newElement as HTMLInputElement).type = 'email';
        } else if (element.title.includes('Password')) {
          (newElement as HTMLInputElement).type = 'password';
        } else if (element.title.includes('Number')) {
          (newElement as HTMLInputElement).type = 'number';
        } else if (element.title.includes('Date')) {
          (newElement as HTMLInputElement).type = 'date';
        } else if (element.title.includes('Color')) {
          (newElement as HTMLInputElement).type = 'color';
        } else if (element.title.includes('Range')) {
          (newElement as HTMLInputElement).type = 'range';
        } else if (element.title.includes('Checkbox')) {
          (newElement as HTMLInputElement).type = 'checkbox';
        } else if (element.title.includes('Radio')) {
          (newElement as HTMLInputElement).type = 'radio';
        } else if (element.title.includes('Submit')) {
          (newElement as HTMLInputElement).type = 'submit';
          (newElement as HTMLInputElement).value = 'Submit';
        } else {
          (newElement as HTMLInputElement).type = 'text';
        }
        break;
      case 'textarea':
        (newElement as HTMLTextAreaElement).placeholder = 'Enter text...';
        (newElement as HTMLTextAreaElement).rows = 4;
        break;
      case 'ul':
      case 'ol':
        for (let i = 0; i < 3; i++) {
          const li = document.createElement('li');
          li.textContent = `Item ${i + 1}`;
          newElement.appendChild(li);
        }
        break;
    }

    // Agregar estilos básicos si no tiene
    if (!newElement.style.padding && ['div', 'section', 'header', 'footer', 'nav', 'article'].includes(element.tag)) {
      newElement.style.padding = '10px';
    }

    // Insertar el elemento después del elemento seleccionado
    this.selectedElement.parentNode?.insertBefore(newElement, this.selectedElement.nextSibling);
    
    console.log(`Element ${element.tag} added`);
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
   * Inicializar TransformPanel
   */
  private initializeTransformPanel(): void {
    const container = this.panelElement?.querySelector('#transform-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.transformPanel) {
        this.transformPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);
      const transform = computedStyle.transform;
      
      // Parsear el transform para obtener valores individuales
      let x = 0, y = 0, rotation = 0;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          x = parseFloat(values[4]) || 0;
          y = parseFloat(values[5]) || 0;
          // Calcular rotación desde la matriz
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        }
      }

      // Crear nueva instancia con propiedades iniciales
      this.transformPanel = new TransformPanel({
        container: container,
        onChange: (props) => {
          this.applyTransformToElement(props);
        }
      });

      // Establecer propiedades iniciales desde el elemento
      this.transformPanel.setProperties({
        x,
        y,
        rotation,
        width: this.selectedElement.offsetWidth,
        height: this.selectedElement.offsetHeight,
        borderRadius: parseFloat(computedStyle.borderRadius) || 0,
        rotationUnit: 'deg',
        sizeUnit: 'px'
      });
    }
  }

  /**
   * Inicializar SpacingPanel
   */
  private initializeSpacingPanel(): void {
    const container = this.panelElement?.querySelector('#spacing-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.spacingPanel) {
        this.spacingPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);
      
      // Helper para parsear valores de spacing
      const parseSpacing = (value: string): { value: number; unit: string } => {
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        return match ? { value: parseFloat(match[1]), unit: match[2] || 'px' } : { value: 0, unit: 'px' };
      };

      // Crear nueva instancia con propiedades iniciales
      this.spacingPanel = new SpacingPanel({
        container: container,
        onChange: (props) => {
          this.applySpacingToElement(props);
        }
      });

      // Establecer propiedades iniciales desde el elemento
      this.spacingPanel.setProperties({
        marginTop: parseSpacing(computedStyle.marginTop),
        marginRight: parseSpacing(computedStyle.marginRight),
        marginBottom: parseSpacing(computedStyle.marginBottom),
        marginLeft: parseSpacing(computedStyle.marginLeft),
        paddingTop: parseSpacing(computedStyle.paddingTop),
        paddingRight: parseSpacing(computedStyle.paddingRight),
        paddingBottom: parseSpacing(computedStyle.paddingBottom),
        paddingLeft: parseSpacing(computedStyle.paddingLeft),
      });
    }
  }

  /**
   * Aplicar spacing al elemento seleccionado
   */
  private applySpacingToElement(props: SpacingProperties): void {
    if (!this.selectedElement) return;

    // Aplicar margins
    this.selectedElement.style.marginTop = `${props.marginTop.value}${props.marginTop.unit}`;
    this.selectedElement.style.marginRight = `${props.marginRight.value}${props.marginRight.unit}`;
    this.selectedElement.style.marginBottom = `${props.marginBottom.value}${props.marginBottom.unit}`;
    this.selectedElement.style.marginLeft = `${props.marginLeft.value}${props.marginLeft.unit}`;
    
    // Aplicar paddings
    this.selectedElement.style.paddingTop = `${props.paddingTop.value}${props.paddingTop.unit}`;
    this.selectedElement.style.paddingRight = `${props.paddingRight.value}${props.paddingRight.unit}`;
    this.selectedElement.style.paddingBottom = `${props.paddingBottom.value}${props.paddingBottom.unit}`;
    this.selectedElement.style.paddingLeft = `${props.paddingLeft.value}${props.paddingLeft.unit}`;
  }

  /**
   * Inicializar TypographyPanel
   */
  private initializeTypographyPanel(): void {
    const container = this.panelElement?.querySelector('#typography-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.typographyPanel) {
        this.typographyPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);

      // Crear nueva instancia con propiedades iniciales
      this.typographyPanel = new TypographyPanel({
        container: container,
        onChange: (props) => {
          this.applyTypographyToElement(props);
        }
      });

      // Establecer propiedades iniciales desde el elemento
      this.typographyPanel.setProperties({
        fontFamily: computedStyle.fontFamily.replace(/["']/g, ''),
        fontWeight: computedStyle.fontWeight,
        fontSize: parseFloat(computedStyle.fontSize),
        fontSizeUnit: 'px',
        color: computedStyle.color,
        lineHeight: computedStyle.lineHeight,
        textAlign: computedStyle.textAlign as any,
        fontStyle: computedStyle.fontStyle as any,
        textDecoration: this.parseTextDecoration(computedStyle.textDecoration),
        useBackgroundAsTextColor: false
      });
    }
  }

  /**
   * Parse text decoration from computed style
   */
  private parseTextDecoration(decoration: string): 'none' | 'underline' | 'line-through' {
    if (decoration.includes('underline')) return 'underline';
    if (decoration.includes('line-through')) return 'line-through';
    return 'none';
  }

  /**
   * Aplicar tipografía al elemento seleccionado
   */
  private applyTypographyToElement(props: TypographyProperties): void {
    if (!this.selectedElement) return;

    // Aplicar font properties
    this.selectedElement.style.fontFamily = props.fontFamily;
    this.selectedElement.style.fontWeight = props.fontWeight;
    this.selectedElement.style.fontSize = `${props.fontSize}${props.fontSizeUnit}`;
    this.selectedElement.style.lineHeight = props.lineHeight;
    this.selectedElement.style.textAlign = props.textAlign;
    this.selectedElement.style.fontStyle = props.fontStyle;
    this.selectedElement.style.textDecoration = props.textDecoration;
    
    // Aplicar color
    if (props.useBackgroundAsTextColor) {
      // Usar background-clip para el efecto de texto con fondo
      this.selectedElement.style.webkitBackgroundClip = 'text';
      this.selectedElement.style.webkitTextFillColor = 'transparent';
    } else {
      this.selectedElement.style.color = props.color;
      this.selectedElement.style.webkitBackgroundClip = '';
      this.selectedElement.style.webkitTextFillColor = '';
    }
  }

  /**
   * Inicializar FiltersPanel
   */
  private initializeFiltersPanel(): void {
    const container = this.panelElement?.querySelector('#filters-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.filtersPanel) {
        this.filtersPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);
      const filterString = computedStyle.filter;

      // Crear nueva instancia con propiedades iniciales
      this.filtersPanel = new FiltersPanel({
        container: container,
        onChange: (props) => {
          this.applyFiltersToElement(props);
        }
      });

      // Parsear filtros existentes
      const filters = this.parseFilters(filterString);
      this.filtersPanel.setProperties(filters);
    }
  }

  /**
   * Parsear string de filtros CSS
   */
  private parseFilters(filterString: string): Partial<FilterProperties> {
    const filters: Partial<FilterProperties> = {};
    
    if (!filterString || filterString === 'none') {
      return {
        blur: 0,
        contrast: 100,
        brightness: 100,
        saturate: 100,
        invert: 0,
        grayscale: 0,
        sepia: 0,
        hueRotate: 0,
        opacity: 100
      };
    }

    // Parsear blur
    const blurMatch = filterString.match(/blur\(([\d.]+)px\)/);
    if (blurMatch) filters.blur = parseFloat(blurMatch[1]);

    // Parsear contrast
    const contrastMatch = filterString.match(/contrast\(([\d.]+)%?\)/);
    if (contrastMatch) filters.contrast = parseFloat(contrastMatch[1]);

    // Parsear brightness
    const brightnessMatch = filterString.match(/brightness\(([\d.]+)%?\)/);
    if (brightnessMatch) filters.brightness = parseFloat(brightnessMatch[1]);

    // Parsear saturate
    const saturateMatch = filterString.match(/saturate\(([\d.]+)%?\)/);
    if (saturateMatch) filters.saturate = parseFloat(saturateMatch[1]);

    // Parsear invert
    const invertMatch = filterString.match(/invert\(([\d.]+)%?\)/);
    if (invertMatch) filters.invert = parseFloat(invertMatch[1]);

    // Parsear grayscale
    const grayscaleMatch = filterString.match(/grayscale\(([\d.]+)%?\)/);
    if (grayscaleMatch) filters.grayscale = parseFloat(grayscaleMatch[1]);

    // Parsear sepia
    const sepiaMatch = filterString.match(/sepia\(([\d.]+)%?\)/);
    if (sepiaMatch) filters.sepia = parseFloat(sepiaMatch[1]);

    // Parsear hue-rotate
    const hueMatch = filterString.match(/hue-rotate\(([\d.]+)deg\)/);
    if (hueMatch) filters.hueRotate = parseFloat(hueMatch[1]);

    // Parsear opacity
    const opacityMatch = filterString.match(/opacity\(([\d.]+)%?\)/);
    if (opacityMatch) filters.opacity = parseFloat(opacityMatch[1]);

    return filters;
  }

  /**
   * Aplicar filtros al elemento seleccionado
   */
  private applyFiltersToElement(props: FilterProperties): void {
    if (!this.selectedElement) return;

    const filters: string[] = [];

    // Agregar cada filtro si no está en su valor por defecto
    if (props.blur > 0) {
      filters.push(`blur(${props.blur}px)`);
    }
    if (props.contrast !== 100) {
      filters.push(`contrast(${props.contrast}%)`);
    }
    if (props.brightness !== 100) {
      filters.push(`brightness(${props.brightness}%)`);
    }
    if (props.saturate !== 100) {
      filters.push(`saturate(${props.saturate}%)`);
    }
    if (props.invert > 0) {
      filters.push(`invert(${props.invert}%)`);
    }
    if (props.grayscale > 0) {
      filters.push(`grayscale(${props.grayscale}%)`);
    }
    if (props.sepia > 0) {
      filters.push(`sepia(${props.sepia}%)`);
    }
    if (props.hueRotate !== 0) {
      filters.push(`hue-rotate(${props.hueRotate}deg)`);
    }
    if (props.opacity !== 100) {
      filters.push(`opacity(${props.opacity}%)`);
    }

    // Aplicar filtros o 'none' si no hay filtros activos
    this.selectedElement.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
  }

  /**
   * Inicializar TextShadowPanel
   */
  private initializeTextShadowPanel(): void {
    const container = this.panelElement?.querySelector('#text-shadow-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.textShadowPanel) {
        this.textShadowPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);
      const textShadowString = computedStyle.textShadow;

      // Crear nueva instancia con propiedades iniciales
      this.textShadowPanel = new TextShadowPanel({
        container: container,
        onChange: (props) => {
          this.applyTextShadowToElement(props);
        }
      });

      // Parsear text shadows existentes
      const shadows = this.parseTextShadow(textShadowString);
      if (shadows.length > 0) {
        this.textShadowPanel.setProperties({ shadows });
      }
    }
  }

  /**
   * Parsear string de text-shadow CSS
   */
  private parseTextShadow(shadowString: string): TextShadowProperties['shadows'] {
    if (!shadowString || shadowString === 'none') {
      return [];
    }

    const shadows: TextShadowProperties['shadows'] = [];
    let nextId = 1;

    // Dividir por comas (pero no las que están dentro de rgb/rgba)
    const shadowParts = shadowString.split(/,(?![^(]*\))/);

    shadowParts.forEach(part => {
      part = part.trim();
      
      // Parsear: offsetX offsetY blur color
      // Ejemplo: "2px 2px 4px rgba(0, 0, 0, 0.5)"
      const rgbaMatch = part.match(/([-\d.]+)px\s+([-\d.]+)px(?:\s+([-\d.]+)px)?\s+(rgba?\([^)]+\))/);
      const hexMatch = part.match(/([-\d.]+)px\s+([-\d.]+)px(?:\s+([-\d.]+)px)?\s+(#[0-9a-fA-F]{3,6})/);
      const namedMatch = part.match(/([-\d.]+)px\s+([-\d.]+)px(?:\s+([-\d.]+)px)?\s+([a-z]+)/);

      let match = rgbaMatch || hexMatch || namedMatch;

      if (match) {
        shadows.push({
          id: `shadow-${nextId++}`,
          offsetX: parseFloat(match[1]),
          offsetY: parseFloat(match[2]),
          blur: match[3] ? parseFloat(match[3]) : 0,
          color: match[4]
        });
      }
    });

    return shadows;
  }

  /**
   * Aplicar text shadows al elemento seleccionado
   */
  private applyTextShadowToElement(props: TextShadowProperties): void {
    if (!this.selectedElement) return;

    if (props.shadows.length === 0) {
      this.selectedElement.style.textShadow = 'none';
    } else {
      const shadowStrings = props.shadows.map(shadow => 
        `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
      );
      this.selectedElement.style.textShadow = shadowStrings.join(', ');
    }
  }

  /**
   * Inicializar BoxShadowPanel
   */
  private initializeBoxShadowPanel(): void {
    const container = this.panelElement?.querySelector('#box-shadow-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.boxShadowPanel) {
        this.boxShadowPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);
      const boxShadowString = computedStyle.boxShadow;

      // Crear nueva instancia
      this.boxShadowPanel = new BoxShadowPanel({
        container: container,
        onChange: (props) => {
          this.applyBoxShadowToElement(props);
        }
      });

      // Establecer el box-shadow actual
      if (boxShadowString && boxShadowString !== 'none') {
        this.boxShadowPanel.setProperties({ currentShadow: boxShadowString });
      }
    }
  }

  /**
   * Aplicar box shadow al elemento seleccionado
   */
  private applyBoxShadowToElement(props: BoxShadowProperties): void {
    if (!this.selectedElement) return;

    this.selectedElement.style.boxShadow = props.currentShadow;
  }

  /**
   * Inicializar PositioningPanel
   */
  private initializePositioningPanel(): void {
    const container = this.panelElement?.querySelector('#positioning-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.positioningPanel) {
        this.positioningPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);

      // Crear nueva instancia con propiedades iniciales
      this.positioningPanel = new PositioningPanel({
        container: container,
        onChange: (props) => {
          this.applyPositioningToElement(props);
        }
      });

      // Establecer valores actuales
      this.positioningPanel.setProperties({
        position: computedStyle.position as PositioningProperties['position'],
        top: computedStyle.top,
        right: computedStyle.right,
        bottom: computedStyle.bottom,
        left: computedStyle.left
      });
    }
  }

  /**
   * Aplicar posicionamiento al elemento seleccionado
   */
  private applyPositioningToElement(props: PositioningProperties): void {
    if (!this.selectedElement) return;

    this.selectedElement.style.position = props.position;
    this.selectedElement.style.top = props.top;
    this.selectedElement.style.right = props.right;
    this.selectedElement.style.bottom = props.bottom;
    this.selectedElement.style.left = props.left;
  }

  /**
   * Inicializar BorderPanel
   */
  private initializeBorderPanel(): void {
    const container = this.panelElement?.querySelector('#border-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.borderPanel) {
        this.borderPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);

      // Parsear border-width
      const borderWidth = computedStyle.borderWidth;
      const widthMatch = borderWidth.match(/(\d+\.?\d*)([a-z%]+)?/);
      const width = widthMatch ? parseFloat(widthMatch[1]) : 1;
      const widthUnit = widthMatch && widthMatch[2] ? widthMatch[2] : 'px';

      // Crear nueva instancia
      this.borderPanel = new BorderPanel({
        container: container,
        onChange: (props) => {
          this.applyBorderToElement(props);
        }
      });

      // Establecer valores actuales
      this.borderPanel.setProperties({
        color: computedStyle.borderColor,
        width: width,
        widthUnit: widthUnit,
        style: computedStyle.borderStyle
      });
    }
  }

  /**
   * Aplicar border al elemento seleccionado
   */
  private applyBorderToElement(props: BorderProperties): void {
    if (!this.selectedElement) return;

    this.selectedElement.style.borderColor = props.color;
    this.selectedElement.style.borderWidth = `${props.width}${props.widthUnit}`;
    this.selectedElement.style.borderStyle = props.style;
  }

  /**
   * Inicializar DisplayPanel
   */
  private initializeDisplayPanel(): void {
    const container = this.panelElement?.querySelector('#display-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.displayPanel) {
        this.displayPanel.destroy();
      }

      // Obtener propiedades actuales del elemento
      const computedStyle = window.getComputedStyle(this.selectedElement);

      // Crear nueva instancia
      this.displayPanel = new DisplayPanel({
        container: container,
        onChange: (props) => {
          this.applyDisplayToElement(props);
        }
      });

      // Establecer valores actuales
      const opacity = parseFloat(computedStyle.opacity) * 100;
      this.displayPanel.setProperties({
        display: computedStyle.display,
        opacity: opacity
      });
    }
  }

  /**
   * Aplicar display al elemento seleccionado
   */
  private applyDisplayToElement(props: DisplayProperties): void {
    if (!this.selectedElement) return;

    this.selectedElement.style.display = props.display;
    this.selectedElement.style.opacity = (props.opacity / 100).toString();
  }

  /**
   * Inicializar BackgroundPanel
   */
  private initializeBackgroundPanel(): void {
    const container = this.panelElement?.querySelector('#background-panel-container') as HTMLElement;
    if (container && this.selectedElement) {
      // Destruir instancia anterior si existe
      if (this.backgroundPanel) {
        this.backgroundPanel.destroy();
      }

      // Crear nueva instancia
      this.backgroundPanel = new BackgroundPanel({
        container: container,
        onChange: (props) => {
          this.applyBackgroundToElement(props);
        }
      });

      // TODO: Parsear background actual del elemento y establecer layers
      // Por ahora comenzamos con un panel vacío
    }
  }

  /**
   * Aplicar background al elemento seleccionado
   */
  private applyBackgroundToElement(props: BackgroundProperties): void {
    if (!this.selectedElement) return;

    // Filtrar solo capas visibles
    const visibleLayers = props.layers.filter(l => l.visible);
    
    if (visibleLayers.length === 0) {
      // Limpiar background si no hay capas visibles
      this.selectedElement.style.backgroundImage = '';
      this.selectedElement.style.backgroundRepeat = '';
      this.selectedElement.style.backgroundBlendMode = '';
      this.selectedElement.style.backgroundSize = '';
      this.selectedElement.style.backgroundPosition = '';
      return;
    }

    // Construir arrays de propiedades CSS compuestas
    const images: string[] = [];
    const repeats: string[] = [];
    const blendModes: string[] = [];
    const sizes: string[] = [];
    const positions: string[] = [];

    visibleLayers.forEach(layer => {
      if (layer.type === 'image') {
        // Capa de imagen
        images.push(layer.imageUrl ? `url(${layer.imageUrl})` : 'none');
        repeats.push(layer.imageRepeat || 'no-repeat');
        blendModes.push('normal');
        sizes.push(layer.imageSize || 'cover');
        positions.push(layer.imagePosition || 'center');
      } else {
        // Capa de color/gradiente desde AdvancedColorPicker
        images.push(layer.backgroundImage || 'transparent');
        repeats.push(layer.backgroundRepeat || 'no-repeat');
        blendModes.push(layer.backgroundBlendMode || 'normal');
        sizes.push(layer.backgroundSize || 'auto');
        positions.push(layer.backgroundPosition || '0% 0%');
      }
    });

    // Aplicar todas las propiedades CSS compuestas
    this.selectedElement.style.backgroundImage = images.join(', ');
    this.selectedElement.style.backgroundRepeat = repeats.join(', ');
    this.selectedElement.style.backgroundBlendMode = blendModes.join(', ');
    this.selectedElement.style.backgroundSize = sizes.join(', ');
    this.selectedElement.style.backgroundPosition = positions.join(', ');
  }

  /**
   * Aplicar transformaciones al elemento seleccionado
   */
  private applyTransformToElement(props: TransformProperties): void {
    if (!this.selectedElement) return;

    const transforms: string[] = [];
    
    // Posición (translate)
    transforms.push(`translate(${props.x}px, ${props.y}px)`);
    
    // Rotación
    transforms.push(`rotate(${props.rotation}${props.rotationUnit})`);
    
    this.selectedElement.style.transform = transforms.join(' ');
    
    // Dimensiones
    if (props.width !== 'auto') {
      this.selectedElement.style.width = `${props.width}${props.sizeUnit}`;
    } else {
      this.selectedElement.style.width = 'auto';
    }
    
    if (props.height !== 'auto') {
      this.selectedElement.style.height = `${props.height}${props.sizeUnit}`;
    } else {
      this.selectedElement.style.height = 'auto';
    }
    
    // Border radius
    this.selectedElement.style.borderRadius = `${props.borderRadius}${props.sizeUnit}`;
    
    // TODO: Emitir evento de cambio cuando se agregue al tipo StyloEditorEvents
    // this.emit('element:styleChanged', {
    //   element: this.selectedElement,
    //   properties: props
    // });
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
    } else if (this.activeTab === 'tailwind') {
      return this.renderTailwindTab();
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
      <div class="inspector-design-content">
        <!-- Selected Element Info -->
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
        
        <!-- Fixed Panels (Always Visible) -->
        <div class="inspector-fixed-panels" style="margin-bottom: 16px;">
          <!-- Transform Panel -->
          <div class="fixed-panel" data-panel="transform" style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; color: #4AEDFF; font-size: 13px; font-weight: 600;">Transform</h4>
            <div id="transform-panel-container"></div>
          </div>
          
          <!-- Spacing Panel -->
          <div class="fixed-panel" data-panel="spacing" style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; color: #4AEDFF; font-size: 13px; font-weight: 600;">Spacing</h4>
            <div id="spacing-panel-container"></div>
          </div>
        </div>
        
        <!-- Collapsible Sections -->
        <div class="inspector-accordion">
          <!-- Positioning Panel -->
          <div class="accordion-item" data-panel="positioning">
            <button class="accordion-header" data-accordion-trigger="positioning">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Positioning</span>
            </button>
            <div class="accordion-content" data-accordion-content="positioning">
              <div id="positioning-panel-container"></div>
            </div>
          </div>
          
          <!-- Border Panel -->
          <div class="accordion-item" data-panel="border">
            <button class="accordion-header" data-accordion-trigger="border">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Border</span>
            </button>
            <div class="accordion-content" data-accordion-content="border">
              <div id="border-panel-container"></div>
            </div>
          </div>
          
          <!-- Display Panel -->
          <div class="accordion-item" data-panel="display">
            <button class="accordion-header" data-accordion-trigger="display">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Display</span>
            </button>
            <div class="accordion-content" data-accordion-content="display">
              <div id="display-panel-container"></div>
            </div>
          </div>
          
          <!-- Background Panel -->
          <div class="accordion-item" data-panel="background">
            <button class="accordion-header" data-accordion-trigger="background">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Background</span>
            </button>
            <div class="accordion-content" data-accordion-content="background">
              <div id="background-panel-container"></div>
            </div>
          </div>
          
          <!-- Typography Panel -->
          <div class="accordion-item" data-panel="typography">
            <button class="accordion-header" data-accordion-trigger="typography">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Typography</span>
            </button>
            <div class="accordion-content" data-accordion-content="typography">
              <div id="typography-panel-container"></div>
            </div>
          </div>
          
          <!-- Filters Panel -->
          <div class="accordion-item" data-panel="filters">
            <button class="accordion-header" data-accordion-trigger="filters">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Filters</span>
            </button>
            <div class="accordion-content" data-accordion-content="filters">
              <div id="filters-panel-container"></div>
            </div>
          </div>
          
          <!-- Text Shadow Panel -->
          <div class="accordion-item" data-panel="text-shadow">
            <button class="accordion-header" data-accordion-trigger="text-shadow">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Text shadow</span>
            </button>
            <div class="accordion-content" data-accordion-content="text-shadow">
              <div id="text-shadow-panel-container"></div>
            </div>
          </div>
          
          <!-- Box Shadow Panel -->
          <div class="accordion-item" data-panel="box-shadow">
            <button class="accordion-header" data-accordion-trigger="box-shadow">
              <svg class="accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span>Box shadow</span>
            </button>
            <div class="accordion-content" data-accordion-content="box-shadow">
              <div id="box-shadow-panel-container"></div>
            </div>
          </div>
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
   * Renderizar pestaña Tailwind
   */
  private renderTailwindTab(): string {
    if (!this.selectedElement) {
      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          text-align: center;
          color: #888;
        ">
          <svg width="64" height="64" viewBox="0 0 54 33" fill="none" style="opacity: 0.3; margin-bottom: 16px;">
            <path fill="#38bdf8" fill-rule="evenodd" d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" clip-rule="evenodd"/>
          </svg>
          <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 16px;">Select an element</h3>
          <p style="margin: 0; font-size: 14px;">Use the inspector to select an element and apply Tailwind classes</p>
        </div>
      `;
    }

    // Combinar clases activas y deshabilitadas
    const activeClasses = Array.from(this.selectedElement.classList);
    const allClasses = [...new Set([...activeClasses, ...Array.from(this.disabledTailwindClasses)])];
    
    return `
      <div class="tailwind-tab-content" style="
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
      ">
        <!-- Search Input -->
        <div style="position: relative;">
          <input 
            type="text" 
            class="tailwind-search-input" 
            placeholder="Search Tailwind classes..."
            style="
              width: 100%;
              padding: 10px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              color: white;
              font-size: 14px;
              outline: none;
              transition: all 0.2s;
            "
          />
          <div class="tailwind-suggestions" style="
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            display: none;
            z-index: 1000;
            backdrop-filter: blur(10px);
          "></div>
        </div>

        <!-- Current Classes -->
        <div style="flex: 1; overflow-y: auto;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          ">
            <h4 style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.7); font-weight: 500;">Applied Classes</h4>
            <span style="font-size: 12px; color: rgba(255, 255, 255, 0.4);">${activeClasses.length} active / ${allClasses.length} total</span>
          </div>
          
          <div class="tailwind-classes-list" style="
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          ">
            ${allClasses.length > 0 ? allClasses.map(cls => {
              const isActive = this.selectedElement?.classList.contains(cls) || false;
              return `
              <div class="tailwind-class-item" data-class="${cls}" data-active="${isActive}" style="
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: ${isActive ? 'rgba(56, 189, 248, 0.1)' : 'rgba(128, 128, 128, 0.05)'};
                border: 1px solid ${isActive ? 'rgba(56, 189, 248, 0.3)' : 'rgba(128, 128, 128, 0.2)'};
                border-radius: 8px;
                font-size: 12px;
                color: ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)'};
                transition: all 0.2s;
                opacity: ${isActive ? '1' : '0.6'};
              ">
                <!-- Custom Checkbox -->
                <label class="toggle-class-checkbox" style="
                  position: relative;
                  display: inline-flex;
                  align-items: center;
                  cursor: pointer;
                  user-select: none;
                ">
                  <input type="checkbox" ${isActive ? 'checked' : ''} style="display: none;" />
                  <span class="checkbox-custom" style="
                    position: relative;
                    width: 16px;
                    height: 16px;
                    border: 2px solid ${isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)'};
                    border-radius: 4px;
                    background: ${isActive ? '#38bdf8' : 'transparent'};
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    ${isActive ? `
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    ` : ''}
                  </span>
                </label>
                
                <span class="class-name" style="flex: 1; font-family: 'Courier New', monospace;">${cls}</span>
                
                <svg class="remove-class-btn" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; cursor: pointer; transition: opacity 0.2s;">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            `}).join('') : `
              <div style="
                width: 100%;
                padding: 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
              ">
                No classes applied yet
              </div>
            `}
          </div>
        </div>

        <!-- Quick Categories -->
        <div style="
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; color: rgba(255, 255, 255, 0.5); font-weight: 500; text-transform: uppercase;">Quick Access</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            <button class="tw-category-btn" data-category="flex" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Flexbox</button>
            <button class="tw-category-btn" data-category="grid" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Grid</button>
            <button class="tw-category-btn" data-category="text" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Text</button>
            <button class="tw-category-btn" data-category="bg" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Background</button>
            <button class="tw-category-btn" data-category="p-" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Padding</button>
            <button class="tw-category-btn" data-category="m-" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.7);
              font-size: 11px;
              cursor: pointer;
              transition: all 0.2s;
            ">Margin</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Filtrar clases de Tailwind según búsqueda
   */
  private filterTailwindClasses(query: string): string[] {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return tailwindClasses
      .filter(cls => cls.toLowerCase().includes(lowerQuery))
      .slice(0, 15); // Limitar a 15 resultados
  }

  /**
   * Obtener el color de una clase de Tailwind para preview
   */
  private getColorPreview(className: string): string | null {
    // Valores arbitrarios: bg-[#ff0000], text-[rgb(255,0,0)]
    const arbitraryMatch = className.match(/\[([^\]]+)\]/);
    if (arbitraryMatch) {
      return arbitraryMatch[1];
    }

    // Lista completa de colores de Tailwind
    const allColors = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
    
    // Regex mejorado que captura:
    // - Utilidades simples: bg-red-500, text-blue-400
    // - Con dirección: border-t-red-500, border-x-blue-400
    // - Con prefijos: ring-offset-red-500, inset-ring-blue-400
    // Patrón: (prefijo-)?(utilidad)(dirección)?-color-shade
    const colorMatch = className.match(
      new RegExp(`^(?:inset-)?(?:bg|text|border|ring|outline|shadow|decoration|accent|caret|fill|stroke|divide|placeholder|from|via|to)(?:-(?:t|r|b|l|x|y|s|e|offset))?-(${allColors})-(\\d+)$`)
    );
    
    if (colorMatch) {
      const colorName = colorMatch[1];
      const shade = colorMatch[2];
      return tailwindColors[colorName]?.[shade] || null;
    }

    return null;
  }

  /**
   * Aplicar clase de Tailwind al elemento seleccionado
   */
  private applyTailwindClass(className: string): void {
    if (!this.selectedElement || !className.trim()) return;

    const trimmedClass = className.trim();
    
    // JIT: Inyectar CSS dinámicamente si la clase no existe
    const injected = injectTailwindClass(trimmedClass);
    
    if (!this.selectedElement.classList.contains(trimmedClass)) {
      this.selectedElement.classList.add(trimmedClass);
      this.renderContent();
      if (this.styleValues) {
        this.emit('styles:updated', this.styleValues);
      }
      
      // Mostrar notificación si se generó la clase dinámicamente
      if (injected && !tailwindClasses.includes(trimmedClass)) {
        this.showJITNotification(trimmedClass);
      }
    }

    // Limpiar input de búsqueda
    const searchInput = this.panelElement?.querySelector('.tailwind-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      this.hideTailwindSuggestions();
    }
  }

  /**
   * Toggle (habilitar/deshabilitar) clase de Tailwind
   */
  private toggleTailwindClass(className: string): void {
    if (!this.selectedElement) return;

    if (this.selectedElement.classList.contains(className)) {
      // Deshabilitar: remover del elemento pero mantener en la lista
      this.selectedElement.classList.remove(className);
      this.disabledTailwindClasses.add(className);
    } else {
      // Habilitar: agregar al elemento y remover de deshabilitadas
      this.selectedElement.classList.add(className);
      this.disabledTailwindClasses.delete(className);
    }

    this.renderContent();
    if (this.styleValues) {
      this.emit('styles:updated', this.styleValues);
    }
  }

  /**
   * Remover clase de Tailwind del elemento seleccionado completamente
   */
  private removeTailwindClass(className: string): void {
    if (!this.selectedElement) return;

    this.selectedElement.classList.remove(className);
    this.disabledTailwindClasses.delete(className); // También remover de deshabilitadas
    this.renderContent();
    if (this.styleValues) {
      this.emit('styles:updated', this.styleValues);
    }
  }

  /**
   * Manejar categoría rápida de Tailwind
   */
  private handleTailwindCategory(category: string): void {
    const searchInput = this.panelElement?.querySelector('.tailwind-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = category;
      searchInput.focus();
      this.showTailwindSuggestions(category);
    }
  }

  /**
   * Mostrar sugerencias de Tailwind
   */
  private showTailwindSuggestions(query: string): void {
    const suggestionsContainer = this.panelElement?.querySelector('.tailwind-suggestions') as HTMLElement;
    if (!suggestionsContainer) return;

    const suggestions = this.filterTailwindClasses(query);

    if (suggestions.length === 0) {
      this.hideTailwindSuggestions();
      return;
    }

    // Resetear índice si está fuera de rango
    if (this.selectedSuggestionIndex >= suggestions.length) {
      this.selectedSuggestionIndex = -1;
    }

    suggestionsContainer.innerHTML = suggestions
      .map((cls, index) => {
        const isSelected = index === this.selectedSuggestionIndex;
        const colorPreview = this.getColorPreview(cls);
        
        return `
        <div class="tailwind-suggestion-item" data-class="${cls}" data-index="${index}" style="
          padding: 10px 12px;
          cursor: pointer;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          background: ${isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent'};
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.15s;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
        ">
          ${colorPreview ? `
            <span class="color-preview" style="
              display: inline-block;
              width: 18px;
              height: 18px;
              min-width: 18px;
              min-height: 18px;
              border-radius: 3px;
              background: ${colorPreview};
              border: 1.5px solid rgba(255, 255, 255, 0.3);
              flex-shrink: 0;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            "></span>
          ` : ''}
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cls}</span>
        </div>
      `})
      .join('');

    suggestionsContainer.style.display = 'block';

    // Scroll automático a la sugerencia seleccionada
    if (this.selectedSuggestionIndex >= 0) {
      const selectedItem = suggestionsContainer.querySelector(`[data-index="${this.selectedSuggestionIndex}"]`) as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /**
   * Actualizar el resaltado de la sugerencia seleccionada
   */
  private updateSuggestionHighlight(): void {
    const suggestionsContainer = this.panelElement?.querySelector('.tailwind-suggestions') as HTMLElement;
    if (!suggestionsContainer) return;

    const items = suggestionsContainer.querySelectorAll('.tailwind-suggestion-item');
    items.forEach((item, index) => {
      const htmlItem = item as HTMLElement;
      if (index === this.selectedSuggestionIndex) {
        htmlItem.style.background = 'rgba(56, 189, 248, 0.25)';
        htmlItem.style.borderLeft = '3px solid #38bdf8';
      } else {
        htmlItem.style.background = 'transparent';
        htmlItem.style.borderLeft = '3px solid transparent';
      }
    });

    // Scroll automático a la sugerencia seleccionada
    if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < items.length) {
      const selectedItem = items[this.selectedSuggestionIndex] as HTMLElement;
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Ocultar sugerencias de Tailwind
   */
  private hideTailwindSuggestions(): void {
    const suggestionsContainer = this.panelElement?.querySelector('.tailwind-suggestions') as HTMLElement;
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
      suggestionsContainer.innerHTML = '';
    }
    this.selectedSuggestionIndex = -1;
  }

  /**
   * Mostrar notificación JIT cuando se genera una clase dinámicamente
   */
  private showJITNotification(className: string): void {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 10002;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    notification.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span><strong>JIT:</strong> Generated <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace;">${className}</code></span>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(10px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  /**
   * Vincular eventos de input de búsqueda de Tailwind
   */
  private bindTailwindSearchEvents(): void {
    const searchInput = this.panelElement?.querySelector('.tailwind-search-input') as HTMLInputElement;
    if (!searchInput) return;

    // Remover listeners antiguos si existen
    if (this.tailwindInputHandler) {
      searchInput.removeEventListener('input', this.tailwindInputHandler);
    }
    if (this.tailwindKeydownHandler) {
      searchInput.removeEventListener('keydown', this.tailwindKeydownHandler);
    }
    if (this.tailwindPanelClickHandler && this.panelElement) {
      this.panelElement.removeEventListener('click', this.tailwindPanelClickHandler);
    }
    if (this.tailwindPanelMouseoverHandler && this.panelElement) {
      this.panelElement.removeEventListener('mouseover', this.tailwindPanelMouseoverHandler);
    }

    // Crear nuevo handler para input
    this.tailwindInputHandler = (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.selectedSuggestionIndex = -1;
      if (query.trim()) {
        this.showTailwindSuggestions(query);
      } else {
        this.hideTailwindSuggestions();
      }
    };
    searchInput.addEventListener('input', this.tailwindInputHandler);

    // Crear nuevo handler para keydown
    this.tailwindKeydownHandler = (e) => {
      const suggestionsContainer = this.panelElement?.querySelector('.tailwind-suggestions') as HTMLElement;
      const isVisible = suggestionsContainer && suggestionsContainer.style.display !== 'none';
      
      if (!isVisible) {
        // Si no hay sugerencias visibles, solo manejar Enter para aplicar directamente
        if (e.key === 'Enter' && searchInput.value.trim()) {
          e.preventDefault();
          this.applyTailwindClass(searchInput.value);
        }
        return;
      }

      const suggestions = suggestionsContainer?.querySelectorAll('.tailwind-suggestion-item') || [];
      const suggestionsCount = suggestions.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % suggestionsCount;
          this.updateSuggestionHighlight();
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.selectedSuggestionIndex = this.selectedSuggestionIndex <= 0 
            ? suggestionsCount - 1 
            : this.selectedSuggestionIndex - 1;
          this.updateSuggestionHighlight();
          break;

        case 'Enter':
          e.preventDefault();
          if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < suggestionsCount) {
            // Aplicar la sugerencia seleccionada
            const selectedItem = suggestions[this.selectedSuggestionIndex] as HTMLElement;
            const className = selectedItem.getAttribute('data-class');
            if (className) {
              this.applyTailwindClass(className);
            }
          } else if (searchInput.value.trim()) {
            // Si no hay selección, aplicar el texto directamente
            this.applyTailwindClass(searchInput.value);
          }
          break;

        case 'Escape':
          e.preventDefault();
          this.hideTailwindSuggestions();
          searchInput.blur();
          break;

        case 'Tab':
          // Permitir Tab para navegar, pero cerrar sugerencias
          this.hideTailwindSuggestions();
          break;
      }
    };
    searchInput.addEventListener('keydown', this.tailwindKeydownHandler);

    // Crear handler para clicks en sugerencias
    this.tailwindPanelClickHandler = (e) => {
      const target = e.target as HTMLElement;
      const suggestionItem = target.closest('.tailwind-suggestion-item') as HTMLElement;
      
      if (suggestionItem) {
        const className = suggestionItem.getAttribute('data-class');
        if (className) {
          this.applyTailwindClass(className);
        }
      }
    };
    if (this.panelElement) {
      this.panelElement.addEventListener('click', this.tailwindPanelClickHandler);
    }

    // Crear handler para hover en sugerencias
    this.tailwindPanelMouseoverHandler = (e) => {
      const target = e.target as HTMLElement;
      const suggestionItem = target.closest('.tailwind-suggestion-item') as HTMLElement;
      
      if (suggestionItem) {
        const index = parseInt(suggestionItem.getAttribute('data-index') || '-1');
        if (index >= 0) {
          this.selectedSuggestionIndex = index;
          this.updateSuggestionHighlight();
        }
      }
    };
    if (this.panelElement) {
      this.panelElement.addEventListener('mouseover', this.tailwindPanelMouseoverHandler);
    }

    // Cerrar sugerencias al hacer click fuera
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tailwind-search-input') && !target.closest('.tailwind-suggestions')) {
        this.hideTailwindSuggestions();
      }
    });
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
      } else if (target.closest('.tab-btn')) {
        const tabBtn = target.closest('.tab-btn') as HTMLElement;
        const tab = tabBtn.getAttribute('data-tab') as TabType;
        if (tab) {
          this.setActiveTab(tab);
        }
      } else if (target.classList.contains('inspector-toggle-btn') || target.closest('.inspector-toggle-btn')) {
          // Emitir evento de toggle del inspector
          this.emit('inspector:toggle', true);
        }
      
      // Tailwind tab: Toggle clase (checkbox)
      if (target.closest('.toggle-class-checkbox')) {
        e.preventDefault(); // Prevenir el comportamiento por defecto
        const classItem = target.closest('.tailwind-class-item') as HTMLElement;
        const className = classItem?.getAttribute('data-class');
        if (className && this.selectedElement) {
          this.toggleTailwindClass(className);
        }
      }

      // Tailwind tab: Remover clase
      if (target.closest('.remove-class-btn')) {
        e.stopPropagation(); // Prevenir que active el toggle
        const classItem = target.closest('.tailwind-class-item') as HTMLElement;
        const className = classItem?.getAttribute('data-class');
        if (className && this.selectedElement) {
          this.removeTailwindClass(className);
        }
      }

      // Tailwind tab: Categoría rápida
      if (target.closest('.tw-category-btn')) {
        const categoryBtn = target.closest('.tw-category-btn') as HTMLElement;
        const category = categoryBtn?.getAttribute('data-category');
        if (category) {
          this.handleTailwindCategory(category);
        }
      }

      // Tailwind tab: Click en sugerencia
      if (target.closest('.tailwind-suggestion-item')) {
        const suggestionItem = target.closest('.tailwind-suggestion-item') as HTMLElement;
        const className = suggestionItem?.getAttribute('data-class');
        if (className && this.selectedElement) {
          this.applyTailwindClass(className);
        }
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
//this.panelElement.style.backgroundColor = '#121315';
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
    
    // Inicializar eventos de búsqueda de Tailwind cuando se cambie a la pestaña Tailwind
    if (tab === 'tailwind' && !this.isMinimized) {
      setTimeout(() => {
        this.bindTailwindSearchEvents();
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
    
    // Si el panel está minimizado y tenemos un elemento, expandirlo
    if (this.isMinimized && element) {
      this.expand();
    }
    
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
   * Abrir el ElementSelector (mostrar el dropdown debajo del botón +)
   */
  public openElementSelector(): void {
    if (!this.elementSelector) return;

    // Buscar el botón add del inspector
    const addButton = document.querySelector('.stylo-add-button') as HTMLElement;
    if (!addButton) return;

    // Obtener contenedor flotante
    const container = (this.elementSelector as any)._floatingContainer as HTMLElement;
    if (!container) return;

    // Obtener posición del botón +
    const buttonRect = addButton.getBoundingClientRect();
    
    // Posicionar el dropdown debajo del botón +
    const top = buttonRect.bottom + 8; // 8px de espacio
    const left = buttonRect.left - 180; // Centrado aproximado (considerando que el dropdown tiene ~400px)
    
    container.style.top = `${top}px`;
    container.style.left = `${Math.max(10, left)}px`;
    container.style.display = 'block';

    // Focus en el input de búsqueda si existe
    const searchInput = container.querySelector('.element-selector-search') as HTMLInputElement;
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  /**
   * Destruir el panel
   */
  override destroy(): void {
    // Limpiar ElementSelector y su contenedor flotante
    if (this.elementSelector) {
      const floatingContainer = (this.elementSelector as any)._floatingContainer as HTMLElement;
      if (floatingContainer && floatingContainer.parentNode) {
        floatingContainer.parentNode.removeChild(floatingContainer);
      }
      this.elementSelector.destroy();
      this.elementSelector = null;
    }
    
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