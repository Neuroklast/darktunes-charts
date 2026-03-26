'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { AchievementPillar, AchievementRarity } from '@/domain/achievements/index'
import { PILLAR_COLOR, RARITY_COLOR } from '@/domain/achievements/index'

interface AchievementBadgeProps {
  slug: string
  pillar: AchievementPillar
  rarity: AchievementRarity
  iconKey: string
  titleDe: string
  earned: boolean
  grantedAt?: Date | null
  locked?: boolean
}

const RARITY_LABEL: Record<AchievementRarity, string> = {
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
}

/**
 * AchievementBadge — Displays a single achievement with earn state.
 *
 * Animates with a glow pulse when first earned (earned: false → true transition).
 * Locked / unearned badges are rendered at reduced opacity with a grayscale filter.
 * All animations respect prefers-reduced-motion via Framer Motion's useReducedMotion.
 */
export function AchievementBadge({
  pillar,
  rarity,
  iconKey,
  titleDe,
  earned,
  locked = false,
}: AchievementBadgeProps) {
  const shouldReduceMotion = useReducedMotion()
  const rarityColor = RARITY_COLOR[rarity]
  const pillarColor = PILLAR_COLOR[pillar]

  const earnedAnimation = shouldReduceMotion
    ? {}
    : {
        scale: [0.8, 1.1, 1],
        boxShadow: [
          `0 0 0px ${rarityColor}00`,
          `0 0 20px ${rarityColor}80`,
          `0 0 8px ${rarityColor}40`,
        ],
      }

  return (
    <motion.div
      className="relative bg-[#141414] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2"
      style={{
        opacity: locked || !earned ? 0.4 : 1,
        filter: locked || !earned ? 'grayscale(1)' : 'none',
        borderColor: earned ? `${rarityColor}60` : undefined,
      }}
      animate={earned ? earnedAnimation : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Pillar dot */}
      <span
        className="absolute top-3 right-3 w-2 h-2 rounded-full"
        style={{ backgroundColor: pillarColor }}
        aria-hidden="true"
      />

      {/* Icon as text label */}
      <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
        {iconKey}
      </span>

      {/* Title */}
      <p className="text-sm font-semibold text-white leading-tight pr-4">{titleDe}</p>

      {/* Rarity badge */}
      <span
        className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
        style={{
          color: rarityColor,
          backgroundColor: `${rarityColor}18`,
          border: `1px solid ${rarityColor}40`,
        }}
      >
        {RARITY_LABEL[rarity]}
      </span>
    </motion.div>
  )
}
