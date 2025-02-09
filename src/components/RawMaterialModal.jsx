import React from 'react';

export default function RawMaterialModal({ raw, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Raw Analysis Material</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 overflow-y-auto max-h-96">
          {raw}
        </pre>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 