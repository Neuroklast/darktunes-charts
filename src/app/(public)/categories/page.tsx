import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Kategorien · DarkTunes' }

const CATEGORIES = [
  { group: 'Musik', items: [
    { name: 'Bester Track', id: 'track', cost: 'Kostenlos (1/Monat)' },
    { name: 'Bestes Album', id: 'album', cost: 'Ab Tier 2' },
    { name: 'Voice of the Void', id: 'voice-of-void', cost: 'Premium' },
    { name: 'Riff Architect', id: 'riff-architect', cost: 'Premium' },
    { name: 'Synthesis & Steel', id: 'synthesis-steel', cost: 'Premium' },
  ]},
  { group: 'Visuals', items: [
    { name: 'Best Cover Art', id: 'best-cover-art', cost: 'Ab Tier 1' },
    { name: 'Best Merch', id: 'best-merch', cost: 'Ab Tier 1' },
    { name: 'Best Music Video', id: 'best-music-video', cost: 'Ab Tier 2' },
  ]},
  { group: 'Community', items: [
    { name: 'Chronicler of the Night', id: 'chronicler-night', cost: 'Nominierung' },
    { name: 'Dark Integrity Award', id: 'dark-integrity', cost: 'Nominierung' },
    { name: 'Lyricist of Shadows', id: 'lyricist-shadows', cost: 'Nominierung' },
  ]},
  { group: 'Newcomer', items: [
    { name: 'Underground Anthem', id: 'underground-anthem', cost: 'Kostenlos' },
    { name: 'Dark Concept Award', id: 'dark-concept', cost: 'Kostenlos' },
  ]},
]

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Kategorien</h1>
        <p className="text-muted-foreground mb-8">
          Alle Wettbewerbskategorien und Einreichungskosten nach Band-Tier
        </p>
        <div className="space-y-8">
          {CATEGORIES.map((group) => (
            <section key={group.group}>
              <h2 className="text-2xl font-semibold mb-4">{group.group}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((cat) => (
                  <Card key={cat.id} className="p-4 glassmorphism">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cat.name}</span>
                      <Badge variant="outline" className="text-xs">{cat.cost}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
