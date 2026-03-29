import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'DJ Vote · DarkTunes' }

export default function DJVotePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">DJ Ballot</h1>
              <HelpButton helpKey="djBallot" />
            </div>
            <p className="text-muted-foreground">Schulze-Methode — Ranked-Choice Voting</p>
          </div>
          <Badge variant="secondary">DJ Verifiziert erforderlich</Badge>
        </div>

        <Card className="p-6 glassmorphism mb-6">
          <h2 className="font-semibold mb-2">🎛 Schulze-Methode erklärt</h2>
          <p className="text-sm text-muted-foreground">
            Ordne Tracks in deine bevorzugte Reihenfolge. Der Beatpath-Algorithmus findet den
            Condorcet-Sieger — strategisches Burial ist mathematisch unmöglich.{' '}
            <Link href="/how-it-works" className="text-accent hover:underline">
              Mehr erfahren →
            </Link>
          </p>
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground mb-4">
            DJ-Voting erfordert eine verifizierte DJ-Identität (KYC-Prozess).
          </p>
          <Button asChild>
            <Link href="/api/auth/login">Anmelden</Link>
          </Button>
        </Card>
      </div>
    </main>
  )
}
