# BrowserOS Integration Guide for Swibe Language

**Version:** 0.1.0  
**Status:** Complete  
**Date:** December 5, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [BrowserOS Capabilities](#browseros-capabilities)
3. [Getting Started](#getting-started)
4. [Swibe Macros for BrowserOS](#swibe-macros-for-browseros)
5. [Implementation Examples](#implementation-examples)
6. [Deployment Options](#deployment-options)
7. [Cross-Device Sync](#cross-device-sync)
8. [Offline Support](#offline-support)

---

## Overview

BrowserOS integration brings Swibe apps into the modern web ecosystem with:

- **Progressive Web App (PWA)** support
- **Web App Manifest** generation
- **Service Worker** caching and offline support
- **IndexedDB & LocalStorage** for persistent data
- **Desktop app** generation with Electron
- **Cross-device sync** capabilities
- **Widget system** for app shortcuts
- **File System Access API** integration

---

## BrowserOS Capabilities

### PWA Features
```
✅ Standalone display mode
✅ App install prompts
✅ Custom icons and splash screens
✅ Theme colors and branding
✅ Orientation control
```

### Storage & Sync
```
✅ LocalStorage (5-10MB)
✅ IndexedDB (50MB+)
✅ File System Access
✅ Cloud synchronization
✅ Cross-device sync
```

### Platform Support
```
✅ Web (browsers)
✅ Mobile (iOS, Android)
✅ Desktop (Windows, macOS, Linux via Electron)
✅ Offline-first architecture
```

---

## Getting Started

### 1. Basic PWA Setup

```javascript
const BrowserOSIntegration = require('./src/browserOS-integration');

// Create app instance
const app = new BrowserOSIntegration('MyApp', '1.0.0');

// Generate PWA manifest
const manifest = app.generateManifest({
  display: 'standalone',
  backgroundColor: '#ffffff',
  themeColor: '#2196F3'
});

// Register widgets
app.registerWidget('Dashboard', {
  url: '/dashboard',
  description: 'View your dashboard'
});

// Initialize file system
await app.initializeFileSystem();

// Initialize storage
await app.initializeStorage();

// Register service worker
await app.registerServiceWorker('/service-worker.js');
```

### 2. Service Worker Generation

```javascript
// Generate service worker code
const swCode = app.generateServiceWorker();

// Service worker handles:
// - Asset caching
// - Offline fallback
// - Request routing
// - Cache updates
```

### 3. HTML Head Tags

```javascript
// Generate required PWA meta tags
const headContent = app.generateHTMLHead();

// Includes:
// - Manifest link
// - Icons
// - Theme colors
// - Service worker registration
// - Apple mobile tags
```

---

## Swibe Macros for BrowserOS

### #[app] Macro

Declares the application with PWA configuration.

**Syntax:**
```swibe
#[app(name: "AppName", version: "1.0.0", description: "...")]
fn main() { ... }
```

**Attributes:**
- `name`: Application name
- `version`: Semantic version
- `description`: App description
- `icon`: App icon URL
- `theme_color`: Primary theme color

**Example:**
```swibe
#[app(name: "TaskManager", version: "1.0.0", description: "Task management app")]
fn main() {
  print("TaskManager started")
}
```

---

### #[widget] Macro

Registers app shortcuts/widgets for the home screen.

**Syntax:**
```swibe
#[widget(name: "Widget Name", url: "/path", icon: "icon.png")]
fn widget_handler() { ... }
```

**Attributes:**
- `name`: Widget display name
- `url`: Widget route URL
- `icon`: Widget icon path
- `description`: Widget description

**Example:**
```swibe
#[widget(name: "Dashboard", url: "/dashboard")]
fn show_dashboard() {
  display_dashboard_content()
}

#[widget(name: "Settings", url: "/settings")]
fn show_settings() {
  display_settings_content()
}
```

---

### #[pwa] Macro

Configures Progressive Web App settings.

**Syntax:**
```swibe
#[pwa(display: "standalone", theme_color: "#2196F3")]
fn startup() { ... }
```

**Attributes:**
- `display`: "standalone", "fullscreen", "minimal-ui", "browser"
- `theme_color`: Primary color hex code
- `background_color`: Background color hex code
- `orientation`: "portrait" or "landscape"
- `scope`: App URL scope

**Example:**
```swibe
#[pwa(display: "standalone", theme_color: "#2196F3", background_color: "#fff")]
fn main() {
  initialize_app()
}
```

---

### #[sync] Macro

Enables automatic cross-device synchronization.

**Syntax:**
```swibe
#[sync(provider: "indexeddb", key: "data_key", ttl: 3600)]
mut data = {...}
```

**Attributes:**
- `provider`: "localStorage", "indexeddb", "cloud"
- `key`: Storage key name
- `ttl`: Time-to-live in seconds (optional)
- `autoSync`: Enable automatic syncing (default: true)
- `cloudSync`: Enable cloud synchronization (default: false)

**Example:**
```swibe
#[sync(provider: "indexeddb", key: "tasks", autoSync: true)]
mut tasks: [Task] = []

#[sync(provider: "localStorage", key: "user_prefs")]
mut preferences = { theme: "dark" }
```

---

### #[offline] Macro

Declares offline support for a function.

**Syntax:**
```swibe
#[offline]
fn fetch_data() -> Result { ... }
```

**Features:**
- Automatic request caching
- Fallback to cached data
- Sync queue for failed requests
- Service worker integration

**Example:**
```swibe
#[offline]
fn get_user(id: str) -> User {
  fetch_user_from_api(id)
}

#[offline]
fn get_tasks() -> [Task] {
  fetch_tasks_from_api()
}
```

---

### #[desktop] Macro

Generates Electron configuration for desktop deployment.

**Syntax:**
```swibe
#[desktop(name: "AppName", version: "1.0.0")]
fn create_desktop() { ... }
```

**Generates:**
- Electron main.js
- App menus
- Window configuration
- Auto-update support

---

## Implementation Examples

### Example 1: Basic Task Manager App

```swibe
#[pwa(display: "standalone", theme_color: "#2196F3")]
#[app(name: "TaskManager", version: "1.0.0")]
fn main() {
  print("Task Manager initialized")
  initialize_storage()
  register_service_worker()
}

struct Task {
  id: str,
  title: str,
  completed: bool
}

#[sync(provider: "indexeddb", key: "tasks")]
mut tasks: [Task] = []

#[offline]
fn create_task(title: str) -> Task {
  let task = Task {
    id: generate_id(),
    title: title,
    completed: false
  }
  tasks.push(task)
  task
}

#[widget(name: "Dashboard", url: "/dashboard")]
fn show_dashboard() {
  print(format("Total tasks: {}", len(tasks)))
}
```

### Example 2: App with Multiple Widgets

```swibe
#[app(name: "ProductivityApp", version: "1.0.0")]
fn main() {
  initialize_app()
}

// Dashboard widget
#[widget(name: "Dashboard", url: "/")]
fn dashboard() {
  display_main_dashboard()
}

// Tasks widget
#[widget(name: "Tasks", url: "/tasks")]
fn tasks_view() {
  display_task_list()
}

// Notes widget
#[widget(name: "Notes", url: "/notes")]
fn notes_view() {
  display_notes()
}

// Settings widget
#[widget(name: "Settings", url: "/settings")]
fn settings_view() {
  display_settings()
}
```

### Example 3: Offline-First App

```swibe
#[offline]
fn fetch_and_cache(url: str) -> Result {
  -- Automatically cached
  fetch(url)
}

#[sync(provider: "indexeddb", key: "data", autoSync: true)]
mut cached_data = []

fn sync_when_online() {
  -- Auto-sync when connection returns
  %% setup online event handler
}

fn handle_offline() {
  print("App is offline - using cached data")
  display_cached_content()
}
```

---

## Deployment Options

### Option 1: Web Deployment

Deploy to any web server (GitHub Pages, Netlify, Vercel).

```bash
# Build the app
npm run build

# Deploy
npm run deploy
```

**Features:**
- PWA caching
- Auto-update with service worker
- Cross-browser support

### Option 2: Mobile App

Deploy to iOS and Android using Capacitor/Cordova.

```bash
# Add mobile platforms
npm run add-platform ios
npm run add-platform android

# Build
npm run build:mobile

# Deploy to app stores
```

### Option 3: Desktop App

Deploy as native desktop application using Electron.

```bash
# Generate Electron code
const electronCode = app.generateElectronMain();

# Build and distribute
npm run build:electron
npm run make:electron
```

**Electron supports:**
- Windows installer
- macOS .app bundle
- Linux AppImage/deb

---

## Cross-Device Sync

### How It Works

1. **Local Sync**: Data syncs to IndexedDB/localStorage
2. **Cloud Sync**: Data syncs to cloud backend
3. **Multi-Device**: All devices stay in sync
4. **Offline Queue**: Changes queue when offline

### Implementation

```swibe
// Define synced data
#[sync(provider: "indexeddb", cloudSync: true)]
mut user_data = { ... }

// Changes auto-sync across devices
user_data.name = "New Name"  // Syncs to cloud immediately

// Cloud sync API
POST /api/sync/push { key: "user_data", value: {...} }
GET  /api/sync/pull { key: "user_data" }
```

### Sync Status Tracking

```javascript
// Monitor sync status
app.storage.sync.addEventListener('syncstart', () => {
  console.log('Sync started');
});

app.storage.sync.addEventListener('syncend', () => {
  console.log('Sync completed');
});

app.storage.sync.addEventListener('syncerror', (error) => {
  console.error('Sync failed:', error);
});
```

---

## Offline Support

### Automatic Caching

Functions marked with `#[offline]` automatically cache results:

```swibe
#[offline]
fn get_data(id: str) -> Data {
  -- First call: fetches from server and caches
  -- Offline: returns cached value
  api.get(`/data/${id}`)
}
```

### Service Worker

The generated service worker:
- Caches all assets on first load
- Serves from cache when offline
- Syncs queued requests when online
- Updates cache in background

### Sync Queue

Failed requests queue automatically:

```javascript
// When offline:
// 1. Request fails
// 2. Added to sync queue
// 3. Stored in IndexedDB
// 4. When online, queue processes
// 5. Results sync back to app
```

### Testing Offline

```bash
# Chrome DevTools
1. Open DevTools → Application
2. Service Workers → Check "Offline"
3. Test your app offline

# Network throttling
DevTools → Network → Throttling
```

---

## API Reference

### BrowserOSIntegration Class

#### Constructor
```javascript
const app = new BrowserOSIntegration(appName, version);
```

#### Methods

```javascript
// Manifest
generateManifest(config) → Object

// Widgets
registerWidget(name, config) → Object

// Storage
initializeFileSystem() → Promise<FileSystem>
initializeStorage() → Promise<Storage>

// Service Worker
registerServiceWorker(path) → Promise<ServiceWorkerRegistration>
generateServiceWorker() → String

// HTML
generateHTMLHead() → String

// Desktop
generateElectronMain() → String

// Export
exportConfiguration() → Object
```

---

## Best Practices

### 1. Always Use #[offline]

```swibe
✅ DO:
#[offline]
fn fetch_user(id: str) -> User {
  api.get(`/users/${id}`)
}

❌ DON'T:
fn fetch_user(id: str) -> User {
  api.get(`/users/${id}`)  -- No offline support
}
```

### 2. Sync Critical Data

```swibe
✅ DO:
#[sync(provider: "indexeddb", cloudSync: true)]
mut user_preferences = {...}

❌ DON'T:
mut user_preferences = {...}  -- No sync
```

### 3. Test on Real Devices

- Test on actual smartphones
- Test offline scenarios
- Test slow connections
- Test service worker updates

### 4. Monitor Performance

```javascript
// Check sync status
console.log(app.storage.quota.estimate());

// Monitor service worker
console.log(navigator.serviceWorker.controller);
```

---

## Troubleshooting

### Issue: Service Worker Not Updating

**Solution:** Check cache in DevTools and force refresh
```javascript
// Force update
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SKIP_WAITING'
  });
}
```

### Issue: Data Not Syncing

**Solution:** Verify sync configuration
```swibe
-- Check provider
#[sync(provider: "indexeddb")]  -- Correct
#[sync(provider: "storage")]    -- Wrong!
```

### Issue: App Not Installable

**Solution:** Verify manifest requirements
```javascript
// Required for PWA:
- name ✅
- short_name ✅
- start_url ✅
- display ✅
- icons ✅
- theme_color ✅
```

---

## Complete Example: Full App

See `examples/browseros-app.swibe` for a complete Task Manager application with:
- PWA configuration
- Multiple widgets
- IndexedDB sync
- Offline support
- Complete CRUD operations

---

## Resources

- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Electron Documentation](https://www.electronjs.org/docs)

---

**Status:** BrowserOS integration is complete and production-ready.

All 28 Swibe Language features including #28 BrowserOS Integration are fully implemented.

