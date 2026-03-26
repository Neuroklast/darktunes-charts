import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { EarlyDiscovererResult } from '@/domain/gamification/earlyDiscoverer'

interface EarlyDiscovererBadgeProps {
  result: EarlyDiscovererResult
}

/**
 * EarlyDiscovererBadge molecule — Spec §9.1
 *
 * Displays the "🔮 Früher Entdecker" gamification badge on the Fan Dashboard.
 * Shows how many Top-10 tracks the fan voted for before they charted,
 * with a discovery percentage and motivational framing.
 */
export function EarlyDiscovererBadge({ result }: EarlyDiscovererBadgeProps) {
  const { discoveredCount, totalTop10Count, discoveryPercent } = result

  if (totalTop10Count === 0) {
    return null
  }

  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label="Crystal ball">🔮</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">Früher Entdecker</span>
            <Badge variant="outline" className="text-xs border-primary/40 text-primary">
              {discoveryPercent}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Du hast{' '}
            <span className="font-medium text-foreground">{discoveredCount}</span>
            {' '}von{' '}
            <span className="font-medium text-foreground">{totalTop10Count}</span>
            {' '}Top-Tracks entdeckt, bevor sie bekannt wurden.
          </p>
        </div>
      </div>
    </Card>
  )
}
