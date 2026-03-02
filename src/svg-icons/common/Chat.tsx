import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ChatIcon - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/message-circle
 */
export const ChatIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};
