import { UserCheck } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * Assign - Proxies to Lucide UserCheck
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user-check
 */
export const Assign = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <UserCheck color={iconColor} size={size} {...props} />;
};

/**
 * AssignIcon - Proxies to Lucide UserCheck
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user-check
 * @deprecated Use Assign instead
 */
export const AssignIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <UserCheck color={iconColor} size={size} {...props} />;
};
