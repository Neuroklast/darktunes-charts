import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Transparenz · DarkTunes' }

export default async function TransparencyPage() {
  const t = await getTranslations('transparency')

  const sections = [
    {
      key: 'qv',
      badge: 'Fan Voting',
      content: [
        { label: t('qv.costFormula'), text: t('qv.description') },
        { label: null, text: t('qv.whyFair') },
      ],
    },
    {
      key: 'schulze',
      badge: 'DJ Voting',
      content: [
        { label: null, text: t('schulze.description') },
        { label: 'Beatpath', text: t('schulze.beatpath') },
        { label: 'Burial-Sicherheit', text: t('schulze.burialProof') },
      ],
    },
    {
      key: 'combined',
      badge: '33/33/33',
      content: [
        { label: null, text: t('combined.description') },
        { label: 'Min-Max-Normalisierung', text: t('combined.normalization') },
        { label: 'Formel', text: t('combined.formula') },
      ],
    },
    {
      key: 'antiManipulation',
      badge: 'Security',
      content: [
        { label: 'Cliquen-Erkennung', text: t('antiManipulation.cliqueDetection') },
        { label: 'Triadic Census', text: t('antiManipulation.triadicCensus') },
        { label: 'Mahalanobis-Distanz', text: t('antiManipulation.mahalanobis') },
        { label: 'Intellektuelle Distanz', text: t('antiManipulation.intellectualDistance') },
      ],
    },
    {
      key: 'tierSystem',
      badge: 'Tiers',
      content: [
        { label: null, text: t('tierSystem.description') },
        { label: 'Schwellenwerte & Preise', text: t('tierSystem.thresholds') },
        { label: 'Algorithmische Entkopplung', text: t('tierSystem.decoupling') },
      ],
    },
    {
      key: 'randomBand',
      badge: 'Daily',
      content: [
        { label: null, text: t('randomBand.description') },
        { label: 'Seed-Mechanismus', text: t('randomBand.seed') },
      ],
    },
  ] as const

  const sectionTitles: Record<string, string> = {
    qv: t('qv.title'),
    schulze: t('schulze.title'),
    combined: t('combined.title'),
    antiManipulation: t('antiManipulation.title'),
    tierSystem: t('tierSystem.title'),
    randomBand: t('randomBand.title'),
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.key} className="p-6 glassmorphism">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">{sectionTitles[section.key]}</h2>
                <Badge variant="outline">{section.badge}</Badge>
              </div>
              <div className="space-y-3">
                {section.content.map((item, idx) => (
                  <div key={idx}>
                    {item.label && (
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
