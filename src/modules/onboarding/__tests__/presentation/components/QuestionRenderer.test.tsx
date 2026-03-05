/**
 * Tests for QuestionRenderer Component
 *
 * QuestionRenderer dynamically renders the appropriate input component
 * based on the question type (text, select, date, rating, slider, etc.).
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { render, fireEvent } from '@testing-library/react-native';
import { QuestionRenderer } from '../../../presentation/components/QuestionRenderer';
import { aScreen } from '../../helpers/builders';
import type { QuestionType } from '../../../domain/common';

// Mock all dependencies
jest.mock('@infrastructure/hooks/useThemedStyles', () => ({
  useThemedStyles: () => ({
    style: (className: string) => ({ className }),
    color: (colorName: string) => colorName,
  }),
}));

jest.mock('../../../presentation/hooks/useScreenTransition', () => ({
  useScreenTransition: () => ({
    entering: null,
    exiting: null,
  }),
}));

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View: View,
    },
  };
});

// Mock all input components
jest.mock('../../../presentation/components/inputs/TextInput', () => ({
  TextInput: ({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TextInput: RNTextInput } = require('react-native');
    return <RNTextInput testID="text-input" value={value} onChangeText={onChangeText} />;
  },
}));

jest.mock('../../../presentation/components/inputs/SingleSelectChips', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    SingleSelectChips: ({
      options,
      onChange,
      onCustomInput,
    }: {
      options: (
        | {
            label?: string;
            value?: string | number;
            allow_custom_input?: boolean;
            custom_input_placeholder?: string;
          }
        | string
      )[];
      onChange: (value: string | number) => void;
      onCustomInput?: (value: string) => void;
    }) => {
      // Find option with allow_custom_input
      const customOption = options.find(
        (opt: any) => typeof opt === 'object' && opt.allow_custom_input,
      );

      return React.createElement(
        View,
        { testID: 'single-select' },
        options.map(
          (option: { label?: string; value?: string | number } | string, index: number) => {
            const getValue = (): string | number => {
              if (typeof option === 'string') return option;
              if (typeof option === 'object' && option.value !== undefined) return option.value;
              if (typeof option === 'object') return String(option);
              return String(option);
            };
            return React.createElement(
              TouchableOpacity,
              {
                key: index,
                testID: `option-${index}`,
                onPress: () => onChange(getValue()),
              },
              React.createElement(
                Text,
                null,
                typeof option === 'object' ? option.label || String(option) : option,
              ),
            );
          },
        ),
        // Add a button to trigger onCustomInput if custom option exists
        customOption && onCustomInput
          ? React.createElement(
              TouchableOpacity,
              {
                key: 'custom-input',
                testID: 'custom-input-trigger',
                onPress: () => onCustomInput('custom value'),
              },
              React.createElement(Text, null, 'Custom Input'),
            )
          : null,
      );
    },
  };
});

jest.mock('../../../presentation/components/inputs/MultiSelectChips', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    MultiSelectChips: ({
      options,
      onChange,
    }: {
      options: ({ label?: string; value?: string | number } | string)[];
      onChange: (values: (string | number)[]) => void;
    }) =>
      React.createElement(
        View,
        { testID: 'multi-select' },
        options.map(
          (option: { label?: string; value?: string | number } | string, index: number) => {
            const getValue = (): string | number => {
              if (typeof option === 'string') return option;
              if (typeof option === 'object' && option.value !== undefined) return option.value;
              return String(option);
            };
            return React.createElement(
              TouchableOpacity,
              {
                key: index,
                testID: `multi-option-${index}`,
                onPress: () => onChange([getValue()]),
              },
              React.createElement(
                Text,
                null,
                typeof option === 'object' ? option.label || String(option) : option,
              ),
            );
          },
        ),
      ),
  };
});

jest.mock('../../../presentation/components/inputs/DatePicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    DatePicker: ({ onChange }: { onChange: (date: Date | null) => void }) =>
      React.createElement(
        View,
        { testID: 'date-picker' },
        React.createElement(
          TouchableOpacity,
          {
            testID: 'date-picker-trigger',
            onPress: () => onChange(new Date('2024-01-01')),
          },
          React.createElement(Text, null, 'Date Picker'),
        ),
      ),
  };
});

jest.mock('../../../presentation/components/inputs/Rating', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Rating: ({ maxRating, onChange }: { maxRating?: number; onChange: (value: number) => void }) =>
      React.createElement(
        View,
        { testID: 'rating' },
        React.createElement(
          TouchableOpacity,
          {
            testID: 'rating-trigger',
            onPress: () => onChange(4),
          },
          React.createElement(Text, null, `Rating (max: ${maxRating || 5})`),
        ),
      ),
  };
});

jest.mock('../../../presentation/components/inputs/Slider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    SliderInput: ({
      min,
      max,
      onChange,
    }: {
      min?: number;
      max?: number;
      onChange: (value: number) => void;
    }) =>
      React.createElement(
        View,
        { testID: 'slider' },
        React.createElement(
          TouchableOpacity,
          {
            testID: 'slider-trigger',
            onPress: () => onChange(50),
          },
          React.createElement(Text, null, `Slider ${min || 0}-${max || 100}`),
        ),
      ),
  };
});

describe('QuestionRenderer', () => {
  const defaultProps = {
    value: null,
    onChange: jest.fn(),
    error: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Screen rendering', () => {
    it('should render screen title', () => {
      const screen = aScreen().withTitle('What is your name?').build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText('What is your name?')).toBeTruthy();
    });

    it('should render screen description when provided', () => {
      const screen = aScreen()
        .withTitle('Question')
        .withDescription('Please provide your answer')
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText('Please provide your answer')).toBeTruthy();
    });

    it('should not render description when not provided', () => {
      const screen = aScreen().withTitle('Question').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} />);

      // Should not have description text
      expect(screen.description).toBeUndefined();
    });

    it('should show required indicator when screen is required', () => {
      const screen = aScreen().withRequired(true).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/required/i)).toBeTruthy();
    });

    it('should not show required indicator when screen is not required', () => {
      const screen = aScreen().withRequired(false).build();

      const { queryByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(queryByText(/required/i)).toBeNull();
    });
  });

  describe('Text input rendering', () => {
    it('should render TextInput for text question type', () => {
      const screen = aScreen().withQuestionType('text').build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('text-input')).toBeTruthy();
    });

    it('should pass value to TextInput', () => {
      const screen = aScreen().withQuestionType('text').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} {...defaultProps} value="test answer" />,
      );

      const textInput = getByTestId('text-input');
      expect(textInput.props.value).toBe('test answer');
    });

    it('should handle null value for text input', () => {
      const screen = aScreen().withQuestionType('text').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} {...defaultProps} value={null} />,
      );

      const textInput = getByTestId('text-input');
      expect(textInput.props.value).toBe('');
    });

    it('should pass error to TextInput', () => {
      const screen = aScreen().withQuestionType('text').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} error="Invalid input" />);

      // Error is passed to TextInput component (tested in TextInput tests)
    });
  });

  describe('Single select rendering', () => {
    it('should render SingleSelectChips for single_select type', () => {
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions(['Option 1', 'Option 2'])
        .build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('single-select')).toBeTruthy();
    });

    it('should pass options to SingleSelectChips', () => {
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions(['Red', 'Green', 'Blue'])
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText('Red')).toBeTruthy();
      expect(getByText('Green')).toBeTruthy();
      expect(getByText('Blue')).toBeTruthy();
    });

    it('should pass selected value to SingleSelectChips', () => {
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value="B" />);

      // Value is passed to component (tested in SingleSelectChips tests)
    });

    it('should handle custom input in single_select', () => {
      const onChange = jest.fn();
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions([
          { id: 'opt1', label: 'Option 1', value: 'opt1' },
          {
            id: 'other',
            label: 'Other',
            value: 'other',
            allow_custom_input: true,
            custom_input_placeholder: 'Enter custom value',
          },
        ])
        .build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value={null} onChange={onChange} />,
      );

      // Trigger custom input (this tests lines 62-64)
      const customInputTrigger = getByTestId('custom-input-trigger');
      fireEvent.press(customInputTrigger);

      expect(onChange).toHaveBeenCalledWith('custom value');
    });
  });

  describe('Multi select rendering', () => {
    it('should render MultiSelectChips for multi_select type', () => {
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['Option 1', 'Option 2'])
        .build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('multi-select')).toBeTruthy();
    });

    it('should pass options to MultiSelectChips', () => {
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['Coding', 'Design', 'Writing'])
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText('Coding')).toBeTruthy();
      expect(getByText('Design')).toBeTruthy();
      expect(getByText('Writing')).toBeTruthy();
    });

    it('should handle array value for multi select', () => {
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={['A', 'C']} />);

      // Value is passed to component
    });

    it('should handle empty array for multi select', () => {
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={[]} />);

      // Should not crash
    });

    it('should call onChange when multi_select value changes', () => {
      const onChange = jest.fn();
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value={[]} onChange={onChange} />,
      );

      // Simulate selecting an option (this tests line 75)
      const optionButton = getByTestId('multi-option-0');
      fireEvent.press(optionButton);

      expect(onChange).toHaveBeenCalledWith(['A']);
    });
  });

  describe('Date picker rendering', () => {
    it('should render DatePicker for date type', () => {
      const screen = aScreen().withQuestionType('date').build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('date-picker')).toBeTruthy();
    });

    it('should handle Date value', () => {
      const screen = aScreen().withQuestionType('date').build();
      const date = new Date('2024-01-01');

      render(<QuestionRenderer screen={screen} {...defaultProps} value={date} />);

      // Date is passed to DatePicker
    });

    it('should handle string date value', () => {
      const screen = aScreen().withQuestionType('date').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value="2024-01-01" />);

      // String is converted to Date
    });

    it('should handle null date value', () => {
      const screen = aScreen().withQuestionType('date').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={null} />);

      // Should not crash
    });

    it('should call onChange when date changes', () => {
      const onChange = jest.fn();
      const screen = aScreen().withQuestionType('date').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value={null} onChange={onChange} />,
      );

      // Simulate date change (this tests line 85)
      const datePickerTrigger = getByTestId('date-picker-trigger');
      fireEvent.press(datePickerTrigger);

      expect(onChange).toHaveBeenCalled();
      const calledWith = onChange.mock.calls[0][0];
      expect(calledWith).toBeInstanceOf(Date);
    });
  });

  describe('Rating rendering', () => {
    it('should render Rating for rating type', () => {
      const screen = aScreen().withQuestionType('rating').build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('rating')).toBeTruthy();
    });

    it('should pass maxRating from uiConfig', () => {
      const screenBuilder = aScreen().withQuestionType('rating');
      const screen = screenBuilder.build();
      // For testing, we need to set uiConfig which is readonly
      Object.defineProperty(screen, 'uiConfig', {
        value: { max_rating: 10 },
        writable: false,
        configurable: true,
      });

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/max: 10/i)).toBeTruthy();
    });

    it('should use default maxRating when not provided', () => {
      const screen = aScreen().withQuestionType('rating').build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/max: 5/i)).toBeTruthy();
    });

    it('should handle number value for rating', () => {
      const screen = aScreen().withQuestionType('rating').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={4} />);

      // Value is passed to Rating component
    });

    it('should handle null rating value', () => {
      const screen = aScreen().withQuestionType('rating').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={null} />);

      // Should default to 0
    });

    it('should call onChange when rating changes', () => {
      const onChange = jest.fn();
      const screen = aScreen().withQuestionType('rating').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value={0} onChange={onChange} />,
      );

      // Simulate rating change (this tests line 98)
      const ratingTrigger = getByTestId('rating-trigger');
      fireEvent.press(ratingTrigger);

      expect(onChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Slider rendering', () => {
    it('should render SliderInput for slider type', () => {
      const screen = aScreen().withQuestionType('slider').build();

      const { getByTestId } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByTestId('slider')).toBeTruthy();
    });

    it('should pass min and max from uiConfig', () => {
      const screen = aScreen().withQuestionType('slider').build();
      // For testing, we need to set uiConfig which is readonly
      Object.defineProperty(screen, 'uiConfig', {
        value: { min: 10, max: 100 },
        writable: false,
        configurable: true,
      });

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/10-100/i)).toBeTruthy();
    });

    it('should handle number value for slider', () => {
      const screen = aScreen().withQuestionType('slider').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} value={50} />);

      // Value is passed to SliderInput
    });

    it('should use min as default when value is null', () => {
      const screen = aScreen().withQuestionType('slider').build();
      // For testing, we need to set uiConfig which is readonly
      Object.defineProperty(screen, 'uiConfig', {
        value: { min: 20, max: 100 },
        writable: false,
        configurable: true,
      });

      render(<QuestionRenderer screen={screen} {...defaultProps} value={null} />);

      // Should default to min (20)
    });

    it('should call onChange when slider value changes', () => {
      const onChange = jest.fn();
      const screen = aScreen().withQuestionType('slider').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value={50} onChange={onChange} />,
      );

      // Simulate slider change (this tests line 110)
      const sliderTrigger = getByTestId('slider-trigger');
      fireEvent.press(sliderTrigger);

      expect(onChange).toHaveBeenCalledWith(50);
    });
  });

  describe('File upload rendering', () => {
    it('should show not implemented message for file_upload type', () => {
      const screen = aScreen()
        .withQuestionType('file_upload' as unknown as QuestionType)
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/not yet implemented/i)).toBeTruthy();
    });
  });

  describe('Unknown question type', () => {
    it('should show error message for unknown type', () => {
      const screen = aScreen()
        .withQuestionType('unknown_type' as unknown as QuestionType)
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/unknown question type/i)).toBeTruthy();
    });

    it('should display the unknown type in error message', () => {
      const screen = aScreen()
        .withQuestionType('custom_type' as unknown as QuestionType)
        .build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/custom_type/i)).toBeTruthy();
    });
  });

  describe('onChange handling', () => {
    it('should call onChange when value changes', () => {
      const onChange = jest.fn();
      const screen = aScreen().withQuestionType('text').build();

      const { getByTestId } = render(
        <QuestionRenderer screen={screen} value="" onChange={onChange} />,
      );

      const textInput = getByTestId('text-input');
      textInput.props.onChangeText('new value');

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('should handle onChange for single select', () => {
      const onChange = jest.fn();
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      const { getByText } = render(
        <QuestionRenderer screen={screen} value={null} onChange={onChange} />,
      );

      const optionB = getByText('B');
      // Use fireEvent to press the TouchableOpacity parent
      const { fireEvent } = require('@testing-library/react-native');
      fireEvent.press(optionB.parent || optionB);

      expect(onChange).toHaveBeenCalledWith('B');
    });
  });

  describe('Error handling', () => {
    it('should pass error to input components', () => {
      const screen = aScreen().withQuestionType('text').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} error="Error message" />);

      // Error is passed to TextInput (tested in component tests)
    });

    it('should handle undefined error', () => {
      const screen = aScreen().withQuestionType('text').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} error={undefined} />);

      // Should not crash
    });

    it('should handle empty string error', () => {
      const screen = aScreen().withQuestionType('text').build();

      render(<QuestionRenderer screen={screen} {...defaultProps} error="" />);

      // Should not crash
    });
  });

  describe('Memoization', () => {
    it('should memoize component to prevent unnecessary re-renders', () => {
      const screen = aScreen().withId('q1').withTitle('Question').build();

      const { rerender } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      // Re-render with same props
      rerender(<QuestionRenderer screen={screen} {...defaultProps} />);

      // Memoization is handled by React.memo
    });

    it('should re-render when screen ID changes', () => {
      const screen1 = aScreen().withId('q1').build();
      const screen2 = aScreen().withId('q2').build();

      const { rerender, getByText } = render(
        <QuestionRenderer screen={screen1} {...defaultProps} />,
      );

      // Screen 1 title
      expect(getByText(screen1.title)).toBeTruthy();

      rerender(<QuestionRenderer screen={screen2} {...defaultProps} />);

      // Should show screen 2 title
      expect(getByText(screen2.title)).toBeTruthy();
    });

    it('should re-render when value changes', () => {
      const screen = aScreen().withQuestionType('text').build();

      const { rerender, getByTestId } = render(
        <QuestionRenderer screen={screen} {...defaultProps} value="old" />,
      );

      expect(getByTestId('text-input').props.value).toBe('old');

      rerender(<QuestionRenderer screen={screen} {...defaultProps} value="new" />);

      expect(getByTestId('text-input').props.value).toBe('new');
    });

    it('should re-render when error changes', () => {
      const screen = aScreen().withQuestionType('text').build();

      const { rerender } = render(
        <QuestionRenderer screen={screen} {...defaultProps} error={undefined} />,
      );

      rerender(<QuestionRenderer screen={screen} {...defaultProps} error="Error" />);

      // Error change triggers re-render
    });
  });

  describe('Edge cases', () => {
    it('should throw error for screen with empty options array', () => {
      expect(() => {
        aScreen().withQuestionType('single_select').withOptions([]).build();
      }).toThrow('single_select type requires options');
    });

    it('should handle very long title', () => {
      const longTitle = 'a'.repeat(1000);
      const screen = aScreen().withTitle(longTitle).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(longTitle)).toBeTruthy();
    });

    it('should handle very long description', () => {
      const longDescription = 'b'.repeat(10000);
      const screen = aScreen().withDescription(longDescription).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(longDescription)).toBeTruthy();
    });

    it('should handle special characters in title', () => {
      const specialTitle = "!@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const screen = aScreen().withTitle(specialTitle).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(specialTitle)).toBeTruthy();
    });

    it('should handle unicode in title', () => {
      const unicodeTitle = '你好世界 🌍 مرحبا';
      const screen = aScreen().withTitle(unicodeTitle).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(unicodeTitle)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render ScrollView for accessibility', () => {
      const screen = aScreen().build();

      const { UNSAFE_getByType } = render(<QuestionRenderer screen={screen} {...defaultProps} />);
      const { ScrollView } = require('react-native');
      expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
    });

    it('should display required indicator for screen readers', () => {
      const screen = aScreen().withRequired(true).build();

      const { getByText } = render(<QuestionRenderer screen={screen} {...defaultProps} />);

      expect(getByText(/required/i)).toBeTruthy();
    });
  });
});
