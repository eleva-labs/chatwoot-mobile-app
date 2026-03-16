import React, { forwardRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import type Reanimated from 'react-native-reanimated';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import type { KeyboardChatScrollViewProps } from 'react-native-keyboard-controller';

/**
 * ScrollView replacement for FlashList that integrates KeyboardChatScrollView.
 *
 * FlashList destructures `inverted` from its props and handles inversion via
 * scaleY transforms — it does NOT pass `inverted` through to renderScrollComponent.
 * We hardcode `inverted` here because this wrapper is only used for the chat
 * message list which is always inverted.
 *
 * `offset` tells KeyboardChatScrollView how far the bottom of the scroll view
 * sits above the bottom of the screen. Setting it to 0 lets KCSV rely entirely
 * on its own runtime frame measurement — it measures where the scroll view's
 * bottom edge actually is on screen and calculates the content shift from that.
 *
 * `keyboardDismissMode="interactive"` requires `KeyboardGestureArea` as an
 * ancestor — provided by `MessagesListContainer`.
 */

// Ref type is Reanimated.ScrollView because KeyboardChatScrollView forwards
// its ref to reanimated's Animated.ScrollView internally.
export const VirtualizedListScrollView = forwardRef<
  Reanimated.ScrollView,
  ScrollViewProps & KeyboardChatScrollViewProps
>((props, ref) => {
  return (
    <KeyboardChatScrollView
      ref={ref}
      inverted
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="always"
      offset={0}
      {...props}
    />
  );
});

VirtualizedListScrollView.displayName = 'VirtualizedListScrollView';
