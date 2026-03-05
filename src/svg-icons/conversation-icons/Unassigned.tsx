import { UserX } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * Unassigned - Proxies to Lucide UserX
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user-x
 */
export const Unassigned = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <UserX color={iconColor} size={size} {...props} />;
};

/**
 * UnassignedIcon - Proxies to Lucide UserX
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user-x
 * @deprecated Use Unassigned instead
 */
export const UnassignedIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <UserX color={iconColor} size={size} {...props} />;
};
