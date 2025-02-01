import React from 'react';
import { X } from 'lucide-react';

export default function AISettingsModal({ isOpen, onClose, settings, onSettingsChange }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">AI Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Voice
            </label>
            <input
              type="text"
              value={settings.brandVoice}
              onChange={(e) => onSettingsChange('brandVoice', e.target.value)}
              placeholder="e.g. upscale, fun, quirky..."
              className="p-2 border rounded-md w-full text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Style
            </label>
            <select
              value={settings.styleWanted}
              onChange={(e) => onSettingsChange('styleWanted', e.target.value)}
              className="p-2 border rounded-md w-full text-gray-700"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="rustic">Rustic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              value={settings.tone}
              onChange={(e) => onSettingsChange('tone', e.target.value)}
              className="p-2 border rounded-md w-full text-gray-700"
            >
              <option value="friendly">Friendly</option>
              <option value="quirky">Quirky</option>
              <option value="serious">Serious</option>
              <option value="funny">Funny</option>
              <option value="romantic">Romantic</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
} 