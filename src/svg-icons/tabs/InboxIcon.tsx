import { Inbox } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * InboxIcon - Proxies to Lucide Inbox
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/inbox
 */
export const InboxIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Inbox color={iconColor} size={size} {...props} />;
};

/**
 * InboxIconOutline - Proxies to Lucide Inbox
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/inbox
 * @deprecated Use InboxIcon instead
 */
export const InboxIconOutline = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Inbox color={iconColor} size={size} {...props} />;
};

/**
 * InboxIconFilled - Proxies to Lucide Inbox
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/inbox
 * @note Lucide doesn't have a filled variant, using stroke-only for consistency
 */
export const InboxIconFilled = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Inbox color={iconColor} size={size} {...props} />;
};
