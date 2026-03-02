import { AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  renderSecondTick?: boolean;
  [key: string]: unknown;
}

/**
 * WarningIcon - Proxies to Lucide AlertTriangle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/alert-triangle
 */
export const WarningIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <AlertTriangle color={iconColor} size={size} {...props} />;
};
