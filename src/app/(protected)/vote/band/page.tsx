import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Band Peer Vote · DarkTunes' }

export default function BandVotePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Band Peer Review</h1>
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
