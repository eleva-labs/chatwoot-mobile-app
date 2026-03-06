import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useChatWindowContext, useRefsContext } from '@infrastructure/context';
import { showToast } from '@infrastructure/utils/toastUtils';
import i18n from '@infrastructure/i18n';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectConversationById } from '@application/store/conversation/conversationSelectors';
import { selectInboxById, selectHasMultipleInboxes } from '@application/store/inbox/inboxSelectors';
import { contactActions } from '@application/store/contact/contactActions';
import { CONVERSATION_STATUS } from '@domain/constants';
import { ChatHeader } from './ChatHeader';
import { DashboardList } from './DropdownMenu';
import { ImageSourcePropType } from 'react-native';
import { SLAStatus } from '@domain/types/common/SLA';
import { evaluateSLAStatus } from '@chatwoot/utils';
import { resetSentMessage } from '@application/store/conversation/sendMessageSlice';
import { selectAllDashboardApps } from '@application/store/dashboard-app/dashboardAppSlice';
import { selectUser } from '@application/store/auth/authSelectors';

type ChatScreenHeaderProps = {
  name: string;
  imageSrc: ImageSourcePropType;
};

const REFRESH_INTERVAL = 60000;

export const ChatHeaderContainer = (props: ChatScreenHeaderProps) => {
  const { name, imageSrc } = props;
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { conversationId } = useChatWindowContext();
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
  const inbox = useAppSelector(state =>
    conversation?.inboxId ? selectInboxById(state, conversation.inboxId) : undefined,
  );
  const hasMultipleInboxes = useAppSelector(selectHasMultipleInboxes);

  const currentUser = useAppSelector(selectUser);
  const dashboardApps = useAppSelector(selectAllDashboardApps);

  const contactId = conversation?.meta?.sender?.id;

  // Read AI status from conversation's custom_attributes (aligned with web logic)
  const isAIEnabled = conversation?.customAttributes?.aiEnabled === 'true';

  const appliedSla = conversation?.appliedSla;

  const [slaStatus, setSlaStatus] = useState<SLAStatus | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversationStatus = conversation?.status;
  const isResolved = conversationStatus === CONVERSATION_STATUS.RESOLVED;

  const updateSlaStatus = useCallback(() => {
    if (appliedSla) {
      const status = evaluateSLAStatus({
        appliedSla: {
          id: appliedSla.id,
          name: appliedSla.slaName,
          description: appliedSla.slaDescription,
          sla_first_response_time_threshold: appliedSla.slaFirstResponseTimeThreshold,
          sla_next_response_time_threshold: appliedSla.slaNextResponseTimeThreshold,
          sla_resolution_time_threshold: appliedSla.slaResolutionTimeThreshold,
          only_during_business_hours: appliedSla.slaOnlyDuringBusinessHours,
          created_at: appliedSla.createdAt,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        chat: {
          first_reply_created_at: conversation?.firstReplyCreatedAt,
          waiting_since: conversation?.waitingSince,
          status: conversation?.status,
        },
      });
      setSlaStatus(status);
    }
  }, [appliedSla, conversation]);

  const { chatPagerView } = useRefsContext();
  const { pagerViewIndex } = useChatWindowContext();

  const createTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      updateSlaStatus();
      createTimer();
    }, REFRESH_INTERVAL);
  }, [updateSlaStatus]);

  useEffect(() => {
    createTimer();
    updateSlaStatus();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [createTimer, updateSlaStatus]);

  const handleBackPress = () => {
    dispatch(resetSentMessage());
    if (navigation.canGoBack()) {
      navigation.dispatch(StackActions.pop());
    } else {
      navigation.dispatch(StackActions.replace('Tab'));
    }
  };

  const handleNavigationToContactDetails = () => {
    const navigateToScreen = StackActions.push('ContactDetails', { conversationId });
    navigation.dispatch(navigateToScreen);
  };

  const handleNavigation = (url?: string, title?: string) => {
    if (url) {
      const navigateToScreen = StackActions.push('Dashboard', {
        url,
        title,
        conversation,
        currentUser,
      });
      navigation.dispatch(navigateToScreen);
    } else {
      chatPagerView.current?.setPage(1);
    }
  };

  const toggleAI = async () => {
    if (!contactId) return;

    try {
      const result = await dispatch(
        contactActions.toggleAI({
          contactId,
          aiEnabled: !isAIEnabled,
        }),
      );

      if (contactActions.toggleAI.fulfilled.match(result)) {
        showToast({
          message: isAIEnabled
            ? i18n.t('SUCCESS.AI_DISABLED_SUCCESS')
            : i18n.t('SUCCESS.AI_ENABLED_SUCCESS'),
        });
      } else {
        throw new Error('Toggle AI failed');
      }
    } catch {
      showToast({
        message: i18n.t('ERRORS.AI_TOGGLE_ERROR'),
      });
    }
  };

  const dashboardRoutes = dashboardApps.map(dashboardApp => ({
    title: dashboardApp.title,
    url: dashboardApp.content[0].url,
    onSelect: handleNavigation,
  }));

  const dashboardsList = useMemo(() => {
    return [
      pagerViewIndex === 0
        ? {
            title: i18n.t('CONVERSATION.ACTIONS.TITLE'),
            onSelect: handleNavigation,
          }
        : undefined,
      ...dashboardRoutes,
    ].filter((item): item is DashboardList => item !== undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagerViewIndex]);

  const sLAStatusText = () => {
    const upperCaseType = slaStatus?.type?.toUpperCase(); // FRT, NRT, or RT
    const statusKey = slaStatus?.isSlaMissed ? 'MISSED' : 'DUE';
    return i18n.t(`SLA.STATUS.${upperCaseType}`, {
      status: i18n.t(`SLA.STATUS.${statusKey}`),
    });
  };
  return (
    <ChatHeader
      name={name}
      imageSrc={imageSrc}
      inbox={inbox ?? null}
      showInboxIndicator={hasMultipleInboxes}
      additionalAttributes={conversation?.additionalAttributes}
      isResolved={isResolved}
      dashboardsList={dashboardsList}
      isSlaMissed={slaStatus?.isSlaMissed}
      hasSla={!!appliedSla}
      slaEvents={conversation?.slaEvents}
      statusText={`${sLAStatusText()}: ${slaStatus?.threshold}`}
      isAIEnabled={isAIEnabled}
      onBackPress={handleBackPress}
      onContactDetailsPress={handleNavigationToContactDetails}
      onToggleAI={toggleAI}
    />
  );
};
