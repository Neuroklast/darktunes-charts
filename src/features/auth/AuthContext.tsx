import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { AuthUser, UserRole } from '@/lib/types'

/** Simulated network delay in ms — replace with 0 when a real API endpoint is wired up. */
const SIMULATED_NETWORK_DELAY_MS = 600

/** Minimum password length enforced at registration. */
const MIN_PASSWORD_LENGTH = 8

/** localStorage key used to persist the authenticated user session. */
const STORAGE_KEY = 'darktunes-auth-user'

/** Credentials accepted by the login form. */
export interface LoginCredentials {
  email: string
  password: string
}

/** Fields required to register a new account. */
export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: Extract<UserRole, 'fan' | 'band' | 'dj' | 'editor'>
  bandName?: string
}

interface AuthContextValue {
  /** The currently authenticated user, or null when logged out. */
  user: AuthUser | null
  /** True while the login / register request is in-flight. */
  isLoading: boolean
  /** True when a user session is active. */
  isAuthenticated: boolean
  /** Convenience: checks whether the current user has a given role. */
  hasRole: (role: UserRole) => boolean
  /** Authenticates an existing user. Returns an error string on failure. */
  login: (credentials: LoginCredentials) => Promise<string | null>
  /** Creates a new account and signs the user in. Returns an error string on failure. */
  register: (payload: RegisterPayload) => Promise<string | null>
  /** Destroys the current session. */
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provides authentication state to the entire application tree.
 *
 * Auth state is persisted in localStorage so sessions survive page reloads.
 * In this frontend-only MVP, login is simulated locally; the KV-shim backend
 * is ready to swap in a real OAuth / JWT flow when the API layer is finalised.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Restore persisted session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (isValidAuthUser(parsed)) {
          setUser(parsed)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const persistUser = useCallback((u: AuthUser) => {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }, [])

  /**
   * Simulated login: matches email against seeded demo accounts.
   * Replace this body with a real API call (POST /api/auth/login) in production.
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<string | null> => {
      setIsLoading(true)
      try {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, SIMULATED_NETWORK_DELAY_MS))

        const demo = DEMO_ACCOUNTS.find(
          a => a.email === credentials.email.toLowerCase().trim(),
        )

        if (!demo || credentials.password !== DEMO_PASSWORD) {
          return 'E-Mail oder Passwort ist ungültig.'
        }

        persistUser(demo)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [persistUser],
  )

  /**
   * Simulated registration: creates a new user object and persists it.
   * Replace with a real POST /api/auth/register endpoint in production.
   */
  const register = useCallback(
    async (payload: RegisterPayload): Promise<string | null> => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, SIMULATED_NETWORK_DELAY_MS))

        if (!payload.email || !payload.password || !payload.name) {
          return 'Alle Pflichtfelder müssen ausgefüllt sein.'
        }

        if (payload.password.length < MIN_PASSWORD_LENGTH) {
          return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`
        }

        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          role: payload.role,
          name: payload.name.trim(),
          email: payload.email.toLowerCase().trim(),
          credits: 100,
          bandId: payload.role === 'band' ? `band-${Date.now()}` : undefined,
          isDJVerified: false,
          joinedAt: Date.now(),
        }

        persistUser(newUser)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [persistUser],
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const hasRole = useCallback(
    (role: UserRole) => user?.role === role,
    [user],
  )

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    hasRole,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Accesses the auth context. Must be used inside an `AuthProvider` subtree.
 * Throws if called outside of the provider (fail-fast for misconfiguration).
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return context
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = 'demo1234'

/** Pre-seeded demo accounts for development / testing. */
const DEMO_ACCOUNTS: AuthUser[] = [
  {
    id: 'admin-1',
    role: 'admin',
    name: 'Raphaël Beck',
    email: 'admin@darktunes.com',
    credits: 100,
    isDJVerified: true,
    joinedAt: Date.now(),
  },
  {
    id: 'dj-1',
    role: 'dj',
    name: 'DJ Schatten',
    email: 'dj@darktunes.com',
    credits: 100,
    isDJVerified: true,
    joinedAt: Date.now(),
  },
  {
    id: 'band-1',
    role: 'band',
    name: 'CZARINA',
    email: 'band@darktunes.com',
    credits: 100,
    bandId: 'band-czarina',
    isDJVerified: false,
    joinedAt: Date.now(),
  },
  {
    id: 'editor-1',
    role: 'editor',
    name: 'Nacht Redaktion',
    email: 'editor@darktunes.com',
    credits: 100,
    isDJVerified: false,
    joinedAt: Date.now(),
  },
  {
    id: 'fan-1',
    role: 'fan',
    name: 'Dark Fan',
    email: 'fan@darktunes.com',
    credits: 100,
    isDJVerified: false,
    joinedAt: Date.now(),
  },
]

function isValidAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'role' in value &&
    'email' in value
  )
}
