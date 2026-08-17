# 📖 Readlet

A clean, modern e-reader for iOS and Android. No account, no internet required, no ads — everything lives on your device.

- Local-first: books never leave your phone
- Supports EPUB, MOBI (DRM-free), and PDF import
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
│   │   ├── AppLockProvider.tsx         # PIN + biometric lock state; (auth)/_layout.tsx redirects off it
│   │   └── LibraryProvider.tsx         # Loads the SQLite book list once, exposes CRUD via useLibrary()
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
│   ├── db/
│   │   ├── database.ts        # expo-sqlite setup + `books` table
│   │   └── booksRepository.ts # The only file that writes SQL — row ↔ Book mapping
│   ├── i18n/
│   │   ├── index.ts           # i18next bootstrap, language preference get/set (expo-secure-store)
│   │   └── locales/{de,en}.json
│   ├── services/
│   │   ├── appLockStorage.ts  # PIN/biometric-pref persistence via expo-secure-store
│   │   ├── importBook.ts      # Picker → copy into app storage → parse → insert into DB
│   │   ├── epubService.ts     # Unzip (jszip) + parse container.xml/OPF (fast-xml-parser)
│   │   ├── mobiService.ts     # Hand-rolled PalmDB/MOBI parser + PalmDOC decompression (no library)
│   │   └── pdfService.ts      # Best-effort page-count heuristic (no real PDF parser)
│   ├── types/
│   │   └── Book.ts
│   └── utils/
│       ├── goBack.ts          # router.back(), safe when there's no history to pop
│       └── accentColor.ts     # Deterministic placeholder cover color, hashed from the book id
│
├── app.json                  # plugins (incl. splash config), typedRoutes
├── tsconfig.json             # strict, paths (@/), moduleResolution: Bundler
└── babel.config.js           # module-resolver for @/ alias
```

There is no native header and no tab bar — the `(auth)` group's `Stack` runs
with `headerShown: false` everywhere, and every screen draws its own chrome
(`ScreenHeader`, or a custom top/bottom bar in the reader) instead.

**Everything below is functional, not a mock-data prototype anymore:**

- **Theme** — the picker actually switches the resolved light/dark scheme
  app-wide (not persisted across restarts yet).
- **Language** — real [i18next](https://www.i18next.com/) (`src/i18n/`), German
  - English, persisted via `expo-secure-store`. Datenschutz/Impressum are
    external links (`Linking.openURL`), not in-app screens —
    `src/constants/LegalLinks.ts` currently points at placeholder `readlet.app`
    URLs since there's no website yet; swap them for the real, hosted pages
    before shipping.
- **App lock** — enabling "PIN-Sperre" in Settings requires a real 4-digit PIN
  (`expo-secure-store`), optionally backed by Face ID/Touch ID/fingerprint
  (`expo-local-authentication`). The app actually locks — on cold start, and
  again whenever backgrounded — via an
  [Expo Router authentication-rewrite](https://docs.expo.dev/router/advanced/authentication-rewrites/):
  `app/(auth)/_layout.tsx` redirects to `app/lock.tsx` whenever locked.
  Settings → "Jetzt sperren" triggers it on demand for testing.
- **Import** — the "+" button opens the real system file picker
  (`expo-document-picker`), copies the chosen EPUB/MOBI/PDF into app storage
  (`expo-file-system`'s newer `File`/`Directory` API), and inserts it into a
  local SQLite library (`expo-sqlite`). EPUBs are unzipped (`jszip`) and
  their OPF package document parsed (`fast-xml-parser`) for title/author/chapter
  order; MOBI files are parsed by hand (`src/services/mobiService.ts` — no
  library exists for this, the format's small enough to read directly) —
  DRM-encrypted files and the less common HUFF/CDIC text compression are
  explicitly unsupported and rejected with a clear error; PDFs get a
  best-effort page-count _estimate_ (byte-pattern heuristic, not a real PDF
  parser).
- **Reading** — the Reader screen renders the real book via a `WebView`
  (chosen deliberately over `react-native-pdf`/a native EPUB library so the
  app stays on Expo Go, no custom dev-client build). EPUB/MOBI progress is
  chapter-based (no in-chapter pagination — MOBI has no real chapter list of
  its own, so one is synthesized from its `<mbp:pagebreak>`/heading markers);
  PDF page count is estimated but reading _position_ isn't tracked yet,
  since the WebView's built-in PDF viewer doesn't expose page-change events
  to JS — see CLAUDE.md's Reader section for the full reasoning and what a
  native-library upgrade would buy.

---

## 🧑‍💻 Getting Started

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for the Android emulator.

---

## 🧱 Tech Stack

| Layer        | Technology                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Framework    | **Expo SDK 57**                                                                                            |
| Navigation   | **expo-router v7** (`~57.0.x`)                                                                             |
| Runtime      | **React 19.2 · React Native 0.86**                                                                         |
| Architecture | **New Architecture** (mandatory)                                                                           |
| Language     | **TypeScript 6.0** (strict)                                                                                |
| Platforms    | **iOS · Android** (no web target)                                                                          |
| Storage      | **expo-sqlite** (library metadata) · **expo-file-system** (book files) · **expo-secure-store** (PIN/prefs) |
| Import       | **expo-document-picker** · **jszip** + **fast-xml-parser** (EPUB unzip/parse) · hand-rolled MOBI parser (no library) |
| Reading      | **react-native-webview** (EPUB/MOBI chapters + PDF, in place of a native reader lib — see CLAUDE.md)       |
| i18n         | **i18next** + **react-i18next** · **expo-localization** (device locale)                                    |
| Testing      | **Jest + jest-expo**                                                                                       |

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

| Key                                               | Usage                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas`                                          | Screen background, tab bar (pure white/black)                                                                                                     |
| `surface`                                         | Cards, sheets (same pure white as `canvas` in light mode, separated only by `border`; one step lighter than the pure-black `canvas` in dark mode) |
| `surfaceHover`                                    | Pressed/hover fill, input backgrounds                                                                                                             |
| `text` / `textMuted` / `textSubtle`               | Primary / secondary / placeholder text                                                                                                            |
| `border` / `borderMuted`                          | Card borders, dividers                                                                                                                            |
| `overlay`                                         | Modal/sheet scrim                                                                                                                                 |
| `primary` / `primarySoft`                         | Buttons, active states, links / tinted badges                                                                                                     |
| `onPrimary`                                       | Text/icon color on a solid `primary` surface                                                                                                      |
| `secondary`                                       | Secondary accents (ratings, streaks)                                                                                                              |
| `success` / `warning` / `danger` / `info`         | Status colors                                                                                                                                     |
| `onSuccess` / `onWarning` / `onDanger` / `onInfo` | Text/icon color on those surfaces                                                                                                                 |

