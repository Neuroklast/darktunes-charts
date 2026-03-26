import type { Metadata } from 'next'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import { NavigationBar } from '@/presentation/components/organisms/NavigationBar'
import '../globals.css'

export const metadata: Metadata = {
  title: 'DarkTunes Charts',
  description: 'Die fairsten Dark-Musik Charts — Quadratic Voting, Schulze-Methode, Anti-Kollusion',
  keywords: ['dark music', 'gothic', 'metal', 'dark electro', 'charts', 'voting'],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <NavigationBar />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
