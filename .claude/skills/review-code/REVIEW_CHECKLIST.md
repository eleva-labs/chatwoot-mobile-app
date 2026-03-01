# Code Review Checklist

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent**: [SKILL.md](SKILL.md)

---

## Usage

Use this checklist during Phase 3 (Detailed Code Review) to ensure comprehensive review of all code layers.

---

## Type Definitions Checklist

**Files**: `src/types/**/*.ts`

### Required Checks
- [ ] Type definitions are correct and complete
- [ ] No `any` types (use `unknown` if type is truly unknown)
- [ ] Interfaces vs types used appropriately
  - Interfaces for object shapes that may be extended
  - Types for unions, primitives, function signatures
- [ ] Generic types used where appropriate
- [ ] Proper use of `readonly` for immutable properties
- [ ] Nullable types properly marked with `| null` or `| undefined`
- [ ] Type imports use `import type` syntax

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Implicit any | `const data = response.data` | Add explicit type annotation |
| Missing null check | `user.name.toUpperCase()` | Add optional chaining or null check |
| Overly broad type | `options: object` | Define specific interface |

---

## Redux State Checklist

**Files**: `src/store/**/*.ts`

### State Structure
- [ ] State shape follows established patterns
- [ ] Initial state is properly typed
- [ ] Nested state uses normalized structure
- [ ] No redundant state (derivable from other state)

### Actions & Reducers
- [ ] Actions follow naming convention (`domain/actionName`)
- [ ] Payload types are properly defined
- [ ] Reducers are pure functions (no side effects)
- [ ] Immutable updates (no direct state mutation)
- [ ] Error states handled

### Selectors
- [ ] Selectors are properly typed
- [ ] Memoized selectors used for computed values
- [ ] Selectors updated when state shape changes
- [ ] No duplicate selector logic

### Migrations
- [ ] State migrations created if shape changed
- [ ] Migration version incremented
- [ ] Backward compatibility maintained
- [ ] Migration tested

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Direct mutation | `state.items.push(item)` | Use spread: `[...state.items, item]` |
| Missing selector update | State shape changed, selector not updated | Update selector to match new shape |
| No error handling | Action doesn't handle failure case | Add error state and handle in reducer |

---

## Components Checklist

**Files**: `src/components-next/**/*.tsx`

### Props & Types
- [ ] Props interface defined and exported
- [ ] Default props use destructuring defaults
- [ ] Children prop typed correctly
- [ ] Callback props properly typed (`(value: T) => void`)

### Component Structure
- [ ] Follows component pattern (function component with hooks)
- [ ] Hooks called at top level only
- [ ] Custom hooks extracted for complex logic
- [ ] Component is focused (single responsibility)

### Accessibility
- [ ] `accessibilityLabel` on interactive elements
- [ ] `accessibilityRole` set appropriately
- [ ] `accessibilityState` for toggles/selections
- [ ] Touch targets minimum 44x44 points

### Performance
- [ ] `useMemo` for expensive computations
- [ ] `useCallback` for callback props
- [ ] `React.memo` for pure components
- [ ] Avoid inline object/array creation in render
- [ ] FlatList used for long lists (not ScrollView + map)

### Styling
- [ ] Uses StyleSheet.create (not inline styles)
- [ ] Responsive dimensions considered
- [ ] Theme colors used (not hardcoded)
- [ ] Safe area insets handled

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Missing memo | Large list item re-renders | Wrap with `React.memo` |
| Inline callback | `onPress={() => handlePress(id)}` | Use `useCallback` or extract handler |
| Missing accessibility | `<TouchableOpacity>` without label | Add `accessibilityLabel` |

---

## Screens Checklist

**Files**: `src/screens/**/*.tsx`

### Navigation
- [ ] Navigation props properly typed
- [ ] Route params typed and validated
- [ ] Back navigation handled correctly
- [ ] Deep linking considered (if applicable)

### Safe Area
- [ ] `SafeAreaView` or `useSafeAreaInsets` used
- [ ] Edge cases handled (notch, home indicator)
- [ ] Keyboard avoiding behavior implemented

### Platform-Specific
- [ ] Platform-specific code uses `Platform.OS` or `Platform.select`
- [ ] iOS and Android behaviors tested
- [ ] Platform-specific APIs wrapped appropriately

