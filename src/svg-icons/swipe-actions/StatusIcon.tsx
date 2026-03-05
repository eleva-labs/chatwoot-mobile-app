import { CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * StatusIcon - Proxies to Lucide CheckCircle (checkmark in circle)
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/check-circle
 * @usage 3 files
 */
export const StatusIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <CheckCircle color={iconColor} size={size} {...props} />;
};
