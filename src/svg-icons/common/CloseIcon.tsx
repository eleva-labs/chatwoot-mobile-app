import { X } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * CloseIcon - Proxies to Lucide X icon
 *
 * @migrated 2026-03-01 (Cycle 2 - rollback to proxy pattern)
 * @lucide https://lucide.dev/icons/x
 */
export const CloseIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[12];
  return <X color={iconColor} size={size} {...props} />;
};
