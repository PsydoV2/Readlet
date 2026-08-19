# 📖 Readlet

A clean, modern e-reader for iOS and Android — no account, no internet
required, no ads. Your books never leave the device.

- **Local-first**: books never leave the phone
- **Import EPUB, MOBI (DRM-free) and PDF** straight from the device's file
  picker
- **PIN & device lock** (Face ID / Touch ID / fingerprint)
- **Light & dark**, follows the system or set manually
- **German & English**, fully translated
- **Open source**, MIT-licensed

This repository is a monorepo made up of two projects plus store assets:

| Folder | What it is |
| --- | --- |
| [`ReadletApp/`](ReadletApp) | The actual app (Expo/React Native, iOS + Android) |
| [`ReadletWeb/`](ReadletWeb) | The website (Next.js) — landing page, privacy policy, imprint |
| [`PlayStore/`](PlayStore) | Screenshots and graphics for the Play Store listing |
| [`DESIGN.md`](DESIGN.md) | Shared design system (colors, typography, spacing) for app and web |

---

## 📱 ReadletApp

Built with [Expo](https://expo.dev) (SDK 57), [expo-router](https://docs.expo.dev/router/introduction/)
and TypeScript. Books are stored locally in SQLite, EPUB/MOBI are parsed on
import itself (no cloud backend, no server dependency), and reading happens
through a reader view embedded right in the app.

```bash
cd ReadletApp
npm install
npx expo start
```

Then press `i` for the iOS simulator or `a` for the Android emulator.

Details on architecture, data model, and the reasoning behind every
decision live in [`ReadletApp/README.md`](ReadletApp/README.md) and
[`ReadletApp/CLAUDE.md`](ReadletApp/CLAUDE.md).

### Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Navigation | expo-router v7 |
| Language | TypeScript 6 (strict) |
| Storage | expo-sqlite, expo-file-system, expo-secure-store |
| Import | expo-document-picker, jszip + fast-xml-parser (EPUB), hand-rolled MOBI parser |
| Reading | react-native-webview + embedded pdf.js (PDF) |
| i18n | i18next + react-i18next |

---

## 🌐 ReadletWeb

The website (landing page plus privacy policy/imprint pages), built with
[Next.js](https://nextjs.org) and Tailwind CSS. Shares color and typography
tokens with the app (see [`DESIGN.md`](DESIGN.md)).

```bash
cd ReadletWeb
npm install
npm run dev
```

Runs at <http://localhost:3000>.

---

## 🎨 Design

[`DESIGN.md`](DESIGN.md) is the authoritative reference for anything
visual — colors, typography, spacing, component patterns, voice/tone. The
source of truth is `ReadletApp/src/constants/StyleVariables.ts`; every
other surface (web, future marketing pages) follows from there.

---

## 🪪 License

MIT — see [`LICENSE`](LICENSE).
