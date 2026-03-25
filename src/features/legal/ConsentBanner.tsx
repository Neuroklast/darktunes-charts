import { useKV } from '@github/spark/hooks'
import { ShieldCheck, Cookie } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ConsentState {
  accepted: boolean
  timestamp: number
  version: string
}

const CONSENT_VERSION = '1.0'

/**
 * DSGVO/GDPR consent banner shown on first visit.
 *
 * The platform stores anonymous voting data in browser localStorage via the
 * Spark KV store. Under DSGVO Art. 6 Abs. 1 lit. a explicit consent is required
 * before any session data is written. The banner gates all interactive features
 * until the user actively accepts or declines.
 *
 * Consent is stored in the KV store so it persists across page refreshes.
 * Declining consent prevents voting but still allows read-only chart browsing.
 */
export function ConsentBanner({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useKV<ConsentState | null>('gdpr-consent', null)

  const handleAccept = () => {
    setConsent({ accepted: true, timestamp: Date.now(), version: CONSENT_VERSION })
  }

  const handleDecline = () => {
    setConsent({ accepted: false, timestamp: Date.now(), version: CONSENT_VERSION })
  }

  if (consent?.version === CONSENT_VERSION) {
    return <>{children}</>
  }

  return (
    <>
      <div className="pointer-events-none opacity-30">{children}</div>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Card className="w-full max-w-lg p-6 glassmorphism border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-8 h-8 text-accent" weight="duotone" />
            <div>
              <h2 className="font-display text-lg font-bold">Datenschutz & Einwilligung</h2>
              <p className="text-xs text-muted-foreground">DSGVO Art. 6 Abs. 1 lit. a</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            darkTunes Charts speichert <strong className="text-foreground">ausschließlich anonyme Sitzungsdaten</strong> (Stimmen, Abstimmungen) lokal in Ihrem Browser (localStorage). Es werden <strong className="text-foreground">keine</strong> personenbezogenen Daten an Server übertragen.
          </p>
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded p-3 mb-4 space-y-1">
            <p>🗄️ <strong className="text-foreground">Gespeichert:</strong> Abstimmungen (anonym), Sitzungs-ID, Zustimmungsstatus</p>
            <p>⏱️ <strong className="text-foreground">Speicherdauer:</strong> Bis zum Löschen des Browser-Speichers</p>
            <p>🚫 <strong className="text-foreground">Nicht gespeichert:</strong> Name, E-Mail, IP-Adresse, Standort</p>
            <p>🔗 <strong className="text-foreground">Weitergabe:</strong> Keine Weitergabe an Dritte</p>
          </div>
          <Separator className="my-4" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={handleDecline}>
              Ablehnen (nur Lesen)
            </Button>
            <Button onClick={handleAccept} className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Einwilligen & Starten
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Weitere Informationen:{' '}
            <button
              className="underline hover:text-foreground transition-colors"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-legal', { detail: 'privacy' }))
              }}
            >
              Datenschutzerklärung
            </button>
            {' · '}
            <button
              className="underline hover:text-foreground transition-colors"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-legal', { detail: 'impressum' }))
              }}
            >
              Impressum
            </button>
          </p>
        </Card>
      </div>
    </>
  )
}
