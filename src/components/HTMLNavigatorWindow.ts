import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';
import { HTMLNavigator } from './HTMLNavigator';

export interface HTMLNavigatorWindowOptions {
  position?: { x: number; y: number };
  onClose?: () => void;
}

export class HTMLNavigatorWindow extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private windowElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private position: { x: number; y: number };
  private htmlNavigator: HTMLNavigator | null = null;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(container: HTMLElement, options: HTMLNavigatorWindowOptions = {}) {
    super();
    this.container = container;
    this.position = options.position || { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 250 };
    
    this.createWindow();
    this.bindEvents();
  }

  private createWindow(): void {
    this.windowElement = document.createElement('div');
    this.windowElement.className = 'html-navigator-window';
    this.windowElement.style.cssText = `
      position: fixed;
      width: 400px;
      height: 500px;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    this.renderWindowContent();
    this.container.appendChild(this.windowElement);
  }

  private renderWindowContent(): void {
    if (!this.windowElement) return;

    this.windowElement.innerHTML = `
      <!-- Header -->
      <div class="html-navigator-header" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.8)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span style="color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
            HTML Navigator
          </span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="refresh-btn" style="
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: rgba(255, 255, 255, 0.7);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          
          <button class="close-btn" style="
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: rgba(255, 255, 255, 0.7);
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="html-navigator-content" style="
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      ">
        <!-- El HTMLNavigator se insertará aquí -->
      </div>
    `;

    this.initializeHTMLNavigator();
  }

  private initializeHTMLNavigator(): void {
    const contentElement = this.windowElement?.querySelector('.html-navigator-content') as HTMLElement;
    if (!contentElement) return;

    this.htmlNavigator = new HTMLNavigator(contentElement);
    
    // Escuchar eventos del HTMLNavigator
    this.htmlNavigator.on('elementSelected', (element: HTMLElement) => {
      this.emit('html-navigator:element-selected', element);
    });

    // Escanear el HTML inicial
    this.htmlNavigator.scanHTML();
  }

  private bindEvents(): void {
    if (!this.windowElement) return;

    // Drag functionality
    const header = this.windowElement.querySelector('.html-navigator-header') as HTMLElement;
    if (header) {
      header.addEventListener('mousedown', this.handleDragStart.bind(this));
    }

    // Close button
    const closeBtn = this.windowElement.querySelector('.close-btn') as HTMLElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Refresh button
    const refreshBtn = this.windowElement.querySelector('.refresh-btn') as HTMLElement;
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh();
      });
    }

    // Global mouse events for dragging
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));

    // Button hover effects
    const buttons = this.windowElement.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(255, 255, 255, 0.2)';
        button.style.color = 'rgba(255, 255, 255, 0.9)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.color = 'rgba(255, 255, 255, 0.7)';
      });
    });
  }

  private handleDragStart(e: MouseEvent): void {
    if (!this.windowElement) return;
    
    this.isDragging = true;
    const rect = this.windowElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    this.windowElement.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private handleDragMove(e: MouseEvent): void {
    if (!this.isDragging || !this.windowElement) return;

    const newX = e.clientX - this.dragOffset.x;
    const newY = e.clientY - this.dragOffset.y;

    // Constrain to viewport
    const maxX = window.innerWidth - this.windowElement.offsetWidth;
    const maxY = window.innerHeight - this.windowElement.offsetHeight;

    this.position = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    this.updatePosition();
  }

  private handleDragEnd(): void {
    if (!this.windowElement) return;
    
    this.isDragging = false;
    this.windowElement.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private updatePosition(): void {
    if (!this.windowElement) return;
    
    this.windowElement.style.left = `${this.position.x}px`;
    this.windowElement.style.top = `${this.position.y}px`;
  }

  public show(position?: { x: number; y: number }): void {
    if (!this.windowElement) return;

    if (position) {
      this.position = position;
    }

    this.updatePosition();
    this.windowElement.style.display = 'flex';
    this.isVisible = true;

    // Animación de entrada
    this.windowElement.style.opacity = '0';
    this.windowElement.style.transform = 'scale(0.9) translateY(10px)';
    
    requestAnimationFrame(() => {
      if (!this.windowElement) return;
      this.windowElement.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      this.windowElement.style.opacity = '1';
      this.windowElement.style.transform = 'scale(1) translateY(0)';
    });

    // Refresh HTML tree when shown
    this.refresh();
  }

  public hide(): void {
    if (!this.windowElement) return;

    this.windowElement.style.transition = 'all 0.2s ease';
    this.windowElement.style.opacity = '0';
    this.windowElement.style.transform = 'scale(0.9) translateY(10px)';

    setTimeout(() => {
      if (this.windowElement) {
        this.windowElement.style.display = 'none';
        this.windowElement.style.transition = '';
      }
      this.isVisible = false;
      this.emit('html-navigator:hidden');
    }, 200);
  }

  public isShown(): boolean {
    return this.isVisible;
  }

  public refresh(): void {
    if (this.htmlNavigator) {
      this.htmlNavigator.scanHTML();
    }
  }

  public selectElementFromOutside(element: HTMLElement): void {
    if (this.htmlNavigator) {
      this.htmlNavigator.selectElementFromOutside(element);
    }
  }

  public getHTMLNavigator(): HTMLNavigator | null {
    return this.htmlNavigator;
  }

  public destroy(): void {
    if (this.htmlNavigator) {
      this.htmlNavigator.destroy();
      this.htmlNavigator = null;
    }

    if (this.windowElement) {
      this.windowElement.remove();
      this.windowElement = null;
    }

    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleDragMove.bind(this));
    document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
  }
}