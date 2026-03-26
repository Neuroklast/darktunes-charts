'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, UserRole } from '@/lib/types'
import type { UserProfile } from '@/domain/auth/profile'

/** Path of the Supabase OAuth callback route handler. */
const AUTH_CALLBACK_PATH = '/api/auth/callback'

/** Minimum password length enforced client-side (must match Supabase Auth settings). */
const MIN_PASSWORD_LENGTH = 8

/** Credentials for email/password sign-in. */
export interface LoginCredentials {
  email: string
  password: string
}

/** Fields required to create a new email/password account. */
export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: Extract<UserRole, 'fan' | 'band' | 'dj' | 'editor'>
  bandName?: string
}

interface AuthContextValue {
  /** Platform user — null until session + profile are loaded. */
  user: AuthUser | null
  /** True while the initial session is being resolved. */
  isLoading: boolean
  /** True when a user session is active. */
  isAuthenticated: boolean
  /**
   * True when the Supabase session exists but no platform profile was found.
   * Consumers can redirect to /onboarding when this is true.
   */
  isProfileIncomplete: boolean
  /** Convenience: checks whether the current user has a given role. */
  hasRole: (role: UserRole) => boolean
  /** Sign in with email and password. Returns error string on failure. */
  login: (credentials: LoginCredentials) => Promise<string | null>
  /** Create a Supabase account + platform profile. Returns error string on failure. */
  register: (payload: RegisterPayload) => Promise<string | null>
  /** Sign in via an OAuth provider (browser redirect — returns null or error). */
  loginWithOAuth: (provider: 'spotify' | 'google' | 'github') => Promise<string | null>
  /** Sign out and clear the session. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider — Real Supabase Authentication
 *
 * Replaces the previous localStorage simulation with a proper Supabase session.
 * Session state is driven by `supabase.auth.onAuthStateChange` so it stays
 * consistent across tabs and page reloads without manual persistence.
 *
 * Profile lookup flow:
 *   1. `onAuthStateChange` fires `SIGNED_IN` or `INITIAL_SESSION`
 *   2. We call `GET /api/profile` to load the platform role + credits
 *   3. If no profile exists, `isProfileIncomplete = true` → redirect to /onboarding
 *      (the actual redirect is the responsibility of the onboarding page or layout)
 *
 * Admin accounts are NEVER creatable via this flow — they require a direct
 * database update after an initial OAuth sign-in. See docs/ADMIN_BOOTSTRAP.md.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)

  /**
   * Fetches the platform profile for the currently authenticated Supabase user
   * and populates the local `user` state. Sets `isProfileIncomplete` if the
   * profile row does not exist yet (first-time OAuth login).
   */
  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) {
        setUser(null)
        setIsProfileIncomplete(false)
        return
      }

      const data = (await res.json()) as { profile: UserProfile | null }

      if (!data.profile) {
        // Authenticated but no platform profile — needs onboarding
        setUser(null)
        setIsProfileIncomplete(true)
        return
      }

      const p = data.profile
      setUser({
        id: p.id,
        role: p.role,
        name: p.name,
        email: p.email,
        credits: p.credits,
        bandId: p.bandId ?? undefined,
        isDJVerified: p.isDJVerified,
        avatarUrl: p.avatarUrl ?? undefined,
        joinedAt: new Date(p.createdAt).getTime(),
      })
      setIsProfileIncomplete(false)
    } catch {
      // Network failure — treat as unauthenticated rather than crashing
      setUser(null)
      setIsProfileIncomplete(false)
    }
  }, [])

  // Subscribe to Supabase auth state on mount
  useEffect(() => {
    const supabase = createClient()

    // Resolve existing session immediately so we don't flash a loading state
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) {
          setIsLoading(false)
          return
        }
        return loadProfile()
      })
      .catch((err: unknown) => {
        // Network failure on initial session check — log in dev, stay logged out
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AuthContext] Initial session check failed:', err)
        }
      })
      .finally(() => { setIsLoading(false) })

    // Keep state in sync across tabs / token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void loadProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsProfileIncomplete(false)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [loadProfile])

  /**
   * Email / password sign-in.
   * Returns a localised error message on failure, null on success.
   */
  const login = useCallback(async ({ email, password }: LoginCredentials): Promise<string | null> => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return 'E-Mail oder Passwort ist ungültig.'
    }
    return error.message
  }, [])

  /**
   * Email / password sign-up.
   *
   * The chosen role is stored in `user_metadata` under the key
   * `darktunes_role` so the OAuth callback (and the profile API) can create
   * the platform profile automatically after email confirmation.
   *
   * When auto-confirm is on (dev / "Confirm email" disabled in Supabase),
   * a session is returned immediately and we create the profile right away.
   */
  const register = useCallback(async (payload: RegisterPayload): Promise<string | null> => {
    if (payload.password.length < MIN_PASSWORD_LENGTH) {
      return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
        data: {
          darktunes_role: payload.role,
          darktunes_name: payload.name,
          darktunes_band_name: payload.bandName,
        },
      },
    })

    if (error) return error.message

    // Auto-confirm path: create the profile immediately
    if (data.session) {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          role: payload.role,
          bandName: payload.bandName,
        }),
      })
      if (!res.ok) return 'Profil konnte nicht erstellt werden.'
      await loadProfile()
    }

    return null
  }, [loadProfile])

  /**
   * OAuth sign-in via an external provider.
   *
   * Triggers a browser redirect to the provider's login page. The Supabase
   * auth callback at `/api/auth/callback` handles the return redirect, checks
   * for a platform profile, and redirects to `/onboarding` if none exists.
   *
   * SECURITY NOTE: Admin accounts cannot be created through this flow.
   * A fresh OAuth login always produces a `fan`-role user. Admin privileges
   * require a manual database update. See docs/ADMIN_BOOTSTRAP.md.
   */
  const loginWithOAuth = useCallback(async (
    provider: 'spotify' | 'google' | 'github',
  ): Promise<string | null> => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
        scopes: provider === 'spotify' ? 'user-read-email' : undefined,
      },
    })
    return error ? error.message : null
  }, [])

  /** Sign out and clear all local auth state. */
  const logout = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }, [])

  const hasRole = useCallback(
    (role: UserRole) => user?.role === role,
    [user],
  )

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isProfileIncomplete,
    hasRole,
    login,
    register,
    loginWithOAuth,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Accesses the auth context. Must be used inside an `AuthProvider` subtree.
 * Throws on misconfiguration so the error surfaces immediately in development.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return context
}
