# Mobile Testing Methodology Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Status**: Active

---

## Overview

Detailed testing methodology for React Native/Expo mobile applications. This guide covers unit testing, component testing, integration testing, and manual platform testing.

---

## Unit Testing

### Purpose
Test individual functions, utilities, and helpers in isolation.

### Tools
- **Jest**: Test runner and assertion library
- **TypeScript**: Type-safe test code

### File Naming
- Pattern: `*.test.ts` or `*.test.tsx`
- Location: Same directory as source file or `__tests__/`

### Basic Structure
```typescript
import { functionUnderTest } from './utility';

describe('functionUnderTest', () => {
  it('should handle normal input', () => {
    const result = functionUnderTest('valid input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(functionUnderTest('')).toBeNull();
    expect(functionUnderTest(null)).toBeNull();
  });

  it('should throw on invalid input', () => {
    expect(() => functionUnderTest(undefined)).toThrow();
  });
});
```

### Best Practices
1. **One assertion per test** (when possible)
2. **Descriptive test names**: "should [action] when [condition]"
3. **Arrange-Act-Assert pattern**
4. **Test edge cases**: null, undefined, empty, boundary values
5. **Mock external dependencies**

### Common Patterns
```typescript
// Async testing
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Error testing
it('should throw on invalid input', () => {
  expect(() => functionWithValidation(null)).toThrow('Invalid input');
});

// Mock testing
jest.mock('./dependency');
const mockDep = dependency as jest.MockedFunction<typeof dependency>;
mockDep.mockReturnValue('mocked value');
```

---

## Component Testing

### Purpose
Test React components in isolation to verify rendering, interactions, and state.

### Tools
- **Jest**: Test runner
- **React Native Testing Library**: Component rendering and queries
- **jest-native**: Additional matchers

### Basic Structure
```typescript
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ComponentUnderTest } from './ComponentUnderTest';

describe('ComponentUnderTest', () => {
  it('renders correctly with default props', () => {
    render(<ComponentUnderTest />);
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onPress = jest.fn();
    render(<ComponentUnderTest onPress={onPress} />);

    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Query Priority
Use queries in this order (most to least preferred):
1. `getByRole` - Accessibility role
2. `getByLabelText` - Accessibility label
3. `getByPlaceholderText` - Input placeholders
4. `getByText` - Text content
5. `getByDisplayValue` - Form input values
6. `getByTestId` - Test IDs (last resort)

### Interaction Events
```typescript
// Button press
fireEvent.press(element);

// Text input
fireEvent.changeText(input, 'new text');

// Scroll
fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 100 } } });

// Swipe/gesture
fireEvent(element, 'onSwipeLeft');
```

### Testing Props
```typescript
describe('Component props', () => {
  it('renders with custom title', () => {
    render(<Component title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeTruthy();
  });

  it('applies disabled state', () => {
    render(<Component disabled={true} />);
    expect(screen.getByTestId('button').props.accessibilityState.disabled).toBe(true);
  });
});
```

### Testing State
```typescript
describe('Component state', () => {
  it('toggles visibility on press', () => {
    render(<ToggleComponent />);

    expect(screen.queryByText('Hidden Content')).toBeNull();

    fireEvent.press(screen.getByText('Toggle'));

    expect(screen.getByText('Hidden Content')).toBeTruthy();
  });
});
```

### Testing Accessibility
```typescript
describe('Accessibility', () => {
  it('has accessible button', () => {
    render(<AccessibleComponent />);

    const button = screen.getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Submit form');
  });
});
```

---

## Integration Testing

### Purpose
Test how multiple components, Redux state, and navigation work together.

### Redux Testing
```typescript
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';
import { featureSlice } from '@/store/feature/featureSlice';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      feature: featureSlice.reducer,
    },
    preloadedState,
  });
};

