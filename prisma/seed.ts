/**
 * Prisma seed script for darkTunes Charts Phase 2 MVP.
 *
 * Seeds:
 * 1. A demo admin user (ID matches a known Supabase Auth user for local dev).
 * 2. 89 dark-music bands from SEED_BANDS (migrated from in-memory store).
 * 3. A default VotingPeriod for the current month (status: OPEN).
 *
 * Run with: npx prisma db seed
 * Or directly: npx tsx prisma/seed.ts
 */

import { prisma } from '../src/lib/prisma'
import { SEED_BANDS } from '../src/lib/seedData'

/** Genre enum mapping from domain strings to Prisma enum values. */
const GENRE_MAP: Record<string, string> = {
  'Goth': 'GOTH',
  'Metal': 'METAL',
  'Dark Electro': 'DARK_ELECTRO',
  'Post Punk': 'POST_PUNK',
  'Industrial': 'INDUSTRIAL',
  'Darkwave': 'DARKWAVE',
  'EBM': 'EBM',
  'Symphonic Metal': 'SYMPHONIC_METAL',
  'Aggrotech': 'AGGROTECH',
  'Neofolk': 'NEOFOLK',
}

/** Tier enum mapping from domain strings to Prisma enum values. */
const TIER_MAP: Record<string, string> = {
  'Micro': 'MICRO',
  'Emerging': 'EMERGING',
  'Established': 'ESTABLISHED',
  'International': 'INTERNATIONAL',
  'Macro': 'MACRO',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seedAdminUser() {
  console.log('👤 Creating demo admin user...')

  // Using a well-known UUID for local dev — must match Supabase Auth user
  const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000001'

  await (prisma as unknown as {
    user: { upsert: (args: unknown) => Promise<{ id: string }> }
  }).user.upsert({
    where: { id: DEMO_ADMIN_ID },
    create: {
      id: DEMO_ADMIN_ID,
      email: 'admin@darktunes.local',
      name: 'DarkTunes Admin',
      displayName: 'Admin',
      role: 'ADMIN',
      credits: 0,
    },
    update: { role: 'ADMIN' },
  })

  console.log(`✅ Demo admin created: ${DEMO_ADMIN_ID}`)
  return DEMO_ADMIN_ID
}

async function seedBands(_adminUserId: string) {
  console.log(`🎸 Seeding ${SEED_BANDS.length} bands...`)

  let created = 0
  let skipped = 0

  for (const band of SEED_BANDS) {
    const slug = slugify(band.name)
    const genreEnum = GENRE_MAP[band.genre as string] ?? 'GOTH'
    const tierEnum = TIER_MAP[band.tier as string] ?? 'MICRO'

    // Each band needs a unique owner user — create a synthetic one
    const syntheticUserId = `band-owner-${band.id}`

    try {
      // Upsert the synthetic band-owner user
      await (prisma as unknown as {
        user: { upsert: (args: unknown) => Promise<{ id: string }> }
      }).user.upsert({
        where: { id: syntheticUserId },
        create: {
          id: syntheticUserId,
          email: `band-${slug}@seed.darktunes.local`,
          name: band.name,
          role: 'BAND',
          credits: 0,
        },
        update: {},
      })

      // Upsert the band
      await (prisma as unknown as {
        band: { upsert: (args: unknown) => Promise<{ id: string }> }
      }).band.upsert({
        where: { ownerId: syntheticUserId },
        create: {
          id: band.id,
          name: band.name,
          slug: await ensureUniqueSlug(slug),
          genre: genreEnum as never,
          genres: [band.genre as string],
          spotifyMonthlyListeners: (band as { spotifyMonthlyListeners?: number }).spotifyMonthlyListeners ?? 0,
          tier: tierEnum as never,
          coverArtUrl: (band as { coverArtUrl?: string }).coverArtUrl,
          spotifyUrl: (band as { spotifyUrl?: string }).spotifyUrl,
          bandcampUrl: (band as { bandcampUrl?: string }).bandcampUrl,
          ownerId: syntheticUserId,
          isVerified: false,
          verified: false,
          subscriptionTier: 'FREE',
        },
        update: {
          spotifyMonthlyListeners: (band as { spotifyMonthlyListeners?: number }).spotifyMonthlyListeners ?? 0,
          tier: tierEnum as never,
        },
      })

      created++
    } catch {
      skipped++
    }
  }

  console.log(`✅ Bands seeded: ${created} created, ${skipped} skipped (duplicates)`)
}

const usedSlugs = new Set<string>()

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  usedSlugs.add(slug)
  return slug
}

async function seedDefaultVotingPeriod() {
  console.log('📅 Creating default voting period...')

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) // Last day of current month

  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear()
  const periodName = `${monthName} ${year}`

  // Check if a period for this month already exists
  const existing = await (prisma as unknown as {
    votingPeriod: {
      findFirst: (args: unknown) => Promise<{ id: string } | null>
      create: (args: unknown) => Promise<{ id: string; name: string | null }>
    }
  }).votingPeriod.findFirst({
    where: {
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    },
  })

  if (existing) {
    console.log(`✅ Voting period already exists: ${existing.id}`)
    return existing.id
  }

  const period = await (prisma as unknown as {
    votingPeriod: { create: (args: unknown) => Promise<{ id: string; name: string | null }> }
  }).votingPeriod.create({
    data: {
      name: periodName,
      startDate,
      endDate,
      isActive: true,
      status: 'OPEN',
    },
  })

  console.log(`✅ Voting period created: "${period.name}" (${period.id})`)
  return period.id
}

async function main() {
  console.log('🌱 Starting darkTunes Charts seed...')

  try {
    const adminId = await seedAdminUser()
    await seedBands(adminId)
    await seedDefaultVotingPeriod()

    console.log('🎉 Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await (prisma as unknown as { $disconnect: () => Promise<void> }).$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
