import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const metadata = { title: 'Admin · DarkTunes' }

const ADMIN_SECTIONS = [
  { href: '/admin/kyc', title: 'KYC-Verifizierung', description: 'DJ Identitäts-Prüfung', badge: 'DJs' },
  { href: '/admin/bot-detection', title: 'Bot Detection', description: 'Anomalie-Erkennung', badge: 'Security' },
  { href: '/admin/awards', title: 'Award-Vergabe', description: 'Manuelle Awards', badge: 'Awards' },
]

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge variant="destructive">Admin Only</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADMIN_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="p-6 glassmorphism hover:border-primary/40 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">{section.title}</h2>
                  <Badge variant="outline">{section.badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
