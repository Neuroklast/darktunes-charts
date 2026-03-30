'use client'

import { useTranslations } from 'next-intl'
import { DemoBanner } from '@/presentation/components/molecules/DemoBanner'

/**
 * Client wrapper for the demo data banner on the charts page.
 * Uses next-intl translations and renders a dismissible warning.
 */
export function DemoBannerWrapper() {
  const t = useTranslations('demo')

  return (
    <div className="mb-4">
      <DemoBanner
        message={t('chartsBanner')}
        dismissLabel={t('dismiss')}
      />
    </div>
  )
}
