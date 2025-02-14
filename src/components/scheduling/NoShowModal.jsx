import React, { useState } from 'react';

export default function NoShowModal({
  shift,
  employeeName,
  day,
  availableCoverageEmployees,
  onSubmit,
  onClose
}) {
  const [reason, setReason] = useState('');
  const [requestCoverage, setRequestCoverage] = useState(false);
  const [selectedCoverage, setSelectedCoverage] = useState('');

  const handleSubmit = () => {
    onSubmit({ reason, requestCoverage, selectedCoverage });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Mark No-Show for {employeeName}</h3>

        {/* Reason for no-show */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for No-Show:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter reason..."
            rows={3}
          />
        </div>

        {/* Coverage request */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requestCoverage}
              onChange={(e) => setRequestCoverage(e.target.checked)}
              className="mr-2"
            />
            Request Coverage for this shift
          </label>
        </div>

        {/* Select coverage employee */}
        {requestCoverage && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Coverage Employee:
            </label>
            {availableCoverageEmployees.length > 0 ? (
              <select
                value={selectedCoverage}
                onChange={(e) => setSelectedCoverage(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- Select an employee --</option>
                {availableCoverageEmployees.map(emp => {
                  const fullName = `${emp.first_name} ${emp.last_name}`;
                  return (
                    <option key={emp.id} value={fullName}>
                      {fullName}
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="text-sm text-gray-500">
                No employees available for coverage on {day} 
                {shift?.role ? ` for the role ${shift.role}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
