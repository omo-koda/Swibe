/**
 * BrowserOS Integration for Swibe Language
 * Enables Swibe apps to deploy as Progressive Web Apps (PWA)
 * Supports app manifests, widgets, file system integration, and desktop generation
 * Lines: 500+
 */

class BrowserOSIntegration {
  constructor(appName = 'SwibeApp', version = '0.1.0') {
    this.appName = appName;
    this.version = version;
    this.manifest = null;
    this.widgets = [];
    this.fileSystem = null;
    this.storage = null;
    this.serviceWorker = null;
  }

  /**
   * Generate PWA Web App Manifest
   * @param {Object} config - App configuration
   * @returns {Object} Manifest object
   */
  generateManifest(config = {}) {
    const {
      shortName = this.appName,
      description = `${this.appName} - Built with Swibe`,
      startUrl = '/',
      display = 'standalone',
      backgroundColor = '#ffffff',
      themeColor = '#2196F3',
      icons = [],
      scope = '/',
      orientation = 'portrait-primary',
      categories = ['productivity'],
      screenshots = []
    } = config;

    this.manifest = {
      name: this.appName,
      short_name: shortName,
      description,
      version: this.version,
      start_url: startUrl,
      scope,
      display,
      orientation,
      background_color: backgroundColor,
      theme_color: themeColor,
      categories,
      icons: icons.length > 0 ? icons : this.generateDefaultIcons(),
      screenshots: screenshots.length > 0 ? screenshots : this.generateDefaultScreenshots(),
      shortcuts: [],
      share_target: {
        action: '/share',
        method: 'POST',
        enctype: 'multipart/form-data',
        params: {
          title: 'title',
          text: 'text',
          url: 'url',
          files: [
            {
              name: 'file',
              accept: ['image/*', 'video/*', 'audio/*']
            }
          ]
        }
      },
      file_handlers: [
        {
          action: '/open-file',
          accept: {
            'text/plain': ['.txt', '.md'],
            'application/json': ['.json'],
            'text/html': ['.html']
          }
        }
      ],
      protocol_handlers: [
        {
          protocol: 'web+swibe',
          url: '/protocol?url=%s'
        }
      ]
    };

    return this.manifest;
  }

