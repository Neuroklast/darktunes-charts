import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  BarChart2,
  Zap,
  RotateCcw,
  LayersIcon,
  Bot,
  Eye,
} from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen gradient-mesh">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-28 px-4">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl">
            <p
              className="text-[11px] text-[#7C3AED] tracking-[0.3em] uppercase mb-4 font-medium"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Quadratic Voting · Schulze-Methode · Anti-Kollusion
            </p>
            <h1
              className="text-6xl md:text-8xl font-display text-white leading-none mb-6"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              DarkTunes<br />
              <span className="text-[#D30000]">Charts</span>
            </h1>
            <p className="text-base text-white/45 max-w-xl mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              Die fairsten Dark-Musik Charts der Welt. Powered by mathematisch
              bewiesenen Voting-Algorithmen, die strategische Manipulation ausschließen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-10 px-6 text-[12px] uppercase tracking-widest bg-[#D30000] hover:bg-[#B00000] text-white border-0 rounded-sm font-medium"
              >
                <Link href="/charts">Charts ansehen</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 px-6 text-[12px] uppercase tracking-widest border-white/15 text-white/70 hover:text-white hover:bg-white/5 rounded-sm"
              >
                <Link href="/how-it-works">Wie funktioniert es?</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 w-1/2 h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 80% 40%, #7C3AED 0%, transparent 70%)',
          }}
        />
      </section>

      {/* ── System Features Bento Grid ── */}
      <section className="py-16 px-4">
        <div className="max-w-[1440px] mx-auto">
          <h2
            className="text-2xl font-display text-white mb-8"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            Das System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <FeatureCard
              icon={<BarChart2 size={20} />}
              accentColor="#D30000"
              title="Quadratic Voting"
              description="Fans erhalten 100 Voice Credits pro Monat. Mehr Stimmen für einen Track kosten exponentiell mehr Credits — faire Meinungsverteilung garantiert."
            />
            <FeatureCard
              icon={<Zap size={20} />}
              accentColor="#7C3AED"
              title="Schulze-Methode"
              description="DJs reichen Ranked-Choice Ballots ein. Der Condorcet-Sieger wird durch den Beatpath-Algorithmus ermittelt — strategisches Burial ist unmöglich."
            />
            <FeatureCard
              icon={<RotateCcw size={20} />}
              accentColor="#00F0FF"
              title="Peer Review"
              description="Bands bewerten sich gegenseitig. Kliquen-Erkennung durch Mahalanobis-Distanz und Triadic Census verhindert Voting-Rings."
            />
            <FeatureCard
              icon={<LayersIcon size={20} />}
              accentColor="#00FF66"
              title="Combined Charts (33/33/33)"
              description="Fan-Score, DJ-Score und Peer-Score werden gleichgewichtet aggregiert. Min-Max-Normalisierung verhindert Dominanz einer Gruppe."
            />
            <FeatureCard
              icon={<Bot size={20} />}
              accentColor="#F59E0B"
              title="AI Prediction"
              description="Machine Learning analysiert Vote-Velocity, Genre-Momentum und Stream-Wachstum um aufsteigende Künstler zu identifizieren."
            />
            <FeatureCard
              icon={<Eye size={20} />}
              accentColor="#7C3AED"
              title="Algorithmische Transparenz"
              description="Jeder Vote-Gewichtungsschritt wird im Transparenz-Log dokumentiert. Vollständige Nachvollziehbarkeit für alle Beteiligten."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 border-t border-white/[0.05]">
        <div className="max-w-[1440px] mx-auto">
          <h2
            className="text-2xl font-display text-white mb-3"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          >
            Mitmachen
          </h2>
          <p className="text-sm text-white/40 mb-6" style={{ fontFamily: 'var(--font-body)' }}>
            Als Fan abstimmen, als DJ Ballots einreichen, oder als Band registrieren.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="h-9 px-5 text-[11px] uppercase tracking-widest border-white/12 text-white/60 hover:text-white hover:bg-white/5 rounded-sm"
            >
              <Link href="/vote/fan">Als Fan abstimmen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 px-5 text-[11px] uppercase tracking-widest border-white/12 text-white/60 hover:text-white hover:bg-white/5 rounded-sm"
            >
              <Link href="/vote/dj">DJ Ballot einreichen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 px-5 text-[11px] uppercase tracking-widest border-white/12 text-white/60 hover:text-white hover:bg-white/5 rounded-sm"
            >
              <Link href="/transparency">Transparenz-Log</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({
  icon,
  accentColor,
  title,
  description,
}: {
  icon: React.ReactNode
  accentColor: string
  title: string
  description: string
}) {
  return (
    <div
      className="bg-[#141414] border border-white/[0.06] rounded-sm p-5 card-hover"
    >
      <div
        className="w-8 h-8 flex items-center justify-center rounded-sm mb-4"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {icon}
      </div>
      <h3
        className="text-sm font-display text-white mb-2"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
      >
        {title}
      </h3>
      <p className="text-xs text-white/40 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
        {description}
      </p>
    </div>
  )
}

