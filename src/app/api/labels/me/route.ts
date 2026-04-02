/**
 * GET /api/labels/me
 * Returns all label organisations the current user belongs to.
 * Access: any authenticated user.
 */
import { NextResponse } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

export const GET = withAuth([], async (_request, user) => {
  const memberships = await (prisma as unknown as {
    labelMember: {
      findMany: (args: unknown) => Promise<Array<{
        role: string
        label: { id: string; name: string; slug: string; websiteUrl: string | null; contactEmail: string | null; createdAt: Date }
      }>>
    }
  }).labelMember.findMany({
    where: { userId: user.id },
    include: { label: true },
  })

  const labels = memberships.map((m) => ({
    ...m.label,
    memberRole: m.role,
  }))

  return NextResponse.json({ labels })
})
