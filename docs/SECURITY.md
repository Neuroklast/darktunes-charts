# Security Documentation

## Overview

This document describes the security measures implemented in the DarkTunes Charts platform, including authentication, authorization, and API security controls.

## Authentication

### Supabase Auth Integration

The platform uses Supabase Auth for user authentication with support for:
- Email/password authentication
- OAuth providers (Spotify, Google, GitHub)
- Session management via HTTP-only cookies

### Session Validation

All protected API routes validate the user's session using the `requireAuth()` middleware function from `src/lib/auth/rbac.ts`.

## Authorization

### Role-Based Access Control (RBAC)

The platform implements a comprehensive RBAC system with the following roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| `fan` | Public voters | Quadratic voting with 100 Voice Credits/month |
| `band` | Registered artists | Peer-review voting, 1 free category/month |
| `dj` | Verified scene DJs | Ranked-choice Schulze ballot voting (requires KYC) |
| `editor` | Editorial staff | Create events, manage spotlights |
| `admin` | Platform administrators | Full access to all resources |
| `ar` | A&R professionals | Access to B2B scouting dashboard and exports |

### RBAC Middleware

The `src/lib/auth/rbac.ts` module provides reusable middleware functions:

#### `requireAuth()`
Validates that the request has a valid Supabase session and retrieves the authenticated user's profile from the database.

**Returns:**
- `{ success: true, user: AuthenticatedUser }` - User is authenticated
- `{ success: false, response: NextResponse }` - Error response with 401 status

#### `requireRole(request, allowedRoles)`
Validates that the authenticated user has one of the specified roles.

**Parameters:**
- `request: NextRequest` - The incoming request
- `allowedRoles: UserRole[]` - Array of roles permitted to access the resource

**Returns:**
- `{ success: true, user: AuthenticatedUser }` - User has required role
- `{ success: false, response: NextResponse }` - Error response with 403 status

#### `validateUserOwnership(authenticatedUserId, requestedUserId)`
Validates that a requested user ID matches the authenticated user's ID to prevent IDOR vulnerabilities.

## API Route Security

### Fixed Vulnerabilities (March 2026)

This section documents the critical security vulnerabilities that were identified and fixed:

#### 1. IDOR Vulnerability in `/api/achievements` (CRITICAL - Issue #38)

**Vulnerability:** The endpoint accepted a `userId` query parameter without validating it against the authenticated user's session, allowing any authenticated user to view other users' achievements.

**Fix:**
- Added `requireAuth()` check
- Validates that `userId` parameter matches the authenticated user's ID
- Returns 403 Forbidden if IDs don't match

**OWASP Category:** A01:2021 - Broken Access Control

#### 2. Missing Role Authorization in `/api/events POST` (HIGH - Issue #39)

**Vulnerability:** The endpoint only checked for authentication but didn't verify the user's role.

**Fix:**
- Added `requireRole(request, ['admin', 'editor'])` check
- Only admin and editor roles can create events

**OWASP Category:** A01:2021 - Broken Access Control

#### 3. Missing Role Authorization in `/api/awards POST` (HIGH - Issue #40)

**Vulnerability:** The endpoint only checked for authentication but didn't verify the user's role.

**Fix:**
- Added `requireRole(request, ['admin'])` check
- Only admin role can create awards

**OWASP Category:** A01:2021 - Broken Access Control

#### 4. Public Access to `/api/bot-detection GET` (HIGH - Issue #41)

**Vulnerability:** The endpoint had no authentication or authorization checks, exposing sensitive bot detection data.

**Fix:**
- Added `requireRole(request, ['admin'])` check to GET, PUT methods
- Only admin role can view and manage bot detection alerts

**OWASP Category:** A01:2021 - Broken Access Control

#### 5. Missing Role Authorization in `/api/export GET` (HIGH - Issue #42)

**Vulnerability:** The endpoint only checked for authentication but didn't verify the user's role.

**Fix:**
- Added `requireRole(request, ['ar', 'admin'])` check
- Only A&R professionals and admins can export analytics data

**OWASP Category:** A01:2021 - Broken Access Control

#### 6. Missing Input Validation in `/api/spotify GET` (MEDIUM - Issue #43)

**Vulnerability:** The endpoint accepted any string as an `artistId` parameter without validation, potentially allowing injection attacks.

**Fix:**
- Added Zod schema validation for Spotify artist IDs
- Artist IDs must be exactly 22 alphanumeric characters
- Returns 400 Bad Request for invalid formats

**OWASP Category:** A03:2021 - Injection

### CORS Headers (Issue #45)

All API routes now include explicit CORS headers via the `withCORS()` helper function:
- `Access-Control-Allow-Origin: *` (will be restricted in production)
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Max-Age: 86400`

## Security Testing

### Unit Tests

Comprehensive unit tests for RBAC middleware are located in:
- `src/lib/auth/__tests__/rbac.test.ts`

Tests cover:
- Authentication validation
- Role-based authorization
- User ownership validation
- CORS header management

### Running Security Tests

```bash
# Run all tests
npx vitest run

# Run RBAC tests specifically
npx vitest run src/lib/auth/__tests__/rbac.test.ts
```

## Security Best Practices

### For API Route Developers

1. **Always require authentication** for protected endpoints:
   ```typescript
   const authResult = await requireAuth()
   if (!authResult.success) {
     return authResult.response
   }
   ```

2. **Enforce role-based authorization** when needed:
   ```typescript
   const authResult = await requireRole(request, ['admin', 'editor'])
   if (!authResult.success) {
     return authResult.response
   }
   ```

3. **Validate user ownership** for user-specific resources:
   ```typescript
   if (!validateUserOwnership(authResult.user.id, requestedUserId)) {
     return NextResponse.json(
       { error: 'Forbidden - Access denied' },
       { status: 403 }
     )
   }
   ```

4. **Add CORS headers** to all responses:
   ```typescript
   return withCORS(NextResponse.json({ data }))
   ```

5. **Validate all input** using Zod schemas:
   ```typescript
   const schema = z.object({
     field: z.string().min(1).max(100)
   })
   const result = schema.safeParse(body)
   if (!result.success) {
     return withCORS(NextResponse.json(
       { error: 'Invalid input', details: result.error.flatten() },
       { status: 400 }
     ))
   }
   ```

## Known Issues

### Pre-existing TypeScript Error

The TypeScript compilation shows a known error in `src/lib/prisma.ts`:
```
error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
```

This is a known issue with Prisma 7 and does not affect runtime behavior. The build completes successfully despite this error.

## Future Improvements

- [ ] Implement rate limiting for API endpoints
- [ ] Add IP-based request throttling
- [ ] Implement security headers middleware (CSP, HSTS, etc.)
- [ ] Add audit logging for sensitive operations
- [ ] Implement 2FA for admin accounts
- [ ] Add automated security scanning in CI/CD pipeline
- [ ] Restrict CORS origins in production

## Reporting Security Issues

If you discover a security vulnerability, please email security@darktunes.example.com (DO NOT create a public issue).

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/security)
