# Visual Debugging in React Native

Techniques for diagnosing layout, sizing, and rendering issues in the mobile app.

## 1. onLayout + console.warn (Primary Technique)

When a component renders at the wrong size, position, or clips its content, use `onLayout` callbacks with `console.warn` to get exact measurements from the Yoga layout engine.

### Setup

Add `onLayout` to the Views you suspect:

```tsx
<View
  onLayout={(e) => console.warn('[PARENT]', JSON.stringify(e.nativeEvent.layout))}
  style={style('...')}>
  <View onLayout={(e) => console.warn('[CHILD]', JSON.stringify(e.nativeEvent.layout))}>
    <SomeComponent />
  </View>
</View>
```

### Capturing logs from the iOS simulator

Stream logs to a file:

```bash
xcrun simctl spawn booted log stream \
  --predicate 'subsystem == "com.facebook.react.log" AND category == "javascript"' \
  --style compact \
  --level info > /tmp/rn-debug-logs.txt 2>&1 &
```

Filter for your markers:

```bash
grep -E 'PARENT|CHILD' /tmp/rn-debug-logs.txt | tail -20
```

Stop capture:

```bash
kill $(pgrep -f "log stream.*com.facebook.react") 2>/dev/null
```

### What to look for

The layout event returns `{ width, height, x, y }`. Compare parent vs child:

```
[PARENT] {"width":256,"height":462,"x":0,"y":0}
[CHILD]  {"width":224,"height":550,"x":0,"y":0}
```

If the child is taller than the parent, the child overflows. Combined with `overflow: hidden` on the parent, this causes clipping.

### Real example: Markdown bubble clipping

We diagnosed a bug where the AI chat message bubble clipped the last 1-2 lines of text. Multiple code-level fixes failed (changing FlashList to FlatList, adjusting estimatedItemSize, modifying paragraph flexDirection). The `onLayout` logs immediately revealed the root cause:

```
[BUBBLE]        height = 478
[TEXTPART]      height = 462   (= bubble - padding)
[MARKDOWN_WRAP] height = 550   <-- 88px taller than its parent!
```

`react-native-markdown-display`'s internal body View was under-reporting its height to the parent layout engine (a Yoga bug with `flexDirection: 'row'` + `flexWrap: 'wrap'` on paragraph Views). The fix: capture the inner View's actual height via `onLayout` and set `minHeight` on the outer container.

```tsx
const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
const handleInnerLayout = useCallback(
  (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight((prev) => (prev === undefined || h > prev) ? h : prev);
  },
  [],
);

return (
  <View style={contentHeight ? { minHeight: contentHeight } : undefined}>
    <View onLayout={handleInnerLayout}>
      <Markdown ...>{text}</Markdown>
    </View>
  </View>
);
```

## 2. Colored borders (Quick visual check)

When you need to see boundaries quickly without reading logs:

```tsx
<View style={{ borderWidth: 1, borderColor: 'red' }}>
  <View style={{ borderWidth: 1, borderColor: 'green' }}>
    <View style={{ borderWidth: 1, borderColor: 'blue' }}>
      ...
    </View>
  </View>
</View>
```

Use different colors for each nesting level. Useful for spotting which element is the wrong size at a glance, but `onLayout` logs give exact numbers.

## 3. Metro cache issues

If edits don't appear after saving, Metro may be serving stale bundles.

### Verify Metro is running

```bash
curl -s http://localhost:8081/status
# Should return: packager-status:running
```

### Restart with clean cache

```bash
kill $(lsof -ti:8081) 2>/dev/null
npx expo start --ios --port 8081 --clear
```

### Full native rebuild (when hot reload fails)

```bash
task run-ios
```

Hot reload can silently disconnect from the simulator. If changes aren't appearing, check:

1. Is Metro running? (`curl localhost:8081/status`)
2. Kill Metro and restart with `--clear`
3. If still stuck, do a full `task run-ios` rebuild

## 4. When to use each technique

| Symptom | Technique |
|---------|-----------|
| Content clipped or overflowing | `onLayout` + `console.warn` |
| Wrong spacing/padding | `onLayout` or colored borders |
| Component not rendering at all | `console.warn` in render body to confirm it's called |
| Style changes not appearing | Check Metro cache (section 3) |
| Third-party library layout bugs | `onLayout` on wrapper Views around the library component |

## 5. Cleanup checklist

Before committing, remove all debug code:

- [ ] Remove all `onLayout` callbacks added for debugging
- [ ] Remove all `console.warn`/`console.log` with debug markers (e.g., `[BUBBLE]`)
- [ ] Remove colored border styles
- [ ] Keep only production `console.warn`/`console.error` (e.g., error handlers)
