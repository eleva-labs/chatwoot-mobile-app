import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, RefreshControl, StatusBar } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { softLayout } from '@infrastructure/animation';
import { FlashList } from '@shopify/flash-list';

import {
  ConversationItemContainer,
  ConversationHeader,
  StatusFilters,
  SortByFilters,
  InboxFilters,
  AssigneeTypeFilters,
} from './components';

import { ActionTabs, BottomSheetWrapper, EmptyListState } from '@infrastructure/ui';
import {
  SCREENS,
  LAST_ACTIVE_TIMESTAMP_KEY,
  LAST_ACTIVE_TIMESTAMP_THRESHOLD,
} from '@domain/constants';
import { useChromeMetrics, useSheetDefaults } from '@infrastructure/utils';
import {
  ConversationListStateProvider,
  useConversationListStateContext,
  useRefsContext,
  useTheme,
} from '@infrastructure/context';

import { tailwind } from '@infrastructure/theme';
import { Conversation } from '@domain/types';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import { useScreenAnalytics, useThemedStyles } from '@infrastructure/hooks';
import {
  selectBottomSheetState,
  selectCurrentState,
  setBottomSheetState,
} from '@application/store/conversation/conversationHeaderSlice';
import { resetActionState } from '@application/store/conversation/conversationActionSlice';
import { conversationActions } from '@application/store/conversation/conversationActions';
import {
  selectConversationsLoading,
  selectIsAllConversationsFetched,
  getFilteredConversations,
} from '@application/store/conversation/conversationSelectors';
import {
  selectFilters,
  FilterState,
} from '@application/store/conversation/conversationFilterSlice';
import { ConversationPayload } from '@application/store/conversation/conversationTypes';
import { clearAllConversations } from '@application/store/conversation/conversationSlice';
import { selectUserId } from '@application/store/auth/authSelectors';
import { clearAllContacts } from '@application/store/contact/contactSlice';
import { clearAssignableAgents } from '@application/store/assignable-agent/assignableAgentSlice';

import i18n from '@infrastructure/i18n';
import ActionBottomSheet from '@application/navigation/tabs/ActionBottomSheet';
import { getCurrentRouteName } from '@infrastructure/utils/navigationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';
import { CONVERSATION_EVENTS } from '@domain/constants/analyticsEvents';

// The screen list thats need to be checked for refreshing the conversations list
const REFRESH_SCREEN_LIST = [SCREENS.CONVERSATION, SCREENS.INBOX, SCREENS.SETTINGS];

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

type FlashListRenderItemType = {
  item: Conversation;
  index: number;
};

