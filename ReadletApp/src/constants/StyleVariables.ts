/**
 * Readlet design system: Notion's neutral, content-first minimalism (warm
 * off-white/ink canvas, borders over shadows) crossed with Airbnb's
 * confident polish (one warm accent, rounded corners, sparing elevation).
 *
 * `light`/`dark` are flat color maps sharing the same keys — add new colors
 * to both. Everything else is a flat, theme-independent token.
 */
const StyleVariables = {
  light: {
    // Background layers, back to front.
    canvas: "#FAF9F7", // page/screen background — warm off-white, not clinical white
    surface: "#FFFFFF", // cards, sheets, anything raised above the canvas
    surfaceHover: "#F1EFEC", // pressed/hover fill, input backgrounds, subtle chips

    // Text, high to low emphasis.
    text: "#1C1B1A", // primary text — warm ink, not pure black
    textMuted: "#6F6B66", // secondary text, labels
    textSubtle: "#A29D97", // placeholders, disabled, tertiary hints

    border: "#E7E4E0", // default card/divider border
    borderMuted: "#F0EEEB", // barely-there divider, inactive icons

    overlay: "rgba(28, 22, 18, 0.5)", // modal/sheet scrim

    // Brand accent — warm terracotta. Primary actions, active states, links.
    primary: "#BF5B2E",
    primarySoft: "#FBE7DC", // tinted background for badges/active nav using primary
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
    canvas: "#181614", // warm near-black — not pure #000, easier for night reading
    surface: "#211E1B",
    surfaceHover: "#2A2622",

    text: "#F5F1EC", // warm off-white, not pure white
    textMuted: "#A79E93",
    textSubtle: "#736A60",

    border: "#332E29",
    borderMuted: "#241F1A",

    overlay: "rgba(0, 0, 0, 0.6)",

    primary: "#E08650", // lighter terracotta so it pops on the dark canvas
    primarySoft: "#3A2A20",
    onPrimary: "#1C1108", // near-black text/icons on the lighter primary

    secondary: "#D9A94E",

    // Status colors are lightened to pop on the dark canvas, so — like
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
