import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum · DarkTunes',
  description: 'Impressum von DarkTunes gemäß § 5 TMG.',
}

/**
 * Impressum (Legal Notice) — required by German law (§ 5 TMG).
 * Must contain name/address of the responsible person and contact details.
 * A production deployment requires valid legal data filled in.
 */
export default function ImprintPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-2xl mx-auto prose prose-invert prose-sm">

        <h1>Impressum</h1>
        <p className="text-white/50 text-xs">Angaben gemäß § 5 TMG</p>

        <h2>Betreiber</h2>
        <p>
          DarkTunes Community Charts<br />
          [Name des Betreibers]<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort], Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: kontakt@darktunes.com<br />
          Webseite: https://darktunes.com
        </p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          [Name und Anschrift des Verantwortlichen]
        </p>

        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          https://ec.europa.eu/consumers/odr/. Wir sind nicht verpflichtet und nicht bereit,
          an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftungsausschluss</h2>
        <h3>Haftung für Inhalte</h3>
        <p>
          Als Dienstanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
          Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind
          wir als Dienstanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
          fremde Informationen zu überwachen.
        </p>

        <h3>Urheberrecht</h3>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
          gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
          der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
          schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </div>
    </main>
  )
}
