export type PaginationTheme = {
  canvas: string;
  text: string;
  primary: string;
};

/**
 * Builds the CSS + bootstrap JS injected into an EPUB/MOBI chapter's
 * WebView to turn its normal vertical text flow into horizontally-paged
 * screens — the CSS multi-column technique JS EPUB readers (e.g. epub.js)
 * use: `column-width: 100vw` on a wrapper makes the chapter's content lay
 * out as a sequence of viewport-wide "columns" (pages), each filled
 * top-to-bottom before the next starts (`column-fill: auto`); an ancestor
 * `overflow: hidden` clips everything but the current column, and paging
 * is just `transform: translateX(-N * 100vw)`. Pure CSS/JS — no native
 * pagination library, no dev client.
 *
 * Re-runnable and idempotent: used both as `injectedJavaScript` (on every
 * chapter load — the reader remounts the WebView per chapter, see
 * `app/(auth)/reader/[id].tsx`) and via the WebView ref's imperative
 * `injectJavaScript` (on a font-size change, without a remount) — it
 * always tears down and rebuilds its own `<style>`/wrapper rather than
 * assuming a fresh document.
 *
 * `initialPagePosition` (0–1) is *always* "land here once paginated", not
 * just for restoring a saved reading position. The reader screen reuses
 * the same fraction for three different purposes:
 *  - Reopening a book: the persisted `book.pagePosition`.
 *  - Crossing a chapter boundary: `0` when moving forward into the next
 *    chapter (start), `1` when moving backward into the previous one
 *    (end) — the actual target page depends on *that* chapter's freshly
 *    computed page count, which the caller can't know ahead of the load,
 *    so a fraction is the only thing that can be passed in advance.
 *  - A font-size change: the current page's fraction (computed by the
 *    caller from the last `readletPageInfo` message), so re-pagination
 *    preserves roughly the same reading position instead of resetting to
 *    page 1.
 *
 * Reading-margin padding lives on `#readlet-pages-content` (an inner
 * wrapper around the actual chapter content), *not* on `#readlet-pages`
 * itself (the element `column-width`/the paging `transform` are set on) —
 * padding on the multi-column element would shrink *its own* content-box
 * below `window.innerWidth`, so each rendered column ends up narrower than
 * the `100vw` the paging math assumes; the error is small per page but
 * compounds every page within a chapter (visible as a growing sliver/then
 * gap on the right, resetting at the next chapter's first page — this
 * shipped once as exactly that bug). `box-decoration-break: clone` on the
 * inner wrapper is what makes its padding repeat on *every* column instead
 * of only the very first/last one (the CSS Fragmentation spec's default,
 * `slice`, treats a box split across columns as one continuous box sliced
 * at the column boundaries — only the first fragment gets the left/top
 * edge, only the last gets the right/bottom edge; `clone` gives each
 * fragment its own complete padding box instead).
 */
export function buildPaginationScript(
  fontSize: number,
  theme: PaginationTheme,
  initialPagePosition: number,
): string {
  const css = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      overflow: hidden !important;
      background: ${theme.canvas} !important;
      color: ${theme.text} !important;
    }
    #readlet-pages {
      box-sizing: border-box !important;
      height: 100vh !important;
      -webkit-column-width: 100vw !important;
      column-width: 100vw !important;
      -webkit-column-gap: 0 !important;
      column-gap: 0 !important;
      -webkit-column-fill: auto !important;
      column-fill: auto !important;
      font-size: ${fontSize}px !important;
      line-height: 1.6 !important;
      transition: transform 0.2s ease-out !important;
    }
    #readlet-pages-content {
      box-sizing: border-box !important;
      padding: 28px 22px !important;
      -webkit-box-decoration-break: clone !important;
      box-decoration-break: clone !important;
    }
    #readlet-pages img, #readlet-pages svg { max-width: 100% !important; height: auto !important; }
    #readlet-pages a { color: ${theme.primary} !important; }
  `;

  return `
    (function() {
      var container = document.getElementById("readlet-pages");
      if (!container) {
        container = document.createElement("div");
        container.id = "readlet-pages";
        var inner = document.createElement("div");
        inner.id = "readlet-pages-content";
        while (document.body.firstChild) inner.appendChild(document.body.firstChild);
        container.appendChild(inner);
        document.body.appendChild(container);
      }

      var existingStyle = document.getElementById("readlet-reader-style");
      if (existingStyle) existingStyle.remove();
      var style = document.createElement("style");
      style.id = "readlet-reader-style";
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);

      function post(pageNumber, pageCount) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "readletPageInfo",
            pageNumber: pageNumber,
            pageCount: pageCount
          }));
        }
      }

      window.readletGoToPage = function (n) {
        var pageCount = window.__readletPageCount || 1;
        var clamped = Math.max(1, Math.min(n, pageCount));
        container.style.transform = "translateX(-" + ((clamped - 1) * 100) + "vw)";
        post(clamped, pageCount);
      };

      // Layout needs a frame (sometimes two, for images/web fonts that
      // resize late) to settle before scrollWidth is trustworthy.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var pageCount = Math.max(1, Math.round(container.scrollWidth / window.innerWidth));
          window.__readletPageCount = pageCount;
          var target = Math.round(${JSON.stringify(initialPagePosition)} * (pageCount - 1)) + 1;
          window.readletGoToPage(target);
        });
      });
    })();
    true;
  `;
}
