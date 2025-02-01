import React from 'react';
import { X, Upload } from 'lucide-react';
import BulkUpload from './BulkUpload';

export default function ImportExportModal({ isOpen, onClose, onImport, onExport }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Import/Export Menu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Import</h3>
            <BulkUpload onUploadSuccess={(items) => {
              onImport(items);
              onClose();
            }} />
          </div>
          <div>
            <h3 className="font-medium mb-2">Export</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Export as CSV
              </button>
              <button
                onClick={() => onExport('json')}
                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 