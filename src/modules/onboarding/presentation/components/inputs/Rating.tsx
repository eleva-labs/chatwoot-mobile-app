import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  style?: 'stars' | 'hearts' | 'thumbs';
  size?: 'small' | 'medium' | 'large';
  error?: string;
}

/**
 * Rating Component
 *
 * Displays a rating input (stars, hearts, or thumbs).
 */
export function Rating({
  value,
  onChange,
  maxRating = 5,
  style = 'stars',
  size = 'medium',
  error,
}: RatingProps) {
  const themedStyles = useThemedStyles();

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  const getIcon = (index: number, filled: boolean) => {
    switch (style) {
      case 'stars':
        return filled ? '⭐' : '☆';
      case 'hearts':
        return filled ? '❤️' : '🤍';
      case 'thumbs':
        return filled ? '👍' : '👎';
      default:
        return filled ? '⭐' : '☆';
    }
  };

  return (
    <View style={themedStyles.style('w-full')}>
      <View style={themedStyles.style('flex-row gap-2 justify-center items-center')}>
        {Array.from({ length: maxRating }, (_, index) => {
          const ratingValue = index + 1;
          const isSelected = value >= ratingValue;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onChange(ratingValue)}
              style={themedStyles.style('p-2')}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Rate ${ratingValue} out of ${maxRating}`}>
              <Text style={themedStyles.style(sizeClasses[size])}>
                {getIcon(index, isSelected)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <Text style={themedStyles.style('text-ruby-500 text-sm mt-2 text-center')}>{error}</Text>
      )}
    </View>
  );
}
