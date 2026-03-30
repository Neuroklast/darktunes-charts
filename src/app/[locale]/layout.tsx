import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import { NavigationBar } from '@/presentation/components/organisms/NavigationBar'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const isTestMode = process.env.NEXT_PUBLIC_APP_ENV === 'test'

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {isTestMode && (
        <div className="bg-red-600 text-white text-center text-sm font-bold py-1 w-full z-50 sticky top-0 uppercase tracking-widest">
          TESTMODUS AKTIV
        </div>
      )}
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <NavigationBar />
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
