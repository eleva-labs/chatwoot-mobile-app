import React from 'react';
import { ImageSourcePropType, Keyboard, Platform, Pressable } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated from 'react-native-reanimated';
import { ChevronLeft } from '@/svg-icons/common/ChevronLeft';
import { Overflow } from '@/svg-icons/common/Overflow';

import { Avatar, Icon, BottomSheetWrapper } from '@infrastructure/ui';
import { InboxIndicator } from '@infrastructure/ui/list-components';
import { Inbox } from '@domain/types/Inbox';
import { ConversationAdditionalAttributes } from '@domain/types/Conversation';
import { SLAIcon } from '@/svg-icons';
import { AIHeaderButton } from '@infrastructure/ui/ai-status/AIHeaderButton';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { useSheetDefaults } from '@infrastructure/utils';
import { ChatDropdownMenu, DashboardList } from './DropdownMenu';
import { SLAEvent } from '@domain/types/common';
import { useRefsContext } from '@infrastructure/context';
import { SlaEvents } from './SlaEvents';

type ChatHeaderProps = {
  name: string;
  imageSrc: ImageSourcePropType;
  inbox: Inbox | null;
  showInboxIndicator?: boolean;
  additionalAttributes?: ConversationAdditionalAttributes;
  isResolved: boolean;
  isSlaMissed?: boolean;
  hasSla?: boolean;
  slaEvents?: SLAEvent[];
  dashboardsList: DashboardList[];
  statusText?: string;
  isAIEnabled?: boolean;
  onBackPress: () => void;
  onContactDetailsPress: () => void;
  onToggleAI: () => void;
};

export const ChatHeader = ({
  name,
  imageSrc,
  inbox,
  showInboxIndicator = false,
  additionalAttributes,
  isResolved,
  slaEvents,
  isSlaMissed,
  hasSla,
  statusText,
  dashboardsList,
  isAIEnabled = false,
  onBackPress,
  onContactDetailsPress,
  onToggleAI,
}: ChatHeaderProps) => {
  const themedTailwind = useThemedStyles();
  const sheetDefaults = useSheetDefaults();
  const { colors } = useThemeColors();
  const { slaEventsSheetRef } = useRefsContext();

  const toggleSlaEventsSheet = () => {
    if (slaEvents?.length) {
      Keyboard.dismiss();
      slaEventsSheetRef.current?.present();
    }
  };

  return (
    <Animated.View style={[themedTailwind.style('border-b-[1px] border-b-slate-6')]}>
      <Animated.View style={tailwind.style('flex flex-row justify-between items-center px-4 py-3')}>
        <Animated.View style={tailwind.style('flex-1 flex-row gap-2 items-center justify-center')}>
          <Pressable
            hitSlop={8}
            style={tailwind.style('h-8 w-8 flex  justify-center items-start')}
            onPress={onBackPress}>
            <ChevronLeft size={24} color={colors.slate[12]} />
          </Pressable>
          <Pressable
            onPress={onContactDetailsPress}
            style={tailwind.style('flex flex-row items-center flex-1')}>
            <Avatar size="xl" src={imageSrc} name={name} />
            <Animated.View style={tailwind.style('pl-2 flex-1 min-w-0')}>
              <Animated.Text
                numberOfLines={1}
                style={themedTailwind.style(
                  'text-[17px] font-inter-medium-24 tracking-[0.32px] text-slate-12',
                )}>
                {name}
              </Animated.Text>
              {showInboxIndicator && inbox && (
                <InboxIndicator
                  inbox={inbox}
                  additionalAttributes={additionalAttributes}
                  size="md"
                />
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View
          style={tailwind.style(
            `flex flex-row justify-end ${Platform.OS === 'ios' ? 'gap-4' : ''}`,
          )}>
          <Animated.View style={tailwind.style('flex flex-row items-center gap-4')}>
            {hasSla && (
              <Pressable hitSlop={8} onPress={toggleSlaEventsSheet}>
                <Icon
                  icon={<SLAIcon color={isSlaMissed ? colors.ruby[9] : colors.slate[11]} />}
                  size={24}
                />
              </Pressable>
            )}
            <AIHeaderButton isEnabled={isAIEnabled} onPress={onToggleAI} />
          </Animated.View>
          {dashboardsList.length > 0 && (
            <ChatDropdownMenu dropdownMenuList={dashboardsList}>
              <Overflow size={24} color={colors.slate[12]} />
            </ChatDropdownMenu>
          )}
        </Animated.View>
      </Animated.View>
      <BottomSheetModal ref={slaEventsSheetRef} {...sheetDefaults} snapPoints={['36%']}>
        <BottomSheetWrapper>
          <SlaEvents slaEvents={slaEvents} statusText={statusText ?? ''} />
        </BottomSheetWrapper>
      </BottomSheetModal>
    </Animated.View>
  );
};
