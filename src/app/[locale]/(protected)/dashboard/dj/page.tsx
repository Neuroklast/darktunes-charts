import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DJFeedbackForm } from '@/presentation/components/molecules/DJFeedbackForm'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'DJ Dashboard · DarkTunes' }

// Example band for demonstration; in production loaded via Prisma
const EXAMPLE_BAND = { id: 'band-example-001', name: 'Nightwish' }

export default async function DJDashboardPage() {
  const t = await getTranslations('dashboard.dj')

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <Badge variant="secondary">DJ</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('rankingScore')}</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">{t('scoreDescription')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('submittedBallots')}</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">{t('thisMonth')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('predictiveAccuracy')}</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">{t('vsFinalResult')}</p>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          <Button asChild>
            <Link href="/vote/dj">{t('submitBallotLink')}</Link>
          </Button>
        </div>

        {/* DJ Feedback System — Spec §9.2 */}
        <Card className="p-6 glassmorphism mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('feedback.title')}</h2>
          <DJFeedbackForm
            bandId={EXAMPLE_BAND.id}
            bandName={EXAMPLE_BAND.name}
          />
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            {t('noBallots')}
          </p>
        </Card>
      </div>
    </main>
  )
}
