import { Mail } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * MarkAsRead - Proxies to Lucide Mail
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/mail
 * @usage 4 files
 */
export const MarkAsRead = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <Mail color={iconColor} size={size} {...props} />;
};
