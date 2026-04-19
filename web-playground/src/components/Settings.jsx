import React, { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    autoStopOnFind: true,
    showPrivateKeys: false,
    enableNotifications: false,
  })

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Generation Settings */}
        <div>
          <h3 className="font-bold text-lg mb-4">Generation</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStopOnFind}
                onChange={() => toggleSetting('autoStopOnFind')}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Auto-stop when max results found</div>
                <div className="text-sm text-gray-500">Stop generation automatically</div>
              </div>
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="font-bold text-lg mb-4">Privacy</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPrivateKeys}
                onChange={() => toggleSetting('showPrivateKeys')}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Always show private keys</div>
                <div className="text-sm text-gray-500">Disable default hiding for faster copy</div>
              </div>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="font-bold text-lg mb-4">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={() => toggleSetting('enableNotifications')}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Enable notifications</div>
                <div className="text-sm text-gray-500">Alert when addresses are found</div>
              </div>
            </label>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-bold mb-3">System Information</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>CPU Cores: {navigator.hardwareConcurrency || 'Unknown'}</div>
            <div>Browser: {getBrowserName()}</div>
            <div>WebGL: {hasWebGL() ? 'Available' : 'Not available'}</div>
            <div>SharedArrayBuffer: {typeof SharedArrayBuffer !== 'undefined' ? 'Available' : 'Not available'}</div>
            <div>WebWorkers: {'Worker' in window ? 'Available' : 'Not available'}</div>
          </div>
        </div>

        {/* About */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2">About Vanity-ETH Pro</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Version:</strong> 2.0.0<br />
            <strong>License:</strong> MIT<br />
            <strong>Repository:</strong> <a href="https://github.com/bokub/vanity-eth" target="_blank" rel="noopener" className="text-blue-600 hover:underline">github.com/bokub/vanity-eth</a>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
            An advanced fork with WebAssembly acceleration, Web Workers parallelization, CREATE2 support, and modern UI.
          </p>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className="btn bg-red-500 hover:bg-red-600 text-white w-full"
        >
          Clear All Data & Reset
        </button>
      </div>
    </div>
  )
}

function getBrowserName() {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown'
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}