### Data Fetching
- [ ] Loading states displayed
- [ ] Error states handled and displayed
- [ ] Empty states handled
- [ ] Pull-to-refresh implemented (if applicable)
- [ ] Pagination implemented (if applicable)

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Missing safe area | Content under notch | Use `SafeAreaView` or `useSafeAreaInsets` |
| No loading state | Screen blank during fetch | Add loading indicator |
| Unhandled error | App crashes on API error | Add error boundary or try-catch |

---

## Navigation Checklist

**Files**: `src/navigation/**/*.tsx`

### Route Configuration
- [ ] Routes defined in navigator
- [ ] Screen names use PascalCase
- [ ] Params typed in ParamList
- [ ] Default routes set correctly

### Type Safety
- [ ] Navigator typed with ParamList
- [ ] `useNavigation` hook properly typed
- [ ] `useRoute` hook properly typed
- [ ] Navigation actions type-safe

### Deep Linking
- [ ] Deep link paths configured (if needed)
- [ ] Params parsed correctly
- [ ] Authentication state handled

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Untyped params | `route.params.id` without type | Type the route with ParamList |
| Missing screen | Navigation to undefined screen | Add screen to navigator |
| Wrong navigator | Stack navigation in tab context | Use correct navigation method |

---

## Utils & Helpers Checklist

**Files**: `src/utils/**/*.ts`

### Function Design
- [ ] Functions are pure (no side effects where possible)
- [ ] Input parameters typed
- [ ] Return type explicitly declared
- [ ] Default parameters used appropriately

### Error Handling
- [ ] Errors thrown with meaningful messages
- [ ] Edge cases handled
- [ ] Null/undefined inputs handled
- [ ] Invalid input validation

### Documentation
- [ ] JSDoc comments for public functions
- [ ] Parameter descriptions
- [ ] Return value described
- [ ] Examples provided for complex functions

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Implicit return type | `function add(a, b) { return a + b }` | Add `: number` return type |
| Missing null check | `value.toString()` | Check `value != null` first |
| No error message | `throw new Error()` | Add descriptive message |

---

## Tests Checklist

**Files**: `__tests__/**/*.ts`, `src/**/*.test.ts`

### Test Coverage
- [ ] New code has corresponding tests
- [ ] Modified code has updated tests
- [ ] Edge cases covered
- [ ] Error cases tested

### Test Quality
- [ ] Tests are independent (no shared state)
- [ ] Tests have clear descriptions
- [ ] Arrange-Act-Assert pattern followed
- [ ] Mocks properly set up and cleaned up

### Platform Testing
- [ ] iOS-specific behavior tested
- [ ] Android-specific behavior tested
- [ ] Cross-platform behavior verified

### Common Issues
| Issue | Example | Fix |
|-------|---------|-----|
| Shared state | Tests affect each other | Use `beforeEach` to reset |
| Missing edge case | Only happy path tested | Add error and boundary tests |
| Brittle test | Test breaks on unrelated changes | Mock dependencies, test behavior not implementation |

---

## Cross-Layer Verification

### Change Cascade Checklist

When a **type** changes:
- [ ] All components using type are updated
- [ ] All Redux slices using type are updated
- [ ] All utils using type are updated
- [ ] All tests are updated

When a **Redux slice** changes:
- [ ] All selectors are updated
- [ ] All components using selectors are updated
- [ ] All tests are updated
- [ ] Migration created if state shape changed

When a **component** changes:
- [ ] Props interface exported if used elsewhere
- [ ] Parent components updated if props changed
- [ ] Tests are updated

When a **screen** changes:
- [ ] Navigation updated if route params changed
- [ ] Deep linking updated if applicable
- [ ] Tests are updated

When a **navigation** changes:
- [ ] Screens registered in navigator
- [ ] Type definitions updated
- [ ] Deep linking config updated

---

## Quick Verification Commands

```bash
# TypeScript compilation
npx tsc --noEmit

# Lint check
pnpm lint

# Run tests
pnpm test

# Run specific tests
pnpm test -- --testPathPattern="{pattern}"

# Check for any types
grep -r ": any" src/

# Check for console.log
grep -r "console.log" src/
```

---

**End of Checklist**
