import React from 'react';

export default function CoverageOptionsModal({ coverageId, onClose }) {
  const handleSelection = async (option) => {
    if (option === 'sms') {
      // Use the SMS endpoint to send an SMS coverage request.
      try {
        const response = await fetch('/api/sms/coverage-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverageId }),
        });
        const data = await response.json();
        if (response.ok) {
          alert('SMS request sent successfully.');
        } else {
          alert('Failed to send SMS: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Error sending SMS request.');
      }
    } else if (option === 'call') {
      // Use the coverage pending endpoint to trigger the call.
      // In our backend, this endpoint updates the record to pending
      // and then, after a delay, calls the employee.
      try {
        const response = await fetch(`/api/coverage/${coverageId}/pending`, {
          method: 'PUT',
        });
        const data = await response.json();
        if (response.ok) {
          alert('Call request triggered successfully.');
        } else {
          alert('Failed to trigger call.');
        }
      } catch (err) {
        console.error(err);
        alert('Error triggering contract call.');
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-4">Select Coverage Option</h2>
        <p>Please choose how you want to request coverage:</p>
        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => handleSelection('call')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Call Coverage
          </button>
          <button
            onClick={() => handleSelection('sms')}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            SMS Coverage Request
          </button>
        </div>
        <div className="mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
