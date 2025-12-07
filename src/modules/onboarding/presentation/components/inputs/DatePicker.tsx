import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { format } from 'date-fns';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minDate?: Date;
  maxDate?: Date;
  displayFormat?: string;
  error?: string;
}

/**
 * Date Picker Component
 *
 * Displays a date/time picker for date input.
 */
export function DatePicker({
  value,
  onChange,
  mode = 'date',
  minDate,
  maxDate,
  displayFormat = 'MMM dd, yyyy',
  error,
}: DatePickerProps) {
  const themedStyles = useThemedStyles();
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    }
  };

  const displayValue = value ? format(value, displayFormat) : 'Select date';

  return (
    <View style={themedStyles.style('w-full')}>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={themedStyles.style(
          'w-full px-4 py-3 rounded-lg border bg-white',
          error ? 'border-ruby-500' : 'border-gray-300',
        )}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Date picker"
        accessibilityHint="Tap to select a date">
        <Text style={themedStyles.style('text-base', value ? 'text-gray-900' : 'text-gray-400')}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {error && <Text style={themedStyles.style('text-ruby-500 text-sm mt-1')}>{error}</Text>}
    </View>
  );
}
