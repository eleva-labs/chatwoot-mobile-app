import React, { memo, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { Screen } from '../../domain/entities/Screen';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useScreenTransition } from '../hooks/useScreenTransition';
import { TextInput } from './inputs/TextInput';
import { SingleSelectChips } from './inputs/SingleSelectChips';
import { MultiSelectChips } from './inputs/MultiSelectChips';
import { DatePicker } from './inputs/DatePicker';
import { Rating } from './inputs/Rating';
import { SliderInput } from './inputs/Slider';
import type { AnswerValue } from '../../domain/common';

const DEFAULT_INPUT_CONTAINER_STYLE =
  'w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50';

interface QuestionRendererProps {
  screen: Screen;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string;
}

/**
 * Question Renderer Component
 *
 * Dynamically renders the appropriate input component based on question type.
 * Memoized for performance optimization.
 */
function QuestionRendererComponent({ screen, value, onChange, error }: QuestionRendererProps) {
  const themedStyles = useThemedStyles();
  const { entering, exiting } = useScreenTransition('forward', screen.uiConfig);

  const renderInput = useMemo(() => {
    switch (screen.type) {
      case 'text':
        return (
          <TextInput
            value={String(value || '')}
            onChangeText={text => onChange(text)}
            placeholder={screen.placeholder}
            error={error}
            required={screen.isRequired()}
            multiline={screen.uiConfig?.layout === 'grid'}
          />
        );

      case 'single_select':
        return (
          <SingleSelectChips
            options={screen.options || []}
            value={(value as string | number) || null}
            onChange={val => onChange(val)}
            error={error}
            allowCustomInput={screen.options?.some(opt => opt.allow_custom_input)}
            customInputPlaceholder={
              screen.options?.find(opt => opt.allow_custom_input)?.custom_input_placeholder
            }
            onCustomInput={customValue => {
              // Find the "other" option and use its value
              const otherOption = screen.options?.find(opt => opt.allow_custom_input);
              if (otherOption) {
                onChange(customValue);
              }
            }}
          />
        );

      case 'multi_select':
        return (
          <MultiSelectChips
            options={screen.options || []}
            value={(value as (string | number)[]) || []}
            onChange={vals => onChange(vals as AnswerValue)}
            error={error}
            maxSelection={screen.validation?.max_selection}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={value instanceof Date ? value : value ? new Date(String(value)) : null}
            onChange={date => onChange(date)}
            mode={screen.uiConfig?.mode || 'date'}
            minDate={screen.uiConfig?.min_date ? new Date(screen.uiConfig.min_date) : undefined}
            maxDate={screen.uiConfig?.max_date ? new Date(screen.uiConfig.max_date) : undefined}
            displayFormat={screen.uiConfig?.display_format}
            error={error}
          />
        );

      case 'rating':
        return (
          <Rating
            value={(value as number) || 0}
            onChange={val => onChange(val)}
            maxRating={screen.uiConfig?.max_rating || 5}
            style={screen.uiConfig?.style || 'stars'}
            size={screen.uiConfig?.size || 'medium'}
            error={error}
          />
        );

      case 'slider':
        return (
          <SliderInput
            value={(value as number) || screen.uiConfig?.min || 0}
            onChange={val => onChange(val)}
            min={screen.uiConfig?.min}
            max={screen.uiConfig?.max}
            step={screen.uiConfig?.step}
            showValue={screen.uiConfig?.show_value}
            unit={screen.uiConfig?.unit}
            error={error}
          />
        );

      case 'file_upload':
        // File upload will be implemented separately
        return (
          <View style={themedStyles.style(DEFAULT_INPUT_CONTAINER_STYLE)}>
            <Text style={themedStyles.style('text-gray-600 text-center')}>
              File upload not yet implemented
            </Text>
          </View>
        );
      default:
        return (
          <View style={themedStyles.style(DEFAULT_INPUT_CONTAINER_STYLE)}>
            <Text style={themedStyles.style('text-gray-600 text-center')}>
              Unknown question type: {screen.type}
            </Text>
          </View>
        );
    }
  }, [screen, value, onChange, error, themedStyles]);
  return (
    <Animated.View
      key={screen.id.toString()}
      entering={entering}
      exiting={exiting}
      style={themedStyles.style('flex-1')}
    >
      <ScrollView
        style={themedStyles.style('flex-1')}
        contentContainerStyle={themedStyles.style('p-4')}
      >
        <View style={themedStyles.style('mb-6')}>
          <Text style={themedStyles.style('text-2xl font-semibold text-gray-900 mb-2')}>
            {screen.title}
          </Text>
          {screen.description && (
            <Text style={themedStyles.style('text-base text-gray-600')}>{screen.description}</Text>
          )}
          {screen.isRequired() && (
            <Text style={themedStyles.style('text-sm text-gray-500 mt-1')}>* Required</Text>
          )}
        </View>

        <View style={themedStyles.style('w-full')}>{renderInput}</View>
      </ScrollView>
    </Animated.View>
  );
}

// Memoize component to prevent unnecessary re-renders
export const QuestionRenderer = memo(QuestionRendererComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.screen.id.toString() === nextProps.screen.id.toString() &&
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error
  );
});
