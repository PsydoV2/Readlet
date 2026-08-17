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

1. **Library** (`app/(auth)/index.tsx`) — grid of imported books with cover art, title, author, reading progress
2. **Import** (`app/(auth)/import.tsx`) — file picker (DocumentPicker) for EPUB/PDF; metadata extraction on import
3. **Reader** (`app/(auth)/reader/[id].tsx`) — EPUB rendered via `react-native-epub-view` or similar; PDF via `react-native-pdf`; reader settings (font size, font family, theme, line height, margins)
4. **Book detail** (`app/(auth)/book/[id].tsx`) — cover, metadata, reading stats, delete option

A frontend prototype of all four exists already, wired together with mock data (`src/data/mockBooks.ts`, `src/data/mockChapterText.ts`) and no real import/parsing logic yet — see the Routing section below for how the screens connect. There's also a **Settings** modal (`app/(auth)/settings.tsx`, opened from the gear icon in the Library header) covering theme, language, app lock, and legal links — see the Theming, App lock, and Routing sections below.

### Key libraries (to evaluate/add)

- `expo-document-picker` — file import
- `expo-file-system` — local storage of book files
- `react-native-epub-view` / `epubjs` — EPUB rendering
- `react-native-pdf` — PDF rendering
- `@op-engineering/op-sqlite` or `expo-sqlite` — local DB for library metadata + reading positions

Already added (not just planned): `expo-secure-store` and `expo-local-authentication`, for the app-lock feature — see the App lock section below.

### No-auth stance

