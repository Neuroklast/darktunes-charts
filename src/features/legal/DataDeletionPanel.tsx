import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Trash, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { TransparencyLogEntry, BotDetectionAlert, Band, Track, FanVote } from '@/lib/types'

/**
 * DSGVO Art. 17 "Recht auf Löschung" panel.
 *
 * All data is stored client-side in localStorage via KV store, so deletion
 * is complete and verifiable — no server-side request required.
 */
export function DataDeletionPanel() {
  const [, setBands] = useKV<Band[]>('bands', [])
  const [, setTracks] = useKV<Track[]>('tracks', [])
  const [, setFanVotes] = useKV<Record<string, FanVote>>('fanVotes', {})
  const [, setTransparencyLog] = useKV<TransparencyLogEntry[]>('transparency-log', [])
  const [, setBotAlerts] = useKV<BotDetectionAlert[]>('bot-alerts', [])
  const [, setConsent] = useKV<null>('gdpr-consent', null)
  const [deleted, setDeleted] = useState(false)

  const handleDeleteVotes = () => {
    setFanVotes({})
    setTransparencyLog([])
    toast.success('Abstimmungsdaten gelöscht')
  }

  const handleWithdrawConsent = () => {
    setFanVotes({})
    setConsent(null)
    toast.info('Einwilligung zurückgezogen')
  }

  const handleDeleteAll = () => {
    setFanVotes({})
    setTransparencyLog([])
    setBotAlerts([])
    setBands([])
    setTracks([])
    setConsent(null)
    setDeleted(true)
    toast.success('Alle Daten gelöscht — Seite wird neu geladen')
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-accent" weight="duotone" />
        <h2 className="font-display text-2xl font-bold tracking-tight">Meine Daten (DSGVO Art. 17)</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Alle Ihre Daten liegen ausschließlich lokal in Ihrem Browser und können jederzeit gelöscht werden.
      </p>

      <Card className="p-6 glassmorphism space-y-5">
        <section>
          <h3 className="font-semibold mb-1">Abstimmungsdaten löschen</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Löscht Ihre Stimmen und das Transparenzprotokoll.
          </p>
          <Button variant="outline" onClick={handleDeleteVotes} className="gap-2">
            <Trash className="w-4 h-4" />
            Stimmen löschen
          </Button>
        </section>

        <Separator />

        <section>
          <h3 className="font-semibold mb-1">Einwilligung zurückziehen</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Zieht Ihre DSGVO-Einwilligung zurück. Abstimmungen sind danach nicht mehr möglich.
          </p>
          <Button variant="outline" onClick={handleWithdrawConsent} className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Einwilligung zurückziehen
          </Button>
        </section>

        <Separator />

        <section className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
          <h3 className="font-semibold text-destructive mb-1">Alle Daten löschen</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Entfernt <strong className="text-foreground">alle</strong> lokal gespeicherten Daten.
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <Button variant="destructive" onClick={handleDeleteAll} disabled={deleted} className="gap-2">
            <Trash className="w-4 h-4" />
            Alle Daten löschen
          </Button>
        </section>
      </Card>
    </div>
  )
}
