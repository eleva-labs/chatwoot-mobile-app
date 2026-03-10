import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { spring } from '@infrastructure/animation';

import { BottomSheetBackdrop, BottomSheetWrapper } from '@infrastructure/ui';

import { Icon } from '@infrastructure/ui/common/icon';
import { DoubleCheckIcon, InboxFilterIcon } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { InboxFilters } from './InboxFilters';
import i18n from '@infrastructure/i18n';
import { useRefsContext } from '@infrastructure/context';

type InboxHeaderProps = {
  markAllAsRead: () => void;
};

export const InboxHeader = (props: InboxHeaderProps) => {
  const { markAllAsRead } = props;
  const { inboxFiltersSheetRef } = useRefsContext();
  const handleToggleState = () => {
    inboxFiltersSheetRef.current?.present();
  };

  return (
    <Animated.View style={[tailwind.style('border-b-[1px] border-b-slate-6')]}>
      <Animated.View
        style={[tailwind.style('flex flex-row justify-between items-center px-4 pt-2 pb-[12px]')]}>
        <Animated.View style={tailwind.style('flex-1')}>
          <Pressable hitSlop={16} onPress={markAllAsRead}>
            <Icon icon={<DoubleCheckIcon />} size={24} />
          </Pressable>
        </Animated.View>
        <Animated.View style={tailwind.style('flex-1')}>
          <Animated.Text
            style={tailwind.style(
              'text-[17px] text-center leading-[17px] tracking-[0.32px] font-inter-medium-24 text-slate-12',
            )}>
            {i18n.t('NOTIFICATION.INBOX')}
          </Animated.Text>
        </Animated.View>
        <Animated.View style={tailwind.style('flex-1 items-end')}>
          <Pressable onPress={handleToggleState} hitSlop={16}>
            <Icon icon={<InboxFilterIcon />} size={24} />
          </Pressable>
        </Animated.View>
      </Animated.View>
      <BottomSheetModal
        ref={inboxFiltersSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        animationConfigs={spring.sheet}
        enablePanDownToClose
        snapPoints={[160]}>
        <BottomSheetWrapper>
          <InboxFilters />
        </BottomSheetWrapper>
      </BottomSheetModal>
    </Animated.View>
  );
};
