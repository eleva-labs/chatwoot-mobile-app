import React from 'react';
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

export const LineFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none" {...props}>
      <G clipPath="url(#line-clip)">
        <Path
          d="M2.778.778a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm4 2.25c2.344 0 4.25 1.528 4.25 3.407 0 .751-.295 1.429-.912 2.096-.892 1.014-2.885 2.249-3.339 2.437-.453.189-.386-.12-.367-.226l.06-.36c.014-.107.03-.273-.013-.38-.048-.116-.236-.177-.375-.206-2.042-.267-3.554-1.677-3.554-3.361 0-1.879 1.907-3.407 4.25-3.407M4.27 5.443a.22.22 0 0 0-.223.22v1.669c0 .122.1.22.223.22h.844a.22.22 0 0 0 .223-.22c0-.121-.1-.22-.223-.22h-.621V5.664c0-.122-.1-.22-.223-.22m1.495 0a.22.22 0 0 0-.223.22v1.669c0 .122.1.22.223.22a.22.22 0 0 0 .223-.22V5.664c0-.122-.1-.22-.223-.22m.766 0a.22.22 0 0 0-.224.22v1.669c0 .122.101.22.224.22a.22.22 0 0 0 .223-.22V6.3l.865 1.164a.225.225 0 0 0 .25.077.22.22 0 0 0 .151-.209V5.664c0-.122-.1-.22-.222-.22a.22.22 0 0 0-.223.22v1.032l-.866-1.164a.23.23 0 0 0-.178-.089m2.011 0a.22.22 0 0 0-.222.221v1.668c0 .122.1.22.222.22h.845a.22.22 0 0 0 .223-.22c0-.121-.1-.22-.223-.22h-.622v-.394h.622a.22.22 0 0 0 .223-.22c0-.122-.1-.22-.223-.22h-.622v-.394h.622a.22.22 0 0 0 .223-.22c0-.121-.1-.22-.223-.22z"
          fill={iconColor}
        />
      </G>
      <Defs>
        <ClipPath id="line-clip">
          <Rect x="0.333" y="0.333" width="13.333" height="13.333" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};
