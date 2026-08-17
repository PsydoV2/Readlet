import type { Metadata } from "next";
import { REPO_URL } from "../../site-config";

export const metadata: Metadata = {
  title: "Impressum — Readlet",
};

// TODO: Vor Veröffentlichung mit echten Angaben ersetzen (Name, Anschrift,
// E-Mail). Ohne diese Angaben ist das Impressum nicht rechtsgültig.
export default function ImpressumPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold tracking-tight text-[var(--text)]">
        Impressum
      </h1>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Sebastian Falter
        {/* <br />
        [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
        <br />
        [Land] */}
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        Kontakt
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        E-Mail:{" "}
        <a
          href="mailto:platzhalter@example.com"
          className="text-[var(--primary)] hover:underline"
        >
          seb.falter@gmail.com
        </a>
      </p>

      <p className="mt-8 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Readlet ist ein privates, nicht-kommerzielles Hobbyprojekt. Es werden
        über diese Seite keine Waren oder Dienstleistungen gegen Entgelt
        angeboten.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        Haftung für Inhalte
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf
        diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8
        bis 10 DDG bin ich als Diensteanbieter jedoch nicht verpflichtet,
        übermittelte oder gespeicherte fremde Informationen zu überwachen oder
        nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
        hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
        Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
        Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
        Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von
        entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend
        entfernen.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        Haftung für Links
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Diese Seite enthält Links zu externen Websites Dritter (z. B. zum
        Quellcode-Repository auf GitHub), auf deren Inhalte ich keinen Einfluss
        habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr
        übernehmen. Für die Inhalte der verlinkten Seiten ist stets der
        jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die
        verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
        Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
        Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der
        verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
        Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
        Rechtsverletzungen werde ich derartige Links umgehend entfernen.
      </p>

      <h2 className="mt-10 text-[19px] font-semibold text-[var(--text)]">
        Urheberrecht
      </h2>
      <p className="mt-3 text-[15px] leading-[24px] text-[var(--text-muted)]">
        Die durch mich erstellten Inhalte und Werke auf dieser Website
        unterliegen dem deutschen Urheberrecht. Der Quellcode der Readlet-App
        steht unter der MIT-Lizenz und ist auf{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] hover:underline"
        >
          GitHub
        </a>{" "}
        einsehbar.
      </p>
    </article>
  );
}
