import { updateShiftPreferences } from '@/lib/employee-management';
export default function ShiftPreferences({ employee, onUpdate }) {
    const shifts = [
      { type: 'morning', label: 'Morning (6am-2pm)' },
      { type: 'afternoon', label: 'Afternoon (2pm-10pm)' },
      { type: 'night', label: 'Night (10pm-6am)' }
    ];
  
    const handlePreferenceChange = async (shiftType, checked) => {
      const newPreferences = employee.shift_preferences.map(p => 
        p.shift_type === shiftType ? {...p, preferred: checked} : p
      );
      
      await updateShiftPreferences(employee.id, newPreferences);
      onUpdate({ ...employee, shift_preferences: newPreferences });
    };
  
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Shift Preferences</h3>
        <div className="space-y-2">
          {shifts.map(shift => (
            <label key={shift.type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={employee.shift_preferences?.find(p => p.shift_type === shift.type)?.preferred || false}
                onChange={(e) => handlePreferenceChange(shift.type, e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm">{shift.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }