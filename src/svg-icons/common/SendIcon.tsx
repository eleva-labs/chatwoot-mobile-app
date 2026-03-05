import { Send } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * SendIcon - Proxies to Lucide Send
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/send
 * @usage 3 files
 */
export const SendIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { semanticColors } = useThemeColors();
  const iconColor = color || semanticColors.textInverse;
  return <Send color={iconColor} size={size} {...props} />;
};
