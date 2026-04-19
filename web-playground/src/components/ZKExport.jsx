import React, { useState } from 'react'
import { Copy, Eye, EyeOff, Download, Lock } from 'lucide-react'
import QRCode from 'qrcode.react'
import {
  createKeystore,
  unlockKeystore,
  createOneTimeQR,
  createSecureExport,
  encryptAESGCM,
  decryptAESGCM,
} from '../utils/encryption'

export default function ZKExport({ address = '', privateKey = '' }) {
  const [password, setPassword] = useState('')
  const [exportType, setExportType] = useState('keystore')
  const [keystore, setKeystore] = useState(null)
  const [secureExport, setSecureExport] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockedData, setUnlockedData] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreateKeystore = async () => {
    if (!password) {
      setError('Enter a password')
      return
    }

    if (!privateKey) {
      setError('No private key to encrypt')
      return
    }

    try {
      setError('')
      const ks = await createKeystore(privateKey, password)
      setKeystore(ks)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateSecureExport = async () => {
    if (!privateKey) {
      setError('No private key to export')
      return
    }

    try {
      setError('')
      const exp = createSecureExport(privateKey, 'ethereum', true)
      setSecureExport(exp)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateQRCode = () => {
    if (!privateKey) {
      setError('No private key for QR code')
      return
    }

    try {
      setError('')
      const qr = createOneTimeQR(privateKey)
      setQrCode(qr)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUnlockKeystore = async () => {
    if (!unlockPassword || !keystore) {
      setError('Enter password')
      return
    }

    try {
      setError('')
      const data = await unlockKeystore(keystore.keystore, unlockPassword)
      setUnlockedData(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJSON = (data, filename) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Lock size={24} className="text-primary-600" />
        Zero-Knowledge Export
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Export private keys securely. Private keys never leave your browser. Client-side encryption only.
      </p>

      {!privateKey ? (
        <div className="alert alert-warning">
          No private key to export. Generate or import an address first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Export Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-3">Export Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'keystore', label: '🔐 Keystore', desc: 'Password encrypted' },
                { type: 'secure', label: '✓ Secure', desc: 'Checksum verified' },
                { type: 'qr', label: '📱 QR Code', desc: 'One-time use' },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setExportType(opt.type)
                    setError('')
                  }}
                  className={`p-3 rounded-lg border-2 transition ${
                    exportType === opt.type
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Keystore Export */}
          {exportType === 'keystore' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Encryption Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Strong password required"
                  className="input"
                />
              </div>

              <button
                onClick={handleCreateKeystore}
                className="btn btn-primary w-full"
              >
                Encrypt & Create Keystore
              </button>

              {keystore && (
                <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keystore created. Store securely. Password required to unlock.
                  </p>
                  <button
                    onClick={() => downloadJSON(keystore, 'keystore.json')}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Download Keystore JSON
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(keystore, null, 2))}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy size={16} />
                    Copy to Clipboard
                  </button>
                </div>
              )}

              {/* Keystore Unlock */}
              {keystore && !unlockedData && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <label className="block text-sm font-medium mb-2">Unlock Keystore</label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter password"
                    className="input mb-2"
                  />
                  <button
                    onClick={handleUnlockKeystore}
                    className="btn btn-primary w-full text-sm"
                  >
                    Verify & View
                  </button>
                </div>
              )}

              {unlockedData && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-sm font-bold text-green-800 dark:text-green-100 mb-2">✓ Unlocked</p>
                  <p className="font-mono text-xs break-all bg-white dark:bg-gray-800 p-2 rounded">
                    {unlockedData.privateKey}
                  </p>
                  <button
                    onClick={() => copyToClipboard(unlockedData.privateKey)}
                    className="text-xs text-green-600 hover:underline mt-2"
                  >
                    <Copy size={14} className="inline mr-1" />
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Secure Export */}
          {exportType === 'secure' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <button
                onClick={handleCreateSecureExport}
                className="btn btn-primary w-full"
              >
                Create Secure Export
              </button>

              {secureExport && (
                <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data verified with checksum: <code className="text-xs">{secureExport.checksum}</code>
                  </p>
                  <button
                    onClick={() => downloadJSON(secureExport, 'secure-export.json')}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    Download Secure JSON
                  </button>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(secureExport, null, 2))}
                    className="btn btn-secondary w-full text-sm"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* QR Code */}
          {exportType === 'qr' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                One-time QR code expires in 5 minutes after generation
              </p>
              <button
                onClick={handleCreateQRCode}
                className="btn btn-primary w-full"
              >
                Generate QR Code
              </button>

              {qrCode && (
                <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-center bg-white p-4 rounded">
                    <QRCode value={qrCode} size={256} level="H" />
                  </div>
                  <p className="text-xs text-yellow-600">
                    ⏱️ This QR expires in 5 minutes. Scan only on secure device.
                  </p>
                  <button
                    onClick={() => copyToClipboard(qrCode)}
                    className="btn btn-secondary w-full text-sm"
                  >
                    Copy QR Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* Current Key Display */}
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Private Key</span>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </label>
            <p className="font-mono text-xs break-all p-2 bg-white dark:bg-gray-800 rounded">
              {showPrivateKey ? privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
