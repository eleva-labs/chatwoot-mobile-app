import { BarChart3 } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * PriorityIcon - Proxies to Lucide BarChart3
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/bar-chart-3
 */
export const PriorityIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.amber[9];
  return <BarChart3 color={iconColor} size={size} {...props} />;
};
