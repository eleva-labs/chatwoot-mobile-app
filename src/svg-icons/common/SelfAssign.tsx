import { UserPlus } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * SelfAssign - Proxies to Lucide UserPlus
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/user-plus
 * @usage 3 files
 */
export const SelfAssign = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <UserPlus color={iconColor} size={size} {...props} />;
};
