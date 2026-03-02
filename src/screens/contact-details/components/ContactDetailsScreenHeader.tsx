import React from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { StackActions, useNavigation } from '@react-navigation/native';
import { CloseIcon } from '@/svg-icons/common/CloseIcon';

import { Avatar } from '@infrastructure/ui/common';
import { tailwind } from '@infrastructure/theme';

type ContactDetailsScreenHeaderProps = {
  name: string;
  thumbnail: string;
  bio: string;
};

export const ContactDetailsScreenHeader = (props: ContactDetailsScreenHeaderProps) => {
  const navigation = useNavigation();

  const { name, thumbnail, bio } = props;
  const handleBackPress = () => {
    navigation.dispatch(StackActions.pop());
  };

  return (
    <Animated.View
      style={tailwind.style(
        'flex flex-row items-start px-4 border-b-[1px] border-b-slate-6 py-[13px]',
      )}>
      <Pressable hitSlop={16} onPress={handleBackPress} style={tailwind.style('flex-1')}>
        <Animated.View>
          <CloseIcon size={24} color={tailwind.color('text-slate-12')} />
        </Animated.View>
      </Pressable>
      <Animated.View>
        <Animated.View style={tailwind.style('flex items-center')}>
          <Avatar size="4xl" src={thumbnail ? { uri: thumbnail } : undefined} name={name} />
          <Animated.View style={tailwind.style('flex flex-col items-center gap-1 pt-3')}>
            <Animated.Text style={tailwind.style('text-[21px] font-inter-580-24 text-slate-12')}>
              {name}
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-[15px] font-inter-420-20 leading-[17.25px] text-slate-12',
              )}>
              {bio}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      <Animated.View style={tailwind.style('flex-1 items-end')}>
        {/* <Icon icon={<Overflow strokeWidth={2} />} size={24} /> */}
      </Animated.View>
    </Animated.View>
  );
};
