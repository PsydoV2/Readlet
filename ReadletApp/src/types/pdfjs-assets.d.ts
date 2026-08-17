// Ambient module declaration for the pdf.js build files bundled under
// assets/pdfjs/ with a neutral `.pdfjs` extension (see metro.config.js
// and src/services/pdfViewerAssets.ts) — TS has no built-in asset-module
// type for a custom extension the way it does for `.png`/`.ttf`/etc.
// (those come from `expo/types`), so importing one needs this declared
// by hand. Shaped exactly like any other RN/Metro asset import: the
// module id Metro's asset resolver hands `expo-asset`'s `Asset.fromModule`.
declare module "*.pdfjs" {
  const assetId: number;
  export default assetId;
}
