import { EventEmitter } from '../utils/EventEmitter';

export interface FancyButtonOptions {
  text?: string;
  subtext?: string;
  variant?: 'primary' | 'secondary' | 'cancel' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

export class FancyButton extends EventEmitter<{ click: void }> {
  private container: HTMLElement;
  private buttonElement: HTMLButtonElement | null = null;
  private options: FancyButtonOptions;

  constructor(container: HTMLElement, options: FancyButtonOptions = {}) {
    super();
    this.container = container;
    this.options = {
      text: 'Button',
      subtext: '',
      variant: 'primary',
      size: 'medium',
      disabled: false,
      ...options
    };

    this.createButton();
    this.bindEvents();
  }

  private createButton(): void {
    // Crear el contenedor del botón
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'fancy-button-container';
    
    // Crear el botón
    this.buttonElement = document.createElement('button');
    this.buttonElement.className = `fancy-button fancy-button--${this.options.variant} fancy-button--${this.options.size}`;
    this.buttonElement.disabled = this.options.disabled || false;

    // Crear el contenido interno
    const innerDiv = document.createElement('div');
    innerDiv.className = 'fancy-button__inner';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'fancy-button__text';
    textSpan.textContent = this.options.text || 'Button';
    
    innerDiv.appendChild(textSpan);
    
    if (this.options.subtext) {
      const subtextSpan = document.createElement('span');
      subtextSpan.className = 'fancy-button__subtext';
      subtextSpan.textContent = this.options.subtext;
      innerDiv.appendChild(subtextSpan);
    }

    this.buttonElement.appendChild(innerDiv);
    buttonContainer.appendChild(this.buttonElement);

    // Agregar los estilos CSS
    this.injectStyles();
    
    // Agregar al contenedor
    this.container.appendChild(buttonContainer);
  }

