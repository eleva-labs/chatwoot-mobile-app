import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * XIcon - Proxies to Lucide Twitter (X is the new Twitter)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/twitter
 */
export const XIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Twitter color={iconColor} size={size} {...props} />;
};

/**
 * XFilledIcon - Proxies to Lucide Twitter (X is the new Twitter)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/twitter
 */
export const XFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Twitter color={iconColor} size={size} {...props} />;
};

/**
 * LinkedinIcon - Proxies to Lucide Linkedin
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/linkedin
 */
export const LinkedinIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Linkedin color={iconColor} size={size} {...props} />;
};

/**
 * GithubIcon - Proxies to Lucide Github
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @lucide https://lucide.dev/icons/github
 */
export const GithubIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Github color={iconColor} size={size} {...props} />;
};
