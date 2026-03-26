import { getRequestConfig } from 'next-intl/server'

/** Locales supported by the application. */
export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]

/** Default locale shown when no preference is detected. */
export const defaultLocale: Locale = 'de'

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve the locale from the request (set by next-intl middleware cookie/header)
  let locale = await requestLocale

  // Validate against supported locales; fall back to default
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
