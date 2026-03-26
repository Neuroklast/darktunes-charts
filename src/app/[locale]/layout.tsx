import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import { NavigationBar } from '@/presentation/components/organisms/NavigationBar'
import { AuthProvider } from '@/features/auth/AuthContext'

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthProvider>
          <NavigationBar />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
