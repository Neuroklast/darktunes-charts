import { Info } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * Impressum page content compliant with §5 TMG and §55 RStV.
 *
 * German commercial websites are legally required to publish an Impressum
 * (legal notice) that is reachable within two clicks from any page.
 * Placeholders marked with [PLATZHALTER] must be filled in by the operator.
 */
export function ImpressumContent() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Info className="w-6 h-6 text-accent" weight="duotone" />
        <h2 className="font-display text-2xl font-bold tracking-tight">Impressum</h2>
      </div>
      <p className="text-xs text-muted-foreground">Pflichtangaben gemäß §5 TMG und §55 Abs. 2 RStV</p>
      <Card className="p-6 glassmorphism space-y-4">
        <section>
          <h3 className="font-semibold mb-2">Anbieter</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            darkTunes Music Group<br />
            [PLATZHALTER: Straße und Hausnummer]<br />
            [PLATZHALTER: PLZ] [PLATZHALTER: Stadt]<br />
            Deutschland
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Kontakt</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            E-Mail: legal@darktunes.de<br />
            Telefon: [PLATZHALTER: Telefonnummer]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Vertretungsberechtigte Person</h3>
          <p className="text-sm text-muted-foreground">
            [PLATZHALTER: Vor- und Nachname des Geschäftsführers / der Geschäftsführerin]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Registereintrag</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Registergericht: [PLATZHALTER: Amtsgericht Stadt]<br />
            Registernummer: [PLATZHALTER: HRB/HRA-Nummer]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Umsatzsteuer-Identifikationsnummer</h3>
          <p className="text-sm text-muted-foreground">
            Gemäß §27a UStG: [PLATZHALTER: DE-Nummer]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Verantwortlich für den Inhalt (§55 Abs. 2 RStV)</h3>
          <p className="text-sm text-muted-foreground">
            [PLATZHALTER: Name und Anschrift der verantwortlichen Person]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Streitschlichtung</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-accent underline">
              https://ec.europa.eu/consumers/odr
            </a>.<br /><br />
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">Haftungsausschluss</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Haftung für Inhalte:</strong> Als Diensteanbieter sind wir gemäß §7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für Inhalte, die von Bands oder Nutzern eingereicht wurden, übernehmen wir keine Haftung.<br /><br />
            <strong>Urheberrecht:</strong> Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Beiträge Dritter (Songtitel, Bandnamen, Albumcover) sind Eigentum der jeweiligen Rechteinhaber.
          </p>
        </section>
      </Card>
    </div>
  )
}
