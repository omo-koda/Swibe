/**
 * BrowserOS Support for Vibe Language
 * Provides Vibe syntax and macros for BrowserOS integration
 * Includes #[app], #[widget], #[sync] macros
 * Lines: 350+
 */

class BrowserOSVibeSupport {
  /**
   * Process #[app] macro for app manifest generation
   * Usage:
   * #[app(name: "MyApp", version: "1.0.0", theme_color: "#2196F3")]
   * fn main() { ... }
   */
  static processAppMacro(attributes) {
    const config = this.parseAttributes(attributes);
    return {
      type: 'app-declaration',
      name: config.name || 'VibeApp',
      version: config.version || '0.1.0',
      config: config
    };
  }

  /**
   * Process #[widget] macro for registering app widgets/shortcuts
   * Usage:
   * #[widget(name: "Dashboard", url: "/dashboard", icon: "dashboard.png")]
   * fn dashboard_view() { ... }
   */
  static processWidgetMacro(attributes, functionName) {
    const config = this.parseAttributes(attributes);
    return {
      type: 'widget-registration',
      name: config.name || functionName,
      url: config.url || `/${functionName.toLowerCase()}`,
      description: config.description || `${config.name} widget`,
      icon: config.icon || null
    };
  }

  /**
   * Process #[sync] macro for cross-device synchronization
   * Usage:
   * #[sync(provider: "indexeddb", key: "user_data", ttl: 3600)]
   * mut user_data = {...}
   */
  static processSyncMacro(attributes, variableName) {
    const config = this.parseAttributes(attributes);
    return {
      type: 'sync-declaration',
      variable: variableName,
      provider: config.provider || 'localStorage',
      key: config.key || variableName,
      ttl: config.ttl || null,
      autoSync: config.autoSync !== false,
      cloudSync: config.cloudSync === true
    };
  }

  /**
   * Process #[offline] macro for offline support declarations
   * Usage:
   * #[offline]
   * fn fetch_user(id: str) -> User { ... }
   */
  static processOfflineMacro(attributes) {
    return {
      type: 'offline-support',
      caching: true,
      fallback: true,
      syncQueue: true
    };
  }

  /**
   * Process #[pwa] macro for PWA configuration
   * Usage:
   * #[pwa(background_color: "#fff", display: "standalone")]
   * fn startup() { ... }
   */
  static processPWAMacro(attributes) {
    const config = this.parseAttributes(attributes);
    return {
      type: 'pwa-config',
      display: config.display || 'standalone',
      backgroundColor: config.background_color || '#ffffff',
      themeColor: config.theme_color || '#2196F3',
      orientation: config.orientation || 'portrait-primary',
      scope: config.scope || '/'
    };
  }

