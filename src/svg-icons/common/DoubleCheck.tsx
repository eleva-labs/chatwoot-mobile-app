import { CheckCheck, Clock } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

interface DoubleCheckIconProps extends IconProps {
  renderSecondTick?: boolean;
}

/**
 * DoubleCheckIcon - Proxies to Lucide CheckCheck
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/check-check
 * @note renderSecondTick prop no longer used as Lucide CheckCheck is always double
 */
export const DoubleCheckIcon = ({ color, size = 24, ...props }: DoubleCheckIconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <CheckCheck color={iconColor} size={size} {...props} />;
};

/**
 * MessagePendingIcon - Proxies to Lucide Clock
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/clock
 */
export const MessagePendingIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.amber[9];
  return <Clock color={iconColor} size={size} {...props} />;
};
