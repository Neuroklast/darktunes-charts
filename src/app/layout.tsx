import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DarkTunes Charts',
  description: 'Die fairsten Dark-Musik Charts — Quadratic Voting, Schulze-Methode, Anti-Kollusion',
  keywords: ['dark music', 'gothic', 'metal', 'dark electro', 'charts', 'voting'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
