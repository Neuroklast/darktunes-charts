import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Band Dashboard · DarkTunes' }

export default async function BandDashboardPage() {
  const t = await getTranslations('dashboard.band')

  // In production: fetch real data via Prisma / Server Component
  const voterStructure = [
    { label: 'Fan Votes (QV)', count: 0, percent: 33 },
    { label: 'DJ Ballots', count: 0, percent: 33 },
    { label: 'Peer Reviews', count: 0, percent: 34 },
  ]

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <Badge variant="outline">Band</Badge>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('tier')}</p>
            <p className="text-3xl font-bold">Micro</p>
            <p className="text-xs text-muted-foreground mt-1">{t('followerRange')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('chartPosition')}</p>
            <p className="text-3xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">{t('combined')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">{t('superListeners')}</p>
              <HelpButton
                title={t('superListenerHelpTitle')}
                description={t('superListenerHelpDescription')}
                ariaLabel={t('superListenerHelpAriaLabel')}
              />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">{t('superListenerCriteria')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('djFeedback')}</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">{t('newComments')}</p>
          </Card>
        </div>

        {/* Voter structure */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t('voterStructure')}</h2>
            <HelpButton
              title={t('voterStructureHelpTitle')}
              description={t('voterStructureHelpDescription')}
              ariaLabel={t('voterStructureHelpAriaLabel')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {voterStructure.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{group.label}</span>
                  <Badge variant="secondary">{group.percent}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${group.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{group.count} {t('votes')}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Chart position trend */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t('chartTrend')}</h2>
            <HelpButton
              title={t('chartTrendHelpTitle')}
              description={t('chartTrendHelpDescription')}
              ariaLabel={t('chartTrendHelpAriaLabel')}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('noChartData')}
          </p>
        </Card>

        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            {t('registerPrompt')}
          </p>
        </Card>
      </div>
    </main>
  )
}
