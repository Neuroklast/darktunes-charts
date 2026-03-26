'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'
import type { AchievementPillar } from '@/domain/achievements/index'
import { AchievementBadge } from '@/presentation/components/molecules/AchievementBadge'

type PillarFilter = AchievementPillar | 'ALL'

const PILLARS: PillarFilter[] = ['ALL', 'FAN', 'BAND', 'DJ', 'LABEL']

interface AchievementGridProps {
  pillar?: AchievementPillar
  userId?: string
  earnedSlugs: Set<string>
}

/**
 * AchievementGrid — Filterable grid of achievement badges.
 *
 * Accepts a pre-computed earnedSlugs set from the parent (no internal fetch).
 * Filter buttons allow narrowing by pillar. Each badge stagger-animates in
 * with a 30ms delay per item. Respects prefers-reduced-motion.
 */
export function AchievementGrid({ pillar, earnedSlugs }: AchievementGridProps) {
  const [activeFilter, setActiveFilter] = useState<PillarFilter>(pillar ?? 'ALL')
  const shouldReduceMotion = useReducedMotion()

  const filtered = useMemo(
    () =>
      activeFilter === 'ALL'
        ? ACHIEVEMENT_DEFINITIONS
        : ACHIEVEMENT_DEFINITIONS.filter((d) => d.pillar === activeFilter),
    [activeFilter],
  )

  return (
    <div className="space-y-4">
      {/* Pillar filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {PILLARS.map((p) => (
          <button
            key={p}
            onClick={() => setActiveFilter(p)}
            className={[
              'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors',
              activeFilter === p
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/70 border border-transparent',
            ].join(' ')}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((def, i) => (
          <motion.div
            key={def.slug}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : i * 0.03, duration: 0.25 }}
          >
            <AchievementBadge
              slug={def.slug}
              pillar={def.pillar}
              rarity={def.rarity}
              iconKey={def.iconKey}
              titleDe={def.titleDe}
              earned={earnedSlugs.has(def.slug)}
              locked={!earnedSlugs.has(def.slug)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
