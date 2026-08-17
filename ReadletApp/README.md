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
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar configuration
│   │   └── index.tsx         # Library — home screen
│   ├── _layout.tsx           # Root layout — providers + splash screen + system UI
│   └── +not-found.tsx        # 404 fallback
│
├── src/
│   ├── context/
│   │   └── ToastProvider.tsx # showToast(message, type, duration)
│   ├── components/
│   │   ├── Themed.tsx        # Text, View, Card, ScreenContent
│   │   ├── Toast.tsx         # Animated slide-in toast
│   │   └── useColorScheme.ts
│   └── constants/
│       └── StyleVariables.ts # Color palette — light + dark
│
├── app.json                  # plugins (incl. splash config), typedRoutes
├── tsconfig.json             # strict, paths (@/), moduleResolution: Bundler
└── babel.config.js           # module-resolver for @/ alias
```

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
content-first minimalism (warm off-white/ink canvas, borders over shadows)
crossed with Airbnb-style polish (a single warm terracotta accent, generous
rounded corners, soft elevation used sparingly).

`light` and `dark` are flat color maps sharing the same keys:

| Key                          | Usage                                         |
| ----------------------------- | ---------------------------------------------- |
| `canvas`                      | Screen background, tab bar                     |
| `surface`                     | Cards, sheets                                  |
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

- [ ] EPUB/PDF import (`expo-document-picker`, `expo-file-system`)
- [ ] Local library metadata + reading positions (`expo-sqlite`)
- [ ] EPUB reader (`react-native-epub-view` / `epubjs`)
- [ ] PDF reader (`react-native-pdf`)
- [ ] Reader settings: font size, font family, theme, line height, margins
- [ ] Book detail screen: cover, metadata, reading stats, delete

---

## 🪪 License

MIT — see [`LICENCE`](./LICENCE) for details.
