import React from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { EmptyStateIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { useChromeMetrics } from '@infrastructure/utils';

type EmptyListStateProps = {
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  isRefreshing: boolean;
  onRefresh: () => void;
};

/**
 * Renders a loading indicator when loading + empty,
 * an empty state with pull-to-refresh when empty,
 * or nothing (returns null) when not empty.
 *
 * Usage: render this BEFORE the list. If it returns non-null, skip the list.
 */
export const EmptyListState = ({
  isLoading,
  isEmpty,
  emptyText,
  isRefreshing,
  onRefresh,
}: EmptyListStateProps) => {
  const themedTailwind = useThemedStyles();
  const { contentBottomPadding } = useChromeMetrics();

  if (isLoading && isEmpty) {
    return (
      <Animated.View
        style={[
          tailwind.style('flex-1 items-center justify-center'),
          { paddingBottom: contentBottomPadding },
        ]}>
        <ActivityIndicator />
      </Animated.View>
    );
  }

  if (isEmpty) {
    return (
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          tailwind.style('flex-1 items-center justify-center'),
          { paddingBottom: contentBottomPadding },
        ]}>
        <EmptyStateIcon />
        <Animated.Text style={themedTailwind.style('pt-6 text-md tracking-[0.32px] text-slate-12')}>
          {emptyText}
        </Animated.Text>
      </Animated.ScrollView>
    );
  }

  return null;
};
