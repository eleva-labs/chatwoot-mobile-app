import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * AddIcon - Proxies to Lucide Plus
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/plus
 */
export const AddIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Plus color={iconColor} size={size} {...props} />;
};
