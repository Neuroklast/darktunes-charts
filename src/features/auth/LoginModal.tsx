import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Disc,
  UsersThree,
  Newspaper,
  ShieldCheck,
  SignIn,
  UserPlus,
  MusicNote,
} from '@phosphor-icons/react'
import { useAuth, type RegisterPayload } from './AuthContext'
import type { UserRole } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

type ModalTab = 'login' | 'register'

type RegisterableRole = Extract<UserRole, 'fan' | 'band' | 'dj' | 'editor'>

interface RoleOption {
  role: RegisterableRole
  label: string
  description: string
  icon: React.ReactNode
  badge?: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'fan',
    label: 'Fan',
    description: '100 Voice Credits / Monat · Quadratic Voting',
    icon: <User className="w-5 h-5" weight="duotone" />,
  },
  {
    role: 'band',
    label: 'Band / Künstler',
    description: '1 kostenlose Kategorie / Monat · Peer-Review Voting',
    icon: <UsersThree className="w-5 h-5" weight="duotone" />,
  },
  {
    role: 'dj',
    label: 'DJ / Kurator',
    description: 'Ranked-Choice Schulze Ballot · KYC erforderlich',
    icon: <Disc className="w-5 h-5" weight="duotone" />,
    badge: 'KYC',
  },
  {
    role: 'editor',
    label: 'Redakteur',
    description: 'Redaktionelle Rechte · Spotlights & Nominierungen',
    icon: <Newspaper className="w-5 h-5" weight="duotone" />,
    badge: 'Auf Einladung',
  },
]

/** Spotify brand green — extracted to avoid colour drift across touch-points. */
const SPOTIFY_GREEN = '#1DB954'

/**
 * Login / Registration modal with role selection.
 *
 * Implements the platform's role model:
 * - Fans and Bands can self-register
 * - DJs require manual KYC verification (flag set by admin post-signup)
 * - Editors are invited by the editorial team
 * - Admins are not publicly registerable
 */
