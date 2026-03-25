import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Question,
  Heart,
  Disc,
  UsersThree,
  CheckCircle,
  Warning,
  LockKey,
  ChartBar,
  ArrowRight,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Shared trigger button
// ---------------------------------------------------------------------------

interface VotingHelpButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

/**
 * Small inline help trigger rendered below each voting section.
 * Consistent styling across all three voting pillars.
 */
export function VotingHelpButton({ onClick, label = 'Wie funktioniert das?', className }: VotingHelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abstimmungs-Mechanik erklären"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
        'hover:text-accent transition-colors duration-200 group',
        className,
      )}
    >
      <Question
        className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200"
        weight="bold"
      />
      {label}
      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
    </button>
  )
}

/** Pre-computed Quadratic Voting cost examples for the info dialog (votes, credits). */
const QV_COST_EXAMPLES: [number, number][] = [[1,1],[2,4],[3,9],[5,25],[10,100]]

interface QuadraticVotingInfoProps {
  open: boolean
  onClose: () => void
}

/**
 * Explains the Quadratic Voting system used by fans (Peoples Choice pillar).
 *
 * Source: Musik-Charts PDF, Section 4.1 – Peoples Choice: Quadratic Voting
 * The explanation is shown verbatim so users can fully verify the methodology.
 */