const ConversationList = () => {
  const { dismissAll } = useBottomSheetModal();
  const dispatch = useAppDispatch();
  const { contentBottomPadding } = useChromeMetrics();
  const [appState, setAppState] = useState(AppState.currentState);

  // This is used to prevent the infinite scrolling before the list is ready
  const [isFlashListReady, setFlashListReady] = useState(false);
  // This is used for pull to refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  // This is used for pagination
  const [pageNumber, setPageNumber] = useState(1);
  const userId = useAppSelector(selectUserId);

  // This is used to store the index of the item that is currently selected
  const { openedRowIndex } = useConversationListStateContext();

  // This is used to check if the conversations are still loading
  const isConversationsLoading = useAppSelector(selectConversationsLoading);
  // This is used to check if all the conversations are fetched
  const isAllConversationsFetched = useAppSelector(selectIsAllConversationsFetched);

  const handleRender = useCallback(({ item, index }: FlashListRenderItemType) => {
    return (
      <ConversationItemContainer
        index={index}
        conversationItem={item}
        openedRowIndex={openedRowIndex as SharedValue<number | null>}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filters = useAppSelector(selectFilters);
  const previousFilters = useRef(filters);

  // Reset last active timestamp when the conversation screen is opened
  useEffect(() => {
    AsyncStorage.removeItem(LAST_ACTIVE_TIMESTAMP_KEY);
  }, []);

  useEffect(() => {
    if (previousFilters.current !== filters) {
      previousFilters.current = filters;
      clearAndFetchConversations(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    dismissAll();
    clearAndFetchConversations(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAndFetchConversations = useCallback(async (filters: FilterState) => {
    setPageNumber(1);
    await dispatch(clearAllConversations());
    await dispatch(clearAllContacts());
    await dispatch(clearAssignableAgents());
    fetchConversations(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ListFooterComponent = () => {
    if (isAllConversationsFetched) return null;
    return (
      <Animated.View
        style={[
          tailwind.style('flex-1 items-center justify-center pt-8'),
          { paddingBottom: contentBottomPadding },
        ]}>
        {isAllConversationsFetched ? null : <ActivityIndicator size="small" />}
      </Animated.View>
    );
  };

  const handleRefresh = useCallback(() => {
    setFlashListReady(false);
    setIsRefreshing(true);
    AnalyticsHelper.track(CONVERSATION_EVENTS.REFRESH_CONVERSATIONS);
    clearAndFetchConversations(filters).finally(() => {
      setIsRefreshing(false);
    });
  }, [clearAndFetchConversations, filters]);

  const checkAppStateAndFetchConversations = useCallback(async () => {
    const lastActiveTimestamp = await AsyncStorage.getItem(LAST_ACTIVE_TIMESTAMP_KEY);
    if (lastActiveTimestamp) {
      const currentTimestamp = Date.now();
      const difference = currentTimestamp - parseInt(lastActiveTimestamp);
      if (difference > LAST_ACTIVE_TIMESTAMP_THRESHOLD) {
        clearAndFetchConversations(filters);
      }
    }
  }, [clearAndFetchConversations, filters]);

  // Update conversations when app comes to foreground from background
  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const routeName = getCurrentRouteName();
        if (routeName && REFRESH_SCREEN_LIST.includes(routeName)) {
          checkAppStateAndFetchConversations();
        }
      }

      if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background
        const currentTimestamp = Date.now();
        AsyncStorage.setItem(LAST_ACTIVE_TIMESTAMP_KEY, currentTimestamp.toString());
      }

      setAppState(nextAppState);
    });
    return () => {
      appStateListener?.remove();
    };
  }, [appState, checkAppStateAndFetchConversations, clearAndFetchConversations, filters]);

  const fetchConversations = useCallback(
    async (filters: FilterState, page: number = 1) => {
      const conversationFilters = {
        status: filters.status,
        assigneeType: filters.assignee_type,
        page: page,
        sortBy: filters.sort_by,
        inboxId: parseInt(filters.inbox_id),
      } as ConversationPayload;

      dispatch(conversationActions.fetchConversations(conversationFilters));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onChangePageNumber = () => {
    const nextPageNumber = pageNumber + 1;
    setPageNumber(nextPageNumber);
    fetchConversations(filters, nextPageNumber);
  };

  const handleOnEndReached = () => {
    const shouldLoadMoreConversations =
      isFlashListReady && !isAllConversationsFetched && !isConversationsLoading;
    if (shouldLoadMoreConversations) {
      onChangePageNumber();
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: () => {
      openedRowIndex.value = -1;
      if (!isFlashListReady) {
        runOnJS(setFlashListReady)(true);
      }
    },
  });

  const allConversations = useAppSelector(state =>
    getFilteredConversations(state, filters, userId),
  );

  const shouldShowEmptyLoader = isConversationsLoading && allConversations.length === 0;
  const emptyState = shouldShowEmptyLoader || allConversations.length === 0;

  return emptyState ? (
    <EmptyListState
      isLoading={isConversationsLoading}
      isEmpty={allConversations.length === 0}
      emptyText={i18n.t('CONVERSATION.EMPTY')}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  ) : (
    <AnimatedFlashList
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      layout={softLayout()}
      showsVerticalScrollIndicator={false}
      data={allConversations}
      estimatedItemSize={91}
      onScroll={scrollHandler}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
      // @ts-ignore
      renderItem={handleRender}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
    />
  );
};

const ConversationScreen = () => {
  useScreenAnalytics(SCREENS.CONVERSATION);
  const sheetDefaults = useSheetDefaults();
  const currentBottomSheet = useAppSelector(selectBottomSheetState);
  const currentConversationState = useAppSelector(selectCurrentState);
  const { isDark } = useTheme();
  const themedTailwind = useThemedStyles();
  const dispatch = useAppDispatch();

  const { filtersModalSheetRef } = useRefsContext();

  const handleOnDismiss = () => {
    /**
     * Resetting the bottoms sheet state to none with a timeout
     * to avoid flickering of bottom sheet
     */
    dispatch(setBottomSheetState('none'));
    dispatch(resetActionState());
  };

  const filterSnapPoints = useMemo(() => {
    switch (currentBottomSheet) {
      case 'status':
        return [290];
      case 'sort_by':
        return [200];
      case 'assignee_type':
        return [200];
      case 'inbox_id':
        return ['70%'];
      default:
        return [250];
    }
  }, [currentBottomSheet]);

  return (
    <SafeAreaView edges={['top']} style={themedTailwind.style('flex-1 bg-solid-1')}>
      <StatusBar
        translucent
        backgroundColor={themedTailwind.color('bg-solid-1')}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <ConversationListStateProvider>
        <ConversationHeader />
        <ConversationList />
        <BottomSheetModal
          ref={filtersModalSheetRef}
          {...sheetDefaults}
          snapPoints={filterSnapPoints}
          onDismiss={handleOnDismiss}>
          <BottomSheetWrapper>
            {currentBottomSheet === 'status' ? <StatusFilters /> : null}
            {currentBottomSheet === 'sort_by' ? <SortByFilters /> : null}
            {currentBottomSheet === 'assignee_type' ? <AssigneeTypeFilters /> : null}
            {currentBottomSheet === 'inbox_id' ? <InboxFilters /> : null}
          </BottomSheetWrapper>
        </BottomSheetModal>
        <ActionBottomSheet />
        {currentConversationState === 'Select' && <ActionTabs />}
      </ConversationListStateProvider>
    </SafeAreaView>
  );
};

export default ConversationScreen;
