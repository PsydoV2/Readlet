import { Directory, File, Paths } from "expo-file-system";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export type ParsedEpub = {
  title: string;
  author: string;
  /** Ordered chapter file paths (the OPF spine), relative to `extractedDir`. */
  spine: string[];
  /** file:// URI of the folder the archive was unzipped into. */
  extractedDir: string;
  /**
   * Cover image path (relative to `extractedDir`, same convention as
   * `spine`), or `null` if the EPUB doesn't declare one. Resolved from the
   * OPF manifest — EPUB3's `properties="cover-image"` first, falling back
   * to EPUB2's `<meta name="cover" content="<manifest-id>"/>`.
   */
  coverPath: string | null;
};

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

/** OPF/container XML nodes are single objects when there's one, arrays when there's more than one — normalize to an array either way. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** A parsed XML text node is either a plain string or `{ "#text": "..." }` depending on whether it has attributes. */
function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (node && typeof node === "object" && "#text" in node) return String((node as { "#text": unknown })["#text"]);
  return "";
}

/**
 * Zip-slip guard: an EPUB entry name (or the OPF path pulled from
 * `container.xml`) is attacker-controlled archive content, not something we
 * generated — an absolute path or a `..` segment that nets negative depth
 * would let a malicious archive write outside `extractedDir` once joined
 * onto it. Reject anything of that shape before it ever reaches `new File`.
 */
function isSafeEntryName(name: string): boolean {
  if (!name || name.startsWith("/") || name.includes("\\")) return false;
  let depth = 0;
  for (const part of name.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      depth -= 1;
      if (depth < 0) return false;
    } else {
      depth += 1;
    }
  }
  return true;
}

/**
 * Unzips an EPUB (it's just a zip file) into `Paths.document/books/<bookId>/`
 * — every entry, not just the chapters, so the reader's WebView can resolve
 * the images/CSS chapters reference — then parses `META-INF/container.xml`
 * and the OPF package document it points to for title/author and the
 * spine (reading order). Throws if the archive doesn't look like a valid
 * EPUB; the caller (`importBook.ts`) surfaces that as an import error.
 */
export async function extractAndParseEpub(sourceFile: File, bookId: string): Promise<ParsedEpub> {
  const zipBytes = await sourceFile.bytes();
  const zip = await JSZip.loadAsync(zipBytes);

  const containerEntry = zip.file("META-INF/container.xml");
  if (!containerEntry) throw new Error("Ungültiges EPUB: META-INF/container.xml fehlt.");
  const containerXml = await containerEntry.async("string");
  const containerObj = xmlParser.parse(containerXml);
  const rootfile = asArray(containerObj?.container?.rootfiles?.rootfile)[0];
  const opfPath: string | undefined = rootfile?.["@_full-path"];
  if (!opfPath) throw new Error("Ungültiges EPUB: kein rootfile in container.xml.");
  if (!isSafeEntryName(opfPath)) throw new Error(`Ungültiges EPUB: unsicherer rootfile-Pfad ${opfPath}.`);
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const opfEntry = zip.file(opfPath);
  if (!opfEntry) throw new Error(`Ungültiges EPUB: ${opfPath} fehlt.`);
  const opfXml = await opfEntry.async("string");
  const opfObj = xmlParser.parse(opfXml);
  const pkg = opfObj?.package ?? {};
  const metadata = pkg.metadata ?? {};

  const fallbackTitle = sourceFile.name.replace(/\.epub$/i, "");
  const title = textOf(asArray(metadata["dc:title"])[0]) || fallbackTitle;
  const author = textOf(asArray(metadata["dc:creator"])[0]) || "Unbekannt";

  // Manifest hrefs feed the spine, which the reader later joins straight
  // onto `extractedDir` as a `file://` URI (see `app/(auth)/reader/[id].tsx`)
  // with no further sandboxing on Android — the same zip-slip class as the
  // entry names below, just reached through the OPF instead of the archive
  // listing, so it needs the same guard.
  const manifestMap = new Map<string, string>();
  let coverHref: string | undefined;
  for (const item of asArray(pkg.manifest?.item)) {
    const id = item?.["@_id"];
    const href = item?.["@_href"];
    if (!href || !isSafeEntryName(href)) continue;
    if (id) manifestMap.set(id, href);
    const properties: string | undefined = item?.["@_properties"];
    if (!coverHref && properties?.split(/\s+/).includes("cover-image")) {
      coverHref = href;
    }
  }
  if (!coverHref) {
    // EPUB2 fallback: metadata carries `<meta name="cover" content="<manifest-item-id>"/>`
    // instead of the item itself being flagged.
    const coverMetaId = asArray(metadata.meta).find((meta) => meta?.["@_name"] === "cover")?.["@_content"];
    coverHref = coverMetaId ? manifestMap.get(coverMetaId) : undefined;
  }
  const coverPath = coverHref ? opfDir + coverHref : null;

  const spine = asArray(pkg.spine?.itemref)
    .map((ref) => manifestMap.get(ref?.["@_idref"]))
    .filter((href): href is string => Boolean(href))
    .map((href) => opfDir + href);

  if (spine.length === 0) throw new Error("Ungültiges EPUB: leere Spine (keine Kapitel gefunden).");

  const extractedDir = new Directory(Paths.document, "books", bookId);
  extractedDir.create({ intermediates: true, idempotent: true });

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  for (const entry of entries) {
    if (!isSafeEntryName(entry.name)) {
      throw new Error(`Ungültiges EPUB: unsicherer Eintragsname ${entry.name}.`);
    }
    const bytes = await entry.async("uint8array");
    const file = new File(extractedDir, entry.name);
    file.create({ intermediates: true, overwrite: true });
    file.write(bytes);
  }

  return { title, author, spine, extractedDir: extractedDir.uri, coverPath };
}
