import { Moon } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * SnoozedIcon - Proxies to Lucide Moon
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH)
 * @lucide https://lucide.dev/icons/moon
 */
export const SnoozedIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Moon color={iconColor} size={size} {...props} />;
};

/**
 * SnoozedFilledIcon - Filled moon icon
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH)
 * @lucide https://lucide.dev/icons/moon
 */
export const SnoozedFilledIcon = ({ color, size = 32, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Moon color={iconColor} size={size} fill={iconColor} {...props} />;
};
