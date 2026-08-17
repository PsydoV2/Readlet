# Readlet Design System

Reference for anything visual that belongs to Readlet — the app itself and
any surface next to it (`../ReadletWeb`, Datenschutz/Impressum, future
marketing pages). If you're an agent working on one of those, read this
first instead of guessing colors/spacing/type from scratch.

**Source of truth**: every value below is copied from
[`src/constants/StyleVariables.ts`](src/constants/StyleVariables.ts) — if
that file changes, this doc is stale and should be updated to match, not
the other way around. A rendered, visual version of this guide (live
swatches, component specimens, both themes) is published at
<https://claude.ai/code/artifact/ccbca40f-5c4d-4566-9136-f2d49f5a61bb> —
useful for a human glancing at it, but this file is the one meant for
another agent's context window.

## Principles

- **No account, no tracking, no ads.** Nothing in the UI should look like
  a sign-up prompt or an ad slot.
- **Local-first.** Books stay on the device — the UI is allowed to make
  that feel deliberate rather than hide it.
- **Color is an accent, not a fill.** The brand blue lives in text, icons,
  checkmarks, and thin progress indicators — almost never as the
  background of a shape. See "The one/two exceptions" below.
- **Border over shadow.** Cards separate from the background via a 1px
  border, not a drop shadow. Shadows are reserved for things that
  genuinely float (sheets, toasts).
- Backgrounds are true neutral gray — pure white / pure black, zero hue.
  A tinted "off-white"/"near-black" reads as dirty, not clean.

## Color

Every color exists as a `light`/`dark` pair sharing the same key. Use CSS
custom properties named after the keys below (`--canvas`, `--primary`,
…) and switch them via `prefers-color-scheme` — see "Web usage" below for
the full pattern.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FFFFFF` | `#000000` | Page/screen background |
| `surface` | `#f9f9f9` | `#0d0d0d` | Cards, sheets |
| `surfaceHover` | `#F2F2F2` | `#1A1A1A` | Pressed/hover fill, inputs, chips |
| `text` | `#171717` | `#EDEDED` | Primary text |
| `textMuted` | `#6B6B6B` | `#A3A3A3` | Secondary text |
| `textSubtle` | `#9E9E9E` | `#737373` | Tertiary text, inactive icons |
| `border` | `#E5E5E5` | `#2E2E2E` | Default card/divider border |
| `borderMuted` | `#F0F0F0` | `#1F1F1F` | Barely-there divider |
| `overlay` | `rgba(0,0,0,.5)` | `rgba(0,0,0,.7)` | Modal/sheet scrim |
| `primary` | `#2383E2` | `#5B9FE3` | Brand accent (Notion blue) |
| `primarySoft` | `#E3F0FC` | `#1B2C40` | Tinted bg for badges/active icons |
| `onPrimary` | `#FFFFFF` | `#0E2035` | Text/icon on a solid `primary` fill |
| `secondary` | `#B8862E` | `#D9A94E` | Warm gold — rare secondary accents |
| `success` / `onSuccess` | `#3A8259` / `#FFFFFF` | `#5FAE81` / `#12281B` | |
| `warning` / `onWarning` | `#C77C1F` / `#FFFFFF` | `#E0A23D` / `#2B1B05` | |
| `danger` / `onDanger` | `#C23B3B` / `#FFFFFF` | `#E2685D` / `#2B0E0A` | |
| `info` / `onInfo` | `#3D6E9C` / `#FFFFFF` | `#6FA0C9` / `#0F2333` | |

**The two exceptions to "color is never a fill":**
1. **Status colors** (`success`/`warning`/`danger`/`info`) *can* be a full
   solid fill — toasts, badges. They're short-lived and meaning-bearing.
2. **`primary` as a thin indicator** — a progress bar fill, a filled PIN
   dot, a small chip background (`primarySoft` + `primary` text). Never a
   button or card background.

**Cover-placeholder palette** (`src/utils/accentColor.ts`) — eight muted
tones for books without a real cover, hashed from the book id so the same
book always gets the same color: `#3D5A5C` `#5C4A6E` `#7A3B2E` `#4A5A38`
`#2E4A5C` `#8A5A2E` `#5C3D5A` `#3A5C4A`.

## Typography

