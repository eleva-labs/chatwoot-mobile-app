import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * WhatsAppIcon - Proxies to Lucide MessageCircle (Lucide doesn't have WhatsApp brand)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/message-circle
 * @note WhatsApp brand icon replaced with generic MessageCircle icon
 */
export const WhatsAppIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};

/**
 * WhatsAppFilledIcon - Proxies to Lucide MessageCircle (Lucide doesn't have WhatsApp brand)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/message-circle
 * @note WhatsApp brand icon replaced with generic MessageCircle icon
 */
export const WhatsAppFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};

/**
 * SMSFilledIcon - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/message-circle
 */
export const SMSFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};
