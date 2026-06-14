import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IUserRepository } from '@/domain/repositories'
import { SupabaseUserRepository } from '@/infrastructure/repositories'

export type AuthenticatedUser = {
  id: string
  role: string
  email?: string
}

export type AuthenticatedHandler = (req: NextRequest, ctx: unknown, user: AuthenticatedUser) => Promise<NextResponse>

type RouteHandler = (req: NextRequest, ctx: unknown) => Promise<NextResponse>

function getSupabaseClient() {
  return createClient()
}

export function withAuth(handler: AuthenticatedHandler): RouteHandler {
  return async (req: NextRequest, ctx: unknown) => {
    const supabase = await getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const userRepo = new SupabaseUserRepository(supabase)
    const roleRecord = await userRepo.findRoleById(user.id)

    const authUser: AuthenticatedUser = {
      id: user.id,
      role: roleRecord?.role || 'USER',
      email: user.email
    }

    return handler(req, ctx, authUser)
  }
}

export function requireRole(
  requiredRole: string,
  handler: RouteHandler,
  userRepo?: IUserRepository
): RouteHandler {
  return async (req: NextRequest, ctx: unknown) => {
    const supabase = await getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const activeUserRepo = userRepo || new SupabaseUserRepository(supabase)
    const roleRecord = await activeUserRepo.findRoleById(user.id)

    if (!roleRecord) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    const currentRole = roleRecord.role
    if (!hasRequiredRole(currentRole, requiredRole)) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
    }

    return handler(req, ctx)
  }
}

function hasRequiredRole(currentRole: string, requiredRole: string): boolean {
  if (currentRole === 'ADMIN') return true
  if (currentRole === 'EDITOR' && requiredRole !== 'ADMIN') return true
  return currentRole === requiredRole
}
