# 📖 Readlet

Ein schlanker, moderner E-Reader für iOS und Android — kein Account, kein
Internet nötig, keine Werbung. Bücher bleiben auf dem Gerät.

- **Lokal-first**: Bücher verlassen das Telefon nie
- **EPUB, MOBI (DRM-frei) und PDF** importieren, direkt über die
  Dateiauswahl des Geräts
- **PIN- & Geräte-Sperre** (Face ID / Touch ID / Fingerabdruck)
- **Hell & Dunkel**, folgt dem System oder manuell wählbar
- **Deutsch & Englisch**, vollständig übersetzt
- **Quelloffen**, MIT-lizenziert

Dieses Repository ist ein Monorepo aus zwei Projekten plus Store-Assets:

| Ordner | Was es ist |
| --- | --- |
| [`ReadletApp/`](ReadletApp) | Die eigentliche App (Expo/React Native, iOS + Android) |
| [`ReadletWeb/`](ReadletWeb) | Die Website (Next.js) — Landingpage, Datenschutz, Impressum |
| [`PlayStore/`](PlayStore) | Screenshots und Grafiken für den Play-Store-Eintrag |
| [`DESIGN.md`](DESIGN.md) | Design-System (Farben, Typografie, Spacing) für App und Web gemeinsam |

---

## 📱 ReadletApp

Gebaut mit [Expo](https://expo.dev) (SDK 57), [expo-router](https://docs.expo.dev/router/introduction/)
und TypeScript. Bücher landen lokal in SQLite, EPUB/MOBI werden im Import
selbst geparst (kein Cloud-Backend, keine Server-Abhängigkeit), gelesen
wird über eine in die App eingebettete Reader-Ansicht.

```bash
cd ReadletApp
npm install
npx expo start
```

Danach `i` für den iOS-Simulator oder `a` für den Android-Emulator drücken.

Details zu Architektur, Datenmodell und allen Entscheidungen dahinter stehen
in [`ReadletApp/README.md`](ReadletApp/README.md) und [`ReadletApp/CLAUDE.md`](ReadletApp/CLAUDE.md).

### Tech Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Navigation | expo-router v7 |
| Sprache | TypeScript 6 (strict) |
| Speicher | expo-sqlite, expo-file-system, expo-secure-store |
| Import | expo-document-picker, jszip + fast-xml-parser (EPUB), handgeschriebener MOBI-Parser |
| Lesen | react-native-webview + eingebettetes pdf.js (PDF) |
| i18n | i18next + react-i18next |

---

## 🌐 ReadletWeb

Die Website (Landingpage sowie Datenschutz-/Impressum-Seiten), gebaut mit
[Next.js](https://nextjs.org) und Tailwind CSS. Teilt Farb- und
Typografie-Tokens mit der App (siehe [`DESIGN.md`](DESIGN.md)).

```bash
cd ReadletWeb
npm install
npm run dev
```

Läuft danach unter <http://localhost:3000>.

---

## 🎨 Design

[`DESIGN.md`](DESIGN.md) ist die verbindliche Referenz für alles Visuelle —
Farben, Typografie, Spacing, Komponenten-Patterns, Tonalität. Quelle der
Wahrheit ist `ReadletApp/src/constants/StyleVariables.ts`; jede andere
Oberfläche (Web, künftige Marketing-Seiten) zieht von dort nach.

---

## 🪪 Lizenz

MIT — siehe [`LICENSE`](LICENSE).
