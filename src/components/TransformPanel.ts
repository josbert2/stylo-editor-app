/**
 * TransformPanel - Panel de propiedades de transformación para elementos
 * Maneja posición (X, Y), rotación, dimensiones (W, H) y border-radius (R)
 */

export interface TransformProperties {
  x: number;
  y: number;
  rotation: number;
  width: number | 'auto';
  height: number | 'auto';
  borderRadius: number;
  rotationUnit: 'deg' | 'rad' | 'turn';
  sizeUnit: 'px' | '%' | 'rem' | 'em' | 'vw' | 'vh';
}

export class TransformPanel {
  private container: HTMLElement;
  private properties: TransformProperties;
  private onChange?: (props: TransformProperties) => void;

  constructor(options: {
    container?: HTMLElement;
    onChange?: (props: TransformProperties) => void;
  } = {}) {
    this.container = options.container || document.createElement('div');
    this.onChange = options.onChange;
    
    // Propiedades iniciales
    this.properties = {
      x: 0,
      y: 0,
      rotation: 0,
      width: 'auto',
      height: 'auto',
      borderRadius: 0,
      rotationUnit: 'deg',
      sizeUnit: 'px'
    };

    this.render();
    this.attachEventListeners();
  }

  /**
   * Renderiza la estructura HTML del panel
   */
  private render(): void {
    this.container.className = 'transform-panel cc:p-3 cc:space-y-3 cc:rounded-lg cc:bg-secondary-bg';
    
    this.container.innerHTML = `
      <!-- Primera fila: X, Y, Rotación -->
      <div class="cc:grid cc:grid-cols-3 cc:gap-2 cc:text-xs">
        <!-- X Position -->
        <div class="cc:flex cc:items-center">
          <div class="cc:flex cc:gap-1 cc:items-center">
            <span class="cc:text-gray-400">X</span>
            <input 
              type="text" 
              data-property="x"
              class="cc:text-gray-300 cc:bg-transparent cc:border-none cc:outline-none cc:w-12 cc:text-xs"
              value="${this.properties.x}"
            >
          </div>
        </div>

        <!-- Y Position -->
        <div class="cc:flex cc:items-center">
          <div class="cc:flex cc:gap-1 cc:items-center">
            <span class="cc:text-gray-400">Y</span>
            <input 
              type="text" 
              data-property="y"
              class="cc:text-gray-300 cc:bg-transparent cc:border-none cc:outline-none cc:w-12 cc:text-xs"
              value="${this.properties.y}"
            >
          </div>
        </div>

        <!-- Rotation -->
        <div class="cc:flex cc:items-center">
          <label class="cc:mr-2 cc:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5"></path>
            </svg>
          </label>
          <div class="cc:flex cc:relative cc:rounded-lg cc:border-2 cc:border-gray-700">
            <input 
              type="text" 
              data-property="rotation"
              class="cc:flex-1 cc:px-2 cc:py-1 cc:w-full cc:text-xs cc:text-white cc:bg-transparent cc:outline-none"
              placeholder="0"
              value="${this.properties.rotation}"
            >
            <button 
              type="button"
              data-select="rotationUnit"
              class="cc:w-[60px] cc:bg-transparent cc:text-white cc:px-2 cc:py-1 cc:rounded-r cc:text-xs cc:border-none focus:cc:border-none focus:cc:outline-none cc:flex cc:items-center cc:justify-between cc:cursor-pointer hover:cc:bg-white/5"
            >
              <span data-value="rotationUnit">${this.properties.rotationUnit}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cc:text-gray-400 cc:shrink-0">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Segunda fila: Width, Height, Border Radius -->
      <div class="cc:grid cc:grid-cols-3 cc:gap-2 cc:text-xs">
        <!-- Width -->
        <div class="cc:space-y-1">
          <label class="cc:text-gray-400 cc:text-xs">W</label>
          <div class="cc:flex cc:relative cc:rounded-lg cc:border-2 cc:border-gray-700">
            <input 
              type="text" 
              data-property="width"
              class="cc:flex-1 cc:px-2 cc:py-1 cc:w-full cc:text-xs cc:text-white cc:bg-transparent cc:border-none focus:cc:border-green-500 focus:cc:outline-none"
              placeholder="auto"
              value="${this.properties.width}"
            >
            <button 
              type="button"
              data-select="sizeUnit"
              data-target="width"
              class="cc:w-[60px] cc:bg-transparent cc:text-white cc:px-2 cc:py-1 cc:rounded-r cc:text-xs cc:border-none focus:cc:border-green-500 focus:cc:outline-none cc:flex cc:items-center cc:justify-between cc:cursor-pointer hover:cc:bg-white/5"
            >
              <span data-value="sizeUnit-width">${this.properties.sizeUnit}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cc:text-gray-400 cc:shrink-0">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Height -->
        <div class="cc:space-y-1">
          <label class="cc:text-gray-400 cc:text-xs">H</label>
          <div class="cc:flex cc:relative cc:rounded-lg cc:border-2 cc:border-gray-700">
            <input 
              type="text" 
              data-property="height"
              class="cc:flex-1 cc:px-2 cc:py-1 cc:w-full cc:text-xs cc:text-white cc:bg-transparent cc:border-none focus:cc:border-green-500 focus:cc:outline-none"
              placeholder="auto"
              value="${this.properties.height}"
            >
            <button 
              type="button"
              data-select="sizeUnit"
              data-target="height"
              class="cc:w-[60px] cc:bg-transparent cc:text-white cc:px-2 cc:py-1 cc:rounded-r cc:text-xs cc:border-none focus:cc:border-green-500 focus:cc:outline-none cc:flex cc:items-center cc:justify-between cc:cursor-pointer hover:cc:bg-white/5"
            >
              <span data-value="sizeUnit-height">${this.properties.sizeUnit}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cc:text-gray-400 cc:shrink-0">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Border Radius -->
        <div class="cc:space-y-1">
          <label class="cc:text-gray-400 cc:text-xs">R</label>
          <div class="cc:flex cc:relative cc:rounded-lg cc:border-2 cc:border-gray-700">
            <input 
              type="text" 
              data-property="borderRadius"
              class="cc:flex-1 cc:px-2 cc:py-1 cc:w-full cc:text-xs cc:text-white cc:bg-transparent cc:border-none focus:cc:border-green-500 focus:cc:outline-none"
              placeholder="0"
              value="${this.properties.borderRadius}"
            >
            <button 
              type="button"
              data-select="sizeUnit"
              data-target="borderRadius"
              class="cc:w-[60px] cc:bg-transparent cc:text-white cc:px-2 cc:py-1 cc:rounded-r cc:text-xs cc:border-none focus:cc:border-green-500 focus:cc:outline-none cc:flex cc:items-center cc:justify-between cc:cursor-pointer hover:cc:bg-white/5"
            >
              <span data-value="sizeUnit-borderRadius">${this.properties.sizeUnit}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cc:text-gray-400 cc:shrink-0">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Dropdown para selectores de unidades (oculto por defecto) -->
      <div 
        data-dropdown="units" 
        class="cc:hidden cc:absolute cc:bg-gray-800 cc:rounded-md cc:shadow-lg cc:mt-1 cc:py-1 cc:z-50"
      ></div>
    `;
  }