export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, register, loginWithOAuth, isLoading } = useAuth()
  const [tab, setTab] = useState<ModalTab>('login')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<RegisterableRole>('fan')
  const [regBandName, setRegBandName] = useState('')
  const [regError, setRegError] = useState('')

  const [oauthError, setOAuthError] = useState('')

  const resetErrors = useCallback(() => {
    setLoginError('')
    setRegError('')
    setOAuthError('')
  }, [])

  const handleOAuthLogin = useCallback(async (provider: 'spotify' | 'google' | 'github') => {
    resetErrors()
    const error = await loginWithOAuth(provider)
    if (error) {
      setOAuthError(error)
    }
    // On success the browser redirects — no need to close the modal
  }, [loginWithOAuth, resetErrors])

  const handleLogin = useCallback(async () => {
    resetErrors()
    const error = await login({ email: loginEmail, password: loginPassword })
    if (error) {
      setLoginError(error)
    } else {
      toast.success('Willkommen zurück! 🎵')
      onClose()
    }
  }, [login, loginEmail, loginPassword, onClose, resetErrors])

  const handleRegister = useCallback(async () => {
    resetErrors()
    const payload: RegisterPayload = {
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      bandName: regRole === 'band' ? regBandName : undefined,
    }
    const error = await register(payload)
    if (error) {
      setRegError(error)
    } else {
      toast.success('Account erstellt! Willkommen in der Szene 🖤')
      onClose()
    }
  }, [register, regName, regEmail, regPassword, regRole, regBandName, onClose, resetErrors])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (tab === 'login') void handleLogin()
        else void handleRegister()
      }
    },
    [tab, handleLogin, handleRegister],
  )

  return (
    <Dialog open={open} onOpenChange={open ? onClose : undefined}>
      <DialogContent
        className="glassmorphism max-w-md w-full animate-modal-in"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" weight="duotone" />
            {tab === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {tab === 'login'
              ? 'Melde dich mit deinem darkTunes-Konto an.'
              : 'Wähle deine Rolle in der Szene.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-secondary/40 rounded-lg">
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200',
              tab === 'login'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => { setTab('login'); resetErrors() }}
          >
            <SignIn className="w-4 h-4" />
            Anmelden
          </button>
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200',
              tab === 'register'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => { setTab('register'); resetErrors() }}
          >
            <UserPlus className="w-4 h-4" />
            Registrieren
          </button>
        </div>

        {tab === 'login' ? (
          <LoginForm
            email={loginEmail}
            password={loginPassword}
            error={loginError}
            isLoading={isLoading}
            onEmailChange={setLoginEmail}
            onPasswordChange={setLoginPassword}
            onSubmit={handleLogin}
          />
        ) : (
          <RegisterForm
            name={regName}
            email={regEmail}
            password={regPassword}
            role={regRole}
            bandName={regBandName}
            error={regError}
            isLoading={isLoading}
            onNameChange={setRegName}
            onEmailChange={setRegEmail}
            onPasswordChange={setRegPassword}
            onRoleChange={setRegRole}
            onBandNameChange={setRegBandName}
            onSubmit={handleRegister}
          />
        )}

        {/* OAuth divider — shown on both tabs */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-widest">
              oder weiter mit
            </span>
          </div>
        </div>

        {/* Spotify OAuth button */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 border-[#1DB954]/40 hover:border-[#1DB954] hover:bg-[#1DB954]/10 transition-colors"
            onClick={() => void handleOAuthLogin('spotify')}
            disabled={isLoading}
            type="button"
          >
            <MusicNote className="w-4 h-4" style={{ color: SPOTIFY_GREEN }} weight="fill" />
            Mit Spotify anmelden
          </Button>
          {oauthError && (
            <p className="text-sm text-destructive text-center">{oauthError}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface LoginFormProps {
  email: string
  password: string
  error: string
  isLoading: boolean
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: () => void
}

function LoginForm({
  email, password, error, isLoading,
  onEmailChange, onPasswordChange, onSubmit,
}: LoginFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">E-Mail</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="deine@email.de"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          className="bg-secondary/30"
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Passwort</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          className="bg-secondary/30"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        className="w-full gap-2"
        onClick={onSubmit}
        disabled={isLoading || !email || !password}
      >
        <SignIn className="w-4 h-4" />
        {isLoading ? 'Anmelden…' : 'Anmelden'}
      </Button>
    </div>
  )
}

interface RegisterFormProps {
  name: string
  email: string
  password: string
  role: RegisterableRole
  bandName: string
  error: string
  isLoading: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRoleChange: (v: RegisterableRole) => void
  onBandNameChange: (v: string) => void
  onSubmit: () => void
}

function RegisterForm({
  name, email, password, role, bandName, error, isLoading,
  onNameChange, onEmailChange, onPasswordChange, onRoleChange, onBandNameChange, onSubmit,
}: RegisterFormProps) {
  return (
    <div className="space-y-4">
      {/* Role selector */}
      <div className="space-y-2">
        <Label>Rolle</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.role}
              type="button"
              onClick={() => onRoleChange(opt.role)}
              className={cn(
                'relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all duration-200',
                role === opt.role
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border/50 bg-secondary/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5',
              )}
            >
              <div className="flex items-center gap-2 text-inherit">
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <span className="text-xs leading-snug">{opt.description}</span>
              {opt.badge && (
                <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1">
                  {opt.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="reg-name">{role === 'band' ? 'Dein Name / Alias' : 'Name'}</Label>
        <Input
          id="reg-name"
          placeholder="Dein Name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          className="bg-secondary/30"
        />
      </div>

      {role === 'band' && (
        <div className="space-y-2">
          <Label htmlFor="reg-band-name">Bandname</Label>
          <Input
            id="reg-band-name"
            placeholder="Name deiner Band / Projekt"
            value={bandName}
            onChange={e => onBandNameChange(e.target.value)}
            className="bg-secondary/30"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reg-email">E-Mail</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="deine@email.de"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          className="bg-secondary/30"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Passwort</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          onChange={e => onPasswordChange(e.target.value)}
          className="bg-secondary/30"
          autoComplete="new-password"
        />
      </div>

      {(role === 'dj' || role === 'editor') && (
        <div className="rounded-lg bg-secondary/30 border border-border/50 p-3 text-xs text-muted-foreground">
          {role === 'dj' && (
            <p>
              <strong className="text-foreground">DJ-Verifikation:</strong> Nach der Registrierung wird
              dein Konto manuell durch unser Team geprüft (KYC). Du erhältst eine Bestätigungs-E-Mail,
              sobald deine Residencies, Webradio-Aktivitäten oder Festival-Bookings verifiziert wurden.
            </p>
          )}
          {role === 'editor' && (
            <p>
              <strong className="text-foreground">Redakteur-Zugang:</strong> Redaktionelle Rechte
              werden nur auf Einladung des darkTunes-Teams vergeben. Dein Antrag wird weitergeleitet.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full gap-2"
        onClick={onSubmit}
        disabled={isLoading || !name || !email || !password}
      >
        <UserPlus className="w-4 h-4" />
        {isLoading ? 'Konto wird erstellt…' : 'Konto erstellen'}
      </Button>
    </div>
  )
}
