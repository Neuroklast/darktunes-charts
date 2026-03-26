import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Bot Detection · DarkTunes Admin' }

export default function BotDetectionAdminPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Bot Detection</h1>
          <Badge variant="destructive">Admin Only</Badge>
        </div>
        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">Keine aktiven Anomalie-Alerts.</p>
        </Card>
      </div>
    </main>
  )
}
