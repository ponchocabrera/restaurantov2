'use client';

import { useState } from 'react';

export default function AIScheduleGenerator({ onScheduleGenerated, onCancel }) {
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  const generateSchedule = async () => {
    setGenerating(true);
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Generate a one-week schedule

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }
      
      const data = await response.json();
      // Pass the schedule data back to the parent component
      onScheduleGenerated(data.schedule);
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Generate Schedule</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={generateSchedule}
            disabled={generating}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${
              generating ? 'cursor-not-allowed' : ''
            }`}
          >
            {generating ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
