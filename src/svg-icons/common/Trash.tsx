import { Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * Trash - Proxies to Lucide Trash2 icon
 *
 * @migrated 2026-03-01 (Cycle 2 - rollback to proxy pattern)
 * @lucide https://lucide.dev/icons/trash-2
 */
export const Trash = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9]; // Red for destructive action
  return <Trash2 color={iconColor} size={size} {...props} />;
};
