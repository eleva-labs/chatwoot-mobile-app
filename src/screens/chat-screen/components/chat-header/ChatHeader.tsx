import React from 'react';
import { ImageSourcePropType, Keyboard, Platform, Pressable } from 'react-native';
import { BottomSheetModal, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import Animated from 'react-native-reanimated';
import { ChevronLeft } from '@/svg-icons/common/ChevronLeft';
import { Overflow } from '@/svg-icons/common/Overflow';

import { Avatar, Icon } from '@infrastructure/ui';
import { /* OpenIcon, ResolvedIcon, */ SLAIcon } from '@/svg-icons';
import { AIHeaderButton } from '@infrastructure/ui/ai-status/AIHeaderButton';
import { BottomSheetBackdrop, BottomSheetWrapper } from '@infrastructure/ui';
import { tailwind, useThemeColors } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { ChatDropdownMenu, DashboardList } from './DropdownMenu';
import { SLAEvent } from '@domain/types/common';
import { useRefsContext } from '@infrastructure/context';
import { SlaEvents } from './SlaEvents';

type ChatHeaderProps = {
  name: string;
  imageSrc: ImageSourcePropType;
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
  const { colors } = useThemeColors();
  const { slaEventsSheetRef } = useRefsContext();

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const toggleSlaEventsSheet = () => {
    if (slaEvents?.length) {
      Keyboard.dismiss();
      slaEventsSheetRef.current?.present();
    }
  };

  return (
    <Animated.View style={[themedTailwind.style('border-b-[1px] border-b-slate-6')]}>
      <Animated.View style={tailwind.style('flex flex-row justify-between items-center px-4 py-2')}>
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
            <Animated.View style={tailwind.style('pl-2')}>
              <Animated.Text
                numberOfLines={1}
                style={themedTailwind.style(
                  'text-[17px] font-inter-medium-24 tracking-[0.32px] text-slate-12',
                )}>
                {name}
              </Animated.Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.View
          style={tailwind.style(
            `flex flex-row flex-1 justify-end ${Platform.OS === 'ios' ? 'gap-4' : ''}`,
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
            {/* Status icon temporarily hidden - was causing user confusion
            <Icon
              icon={
                isResolved ? (
                  <ResolvedIcon strokeWidth={2} stroke={colors.teal[9]} />
                ) : (
                  <OpenIcon strokeWidth={2} stroke={colors.slate[12]} />
                )
              }
              size={24}
            />
            */}
          </Animated.View>
          {dashboardsList.length > 0 && (
            <ChatDropdownMenu dropdownMenuList={dashboardsList}>
              <Overflow size={24} color={colors.slate[12]} />
            </ChatDropdownMenu>
          )}
        </Animated.View>
      </Animated.View>
      <BottomSheetModal
        ref={slaEventsSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        snapPoints={['36%']}>
        <BottomSheetWrapper>
          <SlaEvents slaEvents={slaEvents} statusText={statusText ?? ''} />
        </BottomSheetWrapper>
      </BottomSheetModal>
    </Animated.View>
  );
};
