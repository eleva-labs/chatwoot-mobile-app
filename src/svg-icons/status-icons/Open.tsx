import { CircleDot } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * OpenIcon - Proxies to Lucide CircleDot (circle with dot for "open" status)
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/circle-dot
 * @usage 4 files
 */
export const OpenIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <CircleDot color={iconColor} size={size} {...props} />;
};
