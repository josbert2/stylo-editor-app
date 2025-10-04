export interface ScrollAreaOptions {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export class ScrollArea {
  private container: HTMLElement;
  private viewport: HTMLElement;
  private scrollbar: HTMLElement;
  private thumb: HTMLElement;
  private orientation: 'vertical' | 'horizontal';
  private isDragging = false;
  private dragStartPos = 0;
  private scrollStartPos = 0;

  constructor(container: HTMLElement, options: ScrollAreaOptions = {}) {
    this.container = container;
    this.orientation = options.orientation || 'vertical';
    this.init(options.className);
    this.setupEventListeners();
  }

  private init(className?: string): void {
    // Clear existing content
    this.container.innerHTML = '';
    
    // Set up container styles
    this.container.className = `scroll-area-root ${className || ''}`;
    this.container.style.cssText = `
      position: relative;
      overflow: hidden;
    `;

    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.className = 'scroll-area-viewport';
    this.viewport.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: inherit;
      outline: none;
      transition: color, box-shadow;
      overflow: ${this.orientation === 'vertical' ? 'hidden auto' : 'auto hidden'};
    `;
    this.viewport.setAttribute('data-slot', 'scroll-area-viewport');

    // Create scrollbar
    this.scrollbar = document.createElement('div');
    this.scrollbar.className = 'scroll-area-scrollbar';
    this.scrollbar.setAttribute('data-slot', 'scroll-area-scrollbar');
    
    if (this.orientation === 'vertical') {
      this.scrollbar.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 10px;
        display: flex;
        touch-action: none;
        padding: 1px;
        transition: colors;
        user-select: none;
        border-left: 1px solid transparent;
        z-index: 10;
      `;
    } else {
      this.scrollbar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 10px;
        display: flex;
        flex-direction: column;
        touch-action: none;
        padding: 1px;
        transition: colors;
        user-select: none;
        border-top: 1px solid transparent;
        z-index: 10;
      `;
    }

    // Create thumb
    this.thumb = document.createElement('div');
    this.thumb.className = 'scroll-area-thumb';
    this.thumb.setAttribute('data-slot', 'scroll-area-thumb');
    this.thumb.style.cssText = `
      
      position: relative;
      flex: 1;
      border-radius: 9999px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    // Assemble the structure
    this.scrollbar.appendChild(this.thumb);
    this.container.appendChild(this.viewport);
    this.container.appendChild(this.scrollbar);

    this.updateScrollbar();
  }

  private setupEventListeners(): void {
    // Update scrollbar on viewport scroll
    this.viewport.addEventListener('scroll', () => {
      this.updateScrollbar();
    });

    // Thumb dragging
    this.thumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.dragStartPos = this.orientation === 'vertical' ? e.clientY : e.clientX;
      this.scrollStartPos = this.orientation === 'vertical' ? this.viewport.scrollTop : this.viewport.scrollLeft;
      
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      
      this.thumb.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    });

    // Scrollbar track clicking
    this.scrollbar.addEventListener('click', (e) => {
      if (e.target === this.thumb) return;
      
      const rect = this.scrollbar.getBoundingClientRect();
      const clickPos = this.orientation === 'vertical' 
        ? (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width;
      
      const maxScroll = this.orientation === 'vertical'
        ? this.viewport.scrollHeight - this.viewport.clientHeight
        : this.viewport.scrollWidth - this.viewport.clientWidth;
      
      const newScrollPos = clickPos * maxScroll;
      
      if (this.orientation === 'vertical') {
        this.viewport.scrollTop = newScrollPos;
      } else {
        this.viewport.scrollLeft = newScrollPos;
      }
    });

    // Hover effects
    this.scrollbar.addEventListener('mouseenter', () => {
      if (!this.isDragging) {
        this.thumb.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      }
    });

    this.scrollbar.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.thumb.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      }
    });
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const currentPos = this.orientation === 'vertical' ? e.clientY : e.clientX;
    const delta = currentPos - this.dragStartPos;
    
    const scrollbarRect = this.scrollbar.getBoundingClientRect();
    const scrollbarSize = this.orientation === 'vertical' ? scrollbarRect.height : scrollbarRect.width;
    
    const maxScroll = this.orientation === 'vertical'
      ? this.viewport.scrollHeight - this.viewport.clientHeight
      : this.viewport.scrollWidth - this.viewport.clientWidth;
    
    const scrollDelta = (delta / scrollbarSize) * maxScroll;
    const newScrollPos = Math.max(0, Math.min(maxScroll, this.scrollStartPos + scrollDelta));
    
    if (this.orientation === 'vertical') {
      this.viewport.scrollTop = newScrollPos;
    } else {
      this.viewport.scrollLeft = newScrollPos;
    }
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
    this.thumb.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private updateScrollbar(): void {
    const isVertical = this.orientation === 'vertical';
    const scrollSize = isVertical ? this.viewport.scrollHeight : this.viewport.scrollWidth;
    const clientSize = isVertical ? this.viewport.clientHeight : this.viewport.clientWidth;
    const scrollPos = isVertical ? this.viewport.scrollTop : this.viewport.scrollLeft;
    
    // Hide scrollbar if content doesn't overflow
    if (scrollSize <= clientSize) {
      this.scrollbar.style.display = 'none';
      return;
    }
    
    this.scrollbar.style.display = 'flex';
    
    // Calculate thumb size and position
    const thumbRatio = clientSize / scrollSize;
    const thumbSize = Math.max(20, thumbRatio * (isVertical ? this.scrollbar.clientHeight : this.scrollbar.clientWidth));
    const maxThumbPos = (isVertical ? this.scrollbar.clientHeight : this.scrollbar.clientWidth) - thumbSize;
    const thumbPos = (scrollPos / (scrollSize - clientSize)) * maxThumbPos;
    
    if (isVertical) {
      this.thumb.style.height = `${thumbSize}px`;
      this.thumb.style.transform = `translateY(${thumbPos}px)`;
      this.thumb.style.width = '100%';
    } else {
      this.thumb.style.width = `${thumbSize}px`;
      this.thumb.style.transform = `translateX(${thumbPos}px)`;
      this.thumb.style.height = '100%';
    }
  }

  public appendChild(element: HTMLElement): void {
    this.viewport.appendChild(element);
    // Update scrollbar after content changes
    setTimeout(() => this.updateScrollbar(), 0);
  }

  public setContent(content: string): void {
    this.viewport.innerHTML = content;
    // Update scrollbar after content changes
    setTimeout(() => this.updateScrollbar(), 0);
  }

  public getViewport(): HTMLElement {
    return this.viewport;
  }

  public destroy(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
}