/**
 * AIChatError Component
 *
 * Rich error display with categorization, matching web AiChatError.vue.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '@/components-next/common';
import { WarningIcon, LockIcon } from '@/svg-icons';
import { tailwind } from '@/theme/tailwind';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import i18n from '@/i18n';

type ErrorCategory = 'network' | 'rate_limit' | 'auth' | 'server' | 'unknown';

interface AIChatErrorProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  onFreshStart?: () => void;
}

function categorizeError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) return 'network';
  if (lower.includes('429') || lower.includes('rate')) return 'rate_limit';
  if (lower.includes('401') || lower.includes('403')) return 'auth';
  if (/5\d{2}/.test(message)) return 'server';
  return 'unknown';
}

interface ErrorConfig {
  titleKey: string;
  iconType: 'warning' | 'lock';
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

const ERROR_CONFIG: Record<ErrorCategory, ErrorConfig> = {
  network: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.NETWORK',
    iconType: 'warning',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-4',
    accentText: 'text-amber-11',
  },
  rate_limit: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.RATE_LIMIT',
    iconType: 'warning',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-4',
    accentText: 'text-amber-11',
  },
  auth: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.AUTH',
    iconType: 'lock',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
  server: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.SERVER',
    iconType: 'warning',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
  unknown: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.UNKNOWN',
    iconType: 'warning',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
};

/** Renders the appropriate SVG icon for an error category */
const ErrorCategoryIcon: React.FC<{ config: ErrorConfig }> = ({ config }) => {
  const iconColor = config.accentText.includes('amber')
    ? (tailwind.color('text-amber-11') ?? '#AD5700')
    : (tailwind.color('text-ruby-11') ?? '#CA3A31');

  if (config.iconType === 'lock') {
    return <Icon icon={<LockIcon />} size={16} />;
  }
  return <Icon icon={<WarningIcon stroke={iconColor} />} size={16} />;
};

export const AIChatError: React.FC<AIChatErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  onFreshStart,
}) => {
  const { style } = useAIStyles();
  const category = useMemo(() => categorizeError(error.message || ''), [error.message]);
  const config = ERROR_CONFIG[category];
  const canRetry = category !== 'auth';

  return (
    <View style={style('mx-4 mb-2 p-3 rounded-lg border', config.accentBg, config.accentBorder)}>
      {/* Header */}
      <View style={style('flex-row items-start gap-2')}>
        <View style={style('mt-0.5')}>
          <ErrorCategoryIcon config={config} />
        </View>
        <View style={style('flex-1')}>
          <Text style={style('text-sm font-medium text-slate-12')}>{i18n.t(config.titleKey)}</Text>
          <Text style={style('text-xs mt-1 text-slate-11')} numberOfLines={3}>
            {error.message || String(error)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={style('flex-row flex-wrap gap-2 mt-3')}>
        {canRetry && onRetry && (
          <Pressable onPress={onRetry} style={style('bg-iris-9 px-3 py-1.5 rounded-lg')}>
            <Text style={style('text-xs font-medium text-white')}>
              {i18n.t('AI_ASSISTANT.CHAT.ERRORS.RETRY')}
            </Text>
          </Pressable>
        )}
        {onFreshStart && (
          <Pressable onPress={onFreshStart} style={style('px-3 py-1.5 rounded-lg')}>
            <Text style={style('text-xs text-slate-11')}>
              {i18n.t('AI_ASSISTANT.CHAT.ERRORS.FRESH_START')}
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} style={style('ml-auto px-3 py-1.5')}>
            <Text style={style('text-xs text-slate-10')}>
              {i18n.t('AI_ASSISTANT.CHAT.ERRORS.DISMISS')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
