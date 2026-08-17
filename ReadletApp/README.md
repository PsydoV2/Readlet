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

## 🎨 Theming

Colors live in `src/constants/StyleVariables.ts`. Both `light` and `dark` palettes share the same keys:

| Key         | Usage                          |
| ----------- | ------------------------------ |
| `bgDark`    | Screen background, tab bar     |
| `bgLight`   | Cards, inputs                  |
| `text`      | Primary text                   |
| `textMuted` | Labels, hints                  |
| `border`    | Card borders, dividers         |
| `primary`   | Buttons, active states, links  |
| `danger`    | Destructive actions, errors    |
| `success`   | Confirmations, positive states |

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
