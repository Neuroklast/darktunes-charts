import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CsvExportButton } from '@/presentation/components/molecules/CsvExportButton'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'Label Dashboard · DarkTunes' }

export default async function LabelDashboardPage() {
  const t = await getTranslations('dashboard.label')

  // In production: fetch real data via Prisma / Server Component
  const trendScoutData = [
    { name: 'Band A', velocity: '+42%', tier: 'Micro', trending: true },
    { name: 'Band B', velocity: '+18%', tier: 'Emerging', trending: true },
    { name: 'Band C', velocity: '-5%', tier: 'Micro', trending: false },
  ]

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <Badge>{t('arAnalytics')}</Badge>
          </div>
          <CsvExportButton />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('mandatedBands')}</p>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">{t('conversionRate')}</p>
              <HelpButton
                title={t('conversionHelpTitle')}
                description={t('conversionHelpDescription')}
                ariaLabel={t('conversionHelpAriaLabel')}
              />
            </div>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-xs text-muted-foreground mt-1">{t('conversionSubtext')}</p>
          </Card>
          <Card className="p-6 glassmorphism">
            <p className="text-sm text-muted-foreground mb-1">{t('undergroundFinder')}</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">{t('highQvConversion')}</p>
          </Card>
        </div>

        {/* Trend scouting */}
        <Card className="p-6 glassmorphism mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t('trendScouting')}</h2>
            <HelpButton
              title={t('trendHelpTitle')}
              description={t('trendHelpDescription')}
              ariaLabel={t('trendHelpAriaLabel')}
            />
          </div>
          <div className="space-y-3">
            {trendScoutData.map((band) => (
              <div
                key={band.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{band.name}</span>
                  <Badge variant="outline" className="text-xs">{band.tier}</Badge>
                  {band.trending && (
                    <Badge variant="default" className="text-xs">{t('trending')}</Badge>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    band.velocity.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}
                  aria-label={t('voteVelocityAriaLabel', { velocity: band.velocity })}
                >
                  {band.velocity}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Peer review analysis */}
        <Card className="p-6 glassmorphism">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t('peerReview')}</h2>
            <HelpButton
              title={t('peerHelpTitle')}
              description={t('peerHelpDescription')}
              ariaLabel={t('peerHelpAriaLabel')}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('peerDescription')}
          </p>
        </Card>
      </div>
    </main>
  )
}
