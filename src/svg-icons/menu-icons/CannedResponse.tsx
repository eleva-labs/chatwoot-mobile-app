import { MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * CannedResponse - Proxies to Lucide MessageSquare
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/message-square
 */
export const CannedResponse = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageSquare color={iconColor} size={size} {...props} />;
};

/**
 * CannedResponseIcon - Proxies to Lucide MessageSquare
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/message-square
 * @deprecated Use CannedResponse instead
 */
export const CannedResponseIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageSquare color={iconColor} size={size} {...props} />;
};
