/**
 * POST /api/labels
 * Creates a new Label organisation.
 * Access: LABEL role required.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'
import { CreateLabelSchema } from '@/domain/labels'

export const POST = withAuth(['LABEL', 'ADMIN'], async (request: NextRequest, user) => {
  const body: unknown = await request.json()
  const parsed = CreateLabelSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { name, slug, websiteUrl, contactEmail } = parsed.data

  // Check slug uniqueness
  const existing = await (prisma as unknown as {
    label: {
      findUnique: (args: unknown) => Promise<{ id: string } | null>
      create: (args: unknown) => Promise<{ id: string; name: string; slug: string }>
    }
    labelMember: {
      create: (args: unknown) => Promise<{ id: string }>
    }
  }).label.findUnique({ where: { slug } })

  if (existing) {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  }

  const prismaTyped = prisma as unknown as {
    label: {
      create: (args: unknown) => Promise<{ id: string; name: string; slug: string; websiteUrl: string | null; contactEmail: string | null; createdAt: Date }>
    }
    labelMember: {
      create: (args: unknown) => Promise<{ id: string }>
    }
  }

  const label = await prismaTyped.label.create({
    data: { name, slug, websiteUrl: websiteUrl ?? null, contactEmail: contactEmail ?? null },
  })

  // Auto-create the creator as ADMIN member
  await prismaTyped.labelMember.create({
    data: { labelId: label.id, userId: user.id, role: 'ADMIN' },
  })

  return NextResponse.json({ label }, { status: 201 })
})
