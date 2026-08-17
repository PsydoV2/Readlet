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

- `ToastProvider` / `useToast()` exposes `showToast(message, type?, duration?)` (`type` is `"success" | "error" | "info"`), rendering an animated overlay via `components/Toast.tsx`. No backend/auth dependency — use it for import errors, "book added", etc.

### Theming (`components/Themed.tsx` + `constants/StyleVariables.ts`)

- `constants/StyleVariables.ts` exports a single object with parallel `light` and `dark` palettes sharing the same keys (`bgDark`, `bg`, `bgLight`, `text`, `textMuted`, `border`, `primary`, `danger`, `success`, etc.) plus shared `borderRadius`/`gap`. Add new colors to both palettes with the same key.
- `components/Themed.tsx` exports `Text`, `View`, `Card`, `ScreenContent`, and the `useThemeColor(props, colorName)` hook — drop-in replacements for RN's `Text`/`View` that resolve colors via `useThemeColor` (per-component `light`/`dark` prop override → palette default) based on `useColorScheme()`. All screens use these instead of manually resolving `Colors[scheme]` — reach for `useThemeColor({}, "key")` when you need a raw color value (e.g. for a `Pressable`'s dynamic style function or an icon's `color` prop) rather than re-deriving the palette by hand. Note `View`/`Card` default their background to the palette (`bgDark`/`bgLight`) — for a purely structural wrapper nested inside a `Card` that shouldn't repaint its background, use plain RN `View` instead.

### Path aliases

`@/*` maps to the project root (not `src/`) — configured in both `tsconfig.json` (`paths`) and `babel.config.js` (`module-resolver`). Both must stay in sync if the alias changes. Example: `import Colors from "@/constants/StyleVariables"`, `import { useToast } from "@/src/context/ToastProvider"`.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `noImplicitOverride` on top of `expo/tsconfig.base`. Code should type-check cleanly under these settings (e.g. array/object index access returns `T | undefined`). No `baseUrl` is set (deprecated as of TypeScript 6.0) — `paths` resolve relative to the tsconfig.json directory automatically.

### app.json / config plugins

Splash screen config lives under the `expo-splash-screen` entry in `plugins` (an array-form plugin with `image`/`resizeMode`/`backgroundColor`), not a top-level `splash` key — that key was removed from the config schema. There is likewise no top-level `newArchEnabled` anymore; the New Architecture is mandatory and always on. Run `npx expo-doctor` after touching `app.json` to catch schema drift like this early.
