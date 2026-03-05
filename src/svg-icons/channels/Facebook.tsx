import React from 'react';
import { Facebook, Instagram } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * FacebookIcon - Proxies to Lucide Facebook
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/facebook
 */
export const FacebookIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Facebook color={iconColor} size={size} {...props} />;
};

/**
 * MessengerFilledIcon - Proxies to Lucide Facebook (Messenger is Facebook)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/facebook
 */
export const MessengerFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Facebook color={iconColor} size={size} {...props} />;
};

/**
 * InstagramFilledIcon - Proxies to Lucide Instagram
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/instagram
 */
export const InstagramFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Instagram color={iconColor} size={size} {...props} />;
};

/**
 * FacebookFilledIcon - Proxies to Lucide Facebook
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/facebook
 */
export const FacebookFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Facebook color={iconColor} size={size} {...props} />;
};
