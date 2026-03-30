/**
 * @module infrastructure/security/rbac
 *
 * Role-Based Access Control (RBAC) middleware for Next.js API route handlers.
 *
 * Provides a `withAuth` wrapper that validates the Supabase session and checks
 * the user's database role against an allow-list before delegating to the
 * inner handler. Returns 401 for missing/invalid sessions and 403 for
 * insufficient role privileges.
 *
 * Usage:
 *   export const POST = withAuth(['ADMIN', 'EDITOR'], async (req, user) => { ... })
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { PrismaUserRole } from '@/domain/auth/profile'
import type { IUserRepository } from '@/domain/repositories'
import { PrismaUserRepository } from '@/infrastructure/repositories'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Authenticated user context passed to the inner handler. */
export interface AuthenticatedUser {
  /** Supabase Auth user ID (UUID). */
  id: string
  /** Database role (Prisma enum value). */
  role: PrismaUserRole
}

/**
 * Signature of the inner handler that receives the authenticated user context.
 * The handler can accept an optional `Request` (or `NextRequest`) as first arg.
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser,
) => Promise<NextResponse>

// ─── Default repository ──────────────────────────────────────────────────────

const defaultUserRepo: IUserRepository = new PrismaUserRepository(prisma)

// ─── Middleware factory ──────────────────────────────────────────────────────

/**
 * Creates an RBAC-protected route handler.
 *
 * @param allowedRoles - Prisma `UserRole` values that may access the endpoint.
 *                       Pass an empty array to require authentication only
 *                       (any role is accepted).
 * @param handler      - The route handler to execute when authorised.
 * @param userRepo     - Optional repository override (for unit testing).
 * @returns              A Next.js route handler function.
 *
 * @example
 * // Only admins can create awards
 * export const POST = withAuth(['ADMIN'], async (req, user) => {
 *   const body = await req.json()
 *   return NextResponse.json({ success: true })
 * })
 *
 * @example
 * // Any authenticated user can access
 * export const GET = withAuth([], async (req, user) => {
 *   return NextResponse.json({ userId: user.id })
 * })
 */
export function withAuth(
  allowedRoles: readonly PrismaUserRole[],
  handler: AuthenticatedHandler,
  userRepo: IUserRepository = defaultUserRepo,
): (request: NextRequest) => Promise<NextResponse> {
  return async function protectedHandler(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Validate Supabase session
      const supabase = await createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 2. Fetch the user's role from the database
      const dbUser = await userRepo.findRoleById(authUser.id)

      if (!dbUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // 3. Check role authorisation (empty array = any role accepted)
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(dbUser.role)
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // 4. Delegate to the inner handler
      return await handler(request, { id: authUser.id, role: dbUser.role })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
