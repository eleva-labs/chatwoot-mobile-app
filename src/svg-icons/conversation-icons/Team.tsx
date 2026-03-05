import { Users } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * Team - Proxies to Lucide Users
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/users
 */
export const Team = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Users color={iconColor} size={size} {...props} />;
};

/**
 * TeamIcon - Proxies to Lucide Users
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/users
 * @deprecated Use Team instead
 */
export const TeamIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Users color={iconColor} size={size} {...props} />;
};
