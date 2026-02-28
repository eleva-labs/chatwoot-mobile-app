/**
 * AIChatError Component
 *
 * Rich error display with categorization, matching web AiChatError.vue.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { WifiOff, Clock, Lock, ServerCrash, CircleAlert, RefreshCw } from 'lucide-react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useResolveColor } from '@/presentation/hooks/ai-assistant/useAITheme';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';
import {
  categorizeError,
  ERROR_DISPLAY_CONFIG,
  type ErrorCategory,
  type ErrorDisplayConfig,
} from '@/presentation/utils/ai-assistant/aiChatErrorUtils';

interface AIChatErrorProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  onFreshStart?: () => void;
}

/** Map icon type to Lucide component */
const ICON_COMPONENTS = {
  'wifi-off': WifiOff,
  'clock': Clock,
  'lock': Lock,
  'server-crash': ServerCrash,
  'alert-circle': CircleAlert,
} as const;

/** Renders the appropriate Lucide icon for an error category */
const ErrorCategoryIcon: React.FC<{ config: ErrorDisplayConfig }> = ({ config }) => {
  const resolveColor = useResolveColor();
  const iconColor = config.accentText.includes('amber')
    ? resolveColor('text-amber-11', '#AD5700')
    : resolveColor('text-ruby-11', '#CA3A31');

  const IconComponent = ICON_COMPONENTS[config.iconType];
  return <IconComponent size={16} color={iconColor} strokeWidth={2} />;
};

export const AIChatError: React.FC<AIChatErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  onFreshStart,
}) => {
  const { style } = useAIStyles();
  const { t } = useAIi18n();
  const category = useMemo(() => categorizeError(error.message || ''), [error.message]);
  const config = ERROR_DISPLAY_CONFIG[category];
  const canRetry = category !== 'auth';

  return (
    <View style={style('mx-4 mb-2 p-3 rounded-lg border', config.accentBg, config.accentBorder)}>
      {/* Header */}
      <View style={style('flex-row items-start gap-2')}>
        <View style={style('mt-0.5')}>
          <ErrorCategoryIcon config={config} />
        </View>
        <View style={style('flex-1')}>
          <Text style={style('text-sm font-medium text-slate-12')}>{t(config.titleKey)}</Text>
          <Text style={style('text-xs mt-1 text-slate-11')} numberOfLines={3}>
            {error.message || String(error)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={style('flex-row flex-wrap gap-2 mt-3')}>
        {canRetry && onRetry && (
          <Pressable
            onPress={onRetry}
            style={style('bg-iris-9 px-3 py-1.5 rounded-lg flex-row items-center gap-1')}>
            <RefreshCw size={12} color="white" strokeWidth={2} />
            <Text style={style('text-xs font-medium text-white')}>
              {t('AI_ASSISTANT.CHAT.ERRORS.RETRY')}
            </Text>
          </Pressable>
        )}
        {onFreshStart && (
          <Pressable onPress={onFreshStart} style={style('px-3 py-1.5 rounded-lg')}>
            <Text style={style('text-xs text-slate-11')}>
              {t('AI_ASSISTANT.CHAT.ERRORS.FRESH_START')}
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} style={style('ml-auto px-3 py-1.5')}>
            <Text style={style('text-xs text-slate-10')}>
              {t('AI_ASSISTANT.CHAT.ERRORS.DISMISS')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
