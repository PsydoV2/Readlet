import {
  ArrowUpRightIcon,
  CheckIcon,
  CodeIcon,
  ContrastIcon,
  GearIcon,
  GlobeIcon,
  ImportIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
} from "./icons";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { REPO_URL } from "./site-config";

const features = [
  {
    icon: ShieldIcon,
    title: "Lokal & privat",
    body: "Kein Account, keine Cloud, kein Tracking. Deine Bücher verlassen dein Gerät nie.",
  },
  {
    icon: ImportIcon,
    title: "EPUB, MOBI & PDF",
    body: "Importiere DRM-freie Dateien direkt über die Dateiauswahl deines Geräts.",
  },
  {
    icon: LockIcon,
    title: "PIN- & Geräte-Sperre",
    body: "Schütze deine Bibliothek mit PIN, Face ID oder Fingerabdruck.",
  },
  {
    icon: ContrastIcon,
    title: "Hell & Dunkel",
    body: "Folgt deinem System oder wechselt manuell, ganz nach Wunsch.",
  },
  {
    icon: GlobeIcon,
    title: "Deutsch & Englisch",
    body: "Die Oberfläche spricht deine Sprache, direkt ab dem ersten Start.",
  },
  {
    icon: CodeIcon,
    title: "Quelloffen",
    body: "Der komplette Code steht unter MIT-Lizenz auf GitHub.",
  },
];

const steps = [
  {
    number: "01",
    title: "Importieren",
    body: "Wähle eine EPUB-, MOBI- oder PDF-Datei auf deinem Gerät aus.",
  },
  {
    number: "02",
    title: "Lesen",
    body: "Öffne dein Buch in einer ruhigen Ansicht mit anpassbarer Schriftgröße.",
  },
  {
    number: "03",
    title: "Weiterlesen",
    body: "Readlet merkt sich deine Position automatisch — lokal, ganz ohne Sync-Server.",
  },
];

// Mirrors app/(auth)/index.tsx + BookCard.tsx: 2-column grid, format badge,
// per-card progress bar, cover-placeholder palette from accentColor.ts —
// not a real screenshot, but everything about it (columns, radii, states)
// matches the actual Library screen instead of an invented layout.
const libraryPreview = [
  { title: "Nachtzug", author: "M. Herrera", format: "epub", color: "#2E4A5C", progress: 0.65 },
  { title: "Steppenwolf", author: "H. Hesse", format: "epub", color: "#7A3B2E", progress: 1 },
  { title: "Funkstille", author: "J. Lindqvist", format: "pdf", color: "#4A5A38", progress: 0 },
  { title: "Blaupause", author: "A. Weber", format: "mobi", color: "#5C4A6E", progress: 0.3 },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <SiteHeader />

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1040px] px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <div className="animate-rise">
              <p className="text-[13px] font-semibold text-[var(--primary)]">
                Kein Account · Keine Cloud · Kein Tracking
              </p>

              <h1 className="mt-4 max-w-md text-[40px] font-bold leading-[1.08] tracking-tight text-[var(--text)] sm:text-[52px]">
                Ein E-Reader, der bei dir bleibt.
              </h1>

              <p className="mt-5 max-w-md text-[16px] leading-[26px] text-[var(--text-muted)]">
                Readlet importiert EPUB-, MOBI- und PDF-Dateien direkt auf
                dein Gerät und zeigt sie in einer ruhigen, aufgeräumten
                Leseansicht — ganz ohne Internetverbindung.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1.5 text-[13px] text-[var(--text-muted)]">
                  Bald für iOS &amp; Android
                </span>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--primary)] hover:underline"
                >
                  Quellcode ansehen
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Signature element: a stylised phone-shaped mock of the actual
                Library screen (app/(auth)/index.tsx + BookCard.tsx) — same
                2-column grid, format badge, per-card progress, cover-
                placeholder palette. Not a real screenshot, but every
                proportion and state it shows is real, not invented. */}
            <div
              aria-hidden
              className="animate-rise mx-auto w-full max-w-[280px] rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] lg:mx-0 lg:ml-auto"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[19px] font-bold leading-none text-[var(--text)]">
                    Bibliothek
                  </p>
                  <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
                    {libraryPreview.length} Bücher
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                    <PlusIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                    <GearIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {libraryPreview.map((book) => {
                  const isFinished = book.progress >= 1;
                  const isUnread = book.progress <= 0;
                  return (
                    <div key={book.title}>
                      <div
                        className="relative aspect-[0.7] overflow-hidden rounded-[12px]"
                        style={{ backgroundColor: book.color }}
                      >
                        <span className="absolute top-1.5 left-1.5 rounded-[6px] bg-black/35 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white">
                          {book.format.toUpperCase()}
                        </span>
                        {isFinished && (
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--success)] text-[var(--on-success)]">
                            <CheckIcon className="h-2 w-2" />
                          </span>
                        )}
                      </div>
                      {!isUnread && !isFinished && (
                        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[var(--border-muted)]">
                          <div
                            className="h-full rounded-full bg-[var(--primary)]"
                            style={{ width: `${book.progress * 100}%` }}
                          />
                        </div>
                      )}
                      <p className="mt-1.5 truncate text-[12px] font-semibold text-[var(--text)]">
                        {book.title}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {book.author}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-[1040px] px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text)]">
            Alles bleibt bei dir
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--primary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-[var(--text)]">
                  {title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[20px] text-[var(--text-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — a stepped list, not another boxed-card grid, so it
            reads as a sequence rather than repeating the feature section. */}
        <section className="mx-auto w-full max-w-[1040px] px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text)]">
            So liest du mit Readlet
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6 sm:divide-x sm:divide-[var(--border)]">
            {steps.map((step, i) => (
              <div key={step.number} className={i > 0 ? "sm:pl-6" : ""}>
                <span className="text-[13px] font-semibold text-[var(--primary)]">
                  {step.number}
                </span>
                <h3 className="mt-2 text-[16px] font-semibold text-[var(--text)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[20px] text-[var(--text-muted)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
