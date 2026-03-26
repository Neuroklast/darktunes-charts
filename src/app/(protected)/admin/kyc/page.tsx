import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'KYC-Verifizierung · DarkTunes Admin' }

export default function KYCPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">KYC-Verifizierung</h1>
          <Badge variant="destructive">Admin Only</Badge>
        </div>
        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">Keine ausstehenden KYC-Anträge.</p>
        </Card>
      </div>
    </main>
  )
}
