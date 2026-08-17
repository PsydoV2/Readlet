import Image from "next/image";
import Link from "next/link";
import { CodeIcon } from "../icons";
import { REPO_URL } from "../site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border-muted)] bg-[var(--canvas)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            className="brand-mark rounded-[6px]"
            priority
          />
          <span className="text-[17px] font-bold tracking-tight text-[var(--text)]">
            Readlet<span className="text-[var(--primary)]">.</span>
          </span>
        </Link>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)] transition-colors hover:text-[var(--primary)]"
          aria-label="Quellcode auf GitHub ansehen"
        >
          <CodeIcon className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
