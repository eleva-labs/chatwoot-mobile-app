import { Facebook as LucideFacebook } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * FacebookChannelIcon - Proxies to Lucide Facebook
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/facebook
 */
export const FacebookChannelIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <LucideFacebook color={iconColor} size={size} {...props} />;
};
