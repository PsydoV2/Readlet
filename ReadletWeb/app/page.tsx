import Image from "next/image";
import {
  ArrowUpRightIcon,
  CodeIcon,
  ContrastIcon,
  GearIcon,
  GlobeIcon,
  ImportIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
} from "./icons";

const REPO_URL = "https://github.com/PsydoV2/Readlet";

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

const shelf = [
  { title: "Nachtzug", color: "#2E4A5C" },
  { title: "Steppenwolf", color: "#7A3B2E" },
  { title: "Funkstille", color: "#4A5A38" },
  { title: "Blaupause", color: "#5C4A6E" },
  { title: "Nordlicht", color: "#3D5A5C" },
  { title: "Fabelwesen", color: "#8A5A2E" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 border-b border-[var(--border-muted)] bg-[var(--canvas)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt=""
              width={22}
              height={22}
              className="brand-mark"
              priority
            />
            <span className="text-[17px] font-bold tracking-tight text-[var(--text)]">
              Readlet<span className="text-[var(--primary)]">.</span>
            </span>
          </a>
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

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1040px] px-6 pt-16 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <div className="animate-rise">
              <span className="inline-flex items-center rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.4px] text-[var(--primary)]">
                Kein Account · Keine Cloud · Kein Tracking
              </span>

              <h1 className="mt-5 max-w-md text-[40px] font-bold leading-[1.08] tracking-tight text-[var(--text)] sm:text-[52px]">
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

            {/* Signature element: a stylised library mock, built from the
                app's own placeholder-cover palette — not a real screenshot. */}
            <div
              aria-hidden
              className="animate-rise rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)]"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-semibold text-[var(--text)]">
                  Bibliothek
                </span>
                <div className="flex gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                    <PlusIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text)]">
                    <GearIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {shelf.map((book) => (
                  <div
                    key={book.title}
                    className="aspect-[2/3] rounded-[8px]"
                    style={{ backgroundColor: book.color }}
                  />
                ))}
              </div>

              <div className="mt-5 border-t border-[var(--border-muted)] pt-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[var(--text)]">
                    „{shelf[0]?.title}“
                  </span>
                  <span className="text-[var(--text-subtle)]">
                    Kapitel 6 von 9
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-muted)]">
                  <div className="h-full w-2/3 rounded-full bg-[var(--primary)]" />
                </div>
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

        {/* How it works */}
        <section className="mx-auto w-full max-w-[1040px] px-6 py-16 sm:py-20">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text)]">
            So liest du mit Readlet
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <span className="text-[12px] font-semibold tracking-[0.4px] text-[var(--primary)]">
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
          <div className="flex items-center gap-5 text-[13px] text-[var(--text-muted)]">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)]"
            >
              Quellcode auf GitHub
            </a>
            <span>© 2026 Readlet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
