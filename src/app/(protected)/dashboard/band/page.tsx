import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'Band Dashboard · DarkTunes' }

const VOTER_STRUCTURE_HELP = {
  title: 'Voter-Struktur erklärt',
  description:
    'Die Voter-Struktur zeigt, welche Gruppen für deine Band gestimmt haben:\n\n• Fan Votes: Quadratic Voting, 100 Credits/Monat\n• DJ Ballots: Schulze-Methode, Ranglisten-Ballots\n• Peer Reviews: Band-Peer-Review mit Anti-Kollusions-Algorithmus\n\nDie Combined Charts gewichten alle drei Gruppen gleich (je 33,3 %).',
}

const SUPER_LISTENER_HELP = {
  title: 'Super Listener',
  description:
    'Super Listener sind Fans, die in mindestens 3 aufeinanderfolgenden Monaten für deine Band gestimmt haben und dabei ihr QV-Budget zu mehr als 50% eingesetzt haben. Sie sind deine treuesten Unterstützer.',
}

const CHART_TREND_HELP = {
  title: 'Chart-Position Trend',
  description:
    'Zeigt deine kombinierten Chart-Platzierungen der letzten 6 Monate. Niedrigere Werte = bessere Platzierung. Ein sinkender Trend bedeutet, dass du dich verbesserst.',
}

export default function BandDashboardPage() {
  // In production: fetch real data via Prisma / Server Component
  const voterStructure = [
    { label: 'Fan Votes (QV)', count: 0, percent: 33 },
    { label: 'DJ Ballots', count: 0, percent: 33 },
    { label: 'Peer Reviews', count: 0, percent: 34 },
  ]

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Band Dashboard</h1>
          <Badge variant="outline">Band</Badge>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Tier</p>
            <p className="text-3xl font-bold">Micro</p>
            <p className="text-xs text-muted-foreground mt-1">0–10.000 Follower</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Chart-Platz</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Kombiniert</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">Super Listener</p>
              <HelpButton
                title={SUPER_LISTENER_HELP.title}
                description={SUPER_LISTENER_HELP.description}
                ariaLabel="Hilfe zu Super Listener"
              />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">≥3 Monate, &gt;50% Budget</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">DJ Feedback</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Neue Kommentare</p>
          </Card>
        </div>

        {/* Voter structure */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Voter-Struktur</h2>
            <HelpButton
              title={VOTER_STRUCTURE_HELP.title}
              description={VOTER_STRUCTURE_HELP.description}
              ariaLabel="Hilfe zur Voter-Struktur"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {voterStructure.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{group.label}</span>
                  <Badge variant="secondary">{group.percent}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${group.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{group.count} Votes</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart position trend */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Chart-Position Trend</h2>
            <HelpButton
              title={CHART_TREND_HELP.title}
              description={CHART_TREND_HELP.description}
              ariaLabel="Hilfe zum Chart-Trend"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Keine Chart-Daten verfügbar. Registriere deine Band und reiche Tracks ein.
          </p>
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            Registriere deine Band und reiche Tracks ein, um im Dashboard zu erscheinen.
          </p>
        </Card>
      </div>
    </main>
  )
}