describe('Redux Integration', () => {
  it('updates state on action dispatch', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <ConnectedComponent />
      </Provider>
    );

    // Trigger action via UI
    fireEvent.press(screen.getByText('Update'));

    // Verify state
    expect(store.getState().feature.value).toBe('updated');
  });
});
```

### Navigation Testing
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={() => component} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('Navigation', () => {
  it('navigates to detail screen', () => {
    const { getByText } = renderWithNavigation(<HomeScreen />);

    fireEvent.press(getByText('View Details'));

    // Verify navigation occurred
    expect(getByText('Detail Screen')).toBeTruthy();
  });
});
```

### API Integration Testing
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ items: ['item1', 'item2'] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration', () => {
  it('fetches and displays data', async () => {
    render(<DataComponent />);

    await waitFor(() => {
      expect(screen.getByText('item1')).toBeTruthy();
    });
  });
});
```

---

## Manual Testing

### Purpose
Validate platform-specific behavior, UI/UX, and user flows on actual devices/simulators.

### iOS Testing

#### Setup
```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Run app
pnpm run ios:dev
```

#### Checklist
- [ ] App launches without crash
- [ ] Safe area handling (notch, home indicator)
- [ ] Status bar appearance
- [ ] Keyboard handling
- [ ] Gestures (swipe, pinch, long press)
- [ ] Navigation transitions
- [ ] Dark mode support
- [ ] Dynamic Type support
- [ ] VoiceOver accessibility

### Android Testing

#### Setup
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_34

# Check device connection
adb devices

# Run app
pnpm run android:dev
```

#### Checklist
- [ ] App launches without crash
- [ ] Status bar appearance
- [ ] Navigation bar handling
- [ ] Keyboard handling
- [ ] Back button behavior
- [ ] Gestures (swipe, pinch, long press)
- [ ] Navigation transitions
- [ ] Dark mode support
- [ ] TalkBack accessibility

### Cross-Platform Checklist
- [ ] Feature works identically on iOS and Android
- [ ] UI layout consistent across platforms
- [ ] Text rendering consistent
- [ ] Image loading works
- [ ] Network requests work
- [ ] Redux state updates correctly
- [ ] Navigation flows correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Empty states display
- [ ] Performance acceptable

### Performance Testing
```bash
# Enable performance monitoring
# iOS: Xcode Instruments
# Android: Android Studio Profiler

# Check for:
# - UI thread blocking
# - Memory leaks
# - Slow renders
# - Network bottlenecks
```

---

## Test Data Management

### Mock Data
```typescript
// __mocks__/mockData.ts
export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

export const mockConversation = {
  id: 'conv-1',
  messages: [],
  participants: [mockUser],
};
```

### Factory Functions
```typescript
// __mocks__/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});
```

### Test Fixtures
```typescript
// __fixtures__/conversations.json
{
  "emptyConversation": { "id": "1", "messages": [] },
  "conversationWithMessages": { "id": "2", "messages": [...] }
}
```

---

## Debugging Tests

### Common Issues

#### Test Timeout
```typescript
// Increase timeout for slow tests
jest.setTimeout(10000);

// Or per-test
it('slow test', async () => {
  // ...
}, 10000);
```

#### Async Issues
```typescript
// Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeTruthy();
});

// Use findBy queries (auto-wait)
const element = await screen.findByText('Loaded');
```

#### State Leaks
```typescript
// Reset state between tests
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});
```

### Debug Commands
```bash
# Run single test file
pnpm test path/to/test.ts

# Run with verbose output
pnpm test --verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

---

## Coverage Requirements

### Minimum Coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Generate Coverage Report
```bash
pnpm test --coverage

# Open report
open coverage/lcov-report/index.html
```

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

## Related Documentation

- [SKILL.md](SKILL.md) - Testing process overview
- [TEST_PLAN_TEMPLATE.md](TEST_PLAN_TEMPLATE.md) - Test plan template
- [TEST_RESULTS_TEMPLATE.md](TEST_RESULTS_TEMPLATE.md) - Test results template
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing-with-jest/)

---

**End of Guide**
