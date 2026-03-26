import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Transparenz · DarkTunes' }

export default function TransparencyPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Algorithmische Transparenz</h1>
        <p className="text-muted-foreground mb-8">
          Vollständige Dokumentation aller Vote-Gewichtungsschritte
        </p>
        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            Der Transparenz-Log zeigt alle Vote-Gewichtungsschritte in Echtzeit.
            Jeder Eintrag dokumentiert Roh-Votes, Credit-Kosten, angewandte Gewichte und den finalen Beitrag.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Fan Votes (QV)', 'DJ Ballots (Schulze)', 'Peer Reviews (Anti-Kollusion)'].map((label) => (
              <Badge key={label} variant="outline" className="py-2 text-sm justify-center">
                {label}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
