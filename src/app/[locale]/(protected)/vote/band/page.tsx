import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Band Peer Vote · DarkTunes' }

/**
 * The Band Peer Review pillar has been removed from the platform concept.
 *
 * After evaluation, the 3-pillar model (Fan 33 % / DJ 33 % / Peer 34 %) was
 * found to be too susceptible to collusion even with anti-manipulation
 * measures, and added conceptual complexity without improving chart quality.
 *
 * Charts are now computed exclusively from:
 *  - Fan Quadratic Voting (50 %)
 *  - Verified DJ Schulze Ballots (50 %)
 */
export default function BandVotePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Band Peer Review</h1>
          <p className="text-muted-foreground mt-1">Diese Funktion wurde entfernt</p>
        </div>

        <Card className="p-8 glassmorphism text-center space-y-4">
          <p className="text-muted-foreground">
            Das Band-Peer-Review-Pillar wurde aus dem Plattform-Konzept entfernt.
            Die Charts werden ausschließlich durch <strong className="text-foreground">Fan Quadratic Voting (50 %)</strong> und{' '}
            <strong className="text-foreground">verifizierte DJ-Ballots (50 %)</strong> berechnet.
          </p>
          <Button asChild variant="outline">
            <Link href="/transparency">Transparenz-Seite ansehen</Link>
          </Button>
        </Card>
      </div>
    </main>
  )
}
