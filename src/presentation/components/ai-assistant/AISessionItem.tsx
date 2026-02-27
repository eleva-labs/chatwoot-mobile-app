import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import { isToday, isYesterday, format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import i18n from '@/i18n';

interface SessionItemProps {
  session: AIChatSession;
  isActive: boolean;
  isLastItem: boolean;
  onPress: () => void;
}

/**
 * Formats a date string into a human-friendly session title.
 * - Today: "Today, 2:30 PM"
 * - Yesterday: "Yesterday, 4:15 PM"
 * - Within 7 days: "3 days ago"
 * - Older: "Feb 25, 2:15 PM"
 */
const formatSessionTitle = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `${i18n.t('AI_ASSISTANT.CHAT.SESSION_ITEM.TODAY')}, ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `${i18n.t('AI_ASSISTANT.CHAT.SESSION_ITEM.YESTERDAY')}, ${format(date, 'h:mm a')}`;
    }
    if (differenceInDays(new Date(), date) < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, h:mm a');
  } catch {
    return i18n.t('AI_ASSISTANT.CHAT.SESSIONS.RECENTLY');
  }
};

export const AISessionItem: React.FC<SessionItemProps> = React.memo(
  ({ session, isActive, isLastItem, onPress }) => {
    const { style, tokens } = useAIStyles();
    const sessionTokens = tokens.session;

    const title = useMemo(() => formatSessionTitle(session.updated_at), [session.updated_at]);

    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <Animated.View
            style={[
              style(
                'flex-row items-center px-4 py-3',
                !isLastItem && `border-b ${sessionTokens.border}`,
                isActive && sessionTokens.activeBackground,
              ),
              pressed && style('opacity-70'),
            ]}>
            <View style={style('flex-1')}>
              <Text
                style={style(
                  'text-base font-inter-420-20',
                  isActive ? sessionTokens.activeText : sessionTokens.title,
                  isActive && 'font-inter-580-24',
                )}>
                {title}
              </Text>
            </View>
            {isActive && (
              <View style={style('w-2 h-2 rounded-full', sessionTokens.activeIndicator)} />
            )}
          </Animated.View>
        )}
      </Pressable>
    );
  },
);

AISessionItem.displayName = 'AISessionItem';
