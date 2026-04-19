/**
 * Export: Download encrypted cipher backup
 */

import React, { useState } from 'react';
import { Download, Copy, Lock } from 'lucide-react';

export function Export({ cipher, onExport, isPremium }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exported, setExported] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleExport = async () => {
    try {
      setError(null);

      if (!password) {
        setError('Password required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      const result = await onExport(password);
      if (result.success) {
        setExported(result.encrypted);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = () => {
    if (!exported) return;

    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloakseed-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isPremium) {
    return (
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-300">Encrypted Backup Export</h3>
            <p className="text-sm text-blue-200/80 mt-1">
              Download an encrypted backup of your cipher. Available in Pro tier.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-sm mt-4">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cipher) {
    return (
      <div className="text-gray-400 text-center p-6">
        No cipher to export. Create one first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Encrypted Cipher Backup</h3>

      {exported ? (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <p className="text-green-200 text-sm font-semibold mb-2">✓ Export Ready</p>
            <p className="text-green-200/80 text-sm mb-4">
              Your cipher is encrypted and ready to download. Store it safely.
            </p>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold transition"
            >
              <Download className="w-5 h-5" />
              Download Backup
            </button>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 max-h-48 overflow-auto">
            <p className="text-xs text-gray-400 mb-2">JSON Export</p>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
              {exported.substring(0, 200)}...
            </pre>
          </div>

          <button
            onClick={() => {
              setExported(null);
              setPassword('');
              setConfirmPassword('');
            }}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Create Another Export
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Set a strong password to encrypt your cipher backup.
          </p>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4"
            />
            Show passwords
          </label>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
          >
            <Lock className="w-5 h-5" />
            Encrypt & Export
          </button>

          <div className="bg-gray-800/30 border border-gray-700 rounded p-4 text-sm text-gray-300">
            <p className="font-semibold mb-2">Security Tips:</p>
            <ul className="space-y-1 ml-4">
              <li>• Use a strong, unique password</li>
              <li>• Store backup in secure location (safe, vault)</li>
              <li>• Test import on another device before relying on it</li>
              <li>• Keep password separate from backup file</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Export;
