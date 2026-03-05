/**
 * Avatar Color System
 *
 * Name-based avatar color pairs matching web Avatar.vue.
 * Used when rendering initials-based avatars without a profile image.
 *
 * Each pair has a background and text color for both light and dark modes.
 * The color is deterministic — same name always produces the same color.
 *
 * @see chatwoot/app/javascript/dashboard/components-next/avatar/Avatar.vue
 */

export interface AvatarColorPair {
  /** Background hex color */
  bg: string;
  /** Text/initials hex color */
  text: string;
}

/**
 * 6 color pairs for light and dark modes.
 * Matched exactly to the web Avatar.vue AVATAR_COLORS constant.
 */
export const AVATAR_COLORS = {
  light: [
    { bg: '#FBDCEF', text: '#C2298A' }, // pink
    { bg: '#FFE0BB', text: '#99543A' }, // orange
    { bg: '#E8E8E8', text: '#60646C' }, // gray
    { bg: '#CCF3EA', text: '#008573' }, // teal
    { bg: '#EBEBFE', text: '#4747C2' }, // violet
    { bg: '#E1E9FF', text: '#3A5BC7' }, // blue
  ] as const satisfies readonly AvatarColorPair[],

  dark: [
    { bg: '#4B143D', text: '#FF8DCC' }, // pink
    { bg: '#3F220D', text: '#FFA366' }, // orange
    { bg: '#2A2A2A', text: '#ADB1B8' }, // gray
    { bg: '#023B37', text: '#0BD8B6' }, // teal
    { bg: '#27264D', text: '#A19EFF' }, // violet
    { bg: '#1D2E62', text: '#9EB1FF' }, // blue
  ] as const satisfies readonly AvatarColorPair[],

  /** Fallback when no name is provided */
  default: { bg: '#E8E8E8', text: '#60646C' } as const satisfies AvatarColorPair,
} as const;

/**
 * Get avatar colors for a given name.
 * Uses `name.length % 6` to deterministically select a color pair,
 * matching the web algorithm exactly.
 */
export function getAvatarColorsByName(name: string | undefined, isDark: boolean): AvatarColorPair {
  if (!name) return AVATAR_COLORS.default;
  const palette = isDark ? AVATAR_COLORS.dark : AVATAR_COLORS.light;
  return palette[name.length % palette.length];
}

/**
 * Get initials from a name string.
 * Strips emoji, takes first letter of first 1-2 words.
 * Matches web Avatar.vue initials logic.
 */
export function getAvatarInitials(name: string): string {
  const cleaned = name
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ');
  return words.length === 1
    ? cleaned.charAt(0).toUpperCase()
    : `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}
