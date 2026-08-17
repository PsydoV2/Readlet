import { Asset } from "expo-asset";
import { Directory, File, Paths } from "expo-file-system";

import pdfJsAsset from "@/assets/pdfjs/pdf.pdfjs";
import pdfWorkerAsset from "@/assets/pdfjs/pdf.worker.pdfjs";
import pdfViewerJsAsset from "@/assets/pdfjs/pdf_viewer.pdfjs";
import pdfViewerCssAsset from "@/assets/pdfjs/pdf_viewer_css.pdfjs";

/**
 * pdf.js build files, copied by hand from `node_modules/pdfjs-dist` into
 * `assets/pdfjs/` and given a neutral `.pdfjs` extension (see
 * `metro.config.js`) so Metro bundles them as opaque binary assets instead
 * of trying to parse them as JS/CSS source. They're never imported or
 * executed inside the RN bundle itself — the reader's PDF viewer (see
 * `src/services/pdfViewerHtml.ts`) is a WebView that loads them straight
 * from disk via `<script type="module" src="...">`/`<link>`, so they need
 * to exist as real files with their real names on the filesystem first,
 * not live only at Metro's hashed asset-server URIs.
 *
 * pdfjs-dist ships ESM-only from v4 on (no UMD/classic `.js` build), and
 * the npm package doesn't include the full `viewer.html` demo app (that
 * only lives in the pdf.js GitHub repo) — `pdfViewerHtml.ts` hand-builds a
 * minimal viewer around the reusable `PDFViewer` component from
 * `pdf_viewer.mjs` instead (the same component pdf.js's own viewer uses).
 */
const PDFJS_FILES: { module: number; filename: string }[] = [
  { module: pdfJsAsset, filename: "pdf.mjs" },
  { module: pdfWorkerAsset, filename: "pdf.worker.mjs" },
  { module: pdfViewerJsAsset, filename: "pdf_viewer.mjs" },
  { module: pdfViewerCssAsset, filename: "pdf_viewer.css" },
];

/** Shared directory the pdf.js library files are extracted into once, and every PDF's generated viewer references by absolute `file://` URI. */
export const pdfjsDir = new Directory(Paths.document, "pdfjs");

/**
 * Copies the bundled pdf.js files into `pdfjsDir` the first time a PDF is
 * opened, so the reader's WebView can load them from a real path. Cheap
 * and idempotent on every later call: bails out as soon as all four files
 * are already present. `Asset.downloadAsync()`'s own cache copy isn't
 * guaranteed to survive between app sessions (per its own docs), but our
 * copy in `Paths.document` does — so in practice this only actually runs
 * once per install, not once per app launch.
 */
export async function ensurePdfjsAssets(): Promise<void> {
  pdfjsDir.create({ intermediates: true, idempotent: true });

  const alreadyExtracted = PDFJS_FILES.every((f) => new File(pdfjsDir, f.filename).exists);
  if (alreadyExtracted) return;

  for (const { module, filename } of PDFJS_FILES) {
    const asset = Asset.fromModule(module);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error(`pdf.js-Asset ${filename} konnte nicht geladen werden.`);
    await new File(asset.localUri).copy(new File(pdfjsDir, filename), { overwrite: true });
  }
}