  /**
   * Generate default PWA icons
   * @returns {Array} Icon array
   */
  generateDefaultIcons() {
    const sizes = [192, 512];
    return sizes.map(size => ({
      src: `/icons/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any maskable'
    }));
  }

  /**
   * Generate default screenshots
   * @returns {Array} Screenshots array
   */
  generateDefaultScreenshots() {
    return [
      {
        src: '/screenshots/screenshot1.png',
        sizes: '540x720',
        type: 'image/png',
        form_factor: 'narrow'
      },
      {
        src: '/screenshots/screenshot2.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide'
      }
    ];
  }

  /**
   * Register a widget/app shortcut
   * @param {string} name - Widget name
   * @param {Object} config - Widget configuration
   */
  registerWidget(name, config = {}) {
    const {
      url = `/${name.toLowerCase()}`,
      icon = null,
      description = `${name} widget`,
      shortDescription = name
    } = config;

    const widget = {
      name,
      short_name: shortDescription,
      description,
      url,
      icon
    };

    this.widgets.push(widget);
    this.updateManifestWidgets();
    return widget;
  }

  /**
   * Update manifest with widgets
   */
  updateManifestWidgets() {
    if (this.manifest) {
      this.manifest.shortcuts = this.widgets.map((w, _idx) => ({
        name: w.name,
        short_name: w.short_name,
        description: w.description,
        url: w.url,
        icons: w.icon ? [{ src: w.icon, sizes: '96x96' }] : []
      }));
    }
  }

  /**
   * Initialize browser file system access
   * Uses File System Access API
   */
  async initializeFileSystem() {
    if (!('showOpenFilePicker' in window)) {
      console.warn('File System Access API not supported');
      return null;
    }

    this.fileSystem = {
      openFile: async (options = {}) => {
        const handles = await window.showOpenFilePicker({
          multiple: options.multiple || false,
          types: options.types || [{ description: 'All', accept: { '*/*': ['.*'] } }]
        });
        return handles;
      },

      openDirectory: async () => {
        return await window.showDirectoryPicker();
      },

      saveFile: async (fileName, data, options = {}) => {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: options.types || [{ description: 'All', accept: { '*/*': ['.*'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        return handle;
      },

      readFile: async (handle) => {
        const file = await handle.getFile();
        return await file.text();
      },

      listDirectory: async (directoryHandle) => {
        const entries = [];
        for await (const entry of directoryHandle.values()) {
          entries.push({
            name: entry.name,
            kind: entry.kind,
            handle: entry
          });
        }
        return entries;
      }
    };

    return this.fileSystem;
  }

  /**
   * Initialize browser storage with quota management
   */
  async initializeStorage() {
    this.storage = {
      local: {
        set: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        get: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        remove: (key) => {
          localStorage.removeItem(key);
        },
        clear: () => {
          localStorage.clear();
        }
      },

      session: {
        set: (key, value) => {
          sessionStorage.setItem(key, JSON.stringify(value));
        },
        get: (key) => {
          const item = sessionStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        remove: (key) => {
          sessionStorage.removeItem(key);
        },
        clear: () => {
          sessionStorage.clear();
        }
      },

      indexedDB: {
        open: async (dbName, version = 1) => {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }
      },

      quota: {
        estimate: async () => {
          if ('estimate' in navigator.storage) {
            return await navigator.storage.estimate();
          }
          return null;
        }
      }
    };

    return this.storage;
  }

  /**
   * Register Service Worker for offline support
   */
  async registerServiceWorker(swPath = '/service-worker.js') {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      this.serviceWorker = registration;
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Generate Service Worker code for caching
   * @returns {string} Service Worker code
   */
  generateServiceWorker() {
    return `
// Swibe BrowserOS Service Worker
const CACHE_NAME = 'swibe-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      return caches.match('/offline.html');
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
  }

  /**
   * Enable install prompt handling
   * @param {Function} callback - Callback when user can install
   */
  setupInstallPrompt(callback) {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (callback) {
        callback(true, deferredPrompt);
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      console.log('App was installed');
    });

    return {
      prompt: async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          deferredPrompt = null;
          return outcome;
        }
      }
    };
  }

  /**
   * Generate HTML for PWA with all meta tags
   * @returns {string} HTML head content
   */
  generateHTMLHead() {
    return `
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${this.manifest?.description || 'Swibe App'}">
<meta name="theme-color" content="${this.manifest?.theme_color || '#2196F3'}">

<!-- PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${this.manifest?.short_name || this.appName}">

<!-- Icons -->
<link rel="icon" type="image/png" href="/icons/favicon.png">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<link rel="manifest" href="/manifest.json">

<!-- Service Worker -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js');
    });
  }
</script>

<!-- Theme Color -->
<meta name="theme-color" content="${this.manifest?.theme_color || '#2196F3'}">
`;
  }

  /**
   * Generate Electron main process for desktop app
   * @returns {string} Electron main.js code
   */
  generateElectronMain() {
    return `
import { app, BrowserWindow, Menu } from "electron";
import path from "node:path";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icons/icon-512x512.png')
  });

  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:3000'
    : 'file://' + path.join(__dirname, '/build/index.html');

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
`;
  }

  /**
   * Get cross-device sync capabilities
   * @returns {Object} Sync configuration
   */
  getCrossSyncCapabilities() {
    return {
      localStorage: {
        supported: true,
        capacity: '5-10MB',
        sync: true
      },
      indexedDB: {
        supported: true,
        capacity: '50MB+',
        sync: true
      },
      cloudSync: {
        supported: true,
        endpoints: [
          '/api/sync/push',
          '/api/sync/pull'
        ]
      },
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        offlineSupport: true,
        backgroundSync: true
      }
    };
  }

  /**
   * Export all configuration as JSON
   * @returns {Object} Complete configuration
   */
  exportConfiguration() {
    return {
      app: {
        name: this.appName,
        version: this.version
      },
      manifest: this.manifest,
      widgets: this.widgets,
      serviceWorkerCode: this.generateServiceWorker(),
      electronMainCode: this.generateElectronMain(),
      htmlHead: this.generateHTMLHead(),
      syncCapabilities: this.getCrossSyncCapabilities()
    };
  }
}

export { BrowserOSIntegration };
