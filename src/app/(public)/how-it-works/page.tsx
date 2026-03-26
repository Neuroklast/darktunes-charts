import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export const metadata = { title: 'Wie funktioniert es? · DarkTunes' }

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Wie funktioniert das System?</h1>
        <p className="text-muted-foreground mb-8">
          Verständliche Erklärung aller Algorithmen — für Fans, DJs und Bands
        </p>

        <Tabs defaultValue="qv">
          <TabsList className="flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="qv">Quadratic Voting</TabsTrigger>
            <TabsTrigger value="schulze">Schulze-Methode</TabsTrigger>
            <TabsTrigger value="peer">Peer Voting</TabsTrigger>
            <TabsTrigger value="mahalanobis">Outlier-Erkennung</TabsTrigger>
            <TabsTrigger value="tiers">Tier-System</TabsTrigger>
            <TabsTrigger value="combined">Combined Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="qv">
            <AlgorithmSection
              title="Quadratic Voting (QV)"
              badge="Fan Voting"
              summary="Je mehr Stimmen du auf EINEN Track konzentrierst, desto teurer wird es. Das verhindert, dass ein einziger reicher Fan das Ergebnis dominiert."
              details={[
                'Du erhältst jeden Monat 100 Voice Credits.',
                '1 Stimme für Track A kostet 1² = 1 Credit',
                '5 Stimmen für Track A kosten 5² = 25 Credits',
                '10 Stimmen für Track A kosten 10² = 100 Credits (= all-in)',
                'Verteile deine Credits klug: 5 Stimmen × 4 Tracks = 100 Credits (gleicher Wert wie 10 Stimmen für 1 Track, aber breitere Unterstützung)',
              ]}
              example="Beispiel: Du hast 100 Credits. Du kannst 10 Stimmen für EINEN Track ausgeben — oder 5 Stimmen für VIER Tracks. Die Wahl liegt bei dir."
            />
          </TabsContent>

          <TabsContent value="schulze">
            <AlgorithmSection
              title="Schulze-Methode (Beatpath)"
              badge="DJ Voting"
              summary="DJs reichen eine Rangliste ein, nicht einzelne Stimmen. Der Algorithmus findet den Künstler, der in den meisten paarweisen Vergleichen gewinnt."
              details={[
                'Jeder DJ ordnet alle Tracks in eine bevorzugte Reihenfolge.',
                'Das System vergleicht jeden Track paarweise mit jedem anderen.',
                'Der Condorcet-Sieger ist der Track, der ALLE anderen in der Mehrheit schlägt.',
                'Beatpath-Algorithmus (Floyd-Warshall) findet den stärksten Pfad zwischen je zwei Tracks.',
                'Strategisches Burial ist mathematisch unmöglich: Du kannst deinen Favoriten nicht durch künstlich schlechte Bewertung anderer verbessern.',
              ]}
              example="Beispiel: Track A schlägt Track B in 70% der Ballots. Track B schlägt Track C in 80%. Beatpath A→C ist min(70%, 80%) = 70%. Das ist der indirekte Beatpath."
            />
          </TabsContent>

          <TabsContent value="peer">
            <AlgorithmSection
              title="Peer Voting (Anti-Kollusion)"
              badge="Band Voting"
              summary="Bands bewerten sich gegenseitig, aber Voting-Ringe werden automatisch erkannt und abgewertet."
              details={[
                'Jede Band kann andere Bands bewerten (aber nicht sich selbst).',
                'Das System erkennt gegenseitiges Voting (A→B und B→A).',
                'Jede gegenseitige Verbindung reduziert das Gewicht um 15%.',
                'Minimum-Gewicht: 40% (ein Vote wird nie vollständig ignoriert).',
                'Triadic Census erkennt geschlossene Dreiecke (A→B→C→A) und reduziert deren Gewicht zusätzlich.',
              ]}
              example="Beispiel: Band A und Band B haben sich gegenseitig gevoted, und beide haben Band C gevoted. Das reduziert das Gewicht dieser Votes deutlich."
            />
          </TabsContent>

          <TabsContent value="mahalanobis">
            <AlgorithmSection
              title="Outlier-Erkennung (Mahalanobis-Distanz)"
              badge="Peer Voting Schutz"
              summary="Statistisches Verfahren das Voting-Muster erkennt, die zu weit vom Durchschnitt abweichen."
              details={[
                'Jedes Voting-Muster wird als Vektor dargestellt.',
                'Die Kovarianzmatrix misst die normale Streuung aller Muster.',
                'Mahalanobis-Distanz misst, wie weit ein Muster vom Durchschnitt liegt.',
                'Sehr hohe Distanz (> 3σ) = verdächtiger Ausreißer → reduziertes Gewicht.',
                'Im Gegensatz zur einfachen euklidischen Distanz berücksichtigt Mahalanobis die Korrelation zwischen Variablen.',
              ]}
              example="Vereinfacht: Wenn alle Bands hauptsächlich andere Bands ihres Genres wählen, aber Band X plötzlich ausschließlich Bands eines bestimmten Labels wählt, flaggt das System dies als Outlier."
            />
          </TabsContent>

          <TabsContent value="tiers">
            <AlgorithmSection
              title="Tier-System (5 Stufen)"
              badge="Band-Klassifizierung"
              summary="Bands werden nach Spotify Monthly Listeners in 5 Tiers klassifiziert, die ihre Einreichungskosten und Möglichkeiten bestimmen."
              details={[
                'Tier 1 (Micro): 0–1.000 Listener — Kostenloses Einreichen in 1 Kategorie',
                'Tier 2 (Emerging): 1.001–10.000 Listener — Reduzierte Kosten',
                'Tier 3 (Established): 10.001–100.000 Listener — Standardpreise',
                'Tier 4 (International): 100.001–1.000.000 Listener — Höhere Kosten',
                'Tier 5 (Macro): >1.000.000 Listener — Maximale Kosten (Schutz kleiner Künstler)',
              ]}
              example="Warum? Große Künstler haben mehr Marketing-Budget. Ohne Tier-System würden sie Nischen-Charts dominieren, obwohl sie auf globalen Plattformen bereits sichtbar sind."
            />
          </TabsContent>

          <TabsContent value="combined">
            <AlgorithmSection
              title="Combined Charts (33/33/33)"
              badge="Gesamtwertung"
              summary="Fan-Score, DJ-Score und Peer-Score werden gleichgewichtet zu einem Gesamtranking kombiniert."
              details={[
                'Schritt 1: Alle Fan-Scores werden Min-Max-normalisiert auf [0, 1]',
                'Schritt 2: Alle DJ-Scores werden Min-Max-normalisiert auf [0, 1]',
                'Schritt 3: Alle Peer-Scores werden Min-Max-normalisiert auf [0, 1]',
                'Schritt 4: Combined = 0.333 × Fan + 0.333 × DJ + 0.333 × Peer',
                'Keine Gruppe kann das Ergebnis allein dominieren — echte demokratische Balance',
              ]}
              example="Beispiel: Track A hat Fan-Score 0.9, DJ-Score 0.3, Peer-Score 0.6. Combined = 0.333×0.9 + 0.333×0.3 + 0.333×0.6 = 0.6 — eine solide Mittelposition."
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function AlgorithmSection({
  title, badge, summary, details, example,
}: {
  title: string
  badge: string
  summary: string
  details: string[]
  example: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <Card className="p-6 glassmorphism">
        <p className="text-lg mb-4">{summary}</p>
        <ul className="space-y-2 mb-4">
          {details.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-accent mt-0.5">▸</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <Card className="p-4 bg-muted/30 border-accent/20">
          <p className="text-sm font-medium text-accent mb-1">Beispiel</p>
          <p className="text-sm text-muted-foreground">{example}</p>
        </Card>
      </Card>
    </div>
  )
}
