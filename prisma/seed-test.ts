import { prisma } from '../src/lib/prisma'
import fs from 'fs'
import path from 'path'

// Delay function for API throttling (6 seconds)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithThrottle(url: string) {
  console.log(`⏳ Waiting 6 seconds before fetching: ${url}`)
  await delay(6000)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
  }
  return res.json()
}

// Ensure the local caching directory exists
const TEST_ASSETS_DIR = path.join(process.cwd(), 'public', 'test-assets')
if (!fs.existsSync(TEST_ASSETS_DIR)) {
  fs.mkdirSync(TEST_ASSETS_DIR, { recursive: true })
}

async function downloadAndCacheArtwork(artist: string, trackTitle: string, imageUrl: string): Promise<string> {
  try {
    console.log(`⬇️  Downloading artwork for ${artist} - ${trackTitle} from ${imageUrl}`)
    const sanitizedName = `${artist}_${trackTitle}`.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')
    const fileName = `${sanitizedName}.jpg`
    const filePath = path.join(TEST_ASSETS_DIR, fileName)

    const response = await fetch(imageUrl)
    if (!response.ok) {
       throw new Error(`Failed to download image: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))

    // Return relative path for Next.js public directory
    return `/test-assets/${fileName}`
  } catch (err) {
    console.error(`⚠️  Failed to download artwork for ${artist} - ${trackTitle}:`, err)
    // Fallback to placeholder
    return '/placeholder-artwork.jpg'
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing database...')
  await prisma.fanVote.deleteMany()
  await prisma.bandVote.deleteMany()
  await prisma.track.deleteMany()
  await prisma.band.deleteMany()
  await prisma.user.deleteMany()
}

async function createTestAccounts() {
  console.log('👤 Creating test accounts...')

  // Use a predictable hash for passwords, in a real app this uses Supabase Auth,
  // but we ensure the local database has the user records.

  await prisma.user.createMany({
    data: [
      { id: 'user-fan-id', email: 'test-fan@darktunes.com', name: 'Test Fan', role: 'FAN', credits: 100 },
      { id: 'user-dj-id', email: 'test-dj@darktunes.com', name: 'Test DJ', role: 'DJ', isDJVerified: true, credits: 100 },
      { id: 'user-admin-id', email: 'test-admin@darktunes.com', name: 'Test Admin', role: 'ADMIN', credits: 100 }
    ]
  })
}

async function createVerifiedDJs() {
  console.log('🎧 Creating verified DJs for Schulze Voting...')
  const djs = [
    { id: 'dj-1', email: 'solitaryx@example.com', name: 'DJ SolitaryX', realName: 'Sascha Juranek', focus: 'Goth / Dark Wave', role: 'DJ', isDJVerified: true, credits: 100 },
    { id: 'dj-2', email: 'hellsbody@example.com', name: 'DJ Hellsbody', realName: 'Ingo Nahser', focus: 'Goth / Metal', role: 'DJ', isDJVerified: true, credits: 100 },
    { id: 'dj-3', email: 'vokativus@example.com', name: 'DJ Vokativus', realName: 'Rainer', focus: 'Goth / EBM', role: 'DJ', isDJVerified: true, credits: 100 },
    { id: 'dj-4', email: 'dancefloor@example.com', name: 'Dancefloor Gladiatorz', realName: 'Rapha udn Yannick', focus: 'Harder Styles', role: 'DJ', isDJVerified: true, credits: 100 },
  ] as const;

  await prisma.user.createMany({
    data: djs.map(dj => ({
       id: dj.id,
       email: dj.email,
       name: dj.name,
       role: dj.role,
       isDJVerified: dj.isDJVerified,
       credits: dj.credits
    }))
  })
}

async function seedData() {
  const darkTunesBands = [
    { artist: 'Extize', track: 'MediEVIL', tier: 'ESTABLISHED', genre: 'DARK_ELECTRO' },
    { artist: 'Agnis', track: 'Wicked Witch', tier: 'EMERGING', genre: 'DARKWAVE' },
    { artist: 'Blackbook', track: 'Nobody Loves You', tier: 'ESTABLISHED', genre: 'DARK_ELECTRO' },
    { artist: 'Omnimar', track: 'Out of My Life', tier: 'INTERNATIONAL', genre: 'DARK_ELECTRO' },
    { artist: 'SynthAttack', track: 'Rave The Grave', tier: 'ESTABLISHED', genre: 'DARK_ELECTRO' },
    { artist: 'Neuroklast', track: 'LILITH', tier: 'EMERGING', genre: 'DARK_ELECTRO' },
    { artist: 'Balduvian Bears', track: 'Big World', tier: 'MICRO', genre: 'GOTH' },
    { artist: 'Vioflesh', track: 'Sweet Poison', tier: 'EMERGING', genre: 'DARK_ELECTRO' },
  ] as const;

  const trisolBands = [
    { artist: 'Project Pitchfork', track: 'Akkretion', tier: 'MACRO', genre: 'DARK_ELECTRO' },
    { artist: 'Rotersand', track: 'Torn Realities', tier: 'INTERNATIONAL', genre: 'DARK_ELECTRO' },
    { artist: 'L\'Âme Immortelle', track: 'Bitterkeit', tier: 'MACRO', genre: 'GOTH' },
    { artist: 'Samsas Traum', track: 'Ein Fötus wie du', tier: 'ESTABLISHED', genre: 'METAL' },
    { artist: 'Rome', track: 'The Tower', tier: 'INTERNATIONAL', genre: 'POST_PUNK' },
    { artist: 'ASP', track: 'Zutiefst', tier: 'MACRO', genre: 'GOTH' },
    { artist: 'Psycholies', track: 'Rise of the Dark', tier: 'MICRO', genre: 'METAL' },
  ] as const;

  const allBands = [...darkTunesBands, ...trisolBands]

  console.log('🎸 Seeding bands and fetching track metadata...')
  let index = 1;
  for (const item of allBands) {
    const bandId = `band-${index}`
    const ownerId = `owner-${index}`
    const trackId = `track-${index}`
    index++;

    // Create a dummy user for the band owner to satisfy the foreign key
    await prisma.user.create({
       data: { id: ownerId, email: `owner-${bandId}@example.com`, name: `${item.artist} Owner`, role: 'BAND', credits: 100 }
    })

    await prisma.band.create({
      data: {
        id: bandId,
        ownerId: ownerId,
        name: item.artist,
        genre: item.genre,
        tier: item.tier,
      }
    })

    let artworkPath = '/placeholder-artwork.jpg'

    // Simulate iTunes API fetch for artwork with throttling
    try {
      const query = encodeURIComponent(`${item.artist} ${item.track}`)
      const data = await fetchWithThrottle(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const artworkUrl = result.artworkUrl100?.replace('100x100bb', '600x600bb')
        if (artworkUrl) {
           artworkPath = await downloadAndCacheArtwork(item.artist, item.track, artworkUrl)
        }
      } else {
        console.log(`⚠️  No iTunes results for ${item.artist} - ${item.track}`)
      }
    } catch (err) {
      console.error(`⚠️  iTunes API failed for ${item.artist} - ${item.track}:`, err)
    }

    await prisma.track.create({
       data: {
         id: trackId,
         bandId: bandId,
         title: item.track,
         genre: item.genre,
         coverArtUrl: artworkPath,
         streamingLinks: {
           create: [
             {
               platform: 'spotify',
               url: `https://open.spotify.com/search/${encodeURIComponent(item.artist + ' ' + item.track)}`
             }
           ]
         }
       }
    })
  }
}

async function main() {
  console.log('🚀 Starting test database seeding...')
  await clearDatabase()
  await createTestAccounts()
  await createVerifiedDJs()
  await seedData()
  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
