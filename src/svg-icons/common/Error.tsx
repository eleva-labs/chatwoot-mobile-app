import { AlertOctagon } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ErrorIcon - Proxies to Lucide AlertOctagon
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/alert-octagon
 * @note Original was octagonal error icon, matches semantic meaning
 */
export const ErrorIcon = ({ color, size = 80, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <AlertOctagon color={iconColor} size={size} {...props} />;
};
