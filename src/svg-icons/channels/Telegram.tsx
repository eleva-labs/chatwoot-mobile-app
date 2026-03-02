import React from 'react';
import { Send } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * TelegramIcon - Proxies to Lucide Send (Lucide doesn't have Telegram brand)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/send
 * @note Telegram brand icon replaced with generic Send icon
 */
export const TelegramIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Send color={iconColor} size={size} {...props} />;
};

/**
 * TelegramFilledIcon - Proxies to Lucide Send (Lucide doesn't have Telegram brand)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/send
 * @note Telegram brand icon replaced with generic Send icon
 */
export const TelegramFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Send color={iconColor} size={size} {...props} />;
};