  /**
   * Adjunta event listeners para inputs y selectores
   */
  private attachEventListeners(): void {
    // Listeners para inputs de texto
    const inputs = this.container.querySelectorAll('input[data-property]');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => this.handleInputChange(e as InputEvent));
      input.addEventListener('blur', (e) => this.handleInputBlur(e as FocusEvent));
    });

    // Listeners para botones de selector de unidades
    const selectButtons = this.container.querySelectorAll('button[data-select]');
    selectButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleSelectClick(e as MouseEvent));
    });
  }

  /**
   * Maneja cambios en los inputs
   */
  private handleInputChange(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    const property = input.dataset.property as keyof TransformProperties;
    
    if (!property) return;

    const rawValue = input.value;
    
    // Convertir a número si no es 'auto'
    if (rawValue !== 'auto' && rawValue !== '') {
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        (this.properties[property] as number) = numValue;
        return;
      }
    }

    // Si es 'auto', asignarlo a propiedades que lo permiten
    if (property === 'width' || property === 'height') {
      (this.properties[property] as number | 'auto') = rawValue === 'auto' ? 'auto' : parseFloat(rawValue) || 0;
    }
  }

  /**
   * Maneja el evento blur de inputs (cuando pierde foco)
   */
  private handleInputBlur(event: FocusEvent): void {
    // Notificar cambios cuando el input pierde foco
    if (this.onChange) {
      this.onChange({ ...this.properties });
    }
  }

  /**
   * Maneja clicks en selectores de unidades
   */
  private handleSelectClick(event: MouseEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    const selectType = button.dataset.select;
    
    if (selectType === 'rotationUnit') {
      this.showUnitDropdown(button, ['deg', 'rad', 'turn'], (unit) => {
        this.properties.rotationUnit = unit as 'deg' | 'rad' | 'turn';
        this.updateSelectValue(button, unit);
        if (this.onChange) this.onChange({ ...this.properties });
      });
    } else if (selectType === 'sizeUnit') {
      this.showUnitDropdown(button, ['px', '%', 'rem', 'em', 'vw', 'vh'], (unit) => {
        this.properties.sizeUnit = unit as 'px' | '%' | 'rem' | 'em' | 'vw' | 'vh';
        this.updateSelectValue(button, unit);
        if (this.onChange) this.onChange({ ...this.properties });
      });
    }
  }

  /**
   * Muestra dropdown de selección de unidades
   */
  private showUnitDropdown(
    button: HTMLElement, 
    options: string[], 
    onSelect: (value: string) => void
  ): void {
    const dropdown = this.container.querySelector('[data-dropdown="units"]') as HTMLElement;
    if (!dropdown) return;

    // Crear opciones
    dropdown.innerHTML = options.map(opt => `
      <div class="px-3 py-2 hover:bg-[#3a3a3a] cursor-pointer text-xs text-white" data-option="${opt}">
        ${opt}
      </div>
    `).join('');

    // Posicionar dropdown
    const rect = button.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    dropdown.style.left = `${rect.left - containerRect.left}px`;
    dropdown.style.top = `${rect.bottom - containerRect.top}px`;
    dropdown.classList.remove('hidden');

    // Event listeners para opciones
    const optionElements = dropdown.querySelectorAll('[data-option]');
    optionElements.forEach(opt => {
      opt.addEventListener('click', () => {
        const value = (opt as HTMLElement).dataset.option;
        if (value) {
          onSelect(value);
          dropdown.classList.add('hidden');
        }
      });
    });

    // Cerrar dropdown al hacer click fuera
    const closeDropdown = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node) && !button.contains(e.target as Node)) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeDropdown);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 0);
  }

  /**
   * Actualiza el valor mostrado en un selector
   */
  private updateSelectValue(button: HTMLElement, value: string): void {
    const valueSpan = button.querySelector('[data-value]');
    if (valueSpan) {
      valueSpan.textContent = value;
    }
  }

  /**
   * Actualiza las propiedades del panel
   */
  public setProperties(props: Partial<TransformProperties>): void {
    this.properties = { ...this.properties, ...props };
    this.updateInputs();
  }

  /**
   * Actualiza los valores de los inputs
   */
  private updateInputs(): void {
    const inputs = this.container.querySelectorAll('input[data-property]');
    inputs.forEach(input => {
      const property = (input as HTMLInputElement).dataset.property as keyof TransformProperties;
      if (property) {
        (input as HTMLInputElement).value = String(this.properties[property]);
      }
    });
  }

  /**
   * Obtiene las propiedades actuales
   */
  public getProperties(): TransformProperties {
    return { ...this.properties };
  }

  /**
   * Obtiene el elemento DOM del panel
   */
  public getElement(): HTMLElement {
    return this.container;
  }

  /**
   * Destruye el panel y limpia event listeners
   */
  public destroy(): void {
    this.container.remove();
  }
}
