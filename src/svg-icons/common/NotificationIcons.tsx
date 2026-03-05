import { Moon, AtSign, MessageCircle, UserCircle, Flame } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * NotificationSnoozedIcon - Proxies to Lucide Moon
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/moon
 */
export const NotificationSnoozedIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Moon color={iconColor} size={size} {...props} />;
};

/**
 * NotificationMentionIcon - Proxies to Lucide AtSign
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/at-sign
 */
export const NotificationMentionIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <AtSign color={iconColor} size={size} {...props} />;
};

/**
 * NotificationNewMessageIcon - Proxies to Lucide MessageCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/message-circle
 */
export const NotificationNewMessageIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MessageCircle color={iconColor} size={size} {...props} />;
};

/**
 * NotificationAssignedIcon - Proxies to Lucide UserCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/user-circle
 */
export const NotificationAssignedIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <UserCircle color={iconColor} size={size} {...props} />;
};

/**
 * NotificationSLAIcon - Proxies to Lucide Flame
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/flame
 */
export const NotificationSLAIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <Flame color={iconColor} size={size} {...props} />;
};
