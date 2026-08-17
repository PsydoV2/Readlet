# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Readlet** — a clean, modern e-reader app for iOS/Android. Design inspiration: Notion's minimalism + AirBnB's visual polish. Core principles:

- No account required, no internet needed, no ads
- Local-first: all books stored on device
- Supports EPUB and PDF import
- Reading experience that feels like 2025, not 2010

### Product vision

Users import their own ebooks (EPUB/PDF) via the native file picker or share sheet. The app presents a beautiful library view and a distraction-free reading space. No subscriptions, no tracking, no cruft.

### Planned screens / flows

1. **Library** (`app/(tabs)/index.tsx`) — grid/list of imported books with cover art, title, author, reading progress
2. **Import** — file picker (DocumentPicker) for EPUB/PDF; metadata extraction on import
3. **Reader** — EPUB rendered via `react-native-epub-view` or similar; PDF via `react-native-pdf`; reader settings (font size, font family, theme, line height, margins)
4. **Book detail** — cover, metadata, reading stats, delete option

### Key libraries (to evaluate/add)

- `expo-document-picker` — file import
- `expo-file-system` — local storage of book files
- `react-native-epub-view` / `epubjs` — EPUB rendering
- `react-native-pdf` — PDF rendering
- `@op-engineering/op-sqlite` or `expo-sqlite` — local DB for library metadata + reading positions

### No-auth stance

Auth/session infrastructure from the starter template has been removed — this app is fully local, no backend. `app/AuthScreen.tsx`, `src/context/AuthContext.tsx`, `src/context/UserProvider.tsx`, `src/hooks/useAPI.ts`, `src/hooks/useStorageState.ts`, `src/types/DTOUser.ts`, and `constants/APIRoutes.ts` are gone. `@react-native-async-storage/async-storage` and the `@react-navigation/*` packages were uninstalled with them (expo-router's own `Tabs`/`Stack`/`ThemeProvider` no longer need the raw react-navigation packages as direct dependencies). Web platform support was also dropped (no `react-dom`/`react-native-web`, no `app/+html.tsx`, no `web` script) — this app targets iOS/Android only.

## Commands

```bash
npm install          # install dependencies
npx expo start        # start dev server (press i/a for iOS/Android)
npm run android        # expo start --android
npm run ios            # expo start --ios
npm test               # jest --watchAll (jest-expo preset)
```

```bash
npm run lint          # expo lint (eslint-config-expo)
npx tsc --noEmit       # typecheck (no dedicated script)
```

## Architecture

### Routing (expo-router)

- `app/_layout.tsx` is the root layout. It loads fonts (currently just the FontAwesome icon font used by the tab bar), sets the system UI background per color scheme, hides the splash screen, and wraps everything in providers: `SafeAreaProvider > ToastProvider > ThemeProvider > Slot`. As of expo-router 56+, `ThemeProvider`/`DarkTheme`/`DefaultTheme` must be imported from `expo-router` itself, not `@react-navigation/native` — expo-router is no longer compatible with the raw react-navigation package (Metro will fail the bundle otherwise, with `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1` as an escape hatch).
- There is no auth gate and no `unstable_settings.initialRouteName` — the app boots straight into `app/(tabs)/index.tsx` (the Library screen) via normal expo-router file-based routing.
- `app/(tabs)/` is the bottom-tab area (`_layout.tsx` configures the tab bar, currently a single "Library" tab). Add the Import/Reader/Book-detail flows described above as sibling routes under `app/` (or nested groups) as they're built.

### Toasts (`src/context/ToastProvider.tsx`)

- `ToastProvider` / `useToast()` exposes `showToast(message, type?, duration?)` (`type` is `"success" | "error" | "info"`), rendering an animated overlay via `src/components/Toast.tsx`. No backend/auth dependency — use it for import errors, "book added", etc.

### Design system (`src/components/Themed.tsx` + `src/constants/StyleVariables.ts`)

- `src/constants/StyleVariables.ts` is the whole design system: Notion-style neutral minimalism (warm off-white/ink canvas, borders over shadows) crossed with Airbnb-style polish (one confident warm terracotta accent, generous rounded corners, sparing soft elevation).
  - `light`/`dark` are flat color maps sharing the same keys: background layers `canvas` → `surface` → `surfaceHover`; text `text`/`textMuted`/`textSubtle`; `border`/`borderMuted`; `overlay` (scrim); `primary`/`primarySoft`/`onPrimary`; `secondary`; status colors `success`/`warning`/`danger`/`info` each with a matching `onSuccess`/`onWarning`/`onDanger`/`onInfo` text color (status colors are lightened in dark mode to pop on the dark canvas, so their `on*` flips to dark ink there — same reasoning as `onPrimary`). Add new colors to both palettes with the same key.
  - Everything else is a flat, theme-independent token living as a sibling of `light`/`dark` on the same default export (not nested under a `spacing`/`radius`/etc. sub-object) — prefixed by kind: `br*` (`brSm`/`brMd`/`brLg`/`brXl`/`brRound`) for border radius, `gap*` (`gapXSmall`…`gapXXXLarge`) for spacing, `fontSize*`/`fontWeight*`/`lineHeight*` (`lineHeight*` is absolute px, matching RN's `lineHeight` style prop — not a unitless multiplier) for type, and `shadow*` (`shadowSm`/`shadowMd`/`shadowLg`, iOS shadow* + Android `elevation`) for elevation. Use these instead of hardcoding numbers in a component's `StyleSheet.create`.
- `src/components/Themed.tsx` exports `Text`, `View`, `Card`, `ScreenContent`, and the `useThemeColor(props, colorName)` hook — drop-in replacements for RN's `Text`/`View` that resolve colors via `useThemeColor` (per-component `light`/`dark` prop override → palette default) based on `useColorScheme()`. All screens use these instead of manually resolving `Colors[scheme]` — reach for `useThemeColor({}, "key")` when you need a raw color value (e.g. for a `Pressable`'s dynamic style function or an icon's `color` prop) rather than re-deriving the palette by hand. Note `View`/`Card` default their background to the palette (`canvas`/`surface`) — for a purely structural wrapper nested inside a `Card` that shouldn't repaint its background, use plain RN `View` instead.

### Path aliases

`@/*` maps to the project root — configured in both `tsconfig.json` (`paths`) and `babel.config.js` (`module-resolver`). Both must stay in sync if the alias changes. `components/` and `constants/` live under `src/` (there is no root-level `components/`/`constants/` anymore), so imports go through `@/src/...`. Example: `import Colors from "@/src/constants/StyleVariables"`, `import { useToast } from "@/src/context/ToastProvider"`.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `noImplicitOverride` on top of `expo/tsconfig.base`. Code should type-check cleanly under these settings (e.g. array/object index access returns `T | undefined`). No `baseUrl` is set (deprecated as of TypeScript 6.0) — `paths` resolve relative to the tsconfig.json directory automatically.

### app.json / config plugins

Splash screen config lives under the `expo-splash-screen` entry in `plugins` (an array-form plugin with `image`/`resizeMode`/`backgroundColor`, plus a `dark: { backgroundColor }` override), not a top-level `splash` key — that key was removed from the config schema. There is likewise no top-level `newArchEnabled` anymore; the New Architecture is mandatory and always on. Run `npx expo-doctor` after touching `app.json` to catch schema drift like this early.

`app.json` is static JSON, so it can't import `src/constants/StyleVariables.ts` — the splash `backgroundColor`/`dark.backgroundColor` and `android.adaptiveIcon.backgroundColor` are the palette's `light.canvas`/`dark.canvas` hex values copied by hand. If the canvas colors change, update them here too.
