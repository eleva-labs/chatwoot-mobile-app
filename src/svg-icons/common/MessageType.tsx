import { Lock, CornerUpLeft } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * PrivateNoteIcon - Proxies to Lucide Lock
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/lock
 */
export const PrivateNoteIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Lock color={iconColor} size={size} {...props} />;
};

/**
 * OutgoingIcon - Proxies to Lucide CornerUpLeft
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/corner-up-left
 */
export const OutgoingIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <CornerUpLeft color={iconColor} size={size} {...props} />;
};
