import { FileText } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * AGB / Terms of Service compliant with German consumer law.
 * Covers platform usage, voting rules, band submissions, copyright, liability,
 * and governing law. Placeholders marked [PLATZHALTER] must be filled by the operator.
 */
export function TermsContent() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-accent" weight="duotone" />
        <h2 className="font-display text-2xl font-bold tracking-tight">Nutzungsbedingungen (AGB)</h2>
      </div>
      <p className="text-xs text-muted-foreground">Stand: März 2025 · Version 1.0</p>

      <Card className="p-6 glassmorphism space-y-5">
        <section>
          <h3 className="font-semibold mb-2">§1 Geltungsbereich</h3>
          <p className="text-sm text-muted-foreground">
            Diese Nutzungsbedingungen gelten für die Plattform darkTunes Charts der darkTunes Music Group.
            Durch die Nutzung der Plattform erkennen Sie diese Bedingungen an.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§2 Leistungsbeschreibung</h3>
          <p className="text-sm text-muted-foreground">
            Die Plattform bietet ein demokratisches Musik-Chartsystem für die Dark-Music-Szene mit
            Quadratic Voting, Peer-Review und transparenten Algorithmen. Abstimmungen sind für Fans
            kostenlos. Bands zahlen eine monatliche Einreichungsgebühr gemäß Tier-Preisliste.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§3 Abstimmungsregeln und Integrität</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>3.1 Jeder Nutzer erhält 100 Stimmkredite pro Monat (Kosten: quadratisch — 1 Stimme = 1 Kredit, 10 Stimmen = 100 Kredite).</p>
            <p>3.2 Stimmenmanipulation (Bot-Einsatz, Absprachen, Kauf von Stimmen) ist verboten und führt zur Sperrung.</p>
            <p>3.3 Alle Abstimmungen werden pseudonymisiert im Transparenzprotokoll veröffentlicht.</p>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§4 Band-Einreichungen und Gebühren</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>4.1 Bands sind für die Rechtmäßigkeit ihrer eingereichten Inhalte verantwortlich.</p>
            <p>4.2 Die erste Kategorie ist kostenlos. Weitere Kategorien: Micro €5 · Emerging €15 · Established €35 · International €75 · Macro €150 je Kategorie/Monat.</p>
            <p>4.3 Einreichungsgebühren sind nicht erstattungsfähig.</p>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§5 Urheberrecht</h3>
          <p className="text-sm text-muted-foreground">
            Durch die Einreichung gewähren Bands eine nicht-exklusive Lizenz zur Darstellung auf der
            Plattform. Alle Urheberrechte verbleiben beim jeweiligen Rechteinhaber.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§6 Haftungsbeschränkung</h3>
          <p className="text-sm text-muted-foreground">
            Die Plattform haftet nicht für Richtigkeit von Streaming-Daten Dritter, technische Ausfälle
            oder Entscheidungen auf Basis von KI-Prognosen. KI-Prognosen stellen kein Vertragsangebot dar.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">§7 Geltendes Recht und Gerichtsstand</h3>
          <p className="text-sm text-muted-foreground">
            Es gilt ausschließlich deutsches Recht. Gerichtsstand ist [PLATZHALTER: Unternehmensstadt].
          </p>
        </section>
      </Card>
    </div>
  )
}
