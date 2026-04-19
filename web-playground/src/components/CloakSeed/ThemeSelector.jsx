/**
 * ThemeSelector: Choose or create cipher theme
 */

import React, { useState } from 'react';
import { ChevronRight, Upload, Plus, X } from 'lucide-react';
import { THEMES } from '../../utils/wordlists';

export function ThemeSelector({ onSelectTheme, onCustomWords }) {
  const [customMode, setCustomMode] = useState(false);
  const [customWords, setCustomWords] = useState('');
  const [uploadError, setUploadError] = useState(null);

  const handleThemeClick = (themeName) => {
    const theme = THEMES[themeName];
    onSelectTheme(themeName, theme.words);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const words = text
          .split('\n')
          .map(w => w.trim().toLowerCase())
          .filter(w => w.length > 0);

        if (words.length !== 2048) {
          setUploadError(`Expected 2048 words, got ${words.length}`);
          return;
        }

        const uniqueWords = new Set(words);
        if (uniqueWords.size !== 2048) {
          setUploadError('All words must be unique');
          return;
        }

        setUploadError(null);
        setCustomWords(words.join('\n'));
        onCustomWords(words);
        setCustomMode(false);
      } catch (err) {
        setUploadError(err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Choose Your Theme</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeClick(key)}
              className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-lg p-4 text-left transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">{theme.icon}</div>
                  <h4 className="font-semibold">{theme.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">2048 words</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Upload */}
      <div className="border-t border-gray-700 pt-6">
        <button
          onClick={() => setCustomMode(!customMode)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
        >
          <Plus className="w-4 h-4" />
          Upload Custom Wordlist
        </button>

        {customMode && (
          <div className="mt-4 space-y-3">
            <div className="bg-gray-800/30 border border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                id="wordlist-upload"
              />
              <label
                htmlFor="wordlist-upload"
                className="block cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">
                  Upload .txt file with 2048 words (one per line)
                </p>
              </label>
            </div>

            {uploadError && (
              <div className="bg-red-900/20 border border-red-700 rounded p-3 text-red-200 text-sm">
                {uploadError}
              </div>
            )}

            {customWords && (
              <div className="bg-green-900/20 border border-green-700 rounded p-3 text-green-200 text-sm">
                ✓ Custom wordlist loaded ({customWords.split('\n').length} words)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paste Method */}
      <div className="border-t border-gray-700 pt-6">
        <h4 className="font-semibold mb-3 text-sm text-gray-300">Or paste words directly</h4>
        <textarea
          value={customWords}
          onChange={(e) => setCustomWords(e.target.value)}
          placeholder="Paste 2048 words (one per line)"
          className="w-full h-24 bg-gray-800 border border-gray-700 rounded p-3 text-white text-sm resize-none"
        />
        {customWords && (
          <p className="text-xs text-gray-400 mt-2">
            {customWords.split('\n').filter(w => w.trim()).length} words detected
          </p>
        )}
      </div>
    </div>
  );
}

export default ThemeSelector;
