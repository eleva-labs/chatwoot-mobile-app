import { LoaderCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * PendingIcon - Proxies to Lucide LoaderCircle
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH)
 * @lucide https://lucide.dev/icons/loader-circle
 */
export const PendingIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.amber[9];
  return <LoaderCircle color={iconColor} size={size} {...props} />;
};

/**
 * PendingFilledIcon - Custom filled pending spinner (keep custom)
 *
 * @custom Unique filled spinner design - no Lucide equivalent
 */
export const PendingFilledIcon = ({ color, size = 32 }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.amber[9];

  return <LoaderCircle color={iconColor} size={size} fill={iconColor} fillOpacity={0.2} />;
};
