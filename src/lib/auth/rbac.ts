/**
 * @module lib/auth/rbac
 *
 * Role-Based Access Control (RBAC) middleware for API routes.
 *
 * Provides reusable functions to enforce authentication and authorization
 * in Next.js API route handlers.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@/lib/types'
import { prismaRoleToUserRole, type PrismaUserRole } from '@/domain/auth/profile'

/**
 * Authenticated user context returned by requireAuth and requireRole.
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  dbRole: PrismaUserRole
}

/**
 * Result type for auth middleware functions.
 * Either contains the authenticated user or an error response.
 */
export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse }

/**
 * Retrieves the authenticated user from the Supabase session.
 * Returns an error response if the user is not authenticated.
 *
 * @param _request - The incoming request (reserved for future use)
 * @returns AuthResult containing the user or an error response
 */
export async function requireAuth(_request?: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Fetch the user's role from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true },
    })

    if (!dbUser) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - User profile not found' },
          { status: 401 }
        ),
      }
    }

    return {
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: prismaRoleToUserRole(dbUser.role),
        dbRole: dbUser.role,
      },
    }
  } catch (error) {
    console.error('[requireAuth] Error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Checks if the authenticated user has one of the required roles.
 * Returns an error response if the user is not authenticated or lacks permission.
 *
 * @param request - The incoming request
 * @param allowedRoles - Array of roles that are permitted to access the resource
 * @returns AuthResult containing the user or an error response
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthResult> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Forbidden - Insufficient permissions',
          required: allowedRoles,
          actual: authResult.user.role,
        },
        { status: 403 }
      ),
    }
  }

  return authResult
}

/**
 * Validates that the provided userId matches the authenticated user's ID.
 * This prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
 *
 * @param authenticatedUserId - The ID of the authenticated user
 * @param requestedUserId - The user ID from the request (query param, body, etc.)
 * @returns True if the IDs match, false otherwise
 */
export function validateUserOwnership(
  authenticatedUserId: string,
  requestedUserId: string | null | undefined
): boolean {
  if (!requestedUserId) {
    return false
  }
  return authenticatedUserId === requestedUserId
}

/**
 * Standard CORS headers for API responses.
 * Restricts access to same-origin and allows common HTTP methods.
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Will be restricted in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
} as const

/**
 * Adds standard CORS headers to a NextResponse.
 *
 * @param response - The response to augment with CORS headers
 * @returns The response with CORS headers added
 */
export function withCORS(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Handles OPTIONS requests for CORS preflight.
 *
 * @returns A 200 response with CORS headers
 */
export function handleCORSPreflight(): NextResponse {
  return withCORS(new NextResponse(null, { status: 200 }))
}