Everything else is a flat, theme-independent token — reach for these instead
of hardcoding numbers:

| Prefix        | Example                                   | Meaning                    |
| ------------- | ----------------------------------------- | -------------------------- |
| `br*`         | `brSm`, `brMd`, `brLg`, `brXl`, `brRound` | Border radius              |
| `gap*`        | `gapXSmall` … `gapXXXLarge`               | Spacing                    |
| `fontSize*`   | `fontSizeXSmall` … `fontSizeXXXLarge`     | Font sizes                 |
| `fontWeight*` | `fontWeightRegular` … `fontWeightBold`    | Font weights               |
| `lineHeight*` | `lineHeightXSmall` … `lineHeightXXXLarge` | Line heights (absolute px) |
| `shadow*`     | `shadowSm`, `shadowMd`, `shadowLg`        | Elevation presets          |

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

- [x] App shell: library grid, book detail, reader, import modal, settings (no native header/tab bar)
- [x] Settings: theme (functional), app lock (PIN + optional biometrics, fully functional), Datenschutz/Impressum external links
- [x] Real EPUB/MOBI/PDF import (`expo-document-picker`, `expo-file-system`) into a local SQLite library (`expo-sqlite`)
- [x] Real EPUB/MOBI/PDF reading via `WebView` (chapter-based EPUB/MOBI progress; no PDF page tracking yet)
- [x] Real i18n: German + English via i18next, persisted language preference
- [x] Reader font size control (EPUB/MOBI)
- [ ] Persist theme choice locally (language already does, via `expo-secure-store` — bring theme in line)
- [ ] Real cover-art extraction (PDF first-page thumbnail) — EPUB/MOBI already extract their declared cover image
- [ ] PDF reading-position tracking (needs `react-native-pdf` + a dev client, or a JS-based PDF.js viewer with its own progress bridge — see CLAUDE.md)
- [ ] A real PDF page-count parser (current one is a byte-pattern heuristic)
- [ ] MOBI HUFF/CDIC compression support (currently rejected with a clear error — only PalmDOC/uncompressed text is parsed)
- [ ] Reader settings: font family, line height, margins
- [ ] Reading stats (time spent, streaks)

---

## 🪪 License

MIT — see [`LICENCE`](./LICENCE) for details.
