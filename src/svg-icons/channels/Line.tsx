import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * LineFilledIcon - Proxies to Lucide MessageCircle (Lucide doesn't have Line brand)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/message-circle
 * @note Line brand icon replaced with generic MessageCircle icon
 */
export const LineFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};
