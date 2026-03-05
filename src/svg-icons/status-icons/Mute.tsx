import { BellOff } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * MuteIcon - Proxies to Lucide BellOff
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH)
 * @lucide https://lucide.dev/icons/bell-off
 */
export const MuteIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <BellOff color={iconColor} size={size} {...props} />;
};
