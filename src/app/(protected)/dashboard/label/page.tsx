import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CsvExportButton } from '@/presentation/components/molecules/CsvExportButton'

export const metadata = { title: 'Label Dashboard · DarkTunes' }

export default function LabelDashboardPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Label Dashboard</h1>
            <Badge>A&amp;R Analytics</Badge>
          </div>
          {/* Label A&R CSV Export — Spec §9.4 */}
          <CsvExportButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Mandatierte Bands</p>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">Underground Finder</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Hohe QV-Konversionsrate</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">DJ Beatpath Trends</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Trending Artists</p>
          </Card>
        </div>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            A&amp;R Predictive Analytics: Entdecke Underground-Künstler mit hohen QV-Konversionsraten
            und DJ Beatpath-Momentum, bevor sie mainstream werden.
          </p>
        </Card>
      </div>
    </main>
  )
}
