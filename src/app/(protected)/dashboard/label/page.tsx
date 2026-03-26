import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CsvExportButton } from '@/presentation/components/molecules/CsvExportButton'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'Label Dashboard · DarkTunes' }

const TREND_HELP = {
  title: 'Vote-Velocity erklärt',
  description:
    'Vote-Velocity misst, wie schnell eine Band neue Votes gewinnt im Vergleich zum Vormonat. Bands mit hoher Velocity haben Momentum — sie werden gerade entdeckt. Basiert auf dem AI-Prediction-Modul (Spec §9.4).',
}

const CONVERSION_HELP = {
  title: 'Konversionsrate erklärt',
  description:
    'Konversionsrate = Anteil aller Fan-Voter, die für mindestens eine deiner mandatierten Bands gestimmt haben. Hoch = deine Bands ziehen viele Fans an.',
}

const PEER_HELP = {
  title: 'Peer-Review-Analyse erklärt',
  description:
    'Zeigt, wie andere Bands die Artists deines Labels im Peer-Review bewertet haben. Hohe Peer-Scores signalisieren Anerkennung in der Musikergemeinschaft — ein starker Indikator für Nachhaltigkeit.',
}

export default function LabelDashboardPage() {
  // In production: fetch real data via Prisma / Server Component
  const trendScoutData = [
    { name: 'Band A', velocity: '+42%', tier: 'Micro', trending: true },
    { name: 'Band B', velocity: '+18%', tier: 'Emerging', trending: true },
    { name: 'Band C', velocity: '-5%', tier: 'Micro', trending: false },
  ]

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Label Dashboard</h1>
            <Badge>A&amp;R Analytics</Badge>
          </div>
          <CsvExportButton />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Mandatierte Bands</p>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">Konversionsrate</p>
              <HelpButton
                title={CONVERSION_HELP.title}
                description={CONVERSION_HELP.description}
                ariaLabel="Hilfe zur Konversionsrate"
              />
            </div>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-xs text-muted-foreground mt-1">Fan-Voter → Label-Bands</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Underground Finder</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Hohe QV-Konversionsrate</p>
          </Card>
        </div>

        {/* Trend scouting */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Trend Scouting — Vote Velocity</h2>
            <HelpButton
              title={TREND_HELP.title}
              description={TREND_HELP.description}
              ariaLabel="Hilfe zur Vote-Velocity"
            />
          </div>
          <div className="space-y-3">
            {trendScoutData.map((band) => (
              <div
                key={band.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{band.name}</span>
                  <Badge variant="outline" className="text-xs">{band.tier}</Badge>
                  {band.trending && (
                    <Badge variant="default" className="text-xs">🔥 Trending</Badge>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    band.velocity.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}
                  aria-label={`Vote-Velocity: ${band.velocity}`}
                >
                  {band.velocity}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Peer review analysis */}
        <Card className="p-6 glassmorphism">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Peer-Review-Analyse</h2>
            <HelpButton
              title={PEER_HELP.title}
              description={PEER_HELP.description}
              ariaLabel="Hilfe zur Peer-Review-Analyse"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            A&amp;R Predictive Analytics: Entdecke Underground-Künstler mit hohen QV-Konversionsraten
            und DJ Beatpath-Momentum, bevor sie mainstream werden.
          </p>
        </Card>
      </div>
    </main>
  )
}
