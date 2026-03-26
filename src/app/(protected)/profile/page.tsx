import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Profil · DarkTunes' }

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Mein Profil</h1>
          <Badge variant="outline">Fan</Badge>
        </div>
        <Card className="p-8 glassmorphism text-center">
          <p className="text-muted-foreground">
            Melde dich an, um dein Profil und deine Label-Vollmachten zu verwalten.
          </p>
        </Card>
      </div>
    </main>
  )
}