Auth/session infrastructure from the starter template has been removed — this app is fully local, no backend. `app/AuthScreen.tsx`, `src/context/AuthContext.tsx`, `src/context/UserProvider.tsx`, `src/hooks/useAPI.ts`, `src/hooks/useStorageState.ts`, `src/types/DTOUser.ts`, and `constants/APIRoutes.ts` are gone. `@react-native-async-storage/async-storage` and the `@react-navigation/*` packages were uninstalled with them (expo-router's own `Tabs`/`Stack`/`ThemeProvider` no longer need the raw react-navigation packages as direct dependencies). Web platform support was also dropped (no `react-dom`/`react-native-web`, no `app/+html.tsx`, no `web` script) — this app targets iOS/Android only.

This doesn't contradict the app-lock feature below: `app/(auth)/` and `app/lock.tsx` reuse expo-router's *authentication-rewrites* pattern name/shape purely for its redirect mechanics (a local device PIN gate, still no account/session/backend), not a resurrection of the removed account auth — hence "app lock"/`AppLockProvider` terminology everywhere instead of "auth".

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

- `app/_layout.tsx` is the root layout. `RootLayout` just nests providers: `SafeAreaProvider > ThemePreferenceProvider > AppLockProvider > ToastProvider > ThemedApp`. `ThemedApp` (a child, so it can read both providers' context) loads fonts, waits on both font-loading and `AppLockProvider`'s `isHydrated` before hiding the splash screen and painting anything — see App lock section below for why — then renders a bare `<Slot />`: it no longer decides lock-vs-app itself, that's `(auth)/_layout.tsx`'s job (see below). As of expo-router 56+, `ThemeProvider`/`DarkTheme`/`DefaultTheme` must be imported from `expo-router` itself, not `@react-navigation/native` — expo-router is no longer compatible with the raw react-navigation package (Metro will fail the bundle otherwise, with `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1` as an escape hatch).
- **Auth-style route group for the lock gate**: everything that requires the app to be unlocked lives under `app/(auth)/` (Library, Book detail, Reader, Import, Settings) — mirroring [Expo Router's documented authentication-rewrites pattern](https://docs.expo.dev/router/advanced/authentication-rewrites/). `app/(auth)/_layout.tsx` reads `AppLockProvider`'s `isLocked` and renders `<Redirect href="/lock" />` instead of its `<Stack>` whenever it's true — so the redirect re-evaluates and fires from *any* screen inside the group the instant the app (re-)locks, not just at initial navigation. `app/lock.tsx` (the actual PIN/biometric screen) lives **outside** the group for exactly that reason — it has to stay reachable while locked — and itself redirects to `/` once `unlock()` flips `isLocked` false. `(auth)` is a pathless group, so none of this changes any URL: `/`, `/book/[id]`, `/import`, `/settings`, etc. are the same paths as if the group didn't exist.
- There is no `unstable_settings.initialRouteName` — the app boots straight into `app/(auth)/index.tsx` (the Library screen) via normal expo-router file-based routing, unless app-lock is enabled, in which case the `(auth)` redirect sends it to `/lock` first.
- **No default expo-router chrome**: `(auth)/_layout.tsx`'s `Stack` sets `screenOptions={{ headerShown: false }}`, and there is no tab bar (no `(tabs)` group) — a single-tab bottom bar added nothing and the native header/page-title look didn't fit the Notion/Airbnb-minimal design goal. Every screen draws its own chrome instead via `src/components/ScreenHeader.tsx` (back chevron or close "×", centered title) or, in the reader, a custom tap-to-toggle top/bottom bar. When adding a new screen under `app/`, follow this pattern rather than relying on a Stack's native header.
- `app/(auth)/import.tsx` and `app/(auth)/settings.tsx` are registered with `presentation: "modal"` via explicit `<Stack.Screen name="..." options={{ presentation: "modal" }} />` entries inside `(auth)/_layout.tsx`'s `<Stack>` — other routes in the group are still auto-discovered from the file tree; you don't need to list every screen, only the ones that need non-default options.
- **Settings and its PIN flow are flat files, not a nested directory** (`app/(auth)/settings.tsx` + `app/(auth)/settings-pin.tsx`, not `settings/index.tsx` + `settings/pin.tsx`) — a directory+`index.tsx` route was tried first and broke navigation ("route not found" opening Settings), because expo-router's typed routes (`.expo/types/router.d.ts`) only ever generate the fully-qualified `"/settings/index"` as a valid `Href` for that shape, and pushing that string doesn't actually resolve at runtime — adding a `_layout.tsx` to the directory didn't change the generated Href either. Flat sibling files sidestep the ambiguity entirely and are what's proven to work (also how `import.tsx`/`+not-found.tsx` are structured). Prefer flat files over a directory+`index.tsx` for any new route unless there's a strong reason.
- Route structure: `app/(auth)/index.tsx` (Library) → `app/(auth)/book/[id].tsx` (Book detail, pushed) → `app/(auth)/reader/[id].tsx` (Reader, pushed); `app/(auth)/import.tsx` (modal, opened from the "+" icon in the Library header); `app/(auth)/settings.tsx` (modal, opened from the gear icon next to it) → `app/(auth)/settings-pin.tsx` (pushed, `?mode=enable|change|disable`). There is deliberately no floating action button — a solid-color circle clashed with the design system's rule that color lives only in accents, never a background/shape fill — so both Library actions are plain icon buttons in the pinned header (`headerIconButton` style, `surfaceHover` fill + `text`-colored icon, same idiom as `ScreenHeader`'s back/close buttons). Datenschutz/Impressum are **not** in-app routes — they're external links opened via `Linking.openURL` (see Theming section below) — so there's no `app/legal/` group; don't reintroduce in-app legal screens without being asked. Library/Book-detail/Reader/Import currently run on mock data from `src/data/mockBooks.ts` / `src/data/mockChapterText.ts` — swap for real import/parsing per the roadmap in README.md without needing to touch the navigation shape.
- Every back/close button uses `goBack(router, fallbackHref)` from `src/utils/goBack.ts` instead of calling `router.back()` directly. A screen can end up with no navigation history to pop — opened via a deep link, or after a dev-server reload resets the stack to just that screen — and a bare `router.back()` then logs `"GO_BACK was not handled by any navigator"` and does nothing; `goBack` checks `router.canGoBack()` first and replaces with the fallback route otherwise.

### Theming preference (`src/context/ThemePreferenceProvider.tsx`)

- The Settings screen's theme picker (System/Hell/Dunkel) needs to override `useColorScheme()` app-wide, not just read it — so `src/components/useColorScheme.ts` no longer re-exports React Native's hook directly. It now reads `ThemePreferenceProvider`'s resolved `colorScheme`, which falls back to the OS scheme when the preference is `"system"`. Every themed surface (`Themed.tsx`, `Toast.tsx`, the reader's status bar) imports `useColorScheme` from `@/src/components/useColorScheme` — **never** `"react-native"` directly, or it'll silently ignore the user's override. `ThemedApp` (see Routing above) reads the resolved scheme to both paint the splash/system-UI background and drive `ThemeProvider`/`StatusBar` — there's no separate "raw OS scheme at boot" path anymore, since the preference is synchronous in-memory state (no async load to race).
- The preference is **not persisted** yet — it resets to `"system"` on app restart. Wire it up to local storage once one exists (see roadmap) rather than reaching for `@react-native-async-storage/async-storage`, which was deliberately removed (see No-auth stance above).
- The language picker in Settings is UI-only: selecting a language just shows a toast and updates local component state, no i18n library is wired up and all UI strings are still hardcoded German. Don't wire real translations without being asked — the UI existing ahead of the behavior is intentional for this screen.
- Datenschutz/Impressum in Settings are external links, not in-app screens: `ActionRow`'s `onPress` calls `Linking.openURL` (from `"react-native"`) with a URL from `src/constants/LegalLinks.ts`, wrapped in `.catch()` to toast if the OS can't open it. `LegalLinks.ts` currently points at placeholder `readlet.app` URLs since there's no real website yet — swap them for the real, hosted pages before shipping; don't fabricate legal page content in-app instead.

### App lock (`src/context/AppLockProvider.tsx`)

- Unlike theme/language, this is **fully functional**, not a UI mock — the user explicitly asked for a real lock, not a prototype toggle, since a security feature that looks active but isn't would be actively misleading. Enabling "PIN-Sperre" in Settings requires a real 4-digit PIN persisted via `expo-secure-store` (`src/services/appLockStorage.ts` — see that file for why the PIN is stored as-is rather than hashed); enabling the biometric option additionally requires `expo-local-authentication` hardware + at least one enrolled face/fingerprint (`biometricAvailable`), and itself prompts a biometric check before persisting.
- Enforcement is route-based (see Routing above), not a component swap: `AppLockProvider` wraps the whole app in `app/_layout.tsx` and hydrates asynchronously on mount (SecureStore + hardware detection) — `ThemedApp` holds the splash screen up until `isHydrated`. Once ready, `app/(auth)/_layout.tsx` redirects to `app/lock.tsx` whenever `isLocked` is true; that screen has no back button and calls `unlock()` after a correct PIN (`verifyPin`) or successful `authenticateWithBiometrics()`, which redirects it straight back to `/`. Locks on cold start (if a PIN is set) and again whenever `AppState` transitions to `"background"` (not `"inactive"` — that fires for the biometric system prompt itself, an incoming call banner, etc., and would immediately re-lock a screen that's mid-authentication).
- `app/(auth)/settings-pin.tsx` is the one PIN-entry flow for all three cases (`enable`/`change`/`disable`, via `?mode=`), gated in `disable`/`change` behind re-entering the *current* PIN first — so picking up an unlocked phone isn't enough to turn the lock off. `src/components/PinKeypad.tsx` (`PinDots` + `PinKeypad`) is shared between it and `app/lock.tsx`.
- `app.json` has two plugin entries added for this: `"expo-secure-store"` (auto-added by `npx expo install`) and `["expo-local-authentication", { "faceIDPermission": "..." }]` (the iOS `NSFaceIDUsageDescription`; without it Face ID silently falls back to device passcode). Both are Expo SDK modules available in Expo Go — no dev-client rebuild needed for this feature.
- Settings → "Jetzt sperren" calls `lockNow()` directly, for testing the lock screen without actually backgrounding the app — this is enough to trigger `(auth)/_layout.tsx`'s redirect from wherever the user currently is.

### Toasts (`src/context/ToastProvider.tsx`)

- `ToastProvider` / `useToast()` exposes `showToast(message, type?, duration?)` (`type` is `"success" | "error" | "info"`), rendering an animated overlay via `src/components/Toast.tsx`. No backend/auth dependency — use it for import errors, "book added", etc.

### Design system (`src/components/Themed.tsx` + `src/constants/StyleVariables.ts`)

- `src/constants/StyleVariables.ts` is the whole design system: Notion-style neutral minimalism crossed with Airbnb-style polish (one confident accent — Notion's own blue, `#2383E2` in light mode — generous rounded corners, sparing soft elevation). Backgrounds are pure white (light) / pure black (dark) — true neutral gray, zero hue, no tint mixed in — the rule Notion and Airbnb both follow because a tinted "off-white"/"near-black" reads as dirty, not clean. Color lives only in the accent/status tokens, never in a background. (The accent was originally a warm terracotta; switched to blue on request — if you see "terracotta" mentioned elsewhere, e.g. commit history, it's stale.)
  - `light`/`dark` are flat color maps sharing the same keys: background layers `canvas` → `surface` → `surfaceHover`. In light mode `canvas`/`surface` are both pure white — cards separate from the page via `border` only, not a background shift. In dark mode `canvas` is pure black (zero cost per pixel on OLED) with `surface` one small step up (`#131313`) so cards keep a hint of depth without giving up the true-black canvas. Also: text `text`/`textMuted`/`textSubtle`; `border`/`borderMuted`; `overlay` (scrim); `primary`/`primarySoft`/`onPrimary`; `secondary`; status colors `success`/`warning`/`danger`/`info` each with a matching `onSuccess`/`onWarning`/`onDanger`/`onInfo` text color (status colors are lightened in dark mode to pop on the black canvas, so their `on*` flips to dark ink there — same reasoning as `onPrimary`). Add new colors to both palettes with the same key.
  - Everything else is a flat, theme-independent token living as a sibling of `light`/`dark` on the same default export (not nested under a `spacing`/`radius`/etc. sub-object) — prefixed by kind: `br*` (`brSm`/`brMd`/`brLg`/`brXl`/`brRound`) for border radius, `gap*` (`gapXSmall`…`gapXXXLarge`) for spacing, `fontSize*`/`fontWeight*`/`lineHeight*` (`lineHeight*` is absolute px, matching RN's `lineHeight` style prop — not a unitless multiplier) for type, and `shadow*` (`shadowSm`/`shadowMd`/`shadowLg`, iOS shadow* + Android `elevation`) for elevation. Use these instead of hardcoding numbers in a component's `StyleSheet.create`.
- `src/components/Themed.tsx` exports `Text`, `View`, `Card`, `ScreenContent`, and the `useThemeColor(props, colorName)` hook — drop-in replacements for RN's `Text`/`View` that resolve colors via `useThemeColor` (per-component `light`/`dark` prop override → palette default) based on `useColorScheme()`. All screens use these instead of manually resolving `Colors[scheme]` — reach for `useThemeColor({}, "key")` when you need a raw color value (e.g. for a `Pressable`'s dynamic style function or an icon's `color` prop) rather than re-deriving the palette by hand. Note `View`/`Card` default their background to the palette (`canvas`/`surface`) — for a purely structural wrapper nested inside a `Card` that shouldn't repaint its background, use plain RN `View` instead.

### Path aliases

`@/*` maps to the project root — configured in both `tsconfig.json` (`paths`) and `babel.config.js` (`module-resolver`). Both must stay in sync if the alias changes. `components/` and `constants/` live under `src/` (there is no root-level `components/`/`constants/` anymore), so imports go through `@/src/...`. Example: `import Colors from "@/src/constants/StyleVariables"`, `import { useToast } from "@/src/context/ToastProvider"`.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, and `noImplicitOverride` on top of `expo/tsconfig.base`. Code should type-check cleanly under these settings (e.g. array/object index access returns `T | undefined`). No `baseUrl` is set (deprecated as of TypeScript 6.0) — `paths` resolve relative to the tsconfig.json directory automatically.

### app.json / config plugins

Splash screen config lives under the `expo-splash-screen` entry in `plugins` (an array-form plugin with `image`/`resizeMode`/`backgroundColor`, plus a `dark: { backgroundColor }` override), not a top-level `splash` key — that key was removed from the config schema. There is likewise no top-level `newArchEnabled` anymore; the New Architecture is mandatory and always on. Run `npx expo-doctor` after touching `app.json` to catch schema drift like this early.

`app.json` is static JSON, so it can't import `src/constants/StyleVariables.ts` — the splash `backgroundColor`/`dark.backgroundColor` and `android.adaptiveIcon.backgroundColor` are the palette's `light.canvas`/`dark.canvas` hex values copied by hand. If the canvas colors change, update them here too.
