import { AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * SlaMissed - Proxies to Lucide AlertTriangle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/alert-triangle
 */
export const SlaMissed = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <AlertTriangle color={iconColor} size={size} {...props} />;
};

/**
 * SlaMissedIcon - Proxies to Lucide AlertTriangle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/alert-triangle
 * @deprecated Use SlaMissed instead
 */
export const SlaMissedIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <AlertTriangle color={iconColor} size={size} {...props} />;
};
