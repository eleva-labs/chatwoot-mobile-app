import { Circle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * NoPriority - Proxies to Lucide Circle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/circle
 */
export const NoPriority = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[7];
  return <Circle color={iconColor} size={size} {...props} />;
};

/**
 * NoPriorityIcon - Proxies to Lucide Circle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/circle
 * @deprecated Use NoPriority instead
 */
export const NoPriorityIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[7];
  return <Circle color={iconColor} size={size} {...props} />;
};
