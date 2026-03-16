import React from 'react';
import { iconRegistry, IconName, IconVariant } from './iconRegistry';
import { useThemeColors } from '@infrastructure/theme';

export interface NamedIconProps {
  /**
   * Icon name in kebab-case (e.g., 'attach-file', 'bot', 'conversation')
   */
  name: IconName;
  /**
   * Icon variant - 'default', 'filled', or 'outline' (if available)
   * @default 'default'
   */
  variant?: IconVariant;
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number;
  /**
   * Icon color - defaults to themed slate-11 if not provided
   */
  color?: string;
  /**
   * Additional props to forward to the icon component
   */
  [key: string]: unknown;
}

/**
 * NamedIcon - String-based icon component with autocomplete support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <NamedIcon name="bot" />
 *
 * // With variant
 * <NamedIcon name="conversation" variant="filled" />
 *
 * // With custom size and color
 * <NamedIcon name="attach-file" size={32} color="#FF0000" />
 * ```
 */
export const NamedIcon: React.FC<NamedIconProps> = ({
  name,
  variant = 'default',
  size = 24,
  color,
  ...props
}) => {
  const { colors } = useThemeColors();
  const entry = iconRegistry[name];

  if (!entry) {
    if (__DEV__) {
      console.warn(`[NamedIcon] Icon "${name}" not found in registry`);
    }
    return null;
  }

  // Get the icon component for the requested variant, fallback to default
  const IconComponent = entry[variant] || entry.default;

  // Use provided color or fallback to themed slate-11
  const iconColor = color || colors.slate[11];

  return <IconComponent color={iconColor} size={size} {...props} />;
};
