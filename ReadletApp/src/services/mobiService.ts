import { Directory, File, Paths } from "expo-file-system";

import i18next from "@/src/i18n";

export type ParsedMobi = {
  title: string;
  author: string;
  /** Ordered chapter file paths, relative to `extractedDir` — see the chapter-splitting note below. */
  spine: string[];
  /** file:// URI of the folder the book's chapters/images were extracted into. */
  extractedDir: string;
  /** Cover image path (relative to `extractedDir`), or `null` if the EXTH header doesn't declare one. */
  coverPath: string | null;
};

/**
 * Parses (and, where the format allows, renders) a classic Mobipocket/MOBI6
 * file — the format Kindle's own `.mobi`/`.azw`/`.azw3` files are built on
 * (AZW3/KF8 files additionally carry a newer, more complex format, but ship
 * this MOBI6 version alongside it for backward compatibility with older
 * Kindles; this only reads that compatibility part, not the KF8-specific
 * data). Unlike EPUB, MOBI isn't a zip archive — it's PalmDB, an old Palm
 * OS document container format: a header, a table of record offsets, then
 * the records themselves. Record 0 holds the PalmDOC + MOBI headers, the
 * following `textRecordCount` records hold the (usually compressed) text,
 * and everything from `firstImageIndex` on is images.
 *
 * No third-party library for this — unlike EPUB's zip/XML, MOBI has no
 * pure-JS RN-friendly parser to reach for, and the format is small enough
 * to read directly (PalmDB header + PalmDOC LZ77 decompression, both simple
 * and stable across the format's history — see the format-specific
 * functions below for exact scope/known limitations).
 *
 * Explicitly out of scope, both throwing a translated (i.e. genuinely
 * user-facing, not just a rare/technical failure) error:
 * - **DRM-encrypted files** — real Kindle Store purchases are DRM-wrapped;
 *   this only handles DRM-free files (self-published, converted, or public
 *   domain works).
 * - **HUFF/CDIC-compressed text** — the less common of MOBI's two
 *   compression schemes (dictionary-based, meant for non-Latin scripts);
 *   only the standard PalmDOC (LZ77-style) scheme and uncompressed text
 *   are implemented.
 */
export async function extractAndParseMobi(sourceFile: File, bookId: string): Promise<ParsedMobi> {
  try {
    return await extractAndParseMobiInner(sourceFile, bookId);
  } catch (error) {
    console.error(`[MobiImport] Fehlgeschlagen für "${sourceFile.name}" (bookId=${bookId}):`, error);
    throw error;
  }
}

