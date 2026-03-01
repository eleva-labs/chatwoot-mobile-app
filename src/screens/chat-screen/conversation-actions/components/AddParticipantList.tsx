import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { MoreVertical } from 'lucide-react-native';

import { AddParticipant } from '@/svg-icons';
import { tailwind } from '@infrastructure/theme';
import { Avatar, Icon } from '@infrastructure/ui';
import { Agent } from '@domain/types';
import i18n from '@infrastructure/i18n';

type ListItemProps = {
  listItem: Agent;
  index: number;
};

const ListItem = (props: ListItemProps) => {
  const { listItem, index } = props;
  return (
    <Pressable
      key={index}
      style={({ pressed }) => [
        tailwind.style(pressed ? 'bg-slate-3' : '', index === 0 ? 'rounded-t-[13px]' : ''),
      ]}>
      <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
        <Animated.View>
          <Avatar src={{ uri: listItem.thumbnail || undefined }} size="lg" />
        </Animated.View>
        <Animated.View
          style={tailwind.style('flex-1 py-[11px] ml-2 border-b-[1px] border-b-slate-6')}>
          <Animated.Text
            style={tailwind.style(
              'text-base font-inter-420-20 leading-[22px] tracking-[0.16px] text-slate-12',
            )}>
            {listItem.name}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const ParticipantOverflowCell = ({ count }: { count: number }) => {
  return (
    <Pressable style={({ pressed }) => [tailwind.style(pressed ? 'bg-slate-3' : '')]}>
      <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
        <Animated.View>
          <MoreVertical size={28} color={tailwind.color('text-slate-10') ?? '#888'} />
        </Animated.View>
        <Animated.View
          style={tailwind.style('flex-1 py-[11px] ml-2 border-b-[1px] border-b-slate-6')}>
          <Animated.Text
            style={tailwind.style(
              'text-base font-inter-420-20 leading-[22px] tracking-[0.16px] text-slate-12',
            )}>
            {i18n.t('CONVERSATION_PARTICIPANTS.OVERFLOW_COUNT', { count })}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

type AddParticipantListProps = {
  conversationParticipants: Agent[];
  onAddParticipant: () => void;
};

export const AddParticipantList = (props: AddParticipantListProps) => {
  const { conversationParticipants, onAddParticipant } = props;

  const overflowCount = conversationParticipants?.length;
  return (
    <Animated.View>
      <Animated.View style={tailwind.style('pl-4 pb-3')}>
        <Animated.Text
          style={tailwind.style(
            'text-sm font-inter-medium-24 tracking-[0.32px] leading-[16px] text-slate-11',
          )}>
          {i18n.t('CONVERSATION_PARTICIPANTS.TITLE')}
        </Animated.Text>
      </Animated.View>
      <Animated.View
        style={[
          tailwind.style('rounded-[13px] mx-4 bg-solid-1'),
          styles.listShadow,
          Platform.OS === 'android' && { backgroundColor: tailwind.color('bg-solid-1') ?? 'white' },
        ]}>
        {conversationParticipants &&
          conversationParticipants.slice(0, 4).map((listItem, index) => {
            return <ListItem key={index} {...{ listItem, index }} />;
          })}
        {overflowCount > 4 && <ParticipantOverflowCell count={overflowCount - 4} />}
        <Pressable
          onPress={onAddParticipant}
          style={({ pressed }) => [tailwind.style('rounded-b-[13px]', pressed ? 'bg-iris-3' : '')]}>
          <Animated.View style={tailwind.style('flex flex-row items-center ml-3')}>
            <Animated.View style={tailwind.style('p-0.5')}>
              <Icon icon={<AddParticipant stroke={tailwind.color('text-iris-11')} />} size={24} />
            </Animated.View>
            <Animated.View style={tailwind.style('flex-1 py-[11px] ml-2')}>
              <Animated.Text
                style={tailwind.style(
                  'text-base font-inter-420-20 leading-[22px] tracking-[0.16px] text-iris-11',
                )}>
                {i18n.t('CONVERSATION_PARTICIPANTS.ADD_PARTICIPANT')}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listShadow:
    Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.25)',
        shadowOffset: { width: 0, height: 0.15 },
        shadowRadius: 2,
        shadowOpacity: 0.35,
        elevation: 2,
      },
      android: {
        elevation: 4,
      },
    }) || {}, // Add fallback empty object
});
