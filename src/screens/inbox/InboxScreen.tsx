import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

import { softLayout } from '@infrastructure/animation';
import { SCREENS } from '@domain/constants';
import { useChromeMetrics } from '@infrastructure/utils';
import {
  InboxListStateProvider,
  useTheme,
  useInboxListStateContext,
} from '@infrastructure/context';
import type { Notification } from '@domain/types/Notification';
import { tailwind } from '@infrastructure/theme';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { useScreenAnalytics, useThemedStyles } from '@infrastructure/hooks';
import { notificationActions } from '@application/store/notification/notificationAction';
import {
  selectIsAllNotificationsFetched,
  selectIsLoadingNotifications,
  getFilteredNotifications,
} from '@application/store/notification/notificationSelectors';
import { InboxHeader, InboxItemContainer } from './components';
import { resetNotifications } from '@application/store/notification/notificationSlice';
import { showToast } from '@infrastructure/utils/toastUtils';
import i18n from '@infrastructure/i18n';
import { selectSortOrder } from '@application/store/notification/notificationFilterSlice';
import { EmptyListState } from '@infrastructure/ui';
import { InboxSortTypes } from '@application/store/notification/notificationTypes';

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Notification>);

const InboxList = () => {
  const { contentBottomPadding } = useChromeMetrics();
  const [pageNumber, setPageNumber] = useState(1);

  const [isFlashListReady, setFlashListReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isNotificationsLoading = useAppSelector(selectIsLoadingNotifications);
  const isAllNotificationsFetched = useAppSelector(selectIsAllNotificationsFetched);
  const sortOrder = useAppSelector(selectSortOrder);

  const notifications = useAppSelector(state => getFilteredNotifications(state, sortOrder));

  const previousSortOrder = useRef(sortOrder);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (previousSortOrder.current !== sortOrder) {
      previousSortOrder.current = sortOrder;
      clearAndFetchNotifications(sortOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder]);

  // eslint-disable-next-line react/display-name
  const ListFooterComponent = React.memo(() => {
    if (isAllNotificationsFetched) return null;
    return (
      <Animated.View
        style={[
          tailwind.style('flex-1 items-center justify-center pt-8'),
          { paddingBottom: contentBottomPadding },
        ]}>
        {isAllNotificationsFetched ? null : <ActivityIndicator size="small" />}
      </Animated.View>
    );
  });

  useEffect(() => {
    clearAndFetchNotifications(sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAndFetchNotifications = useCallback(async (sortOrder: InboxSortTypes) => {
    setPageNumber(1);
    await dispatch(resetNotifications());
    fetchNotifications(sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = useCallback(
    async (sortOrder: InboxSortTypes, page: number = 1) => {
      dispatch(notificationActions.fetchNotifications({ page, sort_order: sortOrder }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onChangePageNumber = () => {
    const nextPageNumber = pageNumber + 1;
    setPageNumber(nextPageNumber);
    fetchNotifications(sortOrder, nextPageNumber);
  };

  const handleOnEndReached = () => {
    const shouldLoadMoreConversations =
      isFlashListReady && !isAllNotificationsFetched && !isNotificationsLoading;
    if (shouldLoadMoreConversations) {
      onChangePageNumber();
    }
  };

  const handleRefresh = useCallback(() => {
    setFlashListReady(false);
    setIsRefreshing(true);
    clearAndFetchNotifications(sortOrder).finally(() => {
      setIsRefreshing(false);
    });
  }, [clearAndFetchNotifications, sortOrder]);

  const { openedRowIndex } = useInboxListStateContext();

  const handleRender: ListRenderItem<Notification> = ({ item, index }) => {
    return (
      <InboxItemContainer
        item={item}
        index={index}
        openedRowIndex={openedRowIndex as SharedValue<number | null>}
      />
    );
  };

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      openedRowIndex.value = -1;
      if (!isFlashListReady) {
        runOnJS(setFlashListReady)(true);
      }
    },
  });

  const shouldShowEmptyLoader = isNotificationsLoading && notifications.length === 0;
  const emptyState = shouldShowEmptyLoader || notifications.length === 0;

  return emptyState ? (
    <EmptyListState
      isLoading={isNotificationsLoading}
      isEmpty={notifications.length === 0}
      emptyText={i18n.t('NOTIFICATION.EMPTY')}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  ) : (
    <AnimatedFlashlist
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      layout={softLayout()}
      showsVerticalScrollIndicator={false}
      data={notifications}
      onScroll={scrollHandler}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
      renderItem={handleRender}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
    />
  );
};

const InboxScreen = () => {
  useScreenAnalytics(SCREENS.INBOX);
  const dispatch = useAppDispatch();
  const themedTailwind = useThemedStyles();
  const { isDark } = useTheme();

  // Memoize the markAllAsRead callback
  const markAllAsRead = useCallback(async () => {
    await dispatch(notificationActions.markAllAsRead());
    showToast({
      message: i18n.t('NOTIFICATION.ALERTS.MARK_ALL_READ'),
    });
  }, [dispatch]);

  return (
    <SafeAreaView edges={['top']} style={themedTailwind.style('flex-1 bg-solid-1')}>
      <StatusBar
        translucent
        backgroundColor={themedTailwind.color('bg-solid-1')}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <InboxListStateProvider>
        <InboxHeader markAllAsRead={markAllAsRead} />
        <InboxList />
      </InboxListStateProvider>
    </SafeAreaView>
  );
};

export default InboxScreen;
