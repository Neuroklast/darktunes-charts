import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'

export const metadata = { title: 'Fan Vote · DarkTunes' }

export default function FanVotePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Fan Vote</h1>
              <HelpButton helpKey="fanVoting" />
            </div>
            <p className="text-muted-foreground">Quadratic Voting — 100 Voice Credits pro Monat</p>
          </div>
          <Badge variant="outline">100 Credits verfügbar</Badge>
        </div>

        <Card className="p-6 glassmorphism mb-6">
          <h2 className="font-semibold mb-2">💡 Wie funktioniert Quadratic Voting?</h2>
          <p className="text-sm text-muted-foreground">
            Je mehr Stimmen du auf EINEN Track konzentrierst, desto teurer wird es (Kosten = Stimmen²).
            Das verhindert, dass einzelne Fans das Ergebnis dominieren.{' '}
            <Link href="/how-it-works" className="text-accent hover:underline">
              Mehr erfahren →
            </Link>
          </p>
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground mb-4">
            Melde dich an, um Tracks zu bewerten und deine Voice Credits einzusetzen.
          </p>
          <Button asChild>
            <Link href="/api/auth/login">Anmelden</Link>
          </Button>
        </Card>
      </div>
    </main>
  )
}
