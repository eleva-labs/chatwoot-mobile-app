import { MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ConversationIcon - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/message-circle
 */
export const ConversationIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};

/**
 * ConversationIconOutline - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/message-circle
 * @deprecated Use ConversationIcon instead
 */
export const ConversationIconOutline = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};

/**
 * ConversationIconFilled - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/message-circle
 * @note Lucide doesn't have a filled variant, using regular
 */
export const ConversationIconFilled = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageCircle color={iconColor} size={size} fill={iconColor} {...props} />;
};
