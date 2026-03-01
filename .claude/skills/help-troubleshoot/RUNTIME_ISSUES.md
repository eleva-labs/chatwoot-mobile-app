# Runtime Issues

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Category**: App Crashes, State Management, Navigation, API, Hot Reload, Performance

---

## App Crashes

### Issue: Immediate Crash on Startup

**Symptoms:** App crashes before showing any UI

**Cause:** Native module crash, Redux Persist migration failure, or missing environment variables

**Solution:**
1. Check logs
2. Check Redux Persist migration
3. Check environment variables
4. Regenerate native code

**Commands:**
```bash
# Check iOS logs
npx react-native log-ios

# Check Android logs
npx react-native log-android

# Check environment
cat .env

# Regenerate native code
pnpm run generate
```

```typescript
// Verify CURRENT_VERSION in src/store/index.ts
// Update migration if state shape changed
```

**Prevention:** Test after major changes, verify migrations

---

### Issue: Crash After Login

**Symptoms:** App works initially, crashes after authentication

**Cause:** Redux state shape mismatch, API response handling error, or navigation parameter issues

**Solution:**
1. Check Redux state shape
2. Verify API response handling
3. Check navigation params
4. Review error boundaries

**Prevention:** Add error handling, test auth flows

---

## Redux State Issues

### Issue: State Not Persisting

**Symptoms:** Data lost after app restart

**Cause:** Redux Persist configuration issue, version mismatch

**Solution:**
1. Check `persistConfig` in `src/store/index.ts`
2. Verify `CURRENT_VERSION` matches migration
3. Check whitelist/blacklist in persist config

**Prevention:** Test persistence after state changes

---

### Issue: State Not Updating

**Symptoms:** UI doesn't reflect state changes

**Cause:** Action not dispatched, reducer logic error, selector issue, or memoization problem

**Solution:**
1. Verify action is dispatched correctly
2. Check reducer logic
3. Verify selector is correct
4. Check for memoization issues

**Prevention:** Use Redux DevTools, test reducers

---

## Navigation Issues

### Issue: Navigation Fails

**Symptoms:** Can't navigate to screen, params missing

**Cause:** Route not defined, type mismatch, or nesting issue

**Solution:**
1. Verify route is defined in navigator
2. Check navigation param types
3. Verify screen component exists
4. Check for navigation nesting issues

**Prevention:** Type navigation params, test flows

---

### Issue: Deep Linking Doesn't Work

**Symptoms:** App URLs don't open correct screen

**Cause:** Scheme not configured, route not matched

**Solution:**

**Commands:**
```bash
# Test deep link
npx uri-scheme open <scheme>://path --ios
npx uri-scheme open <scheme>://path --android
```

Check `app.config.ts` for scheme configuration.

**Prevention:** Test deep links after route changes

---

## API Integration Issues

### Issue: Network Errors

**Symptoms:** API calls fail, timeout errors

**Cause:** Network connectivity, wrong endpoint, authentication issue, or CORS (web)

**Solution:**
1. Verify network connectivity
2. Check API endpoint URL
3. Verify authentication tokens
4. Check CORS configuration (web)

**Prevention:** Add error handling, test with mocked API

---

### Issue: Data Not Loading

**Symptoms:** Empty screens, loading forever

**Cause:** API response format mismatch, parsing error, or async issue

**Solution:**
1. Check API response format
2. Verify data parsing logic
3. Check for async issues
4. Verify error handling

**Prevention:** Handle loading and error states

---

## Hot Reload Issues

### Issue: Changes Not Reflecting

**Symptoms:** Code changes don't appear in app

**Cause:** Metro not running, cache issue, or native code change requiring rebuild

**Solution:**

**Commands:**
```bash
# Full clean rebuild
pnpm run clean
pnpm run generate
pnpm run ios:dev  # or android:dev
```

**Prevention:** Save files, check Metro for errors

---

### Issue: Fast Refresh Disabled

**Symptoms:** Need to reload manually

**Cause:** Fast Refresh option disabled in developer menu

**Solution:**
1. Open Developer Menu (shake or `Cmd+D`/`Cmd+M`)
2. Enable "Fast Refresh"

**Prevention:** Keep Fast Refresh enabled

---

## Performance Issues

### Issue: List Performance / Slow Scrolling

**Symptoms:** Slow scrolling, laggy lists

**Cause:** Using FlatList instead of FlashList, or missing optimization

**Solution:**
```typescript
// Use FlashList instead of FlatList
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={item => item.id}
/>
```

**Prevention:** Use FlashList for long lists

---

### Issue: Re-render Issues

**Symptoms:** Components re-render unnecessarily

**Cause:** Missing memoization, unstable references

**Solution:**
```typescript
// Memoize components
const MemoizedComponent = React.memo(Component);

// Memoize values
const memoizedValue = useMemo(() => expensiveCalculation(), [deps]);

// Memoize callbacks
const memoizedCallback = useCallback(() => handleAction(), [deps]);
```

**Prevention:** Profile renders, use React DevTools

---

### Issue: Memory Leaks

**Symptoms:** App slows down over time, crashes

**Cause:** Subscriptions not cleaned up, async operations not cancelled

**Solution:**
```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// Cancel async operations
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, []);
```

**Prevention:** Always cleanup in useEffect

---

### Issue: High Image Memory Usage

**Symptoms:** High memory usage with images

**Cause:** Unoptimized image loading

**Solution:**
```typescript
// Use expo-image for optimized loading
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={200}
/>
```

**Prevention:** Limit image sizes, use appropriate formats

---

## Platform UI Issues

### Issue: Safe Area Problems

**Symptoms:** Content overlaps notch, home indicator

**Cause:** SafeAreaView not used or configured incorrectly

**Solution:**
```typescript
// Use SafeAreaView from react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';

// Specify edges
<SafeAreaView edges={['top', 'bottom']}>
```

**Prevention:** Always use SafeAreaView, test on devices with notch

---

### Issue: Status Bar Issues

**Symptoms:** Status bar color wrong, content overlapping

**Cause:** StatusBar not configured properly

**Solution:**
```typescript
import { StatusBar } from 'react-native';

<StatusBar
  barStyle="dark-content"
  backgroundColor="transparent"
  translucent
/>
```

**Prevention:** Configure StatusBar at app level

---

## Related Documentation

- [COMMON_ISSUES.md](COMMON_ISSUES.md) - Issue index
- [BUILD_ISSUES.md](BUILD_ISSUES.md) - Build-related issues
- [PLATFORM_ISSUES.md](PLATFORM_ISSUES.md) - Platform-specific issues
- [SKILL.md](SKILL.md) - Troubleshooting overview

---

**End of Runtime Issues**
