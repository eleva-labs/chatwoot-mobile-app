import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@infrastructure/theme';

export interface MarkdownThemeOptions {
  /** Base font size (default: 16) */
  fontSize?: number;
  /** Line height (default: 22) */
  lineHeight?: number;
  /** Letter spacing (default: 0.32) */
  letterSpacing?: number;
  /** Text color override — if not provided, uses slate-12 */
  textColor?: string;
  /** Link color override — if not provided, uses blue-9 */
  linkColor?: string;
  /** Code background color — if not provided, uses slate-3 */
  codeBackground?: string;
  /** Whether to include code block styles (default: false) */
  includeCodeStyles?: boolean;
}

export const useMarkdownTheme = (options: MarkdownThemeOptions = {}) => {
  const { colors, themeVersion } = useTheme();

  const {
    fontSize = 16,
    lineHeight = 22,
    letterSpacing = 0.32,
    textColor = colors.slate[12],
    linkColor = colors.blue[9],
    codeBackground = colors.slate[3],
    includeCodeStyles = false,
  } = options;

  return useMemo(
    () =>
      StyleSheet.create({
        body: {
          fontSize,
          lineHeight,
          letterSpacing,
          color: textColor,
          fontFamily: 'Inter-400-20',
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 0,
          fontFamily: 'Inter-400-20',
        },
        strong: {
          fontFamily: 'Inter-600-20',
          fontWeight: '600',
        },
        em: {
          fontStyle: 'italic',
        },
        link: {
          color: linkColor,
          textDecorationLine: 'underline',
        },
        bullet_list: {
          minWidth: 200,
        },
        ordered_list: {
          minWidth: 200,
        },
        list_item: {
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        },
        bullet_list_icon: {
          marginLeft: 0,
          marginRight: 8,
          fontWeight: '900',
          color: textColor,
        },
        ordered_list_icon: {
          marginLeft: 0,
          marginRight: 8,
          fontWeight: '900',
          color: textColor,
        },
        // Code styles (optional — only needed by AI parts)
        ...(includeCodeStyles && {
          code_inline: {
            backgroundColor: codeBackground,
            borderRadius: 4,
            paddingHorizontal: 4,
            fontFamily: 'monospace',
            fontSize: fontSize - 2,
          },
          code_block: {
            backgroundColor: codeBackground,
            borderRadius: 8,
            padding: 12,
            fontFamily: 'monospace',
            fontSize: fontSize - 2,
          },
          fence: {
            backgroundColor: codeBackground,
            borderRadius: 8,
            padding: 12,
            fontFamily: 'monospace',
            fontSize: fontSize - 2,
          },
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fontSize,
      lineHeight,
      letterSpacing,
      textColor,
      linkColor,
      codeBackground,
      includeCodeStyles,
      themeVersion,
    ],
  );
};
