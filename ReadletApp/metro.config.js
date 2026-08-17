const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The pdf.js build files bundled under assets/pdfjs/ (see
// src/services/pdfViewerAssets.ts) are never `require()`d/executed as JS
// inside the RN bundle itself — they're only ever copied to disk at
// runtime and loaded by the reader's WebView via `<script src>`. Without
// this, Metro would try to parse them as source (they're `.mjs`, one of
// Metro's default JS source extensions) instead of treating them as an
// opaque binary asset the way it already does for images/fonts/db files.
config.resolver.assetExts.push("pdfjs");

module.exports = config;
