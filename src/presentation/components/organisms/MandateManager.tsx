'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/presentation/components/molecules/ConfirmDialog'

export type MandateStatus = 'PENDING' | 'ACTIVE' | 'REVOKED'

export interface Mandate {
  id: string
  bandId: string
  bandName: string
  labelId: string
  labelName: string
  status: MandateStatus
  createdAt: string
}

interface MandateManagerProps {
  /** The role of the viewing user — determines which UI is shown. */
  role: 'label' | 'band'
  /** User ID of the current viewer. */
  viewerId: string
  /** Current mandates (both pending and active). */
  mandates: Mandate[]
  /** Called when a label requests a mandate from a band. */
  onRequest: (bandId: string) => Promise<void>
  /** Called when a band accepts a pending mandate request. */
  onAccept: (mandateId: string) => Promise<void>
  /** Called when a mandate is rejected or revoked. */
  onRevoke: (mandateId: string) => Promise<void>
}

function statusBadge(status: MandateStatus) {
  const props = {
    PENDING: { variant: 'secondary' as const, label: 'Ausstehend' },
    ACTIVE: { variant: 'default' as const, label: 'Aktiv' },
    REVOKED: { variant: 'destructive' as const, label: 'Widerrufen' },
  }[status]
  return <Badge variant={props.variant}>{props.label}</Badge>
}

/**
 * MandateManager organism — Label-Band Mandate Management UI (Spec §7.2).
 *
 * For **Labels**: shows a list of managed bands with their mandate status and
 * an option to request a mandate from a new band or revoke existing ones.
 *
 * For **Bands**: shows pending mandate requests with Accept/Reject buttons,
 * and active mandates with a Revoke option.
 *
 * All destructive actions are guarded by a ConfirmDialog.
 */
export function MandateManager({
  role,
  mandates,
  onAccept,
  onRevoke,
}: MandateManagerProps) {
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [acceptTarget, setAcceptTarget] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return
    setIsProcessing(true)
    try {
      await onRevoke(revokeTarget)
    } finally {
      setIsProcessing(false)
      setRevokeTarget(null)
    }
  }, [revokeTarget, onRevoke])

  const handleAccept = useCallback(async () => {
    if (!acceptTarget) return
    setIsProcessing(true)
    try {
      await onAccept(acceptTarget)
    } finally {
      setIsProcessing(false)
      setAcceptTarget(null)
    }
  }, [acceptTarget, onAccept])

  const pendingMandates = mandates.filter((m) => m.status === 'PENDING')
  const activeMandates = mandates.filter((m) => m.status === 'ACTIVE')

  if (mandates.length === 0) {
    return (
      <Card className="p-8 glassmorphism text-center">
        <p className="text-muted-foreground">
          {role === 'label'
            ? 'Keine mandatierten Bands. Sende Bands eine Vollmachtsanfrage.'
            : 'Keine ausstehenden oder aktiven Vollmachten.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending mandate requests (shown for both roles) */}
      {pendingMandates.length > 0 && (
        <section aria-labelledby="pending-mandates-title">
          <h3 id="pending-mandates-title" className="text-lg font-semibold mb-3">
            {role === 'band' ? 'Ausstehende Anfragen' : 'Ausstehende Vollmachten'}
          </h3>
          <div className="space-y-2">
            {pendingMandates.map((mandate) => (
              <Card key={mandate.id} className="p-4 glassmorphism">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {statusBadge(mandate.status)}
                    <span className="font-medium">
                      {role === 'band' ? mandate.labelName : mandate.bandName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      seit {new Date(mandate.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {role === 'band' && (
                      <Button
                        size="sm"
                        onClick={() => setAcceptTarget(mandate.id)}
                        disabled={isProcessing}
                        aria-label={`Vollmacht von ${mandate.labelName} annehmen`}
                      >
                        Annehmen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRevokeTarget(mandate.id)}
                      disabled={isProcessing}
                      aria-label={`Vollmacht ${role === 'band' ? 'ablehnen' : 'widerrufen'}`}
                    >
                      {role === 'band' ? 'Ablehnen' : 'Zurückziehen'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Active mandates */}
      {activeMandates.length > 0 && (
        <section aria-labelledby="active-mandates-title">
          <h3 id="active-mandates-title" className="text-lg font-semibold mb-3">
            Aktive Vollmachten
          </h3>
          <div className="space-y-2">
            {activeMandates.map((mandate) => (
              <Card key={mandate.id} className="p-4 glassmorphism">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {statusBadge(mandate.status)}
                    <span className="font-medium">
                      {role === 'band' ? mandate.labelName : mandate.bandName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      seit {new Date(mandate.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRevokeTarget(mandate.id)}
                    disabled={isProcessing}
                    aria-label={`Vollmacht mit ${role === 'band' ? mandate.labelName : mandate.bandName} widerrufen`}
                  >
                    Widerrufen
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Revoke confirmation */}
      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null) }}
        title="Vollmacht widerrufen"
        description="Möchtest du diese Vollmacht wirklich widerrufen? Das Label verliert danach den Zugriff auf dein Band-Profil."
        confirmLabel="Ja, widerrufen"
        cancelLabel="Abbrechen"
        onConfirm={handleRevoke}
      />

      {/* Accept confirmation */}
      <ConfirmDialog
        open={acceptTarget !== null}
        onOpenChange={(open) => { if (!open) setAcceptTarget(null) }}
        title="Vollmacht annehmen"
        description="Möchtest du dem Label wirklich die Verwaltung deines Profils erlauben? Du kannst die Vollmacht jederzeit widerrufen."
        confirmLabel="Vollmacht erteilen"
        cancelLabel="Abbrechen"
        onConfirm={handleAccept}
      />
    </div>
  )
}
