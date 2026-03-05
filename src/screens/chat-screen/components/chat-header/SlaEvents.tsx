import React from 'react';
import { Text, Animated } from 'react-native';
import { tailwind } from '@infrastructure/theme';
import { useThemedStyles } from '@infrastructure/hooks';
import { SLAEvent } from '@domain/types/common/SLA';
import { SLA_MISS_TYPES } from '@domain/constants';
import { SlaEvents as SlaEventItem } from './SLAEventItem';
import i18n from '@infrastructure/i18n';

interface SlaEventsProps {
  slaEvents?: SLAEvent[];
  statusText: string;
}

export const SlaEvents = ({ slaEvents, statusText }: SlaEventsProps) => {
  const themedTailwind = useThemedStyles();
  const frtMisses = slaEvents?.filter(slaEvent => slaEvent.eventType === SLA_MISS_TYPES.FRT);
  const nrtMisses = slaEvents?.filter(slaEvent => slaEvent.eventType === SLA_MISS_TYPES.NRT);
  const rtMisses = slaEvents?.filter(slaEvent => slaEvent.eventType === SLA_MISS_TYPES.RT);

  return (
    <Animated.View style={tailwind.style('py-6 px-6 gap-3')}>
      <Text
        style={themedTailwind.style(
          'text-[17px]  text-slate-12 font-inter-medium-24 leading-[21px] tracking-[0.16px]',
        )}>
        {statusText}
      </Text>

      <Text
        style={themedTailwind.style(
          'text-md  text-slate-12 font-inter-medium-24 leading-[21px] tracking-[0.16px]',
        )}>
        {i18n.t('SLA.MISSES.TITLE')}
      </Text>

      {frtMisses && frtMisses.length > 0 && (
        <SlaEventItem label={i18n.t('SLA.MISSES.FRT')} items={frtMisses} />
      )}
      {nrtMisses && nrtMisses.length > 0 && (
        <SlaEventItem label={i18n.t('SLA.MISSES.NRT')} items={nrtMisses} />
      )}
      {rtMisses && rtMisses.length > 0 && (
        <SlaEventItem label={i18n.t('SLA.MISSES.RT')} items={rtMisses} />
      )}
    </Animated.View>
  );
};
