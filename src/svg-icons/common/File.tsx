import { FileText, FileX } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * FileIcon - Proxies to Lucide FileText
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/file-text
 * @usage 4 files
 */
export const FileIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <FileText color={iconColor} size={size} {...props} />;
};

/**
 * FileErrorIcon - Proxies to Lucide FileX (file with X mark for errors)
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/file-x
 * @usage 1 file
 */
export const FileErrorIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <FileX color={iconColor} size={size} {...props} />;
};