No custom font is loaded — the app renders in the platform system font
(SF Pro on iOS, Roboto on Android). Web surfaces should match: same
stack, no webfont download, no flash of unstyled text.

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Helvetica, Arial, sans-serif;
/* for token names / tabular data in docs, not used in the app itself: */
font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
```

Type scale (`fontSize*` / `lineHeight*`, px):

| Token | Size / line-height | Weight | Typical use |
|---|---|---|---|
| `xxxLarge` | 34 / 42 | 700 | Page title (e.g. "Bibliothek") |
| `xxLarge` | 28 / 36 | 700 | Section title |
| `xLarge` | 22 / 30 | 600 | Prominent heading |
| `large` | 18 / 24 | 600 | Modal/card title |
| `medium` | 16 / 22 | 400 | Body text |
| `small` | 13 / 18 | 400 | Secondary/caption text |
| `xSmall` | 12 / 16 | 600 | Uppercase eyebrow labels (`letter-spacing: 0.4px`) |

Weights: `400` regular, `500` medium, `600` semibold, `700` bold.

## Spacing & radius

Spacing (`gap*`, px): `xSmall 4` · `Small 8` · `Medium 12` · `Large 16` ·
`xLarge 24` · `xxLarge 32` · `xxxLarge 48`.

Radius (`br*`, px): `Sm 8` (chips, inputs) · `Md 12` (cards, buttons) ·
`Lg 20` (sheets, hero surfaces) · `Xl 28` (large hero cards) ·
`Round 999` (pills, avatars, circular icon buttons).

## Elevation

Used sparingly — prefer a border. Reserved for things that actually
float (sheets, modals, toasts). Shadow color is `#000000` in both
themes (barely visible on the dark canvas, which is intentional — dark
mode leans on borders instead).

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,.06);
--shadow-md: 0 4px 10px rgba(0,0,0,.08);
--shadow-lg: 0 12px 24px rgba(0,0,0,.12);
```

## Component patterns

- **Icon button** — 36×36, `brRound`, `surfaceHover` fill, icon in
  `text`. The only button shape in the product; there is deliberately no
  solid-color CTA button anymore (see `git log` — the last one, on the
  Import screen, was removed in favor of making the dashed dropzone
  itself the tap target).
- **Card** — `surface` background, 1px `border`, `brMd` radius,
  `gapLarge` padding.
- **List rows** — one `Card`, multiple rows separated by a hairline
  `borderMuted` divider. State shown via checkmark / `Switch` / chevron,
  never via a row background color.
- **Dashed dropzone** — dashed `border`, `brLg` radius, `primarySoft`
  icon circle. The whole area is the tap target, no separate button
  underneath (`app/(auth)/import.tsx`).
- **Toast / status badge** — solid `success`/`warning`/`danger`/`info`
  fill + matching `onX` text, `shadowMd` (it's actually floating above
  content).
- **Progress bar / PIN dots** — thin `border-muted` track with a
  `primary` fill, or small circles filled `primary` when active.

## Icons

Line icons only (FontAwesome in the app), ~1.5–2px stroke weight, sized
13–26px. Never a filled/solid icon style except tiny status dots.

## Voice & tone

German first (`de` is `i18next`'s `fallbackLng`), English kept at parity.
Plain and concrete, no marketing language, errors state the actual cause.

> `import.dropSubtitle`: "Das Buch bleibt lokal auf deinem Gerät — kein
> Upload, kein Account nötig." / "The book stays on your device — no
> upload, no account needed."

Do: name the action ("PIN-Sperre aktiviert"), explain failures concretely
("Diese Datei ist kopiergeschützt (DRM) …").
Don't: marketing tone ("Jetzt upgraden"), emoji as UI structure, vague
errors ("Ein Fehler ist aufgetreten").

## Web usage (`ReadletWeb`, Datenschutz/Impressum, …)

**Carry over:** the CSS variables above verbatim, including dark mode via
`prefers-color-scheme`; the system font stack (no webfont); a reading
content width of ~600–720px (matches `ScreenContent`'s `maxWidth: 600` on
web); border-over-shadow for cards; `primary` only for links, active
states, and thin indicators.

**Avoid:** gradients, large flat color fills, "rounded-lg everywhere," a
second brand blue next to `primary`, a tinted off-white/near-black canvas.

**No logo yet** — `assets/images/icon.png` is still the unmodified Expo
template placeholder, not a designed mark. Until a real one exists, a
typographic wordmark ("Readlet" + an accent-colored period) carries the
brand — don't fabricate a logo in the meantime.
