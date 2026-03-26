import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'Band Peer Vote · DarkTunes' }

const BAND_VOTE_HELP = {
  title: 'Wie erkennt das System Voting-Zirkel?',
  description:
    'Drei Sicherheitsschichten schützen vor koordinierter Manipulation:\n\n1. Cliquen-Erkennung: Gegenseitige Votes (A→B und B→A) werden abgewertet.\n2. Mahalanobis-Distanz: Outlier-Voter werden identifiziert und weniger gewichtet.\n3. Triadic Census: Geschlossene Dreiecke (A→B→C→A) erhalten einen Penalty von 0,7× pro Dreieck.\n\nMehr intellektuelle Diversität beim Voten (verschiedene Genres, Regionen) erhöht das Gewicht deiner Stimme um bis zu 15 %.',
}

export default function BandVotePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Band Peer Review</h1>
            <HelpButton
              title={BAND_VOTE_HELP.title}
              description={BAND_VOTE_HELP.description}
              ariaLabel="Hilfe zu Anti-Kollusions-Maßnahmen"
            />
          </div>
          <p className="text-muted-foreground">Anti-Kollusions-Algorithmus mit Mahalanobis-Distanz</p>
        </div>

        <Card className="p-6 glassmorphism mb-6">
          <h2 className="font-semibold mb-2">🔄 Peer Voting erklärt</h2>
          <p className="text-sm text-muted-foreground">
            Bands bewerten sich gegenseitig. Voting-Ringe werden durch Cliquen-Erkennung abgewertet.
            Mahalanobis-Distanz identifiziert statistische Ausreißer.{' '}
            <Link href="/how-it-works" className="text-accent hover:underline">
              Mehr erfahren →
            </Link>
          </p>
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground mb-4">
            Band Peer-Voting erfordert ein verifiziertes Band-Konto.
          </p>
          <Button asChild>
            <Link href="/api/auth/login">Anmelden</Link>
          </Button>
        </Card>
      </div>
    </main>
  )
}
