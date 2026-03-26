import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">
            Quadratic Voting · Schulze-Methode · Anti-Kollusion
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DarkTunes Charts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Die fairsten Dark-Musik Charts der Welt. Powered by mathematisch bewiesenen
            Voting-Algorithmen, die strategische Manipulation ausschließen.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/charts">Charts ansehen</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/how-it-works">Wie funktioniert es?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Das System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Quadratic Voting"
              description="Fans erhalten 100 Voice Credits pro Monat. Mehr Stimmen für einen Track kosten exponentiell mehr Credits — faire Meinungsverteilung garantiert."
              icon="⬛"
            />
            <FeatureCard
              title="Schulze-Methode"
              description="DJs reichen Ranked-Choice Ballots ein. Der Condorcet-Sieger wird durch den Beatpath-Algorithmus ermittelt — strategisches Burial ist unmöglich."
              icon="🎛"
            />
            <FeatureCard
              title="Peer Review"
              description="Bands bewerten sich gegenseitig. Kliquen-Erkennung durch Mahalanobis-Distanz und Triadic Census verhindert Voting-Rings."
              icon="🔄"
            />
            <FeatureCard
              title="Combined Charts (33/33/33)"
              description="Fan-Score, DJ-Score und Peer-Score werden gleichgewichtet aggregiert. Min-Max-Normalisierung verhindert Dominanz einer Gruppe."
              icon="📊"
            />
            <FeatureCard
              title="AI Prediction"
              description="Machine Learning analysiert Vote-Velocity, Genre-Momentum und Stream-Wachstum um aufsteigende Künstler zu identifizieren."
              icon="🤖"
            />
            <FeatureCard
              title="Algorithmische Transparenz"
              description="Jeder Vote-Gewichtungsschritt wird im Transparenz-Log dokumentiert. Vollständige Nachvollziehbarkeit für alle Beteiligten."
              icon="🔍"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Mitmachen</h2>
          <p className="text-muted-foreground mb-8">
            Als Fan abstimmen, als DJ Ballots einreichen, oder als Band registrieren.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/vote/fan">Als Fan abstimmen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/vote/dj">DJ Ballot einreichen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/transparency">Transparenz-Log</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <Card className="p-6 glassmorphism hover:border-primary/40 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  )
}
