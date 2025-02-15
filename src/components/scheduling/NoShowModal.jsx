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
  const [selectedMethod, setSelectedMethod] = useState('call');

  const handleSubmit = () => {
    // Do not trigger the SMS notification immediately.
    // (If "call" is selected, you can still trigger its API if desired.)
    if (requestCoverage && selectedMethod === 'call') {
      fetch(`/api/coverage/${shift.tempId}/pending`, {
        method: 'PUT'
      }).catch(err => console.error('Call error:', err));
    }
    // Pass the notifyMethod along so that the save process knows how to handle notifications.
    onSubmit({ reason, requestCoverage, selectedCoverage, notifyMethod: selectedMethod });
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

        <div className="notification-method mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Method:</h4>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setSelectedMethod('call')}
              className={`px-3 py-1 rounded ${
                selectedMethod === 'call' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Phone Call
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('sms')}
              className={`px-3 py-1 rounded ${
                selectedMethod === 'sms' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('donotify')}
              className={`px-3 py-1 rounded ${
                selectedMethod === 'donotify' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Don't Notify
            </button>
          </div>
        </div>

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
