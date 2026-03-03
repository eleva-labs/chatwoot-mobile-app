import { CheckCircle2 } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * Checked - Proxies to Lucide CheckCircle2
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/check-circle-2
 */
export const Checked = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <CheckCircle2 color={iconColor} size={size} {...props} />;
};

/**
 * CheckedIcon - Proxies to Lucide CheckCircle2
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/check-circle-2
 * @deprecated Use Checked instead
 */
export const CheckedIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <CheckCircle2 color={iconColor} size={size} {...props} />;
};
