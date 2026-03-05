import { User as LucideUser } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * User - Proxies to Lucide User
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user
 */
export const User = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideUser color={iconColor} size={size} {...props} />;
};

/**
 * UserIcon - Proxies to Lucide User
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/user
 * @deprecated Use User instead
 */
export const UserIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideUser color={iconColor} size={size} {...props} />;
};
