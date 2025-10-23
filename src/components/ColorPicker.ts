/**
 * ColorPicker - Advanced color picker using vanilla-colorful
 * Modern and feature-rich color picker component
 */

import { HexColorPicker } from 'vanilla-colorful';

export interface ColorPickerOptions {
  container: HTMLElement;
  defaultColor?: string;
  onChange?: (color: string) => void;
  onSave?: (color: string) => void;
}

export class ColorPicker {
  private container: HTMLElement;
  private button: HTMLButtonElement;
  private popup: HTMLDivElement | null = null;
  private picker: HexColorPicker | null = null;
  private currentColor: string;
  private onChange?: (color: string) => void;
  private onSave?: (color: string) => void;

  constructor(options: ColorPickerOptions) {
    this.container = options.container;
    this.onChange = options.onChange;
    this.onSave = options.onSave;
    this.currentColor = this.rgbToHex(options.defaultColor || '#000000');

    this.button = this.createButton();
    this.attachEvents();
  }

  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-picker-button';
    button.style.backgroundColor = this.currentColor;
    
    this.container.appendChild(button);
    return button;
  }

  private attachEvents(): void {
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopup();
    });

    // Cerrar popup al hacer click fuera
    document.addEventListener('click', (e) => {
      if (this.popup && !this.popup.contains(e.target as Node) && e.target !== this.button) {
        this.closePopup();
      }
    });
  }

  private togglePopup(): void {
    if (this.popup) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  private openPopup(): void {
    // Crear popup
    this.popup = document.createElement('div');
    this.popup.className = 'color-picker-popup';

    // Crear el picker de vanilla-colorful
    this.picker = new HexColorPicker();
    this.picker.color = this.currentColor;
    
    // Event listener para cambios de color
    this.picker.addEventListener('color-changed', (event: Event) => {
      const customEvent = event as CustomEvent;
      const hexColor = customEvent.detail.value;
      this.currentColor = hexColor;
      this.button.style.backgroundColor = hexColor;
      
      if (this.onChange) {
        this.onChange(this.hexToRgb(hexColor));
      }
    });

    // Agregar picker al popup
    this.popup.appendChild(this.picker);

    // Agregar input de texto para hex
    const inputContainer = document.createElement('div');
    inputContainer.className = 'color-picker-input-container';
    
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'color-picker-hex-input';
    hexInput.value = this.currentColor;
    hexInput.placeholder = '#000000';
    
    hexInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        this.currentColor = value;
        this.button.style.backgroundColor = value;
        if (this.picker) this.picker.color = value;
        
        if (this.onChange) {
          this.onChange(this.hexToRgb(value));
        }
      }
    });

    inputContainer.appendChild(hexInput);
    this.popup.appendChild(inputContainer);

    // Posicionar popup
    document.body.appendChild(this.popup);
    this.positionPopup();
  }

  private positionPopup(): void {
    if (!this.popup) return;

    const buttonRect = this.button.getBoundingClientRect();
    const popupRect = this.popup.getBoundingClientRect();

    let top = buttonRect.bottom + 8;
    let left = buttonRect.left;

    // Ajustar si se sale de la ventana
    if (left + popupRect.width > window.innerWidth) {
      left = window.innerWidth - popupRect.width - 8;
    }

    if (top + popupRect.height > window.innerHeight) {
      top = buttonRect.top - popupRect.height - 8;
    }

    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
  }

  private closePopup(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
      this.picker = null;
      
      if (this.onSave) {
        this.onSave(this.hexToRgb(this.currentColor));
      }
    }
  }



  private rgbToHex(rgb: string): string {
    // Si ya es hex, retornar
    if (rgb.startsWith('#')) return rgb;
    
    // Extraer valores RGB
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgb(0, 0, 0)';
    
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }

  public setColor(color: string): void {
    this.currentColor = this.rgbToHex(color);
    this.button.style.backgroundColor = this.currentColor;
    if (this.picker) {
      this.picker.color = this.currentColor;
    }
  }

  public getColor(): string {
    return this.hexToRgb(this.currentColor);
  }

  public destroy(): void {
    this.closePopup();
    this.button.remove();
  }
}
