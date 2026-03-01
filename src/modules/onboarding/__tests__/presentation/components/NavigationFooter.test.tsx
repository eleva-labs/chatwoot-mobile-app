/**
 * Tests for NavigationFooter Component
 *
 * NavigationFooter displays navigation buttons (Previous, Next, Skip, Submit)
 * based on the current screen state and navigation context.
 */

import React from 'react';

// eslint-disable-next-line import/no-unresolved
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationFooter } from '../../../presentation/components/NavigationFooter';
import { aScreen } from '../../helpers/builders';

// Mock dependencies
jest.mock('@infrastructure/hooks/useThemedStyles', () => ({
  useThemedStyles: () => ({
    style: (className: string) => ({ className }),
    color: (colorName: string) => colorName,
  }),
}));

jest.mock('@infrastructure/ui/button/Button', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Button: ({
      text,
      handlePress,
      disabled,
      testID,
    }: {
      text: string;
      handlePress?: () => void;
      disabled?: boolean;
      testID?: string;
    }) =>
      React.createElement(
        TouchableOpacity,
        { onPress: handlePress, disabled, testID },
        React.createElement(Text, null, text),
      ),
  };
});

describe('NavigationFooter', () => {
  const defaultProps = {
    currentScreen: aScreen().build(),
    canGoNext: true,
    canGoPrevious: false,
    isLastStep: false,
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    onSkip: jest.fn(),
    onSubmit: jest.fn(),
    loading: false,
    locale: 'en',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Previous button', () => {
    it('should show previous button when canGoPrevious is true', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} canGoPrevious={true} />);

      expect(getByText(/previous/i)).toBeTruthy();
    });

    it('should not show previous button when canGoPrevious is false', () => {
      const { queryByText } = render(<NavigationFooter {...defaultProps} canGoPrevious={false} />);

      expect(queryByText(/previous/i)).toBeNull();
    });

    it('should call onPrevious when previous button is pressed', () => {
      const onPrevious = jest.fn();
      const { getByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={true} onPrevious={onPrevious} />,
      );

      fireEvent.press(getByText(/previous/i));

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should disable previous button when loading', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={true} loading={true} />,
      );

      const button = getByText(/previous/i).parent;
      expect(button?.props.disabled).toBe(true);
    });

    it('should enable previous button when not loading', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={true} loading={false} />,
      );

      const button = getByText(/previous/i).parent;
      expect(button?.props.disabled).toBe(false);
    });
  });

  describe('Next button', () => {
    it('should show next button when not last step', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} isLastStep={false} />);

      expect(getByText(/next/i)).toBeTruthy();
    });

    it('should not show next button when last step', () => {
      const { queryByText } = render(<NavigationFooter {...defaultProps} isLastStep={true} />);

      expect(queryByText(/^next$/i)).toBeNull();
    });

    it('should call onNext when next button is pressed', () => {
      const onNext = jest.fn();
      const { getByText } = render(<NavigationFooter {...defaultProps} onNext={onNext} />);

      fireEvent.press(getByText(/next/i));

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should disable next button when canGoNext is false', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} canGoNext={false} />);

      const button = getByText(/next/i).parent;
      expect(button?.props.disabled).toBe(true);
    });

    it('should enable next button when canGoNext is true', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} canGoNext={true} />);

      const button = getByText(/next/i).parent;
      expect(button?.props.disabled).toBe(false);
    });

    it('should disable next button when loading', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} loading={true} />);

      const button = getByText(/next/i).parent;
      expect(button?.props.disabled).toBe(true);
    });

    it('should disable next button when both loading and canGoNext is false', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} loading={true} canGoNext={false} />,
      );

      const button = getByText(/next/i).parent;
      expect(button?.props.disabled).toBe(true);
    });
  });

  describe('Submit button', () => {
    it('should show submit button when last step', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} isLastStep={true} />);

      expect(getByText(/submit/i)).toBeTruthy();
    });

    it('should not show submit button when not last step', () => {
      const { queryByText } = render(<NavigationFooter {...defaultProps} isLastStep={false} />);

      expect(queryByText(/submit/i)).toBeNull();
    });

    it('should call onSubmit when submit button is pressed', () => {
      const onSubmit = jest.fn();
      const { getByText } = render(
        <NavigationFooter {...defaultProps} isLastStep={true} onSubmit={onSubmit} />,
      );

      fireEvent.press(getByText(/submit/i));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should disable submit button when canGoNext is false', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} isLastStep={true} canGoNext={false} />,
      );

      const button = getByText(/submit/i).parent;
      expect(button?.props.disabled).toBe(true);
    });

    it('should enable submit button when canGoNext is true', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} isLastStep={true} canGoNext={true} />,
      );

      const button = getByText(/submit/i).parent;
      expect(button?.props.disabled).toBe(false);
    });

    it('should disable submit button when loading', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} isLastStep={true} loading={true} />,
      );

      const button = getByText(/submit/i).parent;
      expect(button?.props.disabled).toBe(true);
    });

    it('should handle undefined onSubmit gracefully', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} isLastStep={true} onSubmit={undefined} />,
      );

      // Should not crash when pressed
      expect(() => fireEvent.press(getByText(/submit/i))).not.toThrow();
    });
  });

  describe('Skip button', () => {
    it('should show skip button when screen is skippable and not last step', () => {
      const screen = aScreen().withSkipConfig(true, 'Skip this').build();
      const { getByText } = render(
        <NavigationFooter {...defaultProps} currentScreen={screen} isLastStep={false} />,
      );

      expect(getByText(/skip/i)).toBeTruthy();
    });

    it('should not show skip button when screen is not skippable', () => {
      const screen = aScreen().withSkipConfig(false).build();
      const { queryByText } = render(<NavigationFooter {...defaultProps} currentScreen={screen} />);

      expect(queryByText(/skip/i)).toBeNull();
    });

    it('should not show skip button on last step even if skippable', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { queryByText } = render(
        <NavigationFooter {...defaultProps} currentScreen={screen} isLastStep={true} />,
      );

      expect(queryByText(/skip/i)).toBeNull();
    });

    it('should call onSkip when skip button is pressed', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const onSkip = jest.fn();
      const { getByText } = render(
        <NavigationFooter {...defaultProps} currentScreen={screen} onSkip={onSkip} />,
      );

      fireEvent.press(getByText(/skip/i));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('should use custom skip button text from screen', () => {
      const screen = aScreen().withSkipConfig(true, 'Skip for now').build();
      const { getByText } = render(<NavigationFooter {...defaultProps} currentScreen={screen} />);

      expect(getByText('Skip for now')).toBeTruthy();
    });

    it('should disable skip button when loading', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { getByText } = render(
        <NavigationFooter {...defaultProps} currentScreen={screen} loading={true} />,
      );

      const button = getByText(/skip/i).parent;
      expect(button?.props.disabled).toBe(true);
    });
  });

  describe('Custom translations', () => {
    it('should use custom next translation', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} translations={{ next: 'Custom Next' }} />,
      );

      expect(getByText('Custom Next')).toBeTruthy();
    });

    it('should use custom previous translation', () => {
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          canGoPrevious={true}
          translations={{ previous: 'Custom Previous' }}
        />,
      );

      expect(getByText('Custom Previous')).toBeTruthy();
    });

    it('should use custom submit translation', () => {
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          isLastStep={true}
          translations={{ submit: 'Custom Submit' }}
        />,
      );

      expect(getByText('Custom Submit')).toBeTruthy();
    });

    it('should use custom skip translation', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={screen}
          translations={{ skip: 'Custom Skip' }}
        />,
      );

      expect(getByText('Custom Skip')).toBeTruthy();
    });

    it('should fall back to default translation when custom not provided', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} translations={{}} />);

      // Should show default "Next" text
      expect(getByText(/next/i)).toBeTruthy();
    });

    it('should handle partial custom translations', () => {
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          canGoPrevious={true}
          translations={{ next: 'Custom Next' }}
        />,
      );

      expect(getByText('Custom Next')).toBeTruthy();
      expect(getByText(/previous/i)).toBeTruthy(); // Default
    });
  });

  describe('Button layout', () => {
    it('should show only next button when first step and not skippable', () => {
      const screen = aScreen().withSkipConfig(false).build();
      const { getByText, queryByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={screen}
          canGoPrevious={false}
          isLastStep={false}
        />,
      );

      expect(getByText(/next/i)).toBeTruthy();
      expect(queryByText(/previous/i)).toBeNull();
      expect(queryByText(/skip/i)).toBeNull();
      expect(queryByText(/submit/i)).toBeNull();
    });

    it('should show previous and next when middle step', () => {
      const { getByText, queryByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={true} isLastStep={false} />,
      );

      expect(getByText(/next/i)).toBeTruthy();
      expect(getByText(/previous/i)).toBeTruthy();
      expect(queryByText(/submit/i)).toBeNull();
    });

    it('should show previous and submit on last step', () => {
      const { getByText, queryByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={true} isLastStep={true} />,
      );

      expect(getByText(/submit/i)).toBeTruthy();
      expect(getByText(/previous/i)).toBeTruthy();
      expect(queryByText(/^next$/i)).toBeNull();
    });

    it('should show skip, previous, and next when screen is skippable', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={screen}
          canGoPrevious={true}
          isLastStep={false}
        />,
      );

      expect(getByText(/next/i)).toBeTruthy();
      expect(getByText(/previous/i)).toBeTruthy();
      expect(getByText(/skip/i)).toBeTruthy();
    });

    it('should show only submit on last step with no previous', () => {
      const { getByText, queryByText } = render(
        <NavigationFooter {...defaultProps} canGoPrevious={false} isLastStep={true} />,
      );

      expect(getByText(/submit/i)).toBeTruthy();
      expect(queryByText(/previous/i)).toBeNull();
      expect(queryByText(/next/i)).toBeNull();
      expect(queryByText(/skip/i)).toBeNull();
    });
  });

  describe('Loading state', () => {
    it('should disable all buttons when loading', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={screen}
          canGoPrevious={true}
          loading={true}
        />,
      );

      const nextButton = getByText(/next/i).parent;
      const previousButton = getByText(/previous/i).parent;
      const skipButton = getByText(/skip/i).parent;

      expect(nextButton?.props.disabled).toBe(true);
      expect(previousButton?.props.disabled).toBe(true);
      expect(skipButton?.props.disabled).toBe(true);
    });

    it('should enable all buttons when not loading', () => {
      const screen = aScreen().withSkipConfig(true).build();
      const { getByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={screen}
          canGoPrevious={true}
          loading={false}
        />,
      );

      const nextButton = getByText(/next/i).parent;
      const previousButton = getByText(/previous/i).parent;
      const skipButton = getByText(/skip/i).parent;

      expect(nextButton?.props.disabled).toBe(false);
      expect(previousButton?.props.disabled).toBe(false);
      expect(skipButton?.props.disabled).toBe(false);
    });
  });

  describe('Null current screen', () => {
    it('should handle null current screen gracefully', () => {
      const { queryByText } = render(<NavigationFooter {...defaultProps} currentScreen={null} />);

      // Skip button should not show (screen is null)
      expect(queryByText(/skip/i)).toBeNull();
    });

    it('should still show navigation buttons with null screen', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} currentScreen={null} />);

      expect(getByText(/next/i)).toBeTruthy();
    });
  });

  describe('Locale support', () => {
    it('should render with en locale', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} locale="en" />);

      // English translations should work
      expect(getByText(/next/i)).toBeTruthy();
    });

    it('should render with es locale', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} locale="es" />);

      // Should render (translations are internal)
      expect(getByText).toBeTruthy();
    });

    it('should render with pt locale', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} locale="pt" />);

      // Should render (translations are internal)
      expect(getByText).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid button presses', () => {
      const onNext = jest.fn();
      const { getByText } = render(<NavigationFooter {...defaultProps} onNext={onNext} />);

      const nextButton = getByText(/next/i);

      fireEvent.press(nextButton);
      fireEvent.press(nextButton);
      fireEvent.press(nextButton);

      expect(onNext).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined loading prop', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} loading={undefined} />);

      const button = getByText(/next/i).parent;
      // Should default to false (not disabled)
      expect(button?.props.disabled).toBe(false);
    });

    it('should handle canGoNext and canGoPrevious both false', () => {
      const { getByText } = render(
        <NavigationFooter {...defaultProps} canGoNext={false} canGoPrevious={false} />,
      );

      const nextButton = getByText(/next/i).parent;
      expect(nextButton?.props.disabled).toBe(true);
    });

    it('should render with all props as edge values', () => {
      const { queryByText } = render(
        <NavigationFooter
          {...defaultProps}
          currentScreen={null}
          canGoNext={false}
          canGoPrevious={false}
          isLastStep={false}
          loading={true}
          onNext={jest.fn()}
          onPrevious={jest.fn()}
          onSkip={jest.fn()}
          onSubmit={undefined}
        />,
      );

      // Should render without crashing
      expect(queryByText(/next/i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render buttons with accessible text', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} />);

      expect(getByText(/next/i)).toBeTruthy();
    });

    it('should indicate disabled state', () => {
      const { getByText } = render(<NavigationFooter {...defaultProps} canGoNext={false} />);

      const button = getByText(/next/i).parent;
      expect(button?.props.disabled).toBe(true);
    });
  });
});