  private injectStyles(): void {
    // Verificar si ya existen los estilos
    if (document.getElementById('fancy-button-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'fancy-button-styles';
    styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

      @layer properties {
        @property --button-shadow-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --button-shadow-spread {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --button-bg-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --button-after-opacity {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --coord-y {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
        @property --coord-x {
          syntax: "<number>";
          inherits: true;
          initial-value: 0;
        }
      }

      .fancy-button-container {
        --debug: 0;
        
        --context-bg: hsl(0deg 0% 99%);
        --bg-container: hsl(0deg 0% 96%);
        --bg-button: hsl(179deg 7% 97%);
        --color-button: hsl(359deg 1% 35%);
        
        --button-shadow-opacity: 0;
        --button-shadow-spread: 0;
        --button-bg-opacity: 0;
        --button-after-opacity: 0;
        --btn-border-color: transparent;
        --btn-border-size: 0;
        --btn-inner-shadow: 1;
        
        --container-border-color: rgb(0 0 0 / 8%);
        --container-box-shadow-color: rgb(0 0 0 / 12%);
        
        --timing: .3s;
        --transitions: 
          --coord-y .075s linear,
          --coord-x .075s linear, 
          --button-shadow-opacity var(--timing) ease,
          --button-shadow-spread var(--timing) ease,
          --button-bg-opacity var(--timing) ease,
          --button-after-opacity var(--timing) ease,
          opacity var(--timing) ease, 
          box-shadow var(--timing) ease, 
          background-image var(--timing) ease;

        display: inline-block;
        font-family: "Inter", sans-serif;
      }

      .fancy-button {
        all: unset;
        --coord-y: 0;
        --coord-x: 0;

        --color-red: color(display-p3 0.95 0.06 0.02 / var(--button-bg-opacity));
        --color-orange: color(display-p3 0.97 0.61 0.07 / var(--button-bg-opacity));
        --color-olive: color(display-p3 0.83 0.87 0.04 / var(--button-bg-opacity));
        --color-lime: color(display-p3 0.31 0.89 0.05 / var(--button-bg-opacity));
        --color-teal: color(display-p3 0.12 0.88 0.88 / var(--button-bg-opacity));
        --color-tealer: color(display-p3 0.15 0.8 0.93 / var(--button-bg-opacity));
        --color-blue: color(display-p3 0.14 0.47 0.99 / var(--button-bg-opacity));
        --color-purple: color(display-p3 0.38 0.14 0.99 / var(--button-bg-opacity));
        --color-purpler: color(display-p3 0.73 0.04 0.94 / var(--button-bg-opacity));
        --color-pink: color(display-p3 0.93 0.03 0.85 / var(--button-bg-opacity));

        cursor: pointer;
        color: var(--color-button);
        border-radius: .80em;
        font-weight: 600;
        box-shadow: 0 8px calc(var(--button-shadow-spread) * 1px) -8px rgb(0 0 0 / calc(var(--button-shadow-opacity) * 1%));
        border: 1px solid var(--btn-border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background-color: rgb(0 0 0 / 6%);
        background-image: conic-gradient(from 180deg, 
          var(--color-red) 0%,
          var(--color-orange) 10%,
          var(--color-olive) 20%,
          var(--color-lime) 30%,
          var(--color-teal) 40%,
          var(--color-tealer) 50%,
          var(--color-blue) 60%,
          var(--color-purple) 70%,
          var(--color-purpler) 80%,
          var(--color-pink) 90%,
          var(--color-red) 100%
        );
        transition: var(--transitions);
        
        /* Fallback para navegadores que no soportan display-p3 */
        @supports not (color: color(display-p3 0.93 0.03 0.85)) {
          --color-red: hsl(3 93% 48% / var(--button-bg-opacity));
          --color-orange: hsl(26 91% 52% / var(--button-bg-opacity));
          --color-olive: hsl(65 89% 46% / var(--button-bg-opacity));
          --color-lime: hsl(122 86% 48% / var(--button-bg-opacity));
          --color-teal: hsl(181 78% 50% / var(--button-bg-opacity));
          --color-tealer: hsl(193 76% 53% / var(--button-bg-opacity));
          --color-blue: hsl(219 95% 56% / var(--button-bg-opacity));
          --color-purple: hsl(269 95% 56% / var(--button-bg-opacity));
          --color-purpler: hsl(292 93% 47% / var(--button-bg-opacity));
          --color-pink: hsl(327 96% 47% / var(--button-bg-opacity));
        }
      }

      .fancy-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(
          circle at calc(var(--coord-x) * 1px) calc(var(--coord-y) * 1px),
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.05) 40%,
          transparent 70%
        );
        opacity: var(--button-after-opacity);
        transition: opacity var(--timing) ease;
        pointer-events: none;
      }

      .fancy-button:hover {
        --button-shadow-opacity: 25;
        --button-shadow-spread: 20;
        --button-bg-opacity: 0.8;
        --button-after-opacity: 1;
        transform: translateY(-2px);
      }

      .fancy-button:active {
        transform: translateY(0px);
        --button-shadow-spread: 10;
      }

      .fancy-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      .fancy-button__inner {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 0.7em;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .fancy-button__text {
        font-weight: 600;
        font-size: 14px;
        color: var(--color-button);
      }

      .fancy-button__subtext {
        font-size: 11px;
        opacity: 0.7;
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }

      /* Variantes de tamaño */
      .fancy-button--small .fancy-button__inner {
        padding: 8px 16px;
      }

      .fancy-button--small .fancy-button__text {
        font-size: 12px;
      }

      .fancy-button--large .fancy-button__inner {
        padding: 16px 32px;
      }

      .fancy-button--large .fancy-button__text {
        font-size: 16px;
      }

      /* Variantes de color */
      .fancy-button--cancel {
        --color-button: hsl(0deg 0% 45%);
      }

      .fancy-button--success {
        --color-button: hsl(122deg 39% 35%);
      }

      .fancy-button--warning {
        --color-button: hsl(35deg 91% 35%);
      }

      .fancy-button--danger {
        --color-button: hsl(0deg 65% 45%);
      }

      .fancy-button--secondary {
        --color-button: hsl(220deg 13% 35%);
      }
    `;

    document.head.appendChild(styleElement);
  }

  private bindEvents(): void {
    if (!this.buttonElement) return;

    // Evento de seguimiento del cursor
    this.buttonElement.addEventListener('pointermove', (event) => {
      const { x, y } = this.getCursorPosition(this.buttonElement!, event);
      this.buttonElement!.style.setProperty('--coord-x', x.toString());
      this.buttonElement!.style.setProperty('--coord-y', y.toString());
    });

    // Evento cuando el cursor sale del botón
    this.buttonElement.addEventListener('pointerleave', () => {
      this.buttonElement!.style.setProperty('--coord-x', '0');
      this.buttonElement!.style.setProperty('--coord-y', '0');
    });

    // Evento de click
    this.buttonElement.addEventListener('click', () => {
      if (!this.options.disabled) {
        this.emit('click');
        if (this.options.onClick) {
          this.options.onClick();
        }
      }
    });
  }

  private getCursorPosition(element: HTMLElement, event: PointerEvent): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = event.clientX - centerX;
    const y = centerY - event.clientY;
    return { x, y };
  }

  // Métodos públicos para actualizar el botón
  public setText(text: string): void {
    this.options.text = text;
    const textElement = this.buttonElement?.querySelector('.fancy-button__text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  public setSubtext(subtext: string): void {
    this.options.subtext = subtext;
    const innerElement = this.buttonElement?.querySelector('.fancy-button__inner');
    if (!innerElement) return;

    let subtextElement = innerElement.querySelector('.fancy-button__subtext');
    
    if (subtext) {
      if (!subtextElement) {
        subtextElement = document.createElement('span');
        subtextElement.className = 'fancy-button__subtext';
        innerElement.appendChild(subtextElement);
      }
      subtextElement.textContent = subtext;
    } else if (subtextElement) {
      subtextElement.remove();
    }
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    if (this.buttonElement) {
      this.buttonElement.disabled = disabled;
    }
  }

  public setVariant(variant: FancyButtonOptions['variant']): void {
    if (!this.buttonElement || !variant) return;
    
    // Remover clases de variante anteriores
    this.buttonElement.className = this.buttonElement.className
      .replace(/fancy-button--\w+/g, '')
      .trim();
    
    // Agregar nueva variante
    this.buttonElement.classList.add(`fancy-button--${variant}`);
    this.options.variant = variant;
  }

  public setSize(size: FancyButtonOptions['size']): void {
    if (!this.buttonElement || !size) return;
    
    // Remover clases de tamaño anteriores
    this.buttonElement.className = this.buttonElement.className
      .replace(/fancy-button--(?:small|medium|large)/g, '')
      .trim();
    
    // Agregar nuevo tamaño
    this.buttonElement.classList.add(`fancy-button--${size}`);
    this.options.size = size;
  }

  public destroy(): void {
    if (this.buttonElement) {
      this.buttonElement.remove();
      this.buttonElement = null;
    }
  }
}