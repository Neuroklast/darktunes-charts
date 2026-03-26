import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import { NavigationBar } from '@/presentation/components/organisms/NavigationBar'

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
        <NavigationBar />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