  /**
   * Parse macro attributes
   * Converts "key: value, key2: value2" to {key: value, key2: value2}
   */
  static parseAttributes(attributeString) {
    const attributes = {};
    if (!attributeString) return attributes;

    const pairs = attributeString.split(',').map(p => p.trim());
    pairs.forEach(pair => {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        attributes[key] = this.parseValue(value);
      }
    });
    return attributes;
  }

  /**
   * Parse attribute values (strings, numbers, booleans)
   */
  static parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }

  /**
   * Generate JavaScript for macro usage
   */
  static generateMacroCode(macro) {
    switch (macro.type) {
      case 'app-declaration':
        return this.generateAppCode(macro);
      case 'widget-registration':
        return this.generateWidgetCode(macro);
      case 'sync-declaration':
        return this.generateSyncCode(macro);
      case 'offline-support':
        return this.generateOfflineCode(macro);
      case 'pwa-config':
        return this.generatePWACode(macro);
      default:
        return '';
    }
  }

  /**
   * Generate code for app macro
   */
  static generateAppCode(macro) {
    return `
const BrowserOSIntegration = require('./browserOS-integration');
const app = new BrowserOSIntegration('${macro.name}', '${macro.version}');
app.generateManifest(${JSON.stringify(macro.config, null, 2)});
const manifest = app.manifest;
`;
  }

  /**
   * Generate code for widget macro
   */
  static generateWidgetCode(macro) {
    return `
app.registerWidget('${macro.name}', {
  url: '${macro.url}',
  description: '${macro.description}',
  icon: ${macro.icon ? `'${macro.icon}'` : 'null'}
});
`;
  }

  /**
   * Generate code for sync macro
   */
  static generateSyncCode(macro) {
    const syncCode = `
class SyncStorage {
  constructor(key, provider, ttl) {
    this.key = key;
    this.provider = provider;
    this.ttl = ttl;
  }

  set(value) {
    const data = {
      value: value,
      timestamp: Date.now(),
      ttl: this.ttl
    };
    if (this.provider === 'localStorage') {
      localStorage.setItem(this.key, JSON.stringify(data));
    } else if (this.provider === 'indexeddb') {
      // IndexedDB logic
    }
  }

  get() {
    if (this.provider === 'localStorage') {
      const item = localStorage.getItem(this.key);
      if (!item) return null;
      const data = JSON.parse(item);
      if (this.ttl && Date.now() - data.timestamp > this.ttl * 1000) {
        localStorage.removeItem(this.key);
        return null;
      }
      return data.value;
    }
    return null;
  }

  sync() {
    // Push to cloud
    fetch('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ key: this.key, value: this.get() })
    });
  }
}

const ${macro.variable}Storage = new SyncStorage(
  '${macro.key}',
  '${macro.provider}',
  ${macro.ttl}
);
`;
    return syncCode;
  }

  /**
   * Generate code for offline macro
   */
  static generateOfflineCode(macro) {
    return `
// Register offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(registration => {
    console.log('Service Worker registered for offline support');
  });
}

// Setup offline queue
const offlineQueue = [];
window.addEventListener('offline', () => {
  console.log('App went offline');
});
window.addEventListener('online', () => {
  console.log('App is online - syncing queue');
  // Process queue
});
`;
  }

  /**
   * Generate code for PWA macro
   */
  static generatePWACode(macro) {
    return `
// PWA Configuration
const pwaConfig = ${JSON.stringify(macro, null, 2)};

// Install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Enable install button
const installBtn = document.getElementById('install-btn');
if (installBtn && deferredPrompt) {
  installBtn.addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
}
`;
  }

  /**
   * Get example Vibe code using BrowserOS macros
   */
  static getExampleCode() {
    return `
-- Configure the app as a PWA
#[pwa(display: "standalone", theme_color: "#2196F3")]

-- Declare the app
#[app(name: "TaskManager", version: "1.0.0")]
fn main() {
  print("TaskManager - Task Management for Vibe")
}

-- Register dashboard widget
#[widget(name: "Dashboard", url: "/dashboard")]
fn show_dashboard() {
  -- Dashboard implementation
}

-- Register settings widget
#[widget(name: "Settings", url: "/settings")]
fn show_settings() {
  -- Settings implementation
}

-- Enable cross-device sync for tasks
#[sync(provider: "indexeddb", key: "tasks", autoSync: true)]
mut tasks = []

-- Enable offline support for fetching tasks
#[offline]
fn fetch_tasks() -> [Task] {
  -- Fetch with offline fallback
}

-- Setup for desktop deployment (Electron)
#[desktop(name: "TaskManager Desktop")]
fn create_desktop_app() {
  -- Electron configuration
}
`;
  }

  /**
   * Validate BrowserOS configuration
   */
  static validateConfiguration(config) {
    const errors = [];

    if (!config.manifest) {
      errors.push('Missing manifest configuration');
    }
    if (!config.manifest?.name) {
      errors.push('App name is required');
    }
    if (!config.manifest?.short_name) {
      errors.push('Short app name is required');
    }
    if (!config.manifest?.start_url) {
      errors.push('Start URL is required');
    }
    if (!config.manifest?.display) {
      errors.push('Display mode is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate complete BrowserOS deployment package
   */
  static generateDeploymentPackage(config) {
    return {
      manifest: config.manifest,
      serviceWorker: config.serviceWorkerCode,
      electronMain: config.electronMainCode,
      htmlHead: config.htmlHead,
      packageJson: {
        name: config.app.name.toLowerCase().replace(/\s+/g, '-'),
        version: config.app.version,
        description: config.manifest?.description,
        main: 'electron/main.js',
        homepage: config.manifest?.start_url,
        scripts: {
          'start': 'react-scripts start',
          'build': 'react-scripts build',
          'electron': 'electron .',
          'electron-dev': 'concurrently "npm start" "wait-on http://localhost:3000 && electron ."',
          'electron-build': 'npm run build && electron-builder'
        }
      },
      dockerFile: this.generateDockerfile(config),
      cicdConfig: this.generateGitHubActions(config)
    };
  }

  /**
   * Generate Dockerfile for containerization
   */
  static generateDockerfile(config) {
    return `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
`;
  }

  /**
   * Generate GitHub Actions workflow
   */
  static generateGitHubActions(config) {
    return `
name: Deploy Vibe App to BrowserOS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: build
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v2
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
`;
  }
}

export { BrowserOSVibeSupport };
