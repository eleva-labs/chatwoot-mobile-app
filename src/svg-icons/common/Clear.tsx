import { RotateCcw } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ClearIcon - Proxies to Lucide RotateCcw
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/rotate-ccw
 * @note Original was a refresh/reset icon with circular arrow
 */
export const ClearIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <RotateCcw color={iconColor} size={size} {...props} />;
};
