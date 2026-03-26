'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  UsersThree,
  Disc,
  Newspaper,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { dashboardPathForRole, getRoleOptions } from '@/domain/auth/profile'
import type { RegisterableRole } from '@/domain/auth/profile'

/**
 * Onboarding page — role selection for first-time OAuth users.
 *
 * When a user signs in via Spotify (or any OAuth provider) for the first time,
 * Supabase creates a bare auth record without a platform role. The auth callback
 * at `/api/auth/callback` redirects them here to complete their profile.
 *
 * After form submission:
 *   - POST /api/profile is called with { name, role, bandName }
 *   - On success → redirect to the role-specific dashboard
 *
 * SECURITY: Only registerable roles (fan, band, dj, editor) are selectable.
 *   Admin accounts require a direct database update. See docs/ADMIN_BOOTSTRAP.md.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const roleOptions = getRoleOptions()

  const [selectedRole, setSelectedRole] = useState<RegisterableRole>('fan')
  const [name, setName] = useState('')
  const [bandName, setBandName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: selectedRole,
          bandName: selectedRole === 'band' && bandName.trim() ? bandName.trim() : undefined,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Profil konnte nicht erstellt werden.')
        return
      }

      // Redirect to the role-specific dashboard
      router.push(dashboardPathForRole(selectedRole))
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }, [name, bandName, selectedRole, router])

  const ROLE_ICONS: Record<RegisterableRole, React.ReactNode> = {
    fan:    <User    className="w-5 h-5" weight="duotone" />,
    band:   <UsersThree className="w-5 h-5" weight="duotone" />,
    dj:     <Disc    className="w-5 h-5" weight="duotone" />,
    editor: <Newspaper className="w-5 h-5" weight="duotone" />,
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glassmorphism w-full max-w-lg p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" weight="duotone" />
          </div>
          <h1 className="font-display text-3xl tracking-tight">Willkommen!</h1>
          <p className="text-muted-foreground text-sm">
            Wähle deine Rolle in der darkTunes-Szene und vervollständige dein Profil.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deine Rolle</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map(opt => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={cn(
                    'relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all duration-200',
                    selectedRole === opt.role
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/50 bg-secondary/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5',
                  )}
                >
                  <div className="flex items-center gap-2 text-inherit">
                    {ROLE_ICONS[opt.role]}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <span className="text-xs leading-snug">{opt.description}</span>
                  {opt.requiresKyc && (
                    <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1">
                      KYC
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info box for special roles */}
          {(selectedRole === 'dj' || selectedRole === 'editor') && (
            <div className="rounded-lg bg-secondary/30 border border-border/50 p-3 text-xs text-muted-foreground">
              {selectedRole === 'dj' && (
                <p>
                  <strong className="text-foreground">DJ-Verifikation:</strong> Dein Konto wird
                  nach der Registrierung manuell durch unser Team geprüft (KYC). Du erhältst
                  eine E-Mail, sobald deine DJ-Aktivitäten verifiziert wurden.
                </p>
              )}
              {selectedRole === 'editor' && (
                <p>
                  <strong className="text-foreground">Redakteur-Zugang:</strong> Redaktionelle
                  Rechte werden nur auf Einladung vergeben. Dein Antrag wird weitergeleitet.
                </p>
              )}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="onboarding-name">
              {selectedRole === 'band' ? 'Dein Name / Alias' : 'Name'}
            </Label>
            <Input
              id="onboarding-name"
              placeholder="Dein Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-secondary/30"
              autoComplete="name"
              required
            />
          </div>

          {/* Band name field — only shown when role is "band" */}
          {selectedRole === 'band' && (
            <div className="space-y-2">
              <Label htmlFor="onboarding-band-name">Bandname</Label>
              <Input
                id="onboarding-band-name"
                placeholder="Name deiner Band / Projekts"
                value={bandName}
                onChange={e => setBandName(e.target.value)}
                className="bg-secondary/30"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting || !name.trim()}
          >
            <ArrowRight className="w-4 h-4" />
            {isSubmitting ? 'Profil wird erstellt…' : 'Profil erstellen & weiter'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
