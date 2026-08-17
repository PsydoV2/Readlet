/**
 * Readlet design system: Notion's neutral, content-first minimalism crossed
 * with Airbnb's confident polish (one confident accent — Notion's own blue
 * — rounded corners, sparing elevation).
 *
 * Backgrounds are pure white / pure black — true neutral gray, zero hue —
 * the same rule Notion and Airbnb both follow: a tinted "off-white" or
 * "near-black" never reads as clean, it reads as dirty. Color is reserved
 * for the accent and status tokens below, never mixed into a background.
 *
 * `light`/`dark` are flat color maps sharing the same keys — add new colors
 * to both. Everything else is a flat, theme-independent token.
 */
const StyleVariables = {
  light: {
    // Background layers, back to front. Flat by design — canvas and surface
    // are both pure white; cards separate from the page via `border` only,
    // not a background shift.
    canvas: "#FFFFFF", // page/screen background — pure white, no tint
    surface: "#f9f9f9", // cards, sheets, anything raised above the canvas
    surfaceHover: "#F2F2F2", // pressed/hover fill, input backgrounds, subtle chips

    // Text, high to low emphasis — true neutral gray, no hue.
    text: "#171717",
    textMuted: "#6B6B6B",
    textSubtle: "#9E9E9E",

    border: "#E5E5E5", // default card/divider border
    borderMuted: "#F0F0F0", // barely-there divider, inactive icons

    overlay: "rgba(0, 0, 0, 0.5)", // modal/sheet scrim

    // Brand accent — Notion blue. The one deliberate spot of color; never
    // used for a background. Primary actions, active states, links.
    primary: "#2383E2",
    primarySoft: "#E3F0FC", // tinted background for badges/active nav using primary
    onPrimary: "#FFFFFF", // text/icon color on top of a solid primary surface

    secondary: "#B8862E", // warm gold — secondary accents, ratings, streaks

    // Status colors are dark/saturated enough in light mode for white text on top.
    success: "#3A8259",
    warning: "#C77C1F",
    danger: "#C23B3B",
    info: "#3D6E9C",
    onSuccess: "#FFFFFF",
    onWarning: "#FFFFFF",
    onDanger: "#FFFFFF",
    onInfo: "#FFFFFF",
  },

  dark: {
    // Pure black, not a "near-black" — also the right call for an e-reader:
    // true black costs zero power per pixel on OLED screens.
    canvas: "#000000",
    surface: "#0d0d0d",
    surfaceHover: "#1A1A1A",

    text: "#EDEDED",
    textMuted: "#A3A3A3",
    textSubtle: "#737373",

    border: "#2E2E2E",
    borderMuted: "#1F1F1F",

    overlay: "rgba(0, 0, 0, 0.7)",

    primary: "#5B9FE3", // lighter, brighter blue so it pops on the black canvas
    primarySoft: "#1B2C40",
    onPrimary: "#0E2035", // near-black text/icons on the lighter primary

    secondary: "#D9A94E",

    // Status colors are lightened to pop on the black canvas, so — like
    // `onPrimary` — their "on" text/icon color flips to dark ink.
    success: "#5FAE81",
    warning: "#E0A23D",
    danger: "#E2685D",
    info: "#6FA0C9",
    onSuccess: "#12281B",
    onWarning: "#2B1B05",
    onDanger: "#2B0E0A",
    onInfo: "#0F2333",
  },

  // Border radius
  brSm: 8, // chips, inputs
  brMd: 12, // cards, buttons
  brLg: 20, // sheets, hero surfaces
  brXl: 28, // large hero cards
  brRound: 999, // pills, avatars, circular icon buttons

  // Spacing
  gapXSmall: 4,
  gapSmall: 8,
  gapMedium: 12,
  gapLarge: 16,
  gapXLarge: 24,
  gapXXLarge: 32,
  gapXXXLarge: 48,

  // Font sizes
  fontSizeXSmall: 12,
  fontSizeSmall: 13,
  fontSizeMedium: 16,
  fontSizeLarge: 18,
  fontSizeXLarge: 22,
  fontSizeXXLarge: 28,
  fontSizeXXXLarge: 34,

  // Font weights
  fontWeightRegular: "400",
  fontWeightMedium: "500",
  fontWeightSemibold: "600",
  fontWeightBold: "700",

  // Line heights (absolute, paired to the font size tiers above)
  lineHeightXSmall: 16,
  lineHeightSmall: 18,
  lineHeightMedium: 22,
  lineHeightLarge: 24,
  lineHeightXLarge: 30,
  lineHeightXXLarge: 36,
  lineHeightXXXLarge: 42,

  // Elevation (iOS shadow* + Android `elevation`). Used sparingly — in the
  // Notion spirit, prefer a `border` over a shadow; reach for these on
  // genuinely floating surfaces (sheets, modals, floating action buttons).
  shadowSm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  shadowLg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export default StyleVariables;
