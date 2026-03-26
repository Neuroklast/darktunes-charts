import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Profil · DarkTunes' }

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Mein Profil</h1>
          <Badge variant="outline">Fan</Badge>
        </div>

        <Card className="p-8 glassmorphism text-center mb-6">
          <p className="text-muted-foreground mb-4">
            Melde dich an, um dein Profil und deine Label-Vollmachten zu verwalten.
          </p>
          <Button asChild>
            <Link href="/api/auth/login">Anmelden</Link>
          </Button>
        </Card>

        {/* Label-Band Mandate Management section */}
        <Card className="p-6 glassmorphism">
          <h2 className="text-lg font-semibold mb-2">Label-Vollmachten</h2>
          <p className="text-sm text-muted-foreground">
            Als Band kannst du einem Label eine Vollmacht erteilen, dein Profil zu verwalten.
            Als Label kannst du Vollmachtsanfragen an Bands senden.{' '}
            <Link href="/how-it-works" className="text-accent hover:underline">
              Mehr erfahren →
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Melde dich an, um Vollmachten zu verwalten.
          </p>
        </Card>
      </div>
    </main>
  )
}
