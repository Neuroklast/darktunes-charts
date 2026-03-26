import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export const metadata = { title: 'Fan Dashboard · DarkTunes' }

export default function FanDashboardPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Fan Dashboard</h1>
          <Badge>Fan</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Voice Credits</p>
            <p className="text-3xl font-bold">100</p>
            <Progress value={100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">100 / 100 verfügbar</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Abgegebene Votes</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Diesen Monat</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Entdeckerquote</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Frühe Votes auf Top-10 Tracks</p>
          </Card>
        </div>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            Melde dich an, um deine Voting-Historie und Statistiken zu sehen.
          </p>
        </Card>
      </div>
    </main>
  )
}
