/**
 * Typography Presets
 *
 * Tailwind class presets for consistent typography across the app.
 * These map to the Inter font family with optical sizes and weights.
 *
 * Font naming convention:
 * - inter-normal-20: Inter 400 weight, 20 optical size (body text)
 * - inter-420-20: Inter 420 weight, 20 optical size (slightly heavier body)
 * - inter-medium-24: Inter 500 weight, 24 optical size (headings)
 * - inter-580-24: Inter 580 weight, 24 optical size (strong headings)
 * - inter-semibold-20: Inter 600 weight, 20 optical size (emphasis)
 */

/** Display text — large headings */
export const textDisplay = 'text-2xl font-inter-580-24 leading-7' as const;

/** Heading 1 — page titles */
export const textH1 = 'text-xl font-inter-580-24 leading-7' as const;

/** Heading 2 — section titles */
export const textH2 = 'text-lg font-inter-medium-24 leading-6' as const;

/** Heading 3 — subsection titles */
export const textH3 = 'text-base font-inter-medium-24 leading-5' as const;

/** Body text — standard readable text */
export const textBody = 'text-md font-inter-normal-20 leading-5' as const;

/** Body small — compact readable text */
export const textBodySmall = 'text-sm font-inter-normal-20 leading-5' as const;

/** Caption — small supplementary text */
export const textCaption = 'text-xs font-inter-normal-20 leading-4' as const;

/** Caption extra small */
export const textCaptionXs = 'text-cxs font-inter-normal-20 leading-4' as const;

/** Label — form labels, button text */
export const textLabel = 'text-sm font-inter-medium-24 leading-5' as const;

/** Overline — small uppercase text */
export const textOverline = 'text-xs font-inter-580-24 leading-4 tracking-wider uppercase' as const;

/**
 * All text style presets as a single object for convenient access.
 */
export const textStyles = {
  display: textDisplay,
  h1: textH1,
  h2: textH2,
  h3: textH3,
  body: textBody,
  bodySmall: textBodySmall,
  caption: textCaption,
  captionXs: textCaptionXs,
  label: textLabel,
  overline: textOverline,
} as const;
