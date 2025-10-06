import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents } from '../types';

interface HTMLNode {
  element: HTMLElement | Document;
  tagName: string;
  id?: string;
  classes: string[];
  attributes: { [key: string]: string };
  children: HTMLNode[];
  depth: number;
  isExpanded: boolean;
  textContent?: string;
  nodeType: 'element' | 'document' | 'text';
}

export class HTMLNavigator extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private htmlTree: HTMLNode[] = [];
  private selectedNode: HTMLNode | null = null;
  private hoveredNode: HTMLNode | null = null;

  constructor(container: HTMLElement) {
    super();
    this.container = container;
  }

  /**
   * Escanear todo el documento HTML desde la raíz
   */
  public scanHTML(): void {
    // Comenzar desde el elemento <html> para capturar todo
    const htmlElement = document.documentElement;
    this.htmlTree = this.buildCompleteHTMLTree(htmlElement, 0);
    this.render();
  }

  /**
   * Construir el árbol HTML completo incluyendo head, body, etc.
   */
  private buildCompleteHTMLTree(element: HTMLElement, depth: number): HTMLNode[] {
    const nodes: HTMLNode[] = [];
    
    // Crear nodo para el elemento actual
    const currentNode: HTMLNode = {
      element: element,
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classes: Array.from(element.classList).filter(cls => !cls.startsWith('stylo-')),
      attributes: this.getElementAttributes(element),
      children: [],
      depth,
      isExpanded: depth < 3, // Expandir automáticamente los primeros 3 niveles
      textContent: this.getDirectTextContent(element),
      nodeType: 'element'
    };

    // Procesar todos los nodos hijos (elementos y texto)
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as HTMLElement;
        
        // Solo omitir elementos específicos del editor Stylo
        if (this.shouldSkipElement(childElement)) {
          continue;
        }

        const childNodes = this.buildCompleteHTMLTree(childElement, depth + 1);
        currentNode.children.push(...childNodes);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const textContent = child.textContent?.trim();
        if (textContent && textContent.length > 0) {
          // Crear nodo de texto
          const textNode: HTMLNode = {
            element: child.parentElement!,
            tagName: '#text',
            classes: [],
            attributes: {},
            children: [],
            depth: depth + 1,
            isExpanded: false,
            textContent: textContent,
            nodeType: 'text'
          };
          currentNode.children.push(textNode);
        }
      }
    }

    nodes.push(currentNode);
    return nodes;
  }

  /**
   * Verificar si un elemento debe ser omitido del árbol
   */
  private shouldSkipElement(element: HTMLElement): boolean {
    // Solo omitir elementos específicos del editor Stylo
    if (element.classList.contains('stylo-editor') ||
        element.classList.contains('inspector-panel') ||
        element.classList.contains('asset-manager') ||
        element.classList.contains('html-navigator-window') ||
        element.classList.contains('color-palette') ||
        element.id === 'stylo-editor-container') {
      return true;
    }

    return false;
  }

  /**
   * Obtener atributos del elemento (incluyendo todos los atributos importantes)
   */
  private getElementAttributes(element: HTMLElement): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    
    for (const attr of Array.from(element.attributes)) {
      // Incluir todos los atributos excepto los específicos de Stylo
      if (!attr.name.startsWith('stylo-') && !attr.name.startsWith('data-stylo')) {
        attributes[attr.name] = attr.value;
      }
    }
    
    return attributes;
  }

  /**
   * Obtener solo el contenido de texto directo del elemento (no de sus hijos)
   */
  private getDirectTextContent(element: HTMLElement): string | undefined {
    let directText = '';
    
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          directText += text + ' ';
        }
      }
    }
    
    return directText.trim() || undefined;
  }

  public render(): void {
    this.container.innerHTML = `
      <style>
        .html-navigator {
          width: 100%;
          height: 100%;
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .html-navigator-header {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .html-navigator-title {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-size: 13px;
        }

        .html-navigator-refresh {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          padding: 6px 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s ease;
        }

        .html-navigator-refresh:hover {
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }

        .html-tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }

        .html-node {
          display: flex;
          align-items: center;
          padding: 2px 8px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          white-space: nowrap;
          min-height: 20px;
        }

        .html-node:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .html-node.selected {
          background: rgba(33, 150, 243, 0.2);
          border-left: 3px solid #2196F3;
        }

        .html-node.hovered {
          background: rgba(255, 255, 255, 0.08);
        }

        .node-indent {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 4px;
          flex-shrink: 0;
        }

        .expand-icon {
          width: 12px;
          height: 12px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          transition: transform 0.2s ease;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .node-content {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .tag-name {
          color: #FF6B6B;
          font-weight: 500;
          margin-right: 4px;
        }

        .tag-name.html { color: #FF6B6B; }
        .tag-name.head { color: #4ECDC4; }
        .tag-name.body { color: #45B7D1; }
        .tag-name.div { color: #96CEB4; }
        .tag-name.span { color: #FFEAA7; }
        .tag-name.p { color: #DDA0DD; }
        .tag-name.h1, .tag-name.h2, .tag-name.h3, .tag-name.h4, .tag-name.h5, .tag-name.h6 { color: #FFB347; }
        .tag-name.a { color: #87CEEB; }
        .tag-name.img { color: #F0E68C; }
        .tag-name.button { color: #FFB6C1; }
        .tag-name.input { color: #98FB98; }
        .tag-name.form { color: #DEB887; }
        .tag-name.table { color: #F5DEB3; }
        .tag-name.ul, .tag-name.ol, .tag-name.li { color: #D3D3D3; }
        .tag-name.script { color: #FFA07A; }
        .tag-name.style { color: #20B2AA; }
        .tag-name.link { color: #9370DB; }
        .tag-name.meta { color: #778899; }
        .tag-name.title { color: #FFD700; }

        .text-node {
          color: #90EE90;
          font-style: italic;
          opacity: 0.8;
        }

        .node-id {
          color: #FFD700;
          margin-left: 4px;
          font-size: 11px;
        }

        .node-classes {
          color: #87CEEB;
          margin-left: 4px;
          font-size: 11px;
        }

        .node-attributes {
          color: #DDA0DD;
          margin-left: 4px;
          font-size: 10px;
          opacity: 0.7;
        }

        .node-text {
          color: #98FB98;
          margin-left: 4px;
          font-size: 11px;
          font-style: italic;
          opacity: 0.8;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .highlight-flash {
          animation: highlightFlash 1s ease-out;
        }
        
        @keyframes highlightFlash {
          0% { background-color: rgba(33, 150, 243, 0.3); }
          100% { background-color: transparent; }
        }

        /* Scrollbar personalizado */
        .html-tree-container::-webkit-scrollbar {
          width: 8px;
        }

        .html-tree-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .html-tree-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .html-tree-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>

      <div class="html-navigator">
        <div class="html-navigator-header">
          <div class="html-navigator-title">HTML Document Structure</div>
          <button class="html-navigator-refresh" onclick="this.closest('.html-navigator').dispatchEvent(new CustomEvent('refresh'))">
            ↻ Refresh
          </button>
        </div>
        <div class="html-tree-container">
          ${this.renderHTMLTree(this.htmlTree)}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Renderizar el árbol HTML completo
   */
  private renderHTMLTree(nodes: HTMLNode[]): string {
    return nodes.map(node => this.renderHTMLNode(node)).join('');
  }

  /**
   * Renderizar un nodo HTML individual con formato mejorado
   */
  private renderHTMLNode(node: HTMLNode): string {
    const nodeId = this.getNodeId(node);
    const hasChildren = node.children.length > 0;
    const isSelected = this.selectedNode === node;
    const isHovered = this.hoveredNode === node;
    
    // Indentación basada en la profundidad
    const indentStyle = `margin-left: ${node.depth * 16}px;`;
    
    let nodeHtml = '';

    if (node.nodeType === 'text') {
      // Nodo de texto
      nodeHtml = `
        <div class="html-node text-node" 
             data-node-id="${nodeId}" 
             style="${indentStyle}">
          <div class="node-indent"></div>
          <div class="node-content">
            <span class="text-node">"${node.textContent}"</span>
          </div>
        </div>
      `;
    } else {
      // Nodo elemento
      const expandIcon = hasChildren ? 
        `<svg class="expand-icon ${node.isExpanded ? 'expanded' : ''}" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>` : '';

      const tagClass = `tag-name ${node.tagName}`;
      const idDisplay = node.id ? `<span class="node-id">#${node.id}</span>` : '';
      const classesDisplay = node.classes.length > 0 ? 
        `<span class="node-classes">.${node.classes.join('.')}</span>` : '';
      
      // Mostrar algunos atributos importantes
      const importantAttrs = ['src', 'href', 'type', 'name', 'value', 'alt', 'title'];
      const attributesDisplay = Object.entries(node.attributes)
        .filter(([key]) => importantAttrs.includes(key))
        .slice(0, 2) // Limitar a 2 atributos para no saturar
        .map(([key, value]) => `${key}="${value.length > 20 ? value.substring(0, 20) + '...' : value}"`)
        .join(' ');
      
      const attrsHtml = attributesDisplay ? 
        `<span class="node-attributes">[${attributesDisplay}]</span>` : '';
      
      const textDisplay = node.textContent && node.textContent.length > 0 ? 
        `<span class="node-text">"${node.textContent}"</span>` : '';

      nodeHtml = `
        <div class="html-node ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}" 
             data-node-id="${nodeId}" 
             style="${indentStyle}">
          <div class="node-indent">
            ${expandIcon}
          </div>
          <div class="node-content">
            <span class="${tagClass}">&lt;${node.tagName}&gt;</span>
            ${idDisplay}
            ${classesDisplay}
            ${attrsHtml}
            ${textDisplay}
          </div>
        </div>
      `;
    }

    // Agregar nodos hijos si están expandidos
    if (hasChildren && node.isExpanded) {
      nodeHtml += this.renderHTMLTree(node.children);
    }

    return nodeHtml;
  }



  private getNodeId(node: HTMLNode): string {
    return `node-${node.depth}-${node.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Vincular eventos
   */
  private bindEvents(): void {
    const refreshBtn = this.container.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.scanHTML();
      });
    }

    // Eventos para nodos
    this.container.addEventListener('click', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.html-node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        const node = this.findNodeById(nodeId);
        
        if (node) {
          // Si se hace clic en el icono de expansión
          if ((e.target as HTMLElement).classList.contains('expand-icon')) {
            this.toggleNodeExpansion(node);
            return;
          }

          // Seleccionar nodo
          this.selectNode(node);
        }
      }
    });

    // Hover effects
    this.container.addEventListener('mouseover', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.html-node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        const node = this.findNodeById(nodeId);
        
        if (node) {
          this.hoveredNode = node;
          this.highlightElement(node.element, true);
          this.render();
        }
      }
    });

    this.container.addEventListener('mouseout', (e) => {
      const nodeElement = (e.target as HTMLElement).closest('.html-node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        const node = this.findNodeById(nodeId);
        
        if (node) {
          this.hoveredNode = null;
          this.highlightElement(node.element, false);
          this.render();
        }
      }
    });
  }

  /**
   * Encontrar nodo por ID
   */
  private findNodeById(nodeId: string | null): HTMLNode | null {
    if (!nodeId) return null;

    const findInNodes = (nodes: HTMLNode[]): HTMLNode | null => {
      for (const node of nodes) {
        if (this.getNodeId(node) === nodeId) {
          return node;
        }
        const found = findInNodes(node.children);
        if (found) return found;
      }
      return null;
    };

    return findInNodes(this.htmlTree);
  }

  /**
   * Alternar expansión del nodo
   */
  private toggleNodeExpansion(node: HTMLNode): void {
    node.isExpanded = !node.isExpanded;
    this.render();
  }

  /**
   * Seleccionar nodo
   */
  private selectNode(node: HTMLNode): void {
    this.selectedNode = node;
    
    // Emitir evento de selección
    this.emit('elementSelected', {
      element: node.element,
      elementInfo: {
        tagName: node.tagName,
        id: node.id,
        classes: node.classes,
        attributes: node.attributes
      }
    });

    this.render();
  }

  /**
   * Resaltar elemento en la página
   */
  private highlightElement(element: HTMLElement, highlight: boolean): void {
    if (highlight) {
      element.style.outline = '2px solid #4AEDFF';
      element.style.outlineOffset = '1px';
    } else {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }
  }

  /**
   * Limpiar selección
   */
  public clearSelection(): void {
    this.selectedNode = null;
    this.render();
  }

  /**
   * Actualizar elemento seleccionado desde el exterior
   */
  public selectElementFromOutside(element: HTMLElement): void {
    const nodeId = this.findNodeByElement(element);
    if (nodeId) {
      this.selectNode(nodeId);
      this.scrollToNode(nodeId);
    }
  }

  /**
   * Encontrar nodo por elemento HTML
   */
  private findNodeByElement(element: HTMLElement): string | null {
    const findInNode = (node: any): string | null => {
      if (node.element === element) {
        return node.id;
      }
      
      if (node.children) {
        for (const child of node.children) {
          const found = findInNode(child);
          if (found) return found;
        }
      }
      
      return null;
    };

    return findInNode(this.htmlTree);
  }

  /**
   * Hacer scroll hasta un nodo específico
   */
  private scrollToNode(nodeId: string): void {
    const nodeElement = this.container.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight temporalmente
      nodeElement.classList.add('highlight-flash');
      setTimeout(() => {
        nodeElement.classList.remove('highlight-flash');
      }, 1000);
    }
  }

  /**
   * Refrescar el árbol HTML
   */
  public refresh(): void {
    this.scanHTML();
    this.render();
  }

  /**
   * Destruir el navegador
   */
  public destroy(): void {
    // Limpiar highlights
    if (this.selectedNode) {
      this.highlightElement(this.selectedNode.element, false);
    }
    if (this.hoveredNode) {
      this.highlightElement(this.hoveredNode.element, false);
    }

    this.container.innerHTML = '';
    this.removeAllListeners();
  }
}