export function QuadraticVotingInfo({ open, onClose }: QuadraticVotingInfoProps) {
  return (
    <Dialog open={open} onOpenChange={open ? onClose : undefined}>
      <DialogContent className="glassmorphism max-w-lg animate-modal-in overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" weight="duotone" />
            Fan-Voting: Quadratic Voting (QV)
          </DialogTitle>
          <DialogDescription>
            Volle Transparenz: So wird deine Stimme berechnet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <InfoBlock icon={<ChartBar className="w-4 h-4 text-primary shrink-0" weight="duotone" />} title="Das Grundprinzip">
            <p>
              Jeder verifizierte Fan erhält pro Abstimmungsmonat exakt{' '}
              <strong>100 Voice Credits</strong>. Diese Credits können frei
              auf alle nominierten Tracks verteilt werden.
            </p>
          </InfoBlock>

          <InfoBlock icon={<LockKey className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Die quadratische Kosten-Formel">
            <p className="mb-2">
              Die Kosten für N Stimmen auf einen Track steigen <strong>quadratisch</strong>:
            </p>
            <code className="block bg-secondary/50 rounded px-3 py-2 font-mono text-center text-base">
              Kosten = N²
            </code>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
              {QV_COST_EXAMPLES.map(([votes, cost]) => (
                <div key={votes} className="bg-secondary/30 rounded p-2">
                  <div className="font-mono font-bold text-foreground">{votes}</div>
                  <div className="text-muted-foreground">{cost}c</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-muted-foreground">
              Votes · Credits. 10 Stimmen auf einen einzigen Track verbrauchen
              das gesamte Monats-Budget.
            </p>
          </InfoBlock>

          <InfoBlock icon={<CheckCircle className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Warum ist das fair?">
            <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
              <li>Verhindert die <em>„Tyranny of the Majority"</em> – reine Follower-Zahlen dominieren nicht mehr.</li>
              <li>Kleine, leidenschaftliche Fanbases können gezielt unterstützen.</li>
              <li>Fans werden incentiviert, Credits auf mehrere Acts zu verteilen.</li>
              <li>Bot-Farms verlieren quadratisch an Wirkung: viele Accounts = hohe Kosten.</li>
            </ul>
          </InfoBlock>

          <InfoBlock icon={<Warning className="w-4 h-4 text-yellow-500 shrink-0" weight="duotone" />} title="Anti-Manipulation">
            <p className="text-muted-foreground">
              Alle Stimmen werden kryptografisch gehashed und mit einem Zeitstempel
              versehen. Verdächtige Muster (IP-Cluster, Velocity-Angriffe) werden
              automatisch in Quarantäne verschoben und manuell geprüft.
            </p>
          </InfoBlock>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs">Gewichtung im Gesamt-Ranking</Badge>
            <span className="font-mono font-bold">33.3 %</span>
            <span className="text-muted-foreground text-xs">der Gesamt-Punktzahl</span>
          </div>
        </div>

        <Separator />
        <Button variant="outline" onClick={onClose} className="w-full">Schließen</Button>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Schulze Method Info (DJ Vote)
// ---------------------------------------------------------------------------

interface SchulzeMethodInfoProps {
  open: boolean
  onClose: () => void
}

/**
 * Explains the Schulze (Beatpath) method used by verified DJs (DJs Choice pillar).
 *
 * Source: Musik-Charts PDF, Section 4.2 – DJs Choice: Die Schulze-Methode
 */
export function SchulzeMethodInfo({ open, onClose }: SchulzeMethodInfoProps) {
  return (
    <Dialog open={open} onOpenChange={open ? onClose : undefined}>
      <DialogContent className="glassmorphism max-w-lg animate-modal-in overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight flex items-center gap-2">
            <Disc className="w-5 h-5 text-accent" weight="duotone" />
            DJ-Voting: Schulze-Methode (Beatpath)
          </DialogTitle>
          <DialogDescription>
            Condorcet-kompatibles Ranked-Choice-Voting für Experten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <InfoBlock icon={<Disc className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Wer darf abstimmen?">
            <p className="text-muted-foreground">
              Ausschließlich <strong>verifizierte Szene-DJs</strong>, die einen manuellen
              KYC-Prozess durchlaufen haben. Nachweise: aktive Club-Residencies,
              Webradio-Tätigkeit oder Festival-Bookings müssen belegt werden.
            </p>
          </InfoBlock>

          <InfoBlock icon={<ChartBar className="w-4 h-4 text-primary shrink-0" weight="duotone" />} title="Wie wird abgestimmt?">
            <p className="mb-2 text-muted-foreground">
              Jeder DJ erstellt eine <strong>Rangfolge</strong> aller nominierten Tracks
              (Ranked-Choice). Keine Punkte, keine Finanzmacht – nur persönliche Präferenz.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Track auf Platz 1 setzen = stärkste Präferenz</li>
              <li>Track auf Platz 2 setzen = zweitstärkste Präferenz</li>
              <li>…und so weiter für alle nominierten Tracks</li>
            </ol>
          </InfoBlock>

          <InfoBlock icon={<LockKey className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Der Beatpath-Algorithmus">
            <p className="text-muted-foreground mb-2">
              Der Algorithmus sucht den <strong>Condorcet-Gewinner</strong>: den Track,
              der im direkten Paarvergleich gegen jeden anderen Track gewinnt.
            </p>
            <div className="bg-secondary/50 rounded p-3 font-mono text-xs space-y-1">
              <p>1. Paarweise-Matrix aufbauen (Wer bevorzugt A über B?)</p>
              <p>2. Stärkste Pfade via Floyd-Warshall berechnen</p>
              <p>3. Track mit stärkstem Pfad gegen alle = Gewinner</p>
            </div>
          </InfoBlock>

          <InfoBlock icon={<CheckCircle className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Warum nicht Borda-Count?">
            <p className="text-muted-foreground">
              Borda-Count ist anfällig für den <em>„Spoiler-Effekt"</em> und strategisches
              Downvoting. Die Schulze-Methode eliminiert taktisches Abstimmen vollständig,
              da kein DJ durch strategische Platzierungen das Ergebnis manipulieren kann.
            </p>
          </InfoBlock>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs">Gewichtung im Gesamt-Ranking</Badge>
            <span className="font-mono font-bold">33.3 %</span>
            <span className="text-muted-foreground text-xs">der Gesamt-Punktzahl</span>
          </div>
        </div>

        <Separator />
        <Button variant="outline" onClick={onClose} className="w-full">Schließen</Button>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Anti-Collusion Peer Review Info (Band Vote)
// ---------------------------------------------------------------------------

interface PeerReviewInfoProps {
  open: boolean
  onClose: () => void
}

/**
 * Explains the Anti-Collusion algorithm used for the Bands Choice pillar.
 *
 * Source: Musik-Charts PDF, Section 4.3 – Bands Choice: Anti-Kollusions-Metriken
 */
export function PeerReviewInfo({ open, onClose }: PeerReviewInfoProps) {
  return (
    <Dialog open={open} onOpenChange={open ? onClose : undefined}>
      <DialogContent className="glassmorphism max-w-lg animate-modal-in overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-tight flex items-center gap-2">
            <UsersThree className="w-5 h-5 text-destructive" weight="duotone" />
            Band-Voting: Anti-Kollusions-Peer-Review
          </DialogTitle>
          <DialogDescription>
            Kollusionsresistentes Peer-Review mit KI-gestützter Cliquen-Erkennung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <InfoBlock icon={<UsersThree className="w-4 h-4 text-destructive shrink-0" weight="duotone" />} title="Das Prinzip">
            <p className="text-muted-foreground">
              Registrierte Bands bewerten andere Bands im Peer-Review-Verfahren.
              Musiker erkennen oft <strong>kompositorische Tiefe</strong> und technische
              Raffinessen, die Fans und DJs entgehen. Diese Perspektive ist wertvoll –
              muss aber gegen <em>Cliquenbildung und Vote-Trading</em> geschützt werden.
            </p>
          </InfoBlock>

          <InfoBlock icon={<Warning className="w-4 h-4 text-yellow-500 shrink-0" weight="duotone" />} title="Das Problem: Cliquenbildung">
            <p className="text-muted-foreground">
              Langzeitstudien zum Eurovision Song Contest (60 Jahre) zeigen: Bands neigen
              dazu, befreundete Acts zu bevorzugen (Reziprozität) oder sich in informellen
              Voting-Zirkeln abzusprechen. Ungefiltertes Peer-Voting wäre nicht neutral.
            </p>
          </InfoBlock>

          <InfoBlock icon={<LockKey className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Der Anti-Kollusions-Algorithmus">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-foreground">01.</span>
                <span><strong>Reziprokes Voting:</strong> Wenn Band A immer Band B wählt und Band B immer Band A, wird das Stimmgewicht beider automatisch abgewertet.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-foreground">02.</span>
                <span><strong>Mahalanobis-Distanz:</strong> Stimmen, die statistisch signifikant von der Gesamt-Peer-Meinung abweichen, werden normalisiert (Outlier-Detection).</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono text-foreground">03.</span>
                <span><strong>Intellektuelle Distanz:</strong> Bands, die für Acts abstimmen, mit denen sie kein gemeinsames Label, keine Tour und keine geografische Nähe teilen, erhalten <em>höheres Stimmgewicht</em>.</span>
              </li>
            </ul>
          </InfoBlock>

          <InfoBlock icon={<CheckCircle className="w-4 h-4 text-accent shrink-0" weight="duotone" />} title="Kryptografische Integrität">
            <p className="text-muted-foreground">
              Jede Stimme wird mit einem Zeitstempel kryptografisch gehasht.
              Nachträgliche Manipulationen – auch durch Administratoren – sind
              mathematisch nachweisbar und im Transparency-Log auditierbar.
            </p>
          </InfoBlock>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs">Gewichtung im Gesamt-Ranking</Badge>
            <span className="font-mono font-bold">33.3 %</span>
            <span className="text-muted-foreground text-xs">der Gesamt-Punktzahl</span>
          </div>
        </div>

        <Separator />
        <Button variant="outline" onClick={onClose} className="w-full">Schließen</Button>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Shared layout helper
// ---------------------------------------------------------------------------

interface InfoBlockProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function InfoBlock({ icon, title, children }: InfoBlockProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold mb-1">{title}</p>
        {children}
      </div>
    </div>
  )
}
