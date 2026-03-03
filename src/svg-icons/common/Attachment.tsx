import { Paperclip, Image, FileText, Mic } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * AttachmentIcon - Proxies to Lucide Paperclip
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/paperclip
 */
export const AttachmentIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Paperclip color={iconColor} size={size} {...props} />;
};

/**
 * ImageAttachmentIcon - Proxies to Lucide Image
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/image
 */
export const ImageAttachmentIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Image color={iconColor} size={size} {...props} />;
};

/**
 * DocumentAttachmentIcon - Proxies to Lucide FileText
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/file-text
 */
export const DocumentAttachmentIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <FileText color={iconColor} size={size} {...props} />;
};

/**
 * AudioIcon - Proxies to Lucide Mic
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/mic
 */
export const AudioIcon = ({ color, size = 14, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Mic color={iconColor} size={size} {...props} />;
};
