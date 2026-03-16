import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@infrastructure/context/ThemeContext';
import { tailwind, useBoxShadow } from '@infrastructure/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const cardShadow = useBoxShadow('card');

  const themes = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ] as const;

  return (
    <View style={tailwind.style('flex-row bg-slate-3 rounded-lg p-1')}>
      {themes.map(themeOption => (
        <TouchableOpacity
          key={themeOption.key}
          style={[
            tailwind.style(
              theme === themeOption.key
                ? 'flex-1 py-2 px-3 rounded-md bg-solid-1'
                : 'flex-1 py-2 px-3 rounded-md bg-transparent',
            ),
            theme === themeOption.key ? { boxShadow: cardShadow } : undefined,
          ]}
          onPress={() => setTheme(themeOption.key)}>
          <Text
            style={tailwind.style(
              theme === themeOption.key
                ? 'text-center text-sm font-medium text-iris-11'
                : 'text-center text-sm font-medium text-slate-10',
            )}>
            {themeOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
