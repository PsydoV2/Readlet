import Link from "next/link";
import { REPO_URL } from "../site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-muted)]">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[15px] font-bold tracking-tight text-[var(--text)]">
            Readlet<span className="text-[var(--primary)]">.</span>
          </span>
          <p className="mt-1 text-[13px] text-[var(--text-subtle)]">
            Kein Account. Keine Cloud. Keine Werbung.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[var(--text-muted)]">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--primary)]"
          >
            Quellcode auf GitHub
          </a>
          <Link href="/datenschutz/" className="hover:text-[var(--primary)]">
            Datenschutz
          </Link>
          <Link href="/impressum/" className="hover:text-[var(--primary)]">
            Impressum
          </Link>
          <span>© 2026 Readlet</span>
        </nav>
      </div>
    </footer>
  );
}