async function extractAndParseMobiInner(sourceFile: File, bookId: string): Promise<ParsedMobi> {
  const bytes = await sourceFile.bytes();
  console.log(`[MobiImport] "${sourceFile.name}": ${bytes.length} Bytes gelesen (bookId=${bookId}).`);
  if (bytes.length < 78) throw new Error("Ungültige MOBI-Datei: zu klein für einen PalmDB-Header.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const numRecords = view.getUint16(76, false);
  console.log(`[MobiImport] PalmDB-Header: numRecords=${numRecords}`);
  if (numRecords < 1) throw new Error("Ungültige MOBI-Datei: keine Records im PalmDB-Header.");

  const recordOffsets: number[] = [];
  for (let i = 0; i < numRecords; i++) {
    const entryOffset = 78 + i * 8;
    if (entryOffset + 4 > bytes.length) throw new Error("Ungültige MOBI-Datei: Record-Tabelle unvollständig.");
    recordOffsets.push(view.getUint32(entryOffset, false));
  }

  function recordBytes(index: number): Uint8Array {
    const start = recordOffsets[index];
    if (start === undefined) return new Uint8Array(0);
    const nextOffset = index + 1 < recordOffsets.length ? recordOffsets[index + 1] : undefined;
    const end = nextOffset ?? bytes.length;
    return bytes.subarray(start, Math.max(start, end));
  }

  const record0 = recordBytes(0);
  if (record0.length < 20 || asciiOf(record0, 16, 4) !== "MOBI") {
    throw new Error(
      "Ungültige MOBI-Datei: MOBI-Header (Record 0) fehlt oder ist beschädigt — evtl. ein reines KF8/AZW3 ohne MOBI6-Kompatibilitätsteil."
    );
  }
  const header0 = new DataView(record0.buffer, record0.byteOffset, record0.byteLength);

  const compression = header0.getUint16(0, false);
  const textLength = header0.getUint32(4, false);
  const textRecordCount = header0.getUint16(8, false);
  const encryptionType = header0.getUint16(12, false);
  const mobiHeaderLength = header0.getUint32(20, false);
  const textEncoding = header0.getUint32(28, false);
  const fullNameOffset = record0.length >= 92 ? header0.getUint32(84, false) : 0;
  const fullNameLength = record0.length >= 92 ? header0.getUint32(88, false) : 0;
  const firstImageIndex = record0.length >= 112 ? header0.getUint32(108, false) : 0xffffffff;
  const exthFlags = record0.length >= 132 ? header0.getUint32(128, false) : 0;
  // "Extra Data Flags" — gates the per-record trailing-bytes trimming below.
  // Its offset shifts across MOBI header versions and isn't consistently
  // documented in one place; 242 is the value most commonly cited. Reading
  // the wrong field here mostly reads as 0 in practice (the MOBI header's
  // reserved regions are conventionally zero-filled), which just disables
  // trimming rather than corrupting it — see `getTrailingByteCount`.
  const extraFlags = mobiHeaderLength >= 232 && record0.length >= 244 ? header0.getUint16(242, false) : 0;

  console.log(
    `[MobiImport] MOBI-Header: compression=${compression} textLength=${textLength} textRecordCount=${textRecordCount} ` +
      `encryptionType=${encryptionType} mobiHeaderLength=${mobiHeaderLength} textEncoding=${textEncoding} ` +
      `firstImageIndex=${firstImageIndex === 0xffffffff ? "none" : firstImageIndex} exthFlags=${exthFlags.toString(16)} extraFlags=${extraFlags}`
  );

  if (encryptionType !== 0) {
    console.error(`[MobiImport] Abbruch: encryptionType=${encryptionType} (DRM-geschützt).`);
    throw new Error(i18next.t("import.errors.drmProtected"));
  }
  if (compression !== 1 && compression !== 2) {
    console.error(`[MobiImport] Abbruch: nicht unterstützte Kompression (compression=${compression}, erwartet 1 oder 2).`);
    throw new Error(i18next.t("import.errors.unsupportedMobiCompression"));
  }

  const exthStart = 16 + mobiHeaderLength;
  const exthRecords = (exthFlags & 0x40) !== 0 ? parseExthRecords(record0, header0, exthStart) : new Map<number, Uint8Array>();
  console.log(`[MobiImport] EXTH-Records gefunden: ${exthRecords.size}`);
  const authorBytes = exthRecords.get(100);
  const author = authorBytes && authorBytes.length > 0 ? decodeText(authorBytes, textEncoding).trim() : "";

  const fallbackTitle = sourceFile.name.replace(/\.(mobi|azw3?|azw)$/i, "");
  const declaredTitle =
    fullNameLength > 0 && fullNameOffset + fullNameLength <= record0.length
      ? decodeText(record0.subarray(fullNameOffset, fullNameOffset + fullNameLength), textEncoding).trim()
      : "";
  const title = declaredTitle || fallbackTitle;
  console.log(`[MobiImport] Titel="${title}" Autor="${author || "(unbekannt)"}"`);

  // Decompress the text records into one buffer, sized exactly to the
  // PalmDOC header's declared `textLength` — records occasionally overshoot
  // it by a few bytes (padding), so writes past that point are dropped.
  const out = new Uint8Array(textLength);
  let outPos = 0;
  for (let i = 1; i <= textRecordCount && i < recordOffsets.length; i++) {
    const raw = recordBytes(i);
    const trailing = getTrailingByteCount(raw, extraFlags);
    const payload = trailing > 0 ? raw.subarray(0, raw.length - trailing) : raw;
    outPos = compression === 2 ? decompressPalmDocRecord(payload, out, outPos) : copyRecord(payload, out, outPos);
  }
  const fullHtml = decodeText(out.subarray(0, Math.min(outPos, textLength)), textEncoding);
  console.log(
    `[MobiImport] Text dekomprimiert: ${outPos}/${textLength} Bytes geschrieben` +
      (outPos !== textLength ? " (Abweichung von textLength — evtl. Trunkierung/Padding)" : "")
  );

  const extractedDir = new Directory(Paths.document, "books", bookId);
  extractedDir.create({ intermediates: true, idempotent: true });

  // Images: every record from `firstImageIndex` on is either an image or an
  // end-of-file/index marker record — sniffed by magic bytes rather than
  // trusted blindly. `recindex="00003"` attributes in the text reference
  // these positionally (1st image record = recindex 1, and so on), which is
  // why non-image records in the range still have to advance the counter.
  const imageFiles = new Map<number, string>();
  if (firstImageIndex !== 0xffffffff && firstImageIndex > 0) {
    let recindexNumber = 1;
    for (let i = firstImageIndex; i < numRecords; i++) {
      const raw = recordBytes(i);
      const ext = sniffImageExtension(raw);
      if (ext) {
        const filename = `image-${recindexNumber}.${ext}`;
        const file = new File(extractedDir, filename);
        file.create({ intermediates: true, overwrite: true });
        file.write(raw);
        imageFiles.set(recindexNumber, filename);
      }
      recindexNumber += 1;
    }
  }
  console.log(`[MobiImport] Bilder extrahiert: ${imageFiles.size}`);
  const htmlWithImages = inlineImageSrcs(fullHtml, imageFiles);

  const coverOffsetBytes = exthRecords.get(201);
  const coverPath =
    coverOffsetBytes && coverOffsetBytes.length >= 4
      ? (imageFiles.get(
          new DataView(coverOffsetBytes.buffer, coverOffsetBytes.byteOffset, coverOffsetBytes.byteLength).getUint32(0, false) + 1
        ) ?? null)
      : null;

  // MOBI has no chapter list of its own — it's one continuous HTML
  // document. Split on Mobipocket's own `<mbp:pagebreak>` chapter markers
  // first (present in most well-formed files); if none exist, fall back to
  // splitting at `<h1>`/`<h2>` boundaries; if that also finds nothing,
  // the whole book becomes a single "chapter" (readable, just no
  // in-book chapter navigation — the same tradeoff already accepted for
  // PDFs, see CLAUDE.md's Reader section).
  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(htmlWithImages);
  const bodyContent = bodyMatch ? (bodyMatch[1] ?? htmlWithImages) : htmlWithImages;
  const viaPagebreaks = splitOnPagebreaks(bodyContent);
  const viaHeadings = viaPagebreaks ? null : splitOnHeadings(bodyContent);
  const chapters = viaPagebreaks ?? viaHeadings ?? [bodyContent];
  console.log(
    `[MobiImport] Kapitel-Splitting: ${chapters.length} Kapitel via ` +
      (viaPagebreaks ? "mbp:pagebreak" : viaHeadings ? "h1/h2-Überschriften" : "Fallback (ein Kapitel)")
  );

  const spine: string[] = [];
  chapters.forEach((chapterHtml, index) => {
    const filename = `chapter-${index}.html`;
    const file = new File(extractedDir, filename);
    file.create({ intermediates: true, overwrite: true });
    file.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${chapterHtml}</body></html>`);
    spine.push(filename);
  });
  if (spine.length === 0) throw new Error("Ungültige MOBI-Datei: kein Textinhalt gefunden.");

  console.log(
    `[MobiImport] Fertig: "${title}" — ${spine.length} Kapitel, Cover=${coverPath ?? "keins"}, extractedDir=${extractedDir.uri}`
  );
  return { title, author: author || "Unbekannt", spine, extractedDir: extractedDir.uri, coverPath };
}

function asciiOf(bytes: Uint8Array, offset: number, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) result += String.fromCharCode(bytes[offset + i] ?? 0);
  return result;
}

/** No-compression (PalmDOC compression type 1) text records are copied through as-is. */
function copyRecord(record: Uint8Array, out: Uint8Array, startPos: number): number {
  let outPos = startPos;
  for (let i = 0; i < record.length && outPos < out.length; i++) {
    const b = record[i];
    if (b !== undefined) out[outPos++] = b;
  }
  return outPos;
}

/**
 * PalmDOC (LZ77-style) decompression — MOBI's default text compression.
 * Each byte is a control code: 0x00 and 0x09–0x7f are literal bytes, 0x01–08
 * means "copy the next N raw bytes", 0x80–0xbf pairs with the following
 * byte to form a back-reference (distance/length into the output already
 * produced), and 0xc0–0xff is a space followed by the byte XORed with 0x80.
 */
function decompressPalmDocRecord(record: Uint8Array, out: Uint8Array, startPos: number): number {
  let outPos = startPos;
  let i = 0;
  while (i < record.length) {
    const c = record[i++];
    if (c === undefined) break;
    if (c === 0 || (c >= 0x09 && c <= 0x7f)) {
      if (outPos < out.length) out[outPos++] = c;
    } else if (c >= 0x01 && c <= 0x08) {
      for (let j = 0; j < c && i < record.length; j++) {
        const b = record[i++];
        if (b !== undefined && outPos < out.length) out[outPos++] = b;
      }
    } else if (c >= 0x80 && c <= 0xbf) {
      const c2 = record[i++];
      if (c2 === undefined) break;
      const combined = ((c & 0x3f) << 8) | c2;
      const distance = combined >> 3;
      const length = (combined & 0x7) + 3;
      let readPos = outPos - distance;
      for (let j = 0; j < length; j++) {
        const b = readPos >= 0 && readPos < out.length ? out[readPos] : undefined;
        if (outPos < out.length) out[outPos++] = b ?? 0x20;
        readPos++;
      }
    } else {
      if (outPos < out.length) out[outPos++] = 0x20;
      if (outPos < out.length) out[outPos++] = c ^ 0x80;
    }
  }
  return outPos;
}

/**
 * Best-effort trim of the per-record "trailing data" MOBI allows before the
 * compressed payload (multibyte-character continuation bytes, index
 * entries) — see the `extraFlags` comment above for the header-offset
 * caveat. `flags` bits 1+ each mark one variable-length trailing entry
 * (read as a backward base-128 integer); bit 0 marks a final 1–4 byte
 * multibyte-continuation entry. Clamped so an implausible result (bigger
 * than the record itself) is treated as "nothing to trim" rather than
 * risking eating real text.
 */
function getTrailingByteCount(record: Uint8Array, flags: number): number {
  let trimmed = 0;
  let bits = flags >> 1;
  while (bits) {
    if (bits & 1) trimmed += getTrailingEntrySize(record, record.length - trimmed);
    bits >>= 1;
  }
  if (flags & 1) {
    const idx = record.length - trimmed - 1;
    const lastByte = idx >= 0 ? record[idx] : undefined;
    if (lastByte !== undefined) trimmed += (lastByte & 0x3) + 1;
  }
  return trimmed > 0 && trimmed < record.length ? trimmed : 0;
}

function getTrailingEntrySize(record: Uint8Array, sizeRemaining: number): number {
  if (sizeRemaining < 1) return 0;
  const first = record[sizeRemaining - 1];
  if (first === undefined || first & 0x80) return 0;

  let result = 0;
  let bitpos = 0;
  let size = sizeRemaining;
  while (size > 0) {
    const v = record[size - 1];
    if (v === undefined) break;
    result |= (v & 0x7f) << bitpos;
    size -= 1;
    bitpos += 7;
    if (v & 0x80 || bitpos >= 28) break;
  }
  return result;
}

/** EXTH metadata records (author, cover offset, …) that follow the MOBI header when `exthFlags & 0x40` is set. */
function parseExthRecords(record0: Uint8Array, header0: DataView, exthStart: number): Map<number, Uint8Array> {
  const records = new Map<number, Uint8Array>();
  if (exthStart + 12 > record0.length || asciiOf(record0, exthStart, 4) !== "EXTH") return records;
  const recordCount = header0.getUint32(exthStart + 8, false);
  let pos = exthStart + 12;
  for (let i = 0; i < recordCount; i++) {
    if (pos + 8 > record0.length) break;
    const type = header0.getUint32(pos, false);
    const length = header0.getUint32(pos + 4, false);
    if (length < 8 || pos + length > record0.length) break;
    records.set(type, record0.subarray(pos + 8, pos + length));
    pos += length;
  }
  return records;
}

function decodeText(bytes: Uint8Array, encoding: number): string {
  return encoding === 65001 ? decodeUtf8(bytes) : decodeCp1252(bytes);
}

function decodeUtf8(bytes: Uint8Array): string {
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    if (b0 === undefined) break;
    if (b0 < 0x80) {
      result += String.fromCharCode(b0);
    } else if (b0 >= 0xc0 && b0 < 0xe0) {
      const b1 = bytes[i++] ?? 0;
      result += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 < 0xf0) {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      result += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else if (b0 >= 0xf0) {
      const b1 = bytes[i++] ?? 0;
      const b2 = bytes[i++] ?? 0;
      const b3 = bytes[i++] ?? 0;
      const codepoint = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
      // A well-formed 4-byte sequence only ever encodes up to U+10FFFF (leading byte 0xf0–0xf4);
      // 0xf5–0xff and malformed continuation bytes can still reach this branch on corrupt input,
      // so guard against handing String.fromCodePoint an out-of-range value.
      result += codepoint <= 0x10ffff ? String.fromCodePoint(codepoint) : String.fromCharCode(0xfffd);
    } else {
      result += String.fromCharCode(0xfffd);
    }
  }
  return result;
}

/** CP1252 is Latin-1 (direct byte→codepoint) except for the 0x80–0x9F range, which this table remaps to its actual (mostly punctuation/currency) characters. */
const CP1252_HIGH_RANGE = [
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018,
  0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
];

function decodeCp1252(bytes: Uint8Array): string {
  let result = "";
  for (const b of bytes) {
    result += String.fromCharCode(b >= 0x80 && b <= 0x9f ? (CP1252_HIGH_RANGE[b - 0x80] ?? b) : b);
  }
  return result;
}

function sniffImageExtension(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return "bmp";
  return null;
}

/** Rewrites Mobipocket's `recindex="00003"` image references into a `src="image-3.jpg"` the WebView can actually load. */
function inlineImageSrcs(html: string, imageFiles: Map<number, string>): string {
  return html.replace(/(?:lo|hi)?recindex\s*=\s*["'](\d+)["']/gi, (match, digits: string) => {
    const file = imageFiles.get(parseInt(digits, 10));
    return file ? `${match} src="${file}"` : match;
  });
}

function splitOnPagebreaks(html: string): string[] | null {
  const parts = html
    .split(/<mbp:pagebreak\b[^>]*\/?>/gi)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : null;
}

function splitOnHeadings(html: string): string[] | null {
  const regex = /<h[12][\s>]/gi;
  const starts: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) starts.push(match.index);
  if (starts.length < 2) return null;

  const parts: string[] = [];
  const prefix = html.slice(0, starts[0] ?? 0).trim();
  if (prefix) parts.push(prefix);
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    if (start === undefined) continue;
    const end = starts[i + 1] ?? html.length;
    const part = html.slice(start, end).trim();
    if (part) parts.push(part);
  }
  return parts.length >= 2 ? parts : null;
}
