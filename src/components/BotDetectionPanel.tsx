import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Shield, Warning, Check, X, Eye, Clock } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BotDetectionAlert, Band, Track } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function BotDetectionPanel() {
  const [alerts, setAlerts] = useKV<BotDetectionAlert[]>('bot-alerts', [])
  const [bands] = useKV<Band[]>('bands', [])
  const [tracks] = useKV<Track[]>('tracks', [])
  const [activeTab, setActiveTab] = useState<'flagged' | 'reviewing' | 'all'>('flagged')

  const safeAlerts = alerts || []
  const sortedAlerts = [...safeAlerts].sort((a, b) => b.timestamp - a.timestamp)

  const flaggedAlerts = sortedAlerts.filter(a => a.status === 'flagged')
  const reviewingAlerts = sortedAlerts.filter(a => a.status === 'reviewing')

  const getTrackDetails = (trackId: string, bandId: string) => {
    const track = tracks?.find(t => t.id === trackId)
    const band = bands?.find(b => b.id === bandId)
    return {
      trackTitle: track?.title || 'Unknown Track',
      bandName: band?.name || 'Unknown Band',
      tier: band?.tier || 'Unknown'
    }
  }

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-destructive'
      case 'medium':
        return 'text-accent'
      case 'low':
        return 'text-muted-foreground'
    }
  }

  const getSeverityBadgeVariant = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'velocity':
        return 'High Velocity'
      case 'new_accounts':
        return 'New Accounts'
      case 'ip_cluster':
        return 'IP Clustering'
      case 'pattern':
        return 'Pattern Detected'
      default:
        return type
    }
  }

  const handleReview = (alertId: string) => {
    setAlerts(current => 
      (current || []).map(alert => 
        alert.id === alertId
          ? { ...alert, status: 'reviewing' as const }
          : alert
      )
    )
    toast.info('Alert moved to review queue')
  }

  const handleClear = (alertId: string) => {
    setAlerts(current =>
      (current || []).map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'cleared' as const, reviewedAt: Date.now(), reviewedBy: 'admin' }
          : alert
      )
    )
    toast.success('Alert cleared - votes restored')
  }

  const handleConfirmFraud = (alertId: string) => {
    setAlerts(current =>
      (current || []).map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'confirmed_fraud' as const, reviewedAt: Date.now(), reviewedBy: 'admin' }
          : alert
      )
    )
    toast.error('Fraud confirmed - votes quarantined permanently')
  }

  const renderAlertCard = (alert: BotDetectionAlert) => {
    const { trackTitle, bandName, tier } = getTrackDetails(alert.trackId, alert.bandId)
    const timeAgo = Math.floor((Date.now() - alert.timestamp) / (1000 * 60))

    return (
      <Card key={alert.id} className="p-4 glassmorphism">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Warning className={cn("w-6 h-6 mt-0.5", getSeverityColor(alert.severity))} weight="duotone" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getSeverityBadgeVariant(alert.severity)} className="uppercase">
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline">{getAlertTypeLabel(alert.alertType)}</Badge>
                </div>
                <h3 className="font-medium text-lg">{trackTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {bandName} • {tier} Tier
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}m ago</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-destructive/10 rounded text-center">
              <p className="text-xs text-muted-foreground mb-1">Votes</p>
              <p className="text-lg font-mono font-bold text-destructive">
                {alert.details.votesCount}
              </p>
            </div>

            <div className="p-3 bg-secondary/50 rounded text-center">
              <p className="text-xs text-muted-foreground mb-1">Time Window</p>
              <p className="text-lg font-mono font-bold">
                {Math.floor(alert.details.timeWindow / 1000)}s
              </p>
            </div>

            {alert.details.newAccountRatio !== undefined && (
              <div className="p-3 bg-accent/10 rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">New Accounts</p>
                <p className="text-lg font-mono font-bold text-accent">
                  {Math.round(alert.details.newAccountRatio * 100)}%
                </p>
              </div>
            )}

            {alert.details.suspiciousIPs && alert.details.suspiciousIPs.length > 0 && (
              <div className="p-3 bg-primary/10 rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Suspicious IPs</p>
                <p className="text-lg font-mono font-bold text-primary">
                  {alert.details.suspiciousIPs.length}
                </p>
              </div>
            )}
          </div>

          {alert.status === 'flagged' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReview(alert.id)}
                className="flex-1 gap-2"
              >
                <Eye className="w-4 h-4" />
                Review
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleClear(alert.id)}
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleConfirmFraud(alert.id)}
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Ban
              </Button>
            </div>
          )}

          {alert.status === 'reviewing' && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleClear(alert.id)}
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Clear Votes
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleConfirmFraud(alert.id)}
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Confirm Fraud
              </Button>
            </div>
          )}

          {(alert.status === 'cleared' || alert.status === 'confirmed_fraud') && (
            <div className={cn(
              "p-3 rounded text-sm",
              alert.status === 'cleared' ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
            )}>
              <div className="flex items-center gap-2">
                {alert.status === 'cleared' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>
                  {alert.status === 'cleared' ? 'Cleared by' : 'Banned by'} {alert.reviewedBy} •{' '}
                  {alert.reviewedAt && new Date(alert.reviewedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-accent" weight="duotone" />
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">BOT PROTECTION</h2>
          <p className="text-muted-foreground">AI-powered fraud detection and quarantine system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 glassmorphism">
          <div className="flex items-center gap-3">
            <Warning className="w-8 h-8 text-destructive" weight="duotone" />
            <div>
              <p className="text-2xl font-mono font-bold">{flaggedAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Flagged Alerts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glassmorphism">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-accent" weight="duotone" />
            <div>
              <p className="text-2xl font-mono font-bold">{reviewingAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glassmorphism">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" weight="duotone" />
            <div>
              <p className="text-2xl font-mono font-bold">{sortedAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Total Detected</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 glassmorphism bg-secondary/20">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Detection Heuristics:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-foreground">Velocity Threshold:</strong> ≥100 votes in 60 seconds</li>
            <li><strong className="text-foreground">New Account Ratio:</strong> &gt;70% accounts &lt;7 days old</li>
            <li><strong className="text-foreground">IP Clustering:</strong> &gt;5 votes from same IP</li>
            <li><strong className="text-foreground">Pattern Analysis:</strong> ML-based behavioral anomalies</li>
          </ul>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="flagged">
            Flagged ({flaggedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            Reviewing ({reviewingAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({sortedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {flaggedAlerts.length === 0 ? (
                <Card className="p-12 text-center glassmorphism">
                  <Check className="w-12 h-12 mx-auto mb-4 text-accent" weight="duotone" />
                  <p className="text-muted-foreground">No flagged alerts - system clean</p>
                </Card>
              ) : (
                flaggedAlerts.map(renderAlertCard)
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reviewing" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {reviewingAlerts.length === 0 ? (
                <Card className="p-12 text-center glassmorphism">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
                  <p className="text-muted-foreground">No alerts under review</p>
                </Card>
              ) : (
                reviewingAlerts.map(renderAlertCard)
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {sortedAlerts.length === 0 ? (
                <Card className="p-12 text-center glassmorphism">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" weight="duotone" />
                  <p className="text-muted-foreground">No detection history yet</p>
                </Card>
              ) : (
                sortedAlerts.map(renderAlertCard)
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
