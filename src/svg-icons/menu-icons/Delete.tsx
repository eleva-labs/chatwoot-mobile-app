import { Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * Delete - Proxies to Lucide Trash2
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/trash-2
 */
export const Delete = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <Trash2 color={iconColor} size={size} {...props} />;
};

/**
 * DeleteIcon - Proxies to Lucide Trash2
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/trash-2
 * @deprecated Use Delete instead
 */
export const DeleteIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <Trash2 color={iconColor} size={size} {...props} />;
};
