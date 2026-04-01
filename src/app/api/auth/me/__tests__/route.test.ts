import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockGetUser, mockDeleteUser, mockFrom, mockFanVoteUpdateMany, mockDjBallotDeleteMany, mockAuditLogDeleteMany, mockUserDelete } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockDeleteUser: vi.fn(),
  mockFrom: vi.fn(),
  mockFanVoteUpdateMany: vi.fn(),
  mockDjBallotDeleteMany: vi.fn(),
  mockAuditLogDeleteMany: vi.fn(),
  mockUserDelete: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: { deleteUser: mockDeleteUser },
    },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: mockUserDelete,
    },
    fanVote: { updateMany: mockFanVoteUpdateMany, findMany: vi.fn().mockResolvedValue([]) },
    dJBallot: { deleteMany: mockDjBallotDeleteMany, findMany: vi.fn().mockResolvedValue([]) },
    auditLog: { deleteMany: mockAuditLogDeleteMany, findMany: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock('@/domain/auth/profile', () => ({
  prismaRoleToUserRole: (role: string) => role.toLowerCase(),
}))

import { DELETE } from '../route'

describe('DELETE /api/auth/me — GDPR Account Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('not authenticated') })

    const response = await DELETE()
    expect(response.status).toBe(401)
  })

  it('anonymises fan votes and deletes personal data', async () => {
    const userId = 'user-123'
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: userId } }, error: null })
    mockFanVoteUpdateMany.mockResolvedValueOnce({ count: 5 })
    mockDjBallotDeleteMany.mockResolvedValueOnce({ count: 2 })
    mockAuditLogDeleteMany.mockResolvedValueOnce({ count: 10 })
    mockUserDelete.mockResolvedValueOnce({})
    mockDeleteUser.mockResolvedValueOnce({})

    const response = await DELETE()
    expect(response.status).toBe(200)

    const data = await response.json() as { success: boolean }
    expect(data.success).toBe(true)

    // Verify fan votes were anonymised (userId set to null) not deleted
    expect(mockFanVoteUpdateMany).toHaveBeenCalledWith({
      where: { userId },
      data: { userId: null },
    })

    // Verify DJ ballots were deleted
    expect(mockDjBallotDeleteMany).toHaveBeenCalledWith({ where: { userId } })

    // Verify user record was deleted
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: userId } })
  })
})
