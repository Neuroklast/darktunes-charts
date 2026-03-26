import { Suspense } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'Charts · DarkTunes' }

const COMBINED_HELP = {
  title: 'Wie werden Combined Charts berechnet?',
  description:
    'Die Combined Charts aggregieren drei unabhängige Voting-Systeme mit gleichen Gewichten (je 33,3 %):\n\n• Fan-Score: Quadratic Voting – 100 Credits pro Monat\n• DJ-Score: Schulze-Methode – Ranked-Choice Ballots\n• Peer-Score: Band-Peer-Review – Anti-Kollusions-Algorithmus\n\nJeder Score wird vor der Kombination Min-Max-normalisiert, sodass keine Gruppe dominieren kann.',
}

const TIER_HELP = {
  title: 'Das Tier-System erklärt',
  description:
    'Tiers basieren auf monatlichen Spotify-Streamzahlen:\n\n• MAJOR: > 1.000.000 Streams/Monat\n• INDIE: 100.000 – 1.000.000 Streams/Monat\n• MICRO: 10.000 – 100.000 Streams/Monat\n• UNDERGROUND: < 10.000 Streams/Monat\n\nDas Tier-System verhindert, dass Major-Labels kleinere Bands verdrängen. Voting-Pools sind nach Tiers getrennt.',
}

export default function ChartsPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-4xl font-bold">Charts</h1>
          <HelpButton
            title={TIER_HELP.title}
            description={TIER_HELP.description}
            ariaLabel="Hilfe zum Tier-System"
          />
        </div>
        <p className="text-muted-foreground mb-8">
          Aggregierte Ergebnisse aus Fan-Voting, DJ-Ballots und Peer-Reviews
        </p>
        <Tabs defaultValue="combined">
          <TabsList className="mb-6">
            <TabsTrigger value="fan">Fan Charts</TabsTrigger>
            <TabsTrigger value="dj">DJ Charts</TabsTrigger>
            <TabsTrigger value="band">Band Peer</TabsTrigger>
            <TabsTrigger value="combined">
              <span className="flex items-center gap-1">
                Combined (33/33/33)
                <HelpButton
                  title={COMBINED_HELP.title}
                  description={COMBINED_HELP.description}
                  ariaLabel="Hilfe zu Combined Charts"
                />
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fan">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartPlaceholder label="Fan Charts" description="Basierend auf Quadratic Voting — 100 Voice Credits pro Fan pro Monat" />
            </Suspense>
          </TabsContent>
          <TabsContent value="dj">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartPlaceholder label="DJ Charts" description="Schulze-Methode — Condorcet-Sieger aus DJ Ranked-Choice Ballots" />
            </Suspense>
          </TabsContent>
          <TabsContent value="band">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartPlaceholder label="Band Peer Review" description="Kollusionsbereinigte Peer-Bewertungen mit Cliquen-Erkennung" />
            </Suspense>
          </TabsContent>
          <TabsContent value="combined">
            <Suspense fallback={<ChartSkeleton />}>
              <ChartPlaceholder label="Combined Charts" description="33.3% Fan + 33.3% DJ + 33.3% Peer — Min-Max-normalisiert" />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

function ChartPlaceholder({ label, description }: { label: string; description: string }) {
  return (
    <Card className="p-8 text-center glassmorphism">
      <h2 className="text-2xl font-bold mb-2">{label}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      <p className="text-sm text-muted-foreground/60">
        Daten werden aus der Datenbank geladen, sobald Votes eingereicht wurden.
      </p>
    </Card>
  )
}
