import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz — Readlet",
};

// TODO: Vor Veröffentlichung Platzhalter (Kontakt, Hosting-Anbieter) mit
// echten Angaben ersetzen.
export default function DatenschutzPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold tracking-tight text-[var(--text)]">
        Datenschutzerklärung
      </h1>
      <p className="mt-3 text-[13px] text-[var(--text-subtle)]">
        Stand: 17. August 2026
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        1. Verantwortlicher
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        <br />
        Sebastian Falter
        <br />
        {/* [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
        <br /> */}
        E-Mail:{" "}
        <a
          href="mailto:platzhalter@example.com"
          className="text-[var(--primary)] hover:underline"
        >
          seb.falter@gmail.com
        </a>
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        2. Kein Tracking, keine Cookies
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Website verzichtet bewusst auf Cookies, Analyse- oder
        Tracking-Tools, Werbenetzwerke und externe Schriftarten. Es werden keine
        Nutzungsprofile erstellt und keine Daten an Dritte zu Werbe- oder
        Analysezwecken weitergegeben. Eingebunden werden nur Inhalte, die direkt
        von dieser Domain ausgeliefert werden.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        3. Hosting und Server-Logfiles
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Website wird bei [Platzhalter: Name und Anschrift des
        Hosting-Anbieters] gehostet. Beim Aufruf der Seite erhebt der
        Hosting-Anbieter automatisch sogenannte Server-Logfiles, die dein
        Browser übermittelt. Dazu gehören üblicherweise: IP-Adresse, Datum und
        Uhrzeit der Anfrage, aufgerufene Seite/Datei, Referrer-URL sowie
        Browsertyp und Betriebssystem. Diese Daten sind technisch erforderlich,
        um die Website auszuliefern und ihre Stabilität und Sicherheit zu
        gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
        (berechtigtes Interesse am sicheren und störungsfreien Betrieb der
        Website). Eine Zusammenführung mit anderen Datenquellen findet nicht
        statt; die genaue Speicherdauer richtet sich nach den Angaben des
        Hosting-Anbieters.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        4. Kontaktaufnahme per E-Mail
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Wenn du mich per E-Mail kontaktierst, werden deine Angaben zum Zweck der
        Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei mir
        gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern sich
        die Anfrage auf die Erfüllung eines Vertrags bezieht oder zur
        Durchführung vorvertraglicher Maßnahmen erforderlich ist, im Übrigen
        Art. 6 Abs. 1 lit. f DSGVO aufgrund meines berechtigten Interesses an
        der Beantwortung der Anfrage. Die Daten werden gelöscht, sobald sie für
        die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        5. Die Readlet-App
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Datenschutzerklärung gilt ausschließlich für diese Website. Die
        Readlet-App selbst speichert importierte Bücher und Lesefortschritt
        ausschließlich lokal auf deinem Gerät. Es gibt keinen Account, keine
        Cloud-Synchronisierung und keine Übertragung deiner Daten an von mir
        betriebene Server.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        6. Links zu externen Seiten
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Website verlinkt auf das Quellcode-Repository von Readlet auf
        GitHub. Beim Klick auf diesen Link verlässt du diese Website; für GitHub
        gilt dessen eigene Datenschutzerklärung. Der Link überträgt selbst keine
        Daten, solange du ihn nicht anklickst.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        7. Deine Rechte
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Du hast im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das
        Recht auf unentgeltliche Auskunft über deine gespeicherten
        personenbezogenen Daten, deren Herkunft und Empfänger sowie den Zweck
        der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder
        Löschung dieser Daten (Art. 15–18 DSGVO). Außerdem stehen dir ein Recht
        auf Datenübertragbarkeit (Art. 20 DSGVO), ein Widerspruchsrecht gegen
        Verarbeitungen auf Grundlage berechtigten Interesses (Art. 21 DSGVO)
        sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde (Art.
        77 DSGVO) zu. Bei Fragen zum Datenschutz kannst du dich jederzeit unter
        der oben genannten E-Mail-Adresse an mich wenden.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        8. SSL/TLS-Verschlüsselung
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Website wird über eine verschlüsselte HTTPS-Verbindung (SSL/TLS)
        ausgeliefert.
      </p>
    </article>
  );
}
