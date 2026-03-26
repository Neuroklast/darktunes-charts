import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Band Dashboard · DarkTunes' }

export default function BandDashboardPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Band Dashboard</h1>
          <Badge variant="outline">Band</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Tier</p>
            <p className="text-3xl font-bold">Micro</p>
            <p className="text-xs text-muted-foreground mt-1">0–1.000 Listener</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Chart-Platz</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Kombiniert</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Super Listener</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Max QV-Budget investiert</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">DJ Feedback</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Neue Kommentare</p>
          </Card>
        </div>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            Registriere deine Band und reiche Tracks ein, um im Dashboard zu erscheinen.
          </p>
        </Card>
      </div>
    </main>
  )
}
