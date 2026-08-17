# 📖 Readlet

A clean, modern e-reader for iOS and Android. No account, no internet required, no ads — everything lives on your device.

- Local-first: books never leave your phone
- Supports EPUB and PDF import
- Distraction-free reading, styled like it's 2025

Built with [`expo-router`](https://docs.expo.dev/router/introduction/) and TypeScript.

See [`CLAUDE.md`](./CLAUDE.md) for the full product vision and architecture notes.

---

## 🧠 Project Structure

```
ReadletApp/
├── app/
│   ├── (auth)/                 # Everything that requires the app to be unlocked
│   │   ├── index.tsx           # Library — home screen (book grid + import/settings)
│   │   ├── book/[id].tsx       # Book detail — cover, metadata, delete
│   │   ├── reader/[id].tsx     # Reader — distraction-free, tap to toggle chrome
│   │   ├── import.tsx          # Import flow, presented as a modal
│   │   ├── settings.tsx        # Settings, presented as a modal — theme, language, app lock, legal links
│   │   ├── settings-pin.tsx    # PIN entry: enable / change / disable app lock
│   │   └── _layout.tsx         # Stack for the group + redirects to /lock while isLocked
│   ├── lock.tsx                # App-lock gate (PIN + optional biometrics) — outside (auth), reachable while locked
│   ├── _layout.tsx             # Root layout — providers + <Slot /> (headerShown: false)
│   └── +not-found.tsx          # 404 fallback
│
├── src/
│   ├── context/
│   │   ├── ToastProvider.tsx           # showToast(message, type, duration)
│   │   ├── ThemePreferenceProvider.tsx # System/Light/Dark override, set from Settings
│   │   └── AppLockProvider.tsx         # PIN + biometric lock state; (auth)/_layout.tsx redirects off it
│   ├── components/
│   │   ├── Themed.tsx         # Text, View, Card, ScreenContent
│   │   ├── ScreenHeader.tsx   # In-content back/close header (no native header)
│   │   ├── BookCard.tsx       # Library grid item — cover, progress, badges
│   │   ├── PinKeypad.tsx      # PinDots + numeric keypad, shared by app/lock.tsx and settings-pin.tsx
│   │   ├── Toast.tsx          # Animated slide-in toast
│   │   └── useColorScheme.ts  # Resolved scheme — reads ThemePreferenceProvider, not the OS directly
│   ├── constants/
│   │   ├── StyleVariables.ts  # Color palette — light + dark
│   │   └── LegalLinks.ts      # Datenschutz/Impressum URLs opened from Settings
│   ├── data/
│   │   ├── mockBooks.ts       # Placeholder library content
│   │   └── mockChapterText.ts # Placeholder reader copy
│   ├── services/
│   │   └── appLockStorage.ts  # PIN/biometric-pref persistence via expo-secure-store
│   ├── types/
│   │   └── Book.ts
│   └── utils/
│       └── goBack.ts          # router.back(), safe when there's no history to pop
│
├── app.json                  # plugins (incl. splash config), typedRoutes
├── tsconfig.json             # strict, paths (@/), moduleResolution: Bundler
└── babel.config.js           # module-resolver for @/ alias
```

There is no native header and no tab bar — the `(auth)` group's `Stack` runs
with `headerShown: false` everywhere, and every screen draws its own chrome
(`ScreenHeader`, or a custom top/bottom bar in the reader) instead.

The theme picker in Settings actually switches the resolved light/dark
scheme app-wide (not persisted across restarts yet); the language picker is
UI-only for now — selecting anything just surfaces a toast, no i18n is
wired up. Datenschutz/Impressum are external links (`Linking.openURL`) to a
website, not in-app screens — `src/constants/LegalLinks.ts` currently points
at placeholder `readlet.app` URLs since there's no website yet; swap them
for the real, hosted pages before shipping.

**App lock is fully functional**, not a UI mock: enabling "PIN-Sperre" in
Settings requires a real 4-digit PIN (stored via `expo-secure-store`),
optionally backed by Face ID/Touch ID/fingerprint (`expo-local-authentication`,
only offered where hardware + enrollment support it). Once enabled, the app
actually locks — on cold start, and again whenever it's backgrounded —
implemented as an [Expo Router authentication-rewrite](https://docs.expo.dev/router/advanced/authentication-rewrites/):
`app/(auth)/_layout.tsx` redirects to `app/lock.tsx` whenever locked, from
wherever the user currently is. Use Settings → "Jetzt sperren" to trigger it
on demand for testing.

---

## 🧑‍💻 Getting Started

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for the Android emulator.

---

## 🧱 Tech Stack

| Layer        | Technology                         |
| ------------ | ----------------------------------- |
| Framework    | **Expo SDK 57**                     |
| Navigation   | **expo-router v7** (`~57.0.x`)      |
| Runtime      | **React 19.2 · React Native 0.86**  |
| Architecture | **New Architecture** (mandatory)    |
| Language     | **TypeScript 6.0** (strict)         |
| Platforms    | **iOS · Android** (no web target)   |
| Testing      | **Jest + jest-expo**                |

---

## 🎨 Design system

Everything lives in `src/constants/StyleVariables.ts`: Notion-style neutral,
content-first minimalism crossed with Airbnb-style polish (a single confident
accent — Notion's own blue — generous rounded corners, soft elevation used
sparingly).
Backgrounds are pure white (light) / pure black (dark) — true neutral gray,
no tint mixed in, the way Notion and Airbnb both keep it clean. Color is
reserved for the accent/status tokens, never a background.

`light` and `dark` are flat color maps sharing the same keys:

| Key                          | Usage                                         |
| ----------------------------- | ---------------------------------------------- |
| `canvas`                      | Screen background, tab bar (pure white/black)  |
| `surface`                     | Cards, sheets (same pure white as `canvas` in light mode, separated only by `border`; one step lighter than the pure-black `canvas` in dark mode) |
| `surfaceHover`                | Pressed/hover fill, input backgrounds          |
| `text` / `textMuted` / `textSubtle` | Primary / secondary / placeholder text   |
| `border` / `borderMuted`      | Card borders, dividers                         |
| `overlay`                     | Modal/sheet scrim                              |
| `primary` / `primarySoft`     | Buttons, active states, links / tinted badges  |
| `onPrimary`                   | Text/icon color on a solid `primary` surface   |
| `secondary`                   | Secondary accents (ratings, streaks)           |
| `success` / `warning` / `danger` / `info` | Status colors                    |
| `onSuccess` / `onWarning` / `onDanger` / `onInfo` | Text/icon color on those surfaces |

Everything else is a flat, theme-independent token — reach for these instead
of hardcoding numbers:

| Prefix        | Example                          | Meaning                    |
| ------------- | --------------------------------- | --------------------------- |
| `br*`         | `brSm`, `brMd`, `brLg`, `brXl`, `brRound` | Border radius        |
| `gap*`        | `gapXSmall` … `gapXXXLarge`       | Spacing                     |
| `fontSize*`   | `fontSizeXSmall` … `fontSizeXXXLarge` | Font sizes              |
| `fontWeight*` | `fontWeightRegular` … `fontWeightBold` | Font weights           |
| `lineHeight*` | `lineHeightXSmall` … `lineHeightXXXLarge` | Line heights (absolute px) |
| `shadow*`     | `shadowSm`, `shadowMd`, `shadowLg` | Elevation presets           |

Use the `Themed` components for automatic light/dark switching:

```tsx
import { Text, View, Card, ScreenContent } from "@/src/components/Themed";

<ScreenContent>
  <Card>
    <Text>Hello</Text>
  </Card>
</ScreenContent>;
```

---

## 🧭 Roadmap

- [x] Frontend prototype: library grid, book detail, reader, import modal (mock data, no native header/tab bar)
- [x] Settings modal: theme (functional), language (UI only), Datenschutz/Impressum external links
- [x] App lock: PIN + optional biometrics, fully functional (not persisted-preference-only)
- [ ] Persist theme/language choice locally once storage is wired up
- [ ] Real i18n (currently German-only UI strings, hardcoded)
- [ ] EPUB/PDF import (`expo-document-picker`, `expo-file-system`)
- [ ] Local library metadata + reading positions (`expo-sqlite`)
- [ ] EPUB reader (`react-native-epub-view` / `epubjs`)
- [ ] PDF reader (`react-native-pdf`)
- [ ] Reader settings: font size, font family, theme, line height, margins
- [ ] Real cover art extraction, reading stats

---

## 🪪 License

MIT — see [`LICENCE`](./LICENCE) for details.
