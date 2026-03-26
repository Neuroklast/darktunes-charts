import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses the public anon key - safe to expose in the browser.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createBrowserClient(url, anonKey)
}
