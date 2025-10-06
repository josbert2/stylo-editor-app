import { EventEmitter } from '../utils/EventEmitter';
import type { StyloEditorEvents, AssetFile, AssetFolder, AssetManagerOptions } from '../types';

export class AssetManager extends EventEmitter<StyloEditorEvents> {
  private container: HTMLElement;
  private modalElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private options: AssetManagerOptions;
  private assets: AssetFile[] = [];
  private folders: AssetFolder[] = [];
  private currentFolder: string | null = null;
  private selectedAssets: Set<string> = new Set();
  private viewMode: 'grid' | 'list' = 'grid';
  private searchQuery: string = '';
  private sortBy: 'name' | 'date' | 'size' | 'type' = 'date';
  private sortOrder: 'asc' | 'desc' = 'desc';

  constructor(container: HTMLElement, options: AssetManagerOptions = {}) {
    super();
    this.container = container;
    this.options = {
      allowedTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      showUpload: true,
      showFolders: true,
      ...options
    };
    
    this.loadAssets();
    this.createModal();
  }

  private createModal(): void {
    this.modalElement = document.createElement('div');
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      z-index: 1000000;
      display: none;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    this.modalElement.innerHTML = `
      <div class="asset-manager-container" style="
        background: #1a1a1a;
        border-radius: 12px;
        width: 90vw;
        max-width: 1200px;
        height: 80vh;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <!-- Header -->
        <div class="asset-manager-header" style="
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #2a2a2a;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <h2 style="
              margin: 0;
              color: white;
              font-size: 18px;
              font-weight: 600;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Asset Manager</h2>
            
            <div class="breadcrumb" style="
              display: flex;
              align-items: center;
              gap: 8px;
              color: rgba(255, 255, 255, 0.6);
              font-size: 14px;
            "></div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="view-toggle-btn" data-view="grid" style="
              background: rgba(255, 255, 255, 0.1);
              border: none;
              border-radius: 6px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: white;
              transition: all 0.2s ease;
            " title="Grid View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </button>
            
            <button class="view-toggle-btn" data-view="list" style="
              background: rgba(255, 255, 255, 0.05);
              border: none;
              border-radius: 6px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: rgba(255, 255, 255, 0.6);
              transition: all 0.2s ease;
            " title="List View">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </button>
            
            <button class="refresh-assets-btn" style="
              background: rgba(255, 255, 255, 0.05);
              border: none;
              border-radius: 6px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: rgba(255, 255, 255, 0.6);
              transition: all 0.2s ease;
              margin-left: 8px;
            " title="Refresh Site Assets">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>

            <button class="close-btn" style="
              background: rgba(255, 255, 255, 0.1);
              border: none;
              border-radius: 6px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: white;
              transition: all 0.2s ease;
            " title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="asset-manager-toolbar" style="
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #222;
        ">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div class="search-container" style="
              position: relative;
              flex: 1;
              max-width: 300px;
            ">
              <input type="text" class="search-input" placeholder="Search assets..." style="
                width: 100%;
                padding: 8px 12px 8px 36px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
                outline: none;
                transition: all 0.2s ease;
              ">
              <svg style="
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                color: rgba(255, 255, 255, 0.5);
                pointer-events: none;
              " viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            
            <select class="sort-select" style="
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              color: white;
              font-size: 14px;
              outline: none;
              cursor: pointer;
            ">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>
          
          <div style="display: flex; align-items: center; gap: 12px;">
            ${this.options.showFolders ? `
              <button class="new-folder-btn" style="
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                New Folder
              </button>
            ` : ''}
            
            ${this.options.showUpload ? `
              <button class="upload-btn" style="
                padding: 8px 16px;
                background: #007acc;
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Upload Files
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Content Area -->
        <div class="asset-manager-content" style="
          flex: 1;
          display: flex;
          overflow: hidden;
        ">
          <!-- Sidebar (Folders) -->
          ${this.options.showFolders ? `
            <div class="asset-sidebar" style="
              width: 250px;
              background: #1e1e1e;
              border-right: 1px solid rgba(255, 255, 255, 0.1);
              overflow-y: auto;
              padding: 16px 0;
            ">
              <div class="folder-list"></div>
            </div>
          ` : ''}
          
          <!-- Main Content -->
          <div class="asset-main" style="
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
            <!-- Asset Grid/List -->
            <div class="asset-grid" style="
              flex: 1;
              padding: 20px;
              overflow-y: auto;
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
              gap: 16px;
              align-content: start;
            "></div>
            
            <!-- Selection Info -->
            <div class="selection-info" style="
              padding: 16px 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              background: #1e1e1e;
              display: none;
              align-items: center;
              justify-content: space-between;
            ">
              <span class="selection-count" style="color: rgba(255, 255, 255, 0.8); font-size: 14px;"></span>
              <div style="display: flex; gap: 8px;">
                <button class="delete-selected-btn" style="
                  padding: 6px 12px;
                  background: #dc3545;
                  border: none;
                  border-radius: 4px;
                  color: white;
                  font-size: 12px;
                  cursor: pointer;
                ">Delete Selected</button>
                <button class="clear-selection-btn" style="
                  padding: 6px 12px;
                  background: rgba(255, 255, 255, 0.1);
                  border: none;
                  border-radius: 4px;
                  color: white;
                  font-size: 12px;
                  cursor: pointer;
                ">Clear Selection</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Hidden file input -->
      <input type="file" class="file-input" multiple style="display: none;" accept="${this.options.allowedTypes?.join(',') || '*'}">
    `;

    document.body.appendChild(this.modalElement);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.modalElement) return;

    // Close modal
    const closeBtn = this.modalElement.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Click outside to close
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });

    // View toggle
    const viewToggleBtns = this.modalElement.querySelectorAll('.view-toggle-btn');
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view') as 'grid' | 'list';
        this.setViewMode(view);
      });
    });

    // Search
    const searchInput = this.modalElement.querySelector('.search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderAssets();
    });

    // Sort
    const sortSelect = this.modalElement.querySelector('.sort-select') as HTMLSelectElement;
    sortSelect?.addEventListener('change', (e) => {
      const [sortBy, sortOrder] = (e.target as HTMLSelectElement).value.split('-');
      this.sortBy = sortBy as any;
      this.sortOrder = sortOrder as any;
      this.renderAssets();
    });

    // Upload
    const uploadBtn = this.modalElement.querySelector('.upload-btn');
    const fileInput = this.modalElement.querySelector('.file-input') as HTMLInputElement;
    
    uploadBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        this.handleFileUpload(Array.from(files));
      }
    });

    // New folder
    const newFolderBtn = this.modalElement.querySelector('.new-folder-btn');
    newFolderBtn?.addEventListener('click', () => {
      this.createNewFolder();
    });

    // Refresh assets
    const refreshBtn = this.modalElement.querySelector('.refresh-assets-btn');
    refreshBtn?.addEventListener('click', () => {
      this.refreshSiteAssets();
      this.showNotification('Site assets refreshed', 'success');
    });

    // Selection actions
    const deleteSelectedBtn = this.modalElement.querySelector('.delete-selected-btn');
    const clearSelectionBtn = this.modalElement.querySelector('.clear-selection-btn');
    
    deleteSelectedBtn?.addEventListener('click', () => {
      this.deleteSelectedAssets();
    });

    clearSelectionBtn?.addEventListener('click', () => {
      this.clearSelection();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isVisible) return;

    if (e.key === 'Escape') {
      this.hide();
    } else if (e.key === 'Delete' && this.selectedAssets.size > 0) {
      this.deleteSelectedAssets();
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a') {
        e.preventDefault();
        this.selectAll();
      }
    }
  };

  private loadAssets(): void {
    // Cargar assets guardados del localStorage
    const savedAssets = localStorage.getItem('stylo-assets');
    const savedFolders = localStorage.getItem('stylo-folders');
    
    if (savedAssets) {
      this.assets = JSON.parse(savedAssets).map((asset: any) => ({
        ...asset,
        uploadedAt: new Date(asset.uploadedAt)
      }));
    }
    
    if (savedFolders) {
      this.folders = JSON.parse(savedFolders).map((folder: any) => ({
        ...folder,
        createdAt: new Date(folder.createdAt)
      }));
    }

    // Escanear y detectar todos los assets existentes en el sitio
    this.scanSiteAssets();
  }

  private scanSiteAssets(): void {
    const existingUrls = new Set(this.assets.map(asset => asset.url));
    const detectedAssets: AssetFile[] = [];

    // Escanear imágenes
    const images = document.querySelectorAll('img[src]');
    images.forEach((img: HTMLImageElement) => {
      if (img.src && !existingUrls.has(img.src) && !this.isDataUrl(img.src)) {
        detectedAssets.push(this.createAssetFromElement(img, 'image'));
      }
    });

    // Escanear videos
    const videos = document.querySelectorAll('video[src], video source[src]');
    videos.forEach((video: HTMLVideoElement | HTMLSourceElement) => {
      if (video.src && !existingUrls.has(video.src) && !this.isDataUrl(video.src)) {
        detectedAssets.push(this.createAssetFromElement(video, 'video'));
      }
    });

    // Escanear audio
    const audios = document.querySelectorAll('audio[src], audio source[src]');
    audios.forEach((audio: HTMLAudioElement | HTMLSourceElement) => {
      if (audio.src && !existingUrls.has(audio.src) && !this.isDataUrl(audio.src)) {
        detectedAssets.push(this.createAssetFromElement(audio, 'audio'));
      }
    });

    // Escanear backgrounds en CSS
    this.scanCSSBackgrounds(existingUrls, detectedAssets);

    // Escanear links a documentos
    const links = document.querySelectorAll('a[href]');
    links.forEach((link: HTMLAnchorElement) => {
      if (link.href && !existingUrls.has(link.href) && this.isDocumentUrl(link.href)) {
        detectedAssets.push(this.createAssetFromElement(link, 'document'));
      }
    });

    // Agregar assets detectados
    if (detectedAssets.length > 0) {
      this.assets = [...detectedAssets, ...this.assets];
      this.saveAssets();
    }
  }

  private createAssetFromElement(element: HTMLElement, type: 'image' | 'video' | 'audio' | 'document'): AssetFile {
    const url = (element as any).src || (element as any).href;
    let fileName = this.extractFileName(url);
    
    // Obtener nombre descriptivo de alt o title para imágenes
    if (type === 'image') {
      const img = element as HTMLImageElement;
      const altText = img.alt?.trim();
      const titleText = img.title?.trim();
      
      if (altText && altText.length > 0) {
        fileName = altText;
      } else if (titleText && titleText.length > 0) {
        fileName = titleText;
      }
    }
    
    return {
      id: this.generateId(),
      name: fileName,
      type: type,
      url: url,
      size: 0, // No podemos determinar el tamaño sin hacer una request
      mimeType: this.getMimeTypeFromUrl(url),
      uploadedAt: new Date(),
      tags: ['detected', 'site-asset'],
      dimensions: type === 'image' ? this.getImageDimensionsFromElement(element as HTMLImageElement) : undefined
    };
  }

  private scanCSSBackgrounds(existingUrls: Set<string>, detectedAssets: AssetFile[]): void {
    const elements = document.querySelectorAll('*');
    
    elements.forEach((element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = computedStyle.backgroundImage;
      
      if (backgroundImage && backgroundImage !== 'none') {
        const urlMatch = backgroundImage.match(/url\(['"']?([^'"']+)['"']?\)/);
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          if (!existingUrls.has(url) && !this.isDataUrl(url)) {
            detectedAssets.push({
              id: this.generateId(),
              name: this.extractFileName(url),
              type: 'image',
              url: url,
              size: 0,
              mimeType: this.getMimeTypeFromUrl(url),
              uploadedAt: new Date(),
              tags: ['detected', 'css-background']
            });
            existingUrls.add(url);
          }
        }
      }
    });
  }

  private isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  private isDocumentUrl(url: string): boolean {
    const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'];
    return documentExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private extractFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'unknown';
      return decodeURIComponent(fileName);
    } catch {
      return url.split('/').pop() || 'unknown';
    }
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      // Imágenes
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      
      // Documentos
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private getImageDimensionsFromElement(img: HTMLImageElement): { width: number; height: number } | undefined {
    if (img.naturalWidth && img.naturalHeight) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    }
    return undefined;
  }

  private saveAssets(): void {
    localStorage.setItem('stylo-assets', JSON.stringify(this.assets));
    localStorage.setItem('stylo-folders', JSON.stringify(this.folders));
  }

  private async handleFileUpload(files: File[]): Promise<void> {
    for (const file of files) {
      // Validate file type
      if (this.options.allowedTypes && !this.isFileTypeAllowed(file)) {
        this.showNotification(`File type not allowed: ${file.name}`, 'error');
        continue;
      }

      // Validate file size
      if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
        this.showNotification(`File too large: ${file.name}`, 'error');
        continue;
      }

      try {
        const asset = await this.processFile(file);
        this.assets.unshift(asset);
        this.saveAssets();
        this.renderAssets();
        
        this.emit('asset:uploaded', asset);
        this.options.onAssetUploaded?.(asset);
        
        this.showNotification(`Uploaded: ${file.name}`, 'success');
      } catch (error) {
        console.error('Error uploading file:', error);
        this.showNotification(`Error uploading: ${file.name}`, 'error');
      }
    }
  }

  private async processFile(file: File): Promise<AssetFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const asset: AssetFile = {
            id: this.generateId(),
            name: file.name,
            type: this.getFileType(file),
            url: e.target?.result as string,
            size: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
            tags: [],
            folder: this.currentFolder || undefined
          };

          // Get dimensions for images
          if (asset.type === 'image') {
            const dimensions = await this.getImageDimensions(asset.url);
            asset.dimensions = dimensions;
          }

          resolve(asset);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }

  private isFileTypeAllowed(file: File): boolean {
    if (!this.options.allowedTypes) return true;
    
    return this.options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });
  }

  private getFileType(file: File): AssetFile['type'] {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'document';
    if (file.type.includes('font') || /\.(woff|woff2|ttf|otf|eot)$/i.test(file.name)) return 'font';
    return 'other';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private renderAssets(): void {
    const assetGrid = this.modalElement?.querySelector('.asset-grid');
    if (!assetGrid) return;

    const filteredAssets = this.getFilteredAssets();
    
    if (filteredAssets.length === 0) {
      assetGrid.innerHTML = `
        <div style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.5);
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 16px; opacity: 0.5;">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <p>No assets found</p>
          ${this.options.showUpload ? '<p style="font-size: 14px; margin-top: 8px;">Upload some files to get started</p>' : ''}
        </div>
      `;
      return;
    }

    if (this.viewMode === 'grid') {
      assetGrid.style.display = 'grid';
      assetGrid.innerHTML = filteredAssets.map(asset => this.renderAssetCard(asset)).join('');
    } else {
      assetGrid.style.display = 'block';
      assetGrid.innerHTML = filteredAssets.map(asset => this.renderAssetListItem(asset)).join('');
    }

    // Bind asset events
    this.bindAssetEvents();
  }

  private getFilteredAssets(): AssetFile[] {
    let filtered = this.assets.filter(asset => {
      // Filter by folder
      if (this.currentFolder && asset.folder !== this.currentFolder) return false;
      if (!this.currentFolder && asset.folder) return false;
      
      // Filter by search
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        return asset.name.toLowerCase().includes(query) ||
               asset.tags.some(tag => tag.toLowerCase().includes(query));
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  private renderAssetCard(asset: AssetFile): string {
    const isSelected = this.selectedAssets.has(asset.id);
    const sizeText = this.formatFileSize(asset.size);
    
    return `
      <div class="asset-card" data-asset-id="${asset.id}" style="
        background: ${isSelected ? 'rgba(0, 122, 204, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
        border: 2px solid ${isSelected ? '#007acc' : 'rgba(255, 255, 255, 0.1)'};
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
      ">
        <div class="asset-preview" style="
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
        ">
          ${this.renderAssetPreview(asset)}
        </div>
        
        <div class="asset-info" style="
          color: white;
          font-size: 12px;
          text-align: center;
        ">
          <div style="
            font-weight: 500;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          " title="${asset.name}">${asset.name}</div>
          <div style="
            color: rgba(255, 255, 255, 0.6);
            font-size: 11px;
          ">${sizeText}</div>
        </div>
        
        <!-- Botón de descarga -->
        <button class="download-btn" data-asset-id="${asset.id}" style="
          position: absolute;
          top: 8px;
          left: 8px;
          width: 28px;
          height: 28px;
          background: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;
        " title="Descargar asset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
          </svg>
        </button>
        
        ${isSelected ? `
          <div style="
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background: #007acc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderAssetListItem(asset: AssetFile): string {
    const isSelected = this.selectedAssets.has(asset.id);
    const sizeText = this.formatFileSize(asset.size);
    const dateText = asset.uploadedAt.toLocaleDateString();
    
    return `
      <div class="asset-list-item" data-asset-id="${asset.id}" style="
        background: ${isSelected ? 'rgba(0, 122, 204, 0.2)' : 'transparent'};
        border: 1px solid ${isSelected ? '#007acc' : 'rgba(255, 255, 255, 0.1)'};
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      ">
        <div class="asset-preview" style="
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          ${this.renderAssetPreview(asset, 32)}
        </div>
        
        <div style="flex: 1; min-width: 0;">
          <div style="
            color: white;
            font-weight: 500;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${asset.name}</div>
          <div style="
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
          ">${asset.type} • ${sizeText} • ${dateText}</div>
        </div>
        
        <!-- Botón de descarga en vista lista -->
        <button class="download-btn" data-asset-id="${asset.id}" style="
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.2s ease;
        " title="Descargar asset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
          </svg>
        </button>
        
        ${isSelected ? `
          <div style="
            width: 20px;
            height: 20px;
            background: #007acc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderAssetPreview(asset: AssetFile, size: number = 64): string {
    if (asset.type === 'image') {
      return `<img src="${asset.url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${asset.name}">`;
    }
    
    const iconColor = 'rgba(255, 255, 255, 0.6)';
    
    switch (asset.type) {
      case 'video':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}">
            <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
          </svg>
        `;
      case 'audio':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}">
            <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
          </svg>
        `;
      case 'document':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        `;
      case 'font':
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}">
            <path d="M9.93,13.5H4.07L3,16.5H1L6.96,3H7.04L13,16.5H11L9.93,13.5M9.32,11.5L7,5.25L4.68,11.5H9.32M20,14V16.5H23V18.5H20V21H18V18.5H15V16.5H18V14H20Z"/>
          </svg>
        `;
      default:
        return `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconColor}">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        `;
    }
  }

  private bindAssetEvents(): void {
    const assetCards = this.modalElement?.querySelectorAll('.asset-card, .asset-list-item');
    
    assetCards?.forEach(card => {
      // Evento hover para mostrar botón de descarga en vista grid
      if (card.classList.contains('asset-card')) {
        card.addEventListener('mouseenter', () => {
          const downloadBtn = card.querySelector('.download-btn') as HTMLElement;
          if (downloadBtn) {
            downloadBtn.style.opacity = '1';
          }
        });
        
        card.addEventListener('mouseleave', () => {
          const downloadBtn = card.querySelector('.download-btn') as HTMLElement;
          if (downloadBtn) {
            downloadBtn.style.opacity = '0';
          }
        });
      }
      
      // Evento click del asset
      card.addEventListener('click', (e) => {
        // Evitar que el click del botón de descarga active la selección
        if ((e.target as HTMLElement).closest('.download-btn')) {
          return;
        }
        
        const assetId = card.getAttribute('data-asset-id');
        if (!assetId) return;

        if (e.ctrlKey || e.metaKey) {
          // Multi-select
          this.toggleAssetSelection(assetId);
        } else if (e.shiftKey && this.selectedAssets.size > 0) {
          // Range select
          this.selectAssetRange(assetId);
        } else {
          // Single select or use asset
          const asset = this.assets.find(a => a.id === assetId);
          if (asset) {
            this.emit('asset:selected', asset);
            this.options.onAssetSelected?.(asset);
            this.hide();
          }
        }
      });

      // Evento del botón de descarga
      const downloadBtn = card.querySelector('.download-btn');
      downloadBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const assetId = downloadBtn.getAttribute('data-asset-id');
        if (assetId) {
          this.downloadAsset(assetId);
        }
      });

      // Hover para botón de descarga en vista lista
      if (card.classList.contains('asset-list-item')) {
        const downloadBtn = card.querySelector('.download-btn') as HTMLElement;
        downloadBtn?.addEventListener('mouseenter', () => {
          downloadBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        downloadBtn?.addEventListener('mouseleave', () => {
          downloadBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        });
      }

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const assetId = card.getAttribute('data-asset-id');
        if (assetId) {
          this.showAssetContextMenu(assetId, e.clientX, e.clientY);
        }
      });
    });
  }

  private toggleAssetSelection(assetId: string): void {
    if (this.selectedAssets.has(assetId)) {
      this.selectedAssets.delete(assetId);
    } else {
      this.selectedAssets.add(assetId);
    }
    
    this.updateSelectionUI();
    this.renderAssets();
  }

  private selectAssetRange(endAssetId: string): void {
    const filteredAssets = this.getFilteredAssets();
    const lastSelected = Array.from(this.selectedAssets).pop();
    
    if (!lastSelected) {
      this.selectedAssets.add(endAssetId);
      this.updateSelectionUI();
      this.renderAssets();
      return;
    }

    const startIndex = filteredAssets.findIndex(a => a.id === lastSelected);
    const endIndex = filteredAssets.findIndex(a => a.id === endAssetId);
    
    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    for (let i = minIndex; i <= maxIndex; i++) {
      this.selectedAssets.add(filteredAssets[i].id);
    }
    
    this.updateSelectionUI();
    this.renderAssets();
  }

  private selectAll(): void {
    const filteredAssets = this.getFilteredAssets();
    filteredAssets.forEach(asset => {
      this.selectedAssets.add(asset.id);
    });
    
    this.updateSelectionUI();
    this.renderAssets();
  }

  private clearSelection(): void {
    this.selectedAssets.clear();
    this.updateSelectionUI();
    this.renderAssets();
  }

  private updateSelectionUI(): void {
    const selectionInfo = this.modalElement?.querySelector('.selection-info');
    const selectionCount = this.modalElement?.querySelector('.selection-count');
    
    if (!selectionInfo || !selectionCount) return;

    if (this.selectedAssets.size > 0) {
      selectionInfo.style.display = 'flex';
      selectionCount.textContent = `${this.selectedAssets.size} asset${this.selectedAssets.size > 1 ? 's' : ''} selected`;
    } else {
      selectionInfo.style.display = 'none';
    }
  }

  private deleteSelectedAssets(): void {
    if (this.selectedAssets.size === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${this.selectedAssets.size} asset${this.selectedAssets.size > 1 ? 's' : ''}?`);
    if (!confirmed) return;

    this.selectedAssets.forEach(assetId => {
      const index = this.assets.findIndex(a => a.id === assetId);
      if (index !== -1) {
        this.assets.splice(index, 1);
        this.emit('asset:deleted', assetId);
        this.options.onAssetDeleted?.(assetId);
      }
    });

    this.selectedAssets.clear();
    this.saveAssets();
    this.updateSelectionUI();
    this.renderAssets();
    
    this.showNotification('Assets deleted successfully', 'success');
  }

  private setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    
    // Update button states
    const viewToggleBtns = this.modalElement?.querySelectorAll('.view-toggle-btn');
    viewToggleBtns?.forEach(btn => {
      const btnView = btn.getAttribute('data-view');
      if (btnView === mode) {
        btn.style.background = 'rgba(255, 255, 255, 0.2)';
        btn.style.color = 'white';
      } else {
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = 'rgba(255, 255, 255, 0.6)';
      }
    });

    // Update grid styles
    const assetGrid = this.modalElement?.querySelector('.asset-grid') as HTMLElement;
    if (assetGrid) {
      if (mode === 'grid') {
        assetGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
        assetGrid.style.gap = '16px';
      } else {
        assetGrid.style.gridTemplateColumns = '1fr';
        assetGrid.style.gap = '0';
      }
    }

    this.renderAssets();
  }

  private createNewFolder(): void {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;

    const folder: AssetFolder = {
      id: this.generateId(),
      name: name.trim(),
      parentId: this.currentFolder || undefined,
      createdAt: new Date()
    };

    this.folders.push(folder);
    this.saveAssets();
    this.renderFolders();
    
    this.showNotification(`Folder "${name}" created`, 'success');
  }

  private renderFolders(): void {
    const folderList = this.modalElement?.querySelector('.folder-list');
    if (!folderList) return;

    const rootFolders = this.folders.filter(f => !f.parentId);
    
    folderList.innerHTML = `
      <div class="folder-item ${!this.currentFolder ? 'active' : ''}" data-folder-id="" style="
        padding: 8px 16px;
        cursor: pointer;
        color: ${!this.currentFolder ? '#007acc' : 'rgba(255, 255, 255, 0.8)'};
        background: ${!this.currentFolder ? 'rgba(0, 122, 204, 0.1)' : 'transparent'};
        border-radius: 4px;
        margin: 0 8px 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        All Assets
      </div>
      ${rootFolders.map(folder => this.renderFolderItem(folder)).join('')}
    `;

    // Bind folder events
    const folderItems = folderList.querySelectorAll('.folder-item');
    folderItems.forEach(item => {
      item.addEventListener('click', () => {
        const folderId = item.getAttribute('data-folder-id') || null;
        this.setCurrentFolder(folderId);
      });
    });
  }

  private renderFolderItem(folder: AssetFolder): string {
    const isActive = this.currentFolder === folder.id;
    const assetCount = this.assets.filter(a => a.folder === folder.id).length;
    
    return `
      <div class="folder-item ${isActive ? 'active' : ''}" data-folder-id="${folder.id}" style="
        padding: 8px 16px;
        cursor: pointer;
        color: ${isActive ? '#007acc' : 'rgba(255, 255, 255, 0.8)'};
        background: ${isActive ? 'rgba(0, 122, 204, 0.1)' : 'transparent'};
        border-radius: 4px;
        margin: 0 8px 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
          </svg>
          ${folder.name}
        </div>
        <span style="
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        ">${assetCount}</span>
      </div>
    `;
  }

  private setCurrentFolder(folderId: string | null): void {
    this.currentFolder = folderId;
    this.renderFolders();
    this.renderAssets();
    this.updateBreadcrumb();
  }

  private updateBreadcrumb(): void {
    const breadcrumb = this.modalElement?.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    if (!this.currentFolder) {
      breadcrumb.innerHTML = '';
      return;
    }

    const folder = this.folders.find(f => f.id === this.currentFolder);
    if (!folder) return;

    breadcrumb.innerHTML = `
      <span style="cursor: pointer;" data-folder-id="">All Assets</span>
      <span style="margin: 0 4px;">/</span>
      <span>${folder.name}</span>
    `;

    // Bind breadcrumb navigation
    const allAssetsLink = breadcrumb.querySelector('[data-folder-id=""]');
    allAssetsLink?.addEventListener('click', () => {
      this.setCurrentFolder(null);
    });
  }

  private showAssetContextMenu(assetId: string, x: number, y: number): void {
    // Implement context menu for assets
    // For now, just show basic options
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return;

    const contextMenu = document.createElement('div');
    contextMenu.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      background: #2a2a2a;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 4px 0;
      z-index: 1000001;
      min-width: 150px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="select" style="
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        font-size: 14px;
        transition: background 0.2s ease;
      ">Use Asset</div>
      <div class="context-menu-item" data-action="download" style="
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        font-size: 14px;
        transition: background 0.2s ease;
      ">Download</div>
      <div class="context-menu-item" data-action="copy-url" style="
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        font-size: 14px;
        transition: background 0.2s ease;
      ">Copy URL</div>
      <div class="context-menu-item" data-action="rename" style="
        padding: 8px 16px;
        cursor: pointer;
        color: white;
        font-size: 14px;
        transition: background 0.2s ease;
      ">Rename</div>
      <hr style="margin: 4px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <div class="context-menu-item" data-action="delete" style="
        padding: 8px 16px;
        cursor: pointer;
        color: #dc3545;
        font-size: 14px;
        transition: background 0.2s ease;
      ">Delete</div>
    `;

    document.body.appendChild(contextMenu);

    // Add hover effects
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255, 255, 255, 0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        this.handleAssetContextAction(asset, action);
        document.body.removeChild(contextMenu);
      });
    });

    // Close on click outside
    const closeContextMenu = (e: MouseEvent) => {
      if (!contextMenu.contains(e.target as Node)) {
        document.body.removeChild(contextMenu);
        document.removeEventListener('click', closeContextMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeContextMenu);
    }, 0);
  }

  private handleAssetContextAction(asset: AssetFile, action: string | null): void {
    switch (action) {
      case 'select':
        this.emit('asset:selected', asset);
        this.options.onAssetSelected?.(asset);
        this.hide();
        break;
      case 'download':
        this.downloadAsset(asset.id);
        break;
      case 'copy-url':
        navigator.clipboard.writeText(asset.url);
        this.showNotification('URL copied to clipboard', 'success');
        break;
      case 'rename':
        const newName = prompt('Enter new name:', asset.name);
        if (newName && newName.trim() && newName !== asset.name) {
          asset.name = newName.trim();
          this.saveAssets();
          this.renderAssets();
          this.showNotification('Asset renamed', 'success');
        }
        break;
      case 'delete':
        const confirmed = confirm(`Are you sure you want to delete "${asset.name}"?`);
        if (confirmed) {
          const index = this.assets.findIndex(a => a.id === asset.id);
          if (index !== -1) {
            this.assets.splice(index, 1);
            this.saveAssets();
            this.renderAssets();
            this.emit('asset:deleted', asset.id);
            this.options.onAssetDeleted?.(asset.id);
            this.showNotification('Asset deleted', 'success');
          }
        }
        break;
    }
  }

  // Nueva función para descargar assets
  private downloadAsset(assetId: string): void {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return;

    try {
      // Crear un enlace temporal para la descarga
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = asset.name;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification(`Downloading "${asset.name}"`, 'success');
    } catch (error) {
      console.error('Error downloading asset:', error);
      this.showNotification('Error downloading asset', 'error');
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007acc'};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000002;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  public show(): void {
    if (!this.modalElement || this.isVisible) return;

    this.isVisible = true;
    this.modalElement.style.display = 'flex';
    
    // Trigger reflow
    this.modalElement.offsetHeight;
    
    this.modalElement.style.opacity = '1';
    
    this.renderFolders();
    this.renderAssets();
    this.updateBreadcrumb();
    
    this.emit('asset-manager:opened');
  }

  public hide(): void {
    if (!this.modalElement || !this.isVisible) return;

    this.isVisible = false;
    this.modalElement.style.opacity = '0';
    
    setTimeout(() => {
      if (this.modalElement) {
        this.modalElement.style.display = 'none';
      }
    }, 300);
    
    this.clearSelection();
    this.emit('asset-manager:closed');
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public getAssets(): AssetFile[] {
    return [...this.assets];
  }

  public addAsset(asset: AssetFile): void {
    this.assets.unshift(asset);
    this.saveAssets();
    if (this.isVisible) {
      this.renderAssets();
    }
  }

  public removeAsset(assetId: string): void {
    const index = this.assets.findIndex(a => a.id === assetId);
    if (index !== -1) {
      this.assets.splice(index, 1);
      this.saveAssets();
      if (this.isVisible) {
        this.renderAssets();
      }
    }
  }

  // Método público para re-escanear el sitio
  public refreshSiteAssets(): void {
    this.scanSiteAssets();
    if (this.isVisible) {
      this.renderAssets();
    }
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (this.modalElement && this.modalElement.parentNode) {
      document.body.removeChild(this.modalElement);
    }
    
    this.removeAllListeners();
  }
}