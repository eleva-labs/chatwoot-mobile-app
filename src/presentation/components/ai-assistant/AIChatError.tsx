/**
 * AIChatError Component
 *
 * Rich error display with categorization, matching web AiChatError.vue.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

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

const ERROR_CONFIG: Record<
  ErrorCategory,
  { title: string; icon: string; accentBg: string; accentBorder: string; accentText: string }
> = {
  network: {
    title: 'Network Error',
    icon: '📡',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-6',
    accentText: 'text-amber-11',
  },
  rate_limit: {
    title: 'Rate Limited',
    icon: '⏱',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-6',
    accentText: 'text-amber-11',
  },
  auth: {
    title: 'Authentication Error',
    icon: '🔒',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-6',
    accentText: 'text-ruby-11',
  },
  server: {
    title: 'Server Error',
    icon: '⚠️',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-6',
    accentText: 'text-ruby-11',
  },
  unknown: {
    title: 'Something went wrong',
    icon: '⚠️',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-6',
    accentText: 'text-ruby-11',
  },
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
        <Text style={style('text-base mt-0.5')}>{config.icon}</Text>
        <View style={style('flex-1')}>
          <Text style={style('text-sm font-medium text-slate-12')}>{config.title}</Text>
          <Text style={style('text-xs mt-1 text-slate-11')} numberOfLines={3}>
            {error.message || String(error)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={style('flex-row flex-wrap gap-2 mt-3')}>
        {canRetry && onRetry && (
          <Pressable onPress={onRetry} style={style('bg-iris-9 px-3 py-1.5 rounded-lg')}>
            <Text style={style('text-xs font-medium text-white')}>Retry</Text>
          </Pressable>
        )}
        {onFreshStart && (
          <Pressable onPress={onFreshStart} style={style('px-3 py-1.5 rounded-lg')}>
            <Text style={style('text-xs text-slate-11')}>Fresh Start</Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} style={style('ml-auto px-3 py-1.5')}>
            <Text style={style('text-xs text-slate-10')}>Dismiss</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
