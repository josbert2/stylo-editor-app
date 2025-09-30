export class TooltipManager {
  private static instance: TooltipManager | null = null;
  private tooltip: HTMLElement | null = null;
  private showTimeout: number | null = null;
  private hideTimeout: number | null = null;

  private constructor() {
    this.createTooltip();
    this.bindEvents();
  }

  static getInstance(): TooltipManager {
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'stylo-tooltip';
    document.body.appendChild(this.tooltip);
  }

  private bindEvents(): void {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private handleMouseOver(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Buscar el elemento padre que tenga data-tooltip
    const tooltipElement = this.findTooltipElement(target);
    
    if (tooltipElement) {
      const tooltipText = tooltipElement.getAttribute('data-tooltip');
      
      if (tooltipText && this.tooltip) {
        this.clearTimeouts();
        
        this.showTimeout = window.setTimeout(() => {
          this.showTooltip(tooltipElement, tooltipText);
        }, 200);
      }
    }
  }

  private handleMouseOut(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Obtener el elemento del tooltip que se está mostrando actualmente
    const currentTooltipElement = this.tooltip?.parentElement?.querySelector('[data-tooltip]') as HTMLElement;
    
    // Verificar si el mouse está saliendo del elemento del tooltip y no entrando a un elemento hijo
    if (currentTooltipElement && !this.isDescendant(currentTooltipElement, relatedTarget)) {
      this.clearTimeouts();
      
      this.hideTimeout = window.setTimeout(() => {
        // Verificar nuevamente que el mouse no esté sobre el tooltip o un elemento relacionado
        if (!this.tooltip?.contains(document.activeElement) && 
            !this.tooltip?.contains(relatedTarget)) {
          this.hideTooltip();
        }
      }, 100);
    }
  }
  
  // Método auxiliar para verificar si un elemento es descendiente de otro
  private isDescendant(parent: HTMLElement, child: HTMLElement | null): boolean {
    if (!child) return false;
    let node = child.parentNode;
    while (node != null) {
      if (node === parent) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  private handleMouseMove(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Buscar el elemento padre que tenga data-tooltip
    const tooltipElement = this.findTooltipElement(target);
    
    if (tooltipElement && this.tooltip && this.tooltip.classList.contains('show')) {
      this.positionTooltip(tooltipElement);
    }
  }

  // Nuevo método para encontrar el elemento con data-tooltip
  private findTooltipElement(element: HTMLElement): HTMLElement | null {
    let current = element;
    
    // Buscar hacia arriba en el DOM hasta encontrar un elemento con data-tooltip
    while (current && current !== document.body) {
      if (current.hasAttribute('data-tooltip')) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    
    return null;
  }

  private showTooltip(element: HTMLElement, text: string): void {
    if (!this.tooltip) return;

    this.tooltip.textContent = text;
    this.positionTooltip(element);
    this.tooltip.classList.add('show');
  }

  private hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('show');
  }

  private positionTooltip(element: HTMLElement): void {
    if (!this.tooltip) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let position = element.getAttribute('data-tooltip-position') || 'bottom';
    
    // Calcular espacio disponible en cada dirección
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    
    const tooltipHeight = tooltipRect.height || 40; // altura estimada si no está visible
    const tooltipWidth = tooltipRect.width || 100; // ancho estimado si no está visible
    const padding = 8;
    
    // Auto-detectar la mejor posición si no hay suficiente espacio
    if (position === 'bottom' && spaceBottom < tooltipHeight + padding) {
      if (spaceTop > tooltipHeight + padding) {
        position = 'top';
      } else if (spaceRight > tooltipWidth + padding) {
        position = 'right';
      } else if (spaceLeft > tooltipWidth + padding) {
        position = 'left';
      }
    } else if (position === 'top' && spaceTop < tooltipHeight + padding) {
      if (spaceBottom > tooltipHeight + padding) {
        position = 'bottom';
      } else if (spaceRight > tooltipWidth + padding) {
        position = 'right';
      } else if (spaceLeft > tooltipWidth + padding) {
        position = 'left';
      }
    } else if (position === 'left' && spaceLeft < tooltipWidth + padding) {
      if (spaceRight > tooltipWidth + padding) {
        position = 'right';
      } else if (spaceBottom > tooltipHeight + padding) {
        position = 'bottom';
      } else if (spaceTop > tooltipHeight + padding) {
        position = 'top';
      }
    } else if (position === 'right' && spaceRight < tooltipWidth + padding) {
      if (spaceLeft > tooltipWidth + padding) {
        position = 'left';
      } else if (spaceBottom > tooltipHeight + padding) {
        position = 'bottom';
      } else if (spaceTop > tooltipHeight + padding) {
        position = 'top';
      }
    }
    
    // Reset classes y aplicar la posición final
    this.tooltip.className = 'stylo-tooltip';
    this.tooltip.classList.add(position);
    
    let left = 0;
    let top = 0;
    
    // Calcular posición según la dirección final
    switch (position) {
      case 'bottom':
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        top = rect.bottom + padding;
        break;
      case 'top':
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        top = rect.top - tooltipHeight - padding;
        break;
      case 'left':
        left = rect.left - tooltipWidth - padding;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
      case 'right':
        left = rect.right + padding;
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        break;
    }
    
    // Ajustes finales para evitar que se salga de la pantalla
    if (position === 'bottom' || position === 'top') {
      // Ajustar horizontalmente
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
    } else {
      // Ajustar verticalmente para left/right
      if (top < padding) {
        top = padding;
      } else if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }
    }
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  private clearTimeouts(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}