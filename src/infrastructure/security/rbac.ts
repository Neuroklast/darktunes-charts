/**
 * @module infrastructure/security/rbac
 *
 * Role-Based Access Control (RBAC) middleware for Next.js API routes.
 *
 * Provides a `withAuth` wrapper that extracts the Supabase session, verifies
 * the user's role against a list of allowed roles, and returns standardised
 * 401/403 JSON responses when access is denied.
 *
 * @example
 * ```typescript
 * // Allow only ADMIN to create awards
 * export const POST = withAuth(['admin'], async (req, user) => {
 *   // `user` is guaranteed to have the 'admin' role
 *   return NextResponse.json({ success: true })
 * })
 *
 * // Allow any authenticated user (no role restriction)
 * export const GET = withAuth([], async (_req, user) => {
 *   return NextResponse.json({ userId: user.id })
 * })
 * ```
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prismaRoleToUserRole } from '@/domain/auth/profile'
import type { UserRole } from '@/lib/types'

/**
 * Authenticated user context passed to the route handler.
 * Contains the Supabase auth ID and the verified platform role.
 */
export interface AuthenticatedUser {
  /** Supabase Auth user ID (UUID). */
  id: string
  /** Verified platform role from the database (not from JWT claims). */
  role: UserRole
  /** User's email address from Supabase Auth. */
  email: string
}

/**
 * Route handler signature when wrapped with `withAuth`.
 * Receives the original request and the verified user context.
 */
type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser,
) => Promise<NextResponse>

/**
 * Wraps an API route handler with authentication and role-based access control.
 *
 * **Authentication**: Verifies a valid Supabase session exists and looks up
 * the user's role from the database (not from JWT claims, which can be stale).
 *
 * **Authorisation**: If `allowedRoles` is non-empty, the user's role must be
 * in the list. An empty `allowedRoles` array means "any authenticated user".
 *
 * **Error responses**:
 * - `401 Unauthorized` — no valid session or user not found in database
 * - `403 Forbidden` — user's role is not in `allowedRoles`
 *
 * @param allowedRoles - Roles permitted to access this endpoint. Empty = any authenticated user.
 * @param handler      - The route handler to execute if authorisation succeeds.
 * @returns            - A Next.js route handler function.
 */
export function withAuth(
  allowedRoles: readonly UserRole[],
  handler: AuthenticatedHandler,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = await createClient()
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }

      // Look up the platform role from the database — never trust JWT claims alone
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { role: true },
      })

      if (!dbUser) {
        return NextResponse.json(
          { error: 'Unauthorized — user profile not found' },
          { status: 401 },
        )
      }

      const role = prismaRoleToUserRole(
        dbUser.role as 'FAN' | 'DJ' | 'BAND' | 'EDITOR' | 'ADMIN' | 'AR' | 'LABEL',
      )

      // Check role authorisation (empty array = any role is allowed)
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Forbidden — insufficient permissions' },
          { status: 403 },
        )
      }

      const authenticatedUser: AuthenticatedUser = {
        id: authUser.id,
        role,
        email: authUser.email ?? '',
      }

      return await handler(request, authenticatedUser)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
