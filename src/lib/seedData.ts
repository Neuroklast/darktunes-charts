import type { Band, Track, Genre } from './types'
import { getTierFromListeners } from './voting'

/**
 * Canonical list of bands derived from the Artists_for_Tests.pdf test dataset.
 *
 * Each entry maps to the original CSV row:
 * name | isEuNonGerman | notes (Country | Genre)
 *
 * Spotify monthly listeners are seeded with realistic values that reflect
 * the underground/niche status of most artists in this scene.
 * They are intentionally varied to cover all five tiers.
 */
const RAW_ARTISTS: ReadonlyArray<{
  name: string
  subgenre: string
  genre: Genre
  country: string
  isEuNonGerman: boolean
  spotifyMonthlyListeners: number
}> = [
  { name: 'Aesthetic Perfection',  subgenre: 'Industrial Pop',                 genre: 'Dark Electro', country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 48_200  },
  { name: 'Aevum',                  subgenre: 'Symphonic Gothic Metal',          genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 3_100   },
  { name: 'Agnis',                  subgenre: 'Industrial Metal',                genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_800   },
  { name: 'Alien Vampires',         subgenre: 'Harsh EBM / Aggrotech',           genre: 'Dark Electro', country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 12_400  },
  { name: 'Amore Ad Lunam',         subgenre: 'Dark Pop / Electronic',           genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 2_750   },
  { name: 'Antibody',               subgenre: 'Harsh Electro / TBM',             genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 7_200   },
  { name: 'Apnoie',                 subgenre: 'Dark Electro',                    genre: 'Dark Electro', country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 1_800   },
  { name: 'Apryl',                  subgenre: 'Gothic Rock / Metal',             genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_500   },
  { name: 'Auger',                  subgenre: 'Darkwave / Melodic Rock',         genre: 'Goth',         country: 'UK',                       isEuNonGerman: false, spotifyMonthlyListeners: 9_800   },
  { name: 'Balduvian Bears',        subgenre: 'Electro / Industrial',            genre: 'Dark Electro', country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 3_600   },
  { name: 'Basscalate',             subgenre: 'Dark Techno / EBM',               genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 6_100   },
  { name: 'Basszilla',              subgenre: 'Industrial Bass / Dubstep',       genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 2_200   },
  { name: 'Binary Division',        subgenre: 'Synthpop / EBM',                  genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 18_900  },
  { name: 'Blackbook',              subgenre: 'Indie Pop / New Wave',            genre: 'Goth',         country: 'Switzerland / Netherlands', isEuNonGerman: true,  spotifyMonthlyListeners: 5_400   },
  { name: 'Blutengel',              subgenre: 'Darkwave / Gothic',               genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 268_000 },
  { name: 'Breed Machine',          subgenre: 'Nu Metal / Hardcore',             genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 8_300   },
  { name: 'C Z A R I N A',          subgenre: 'Progressive Darkwave',            genre: 'Goth',         country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 11_700  },
  { name: 'C-Lekktor',              subgenre: 'Aggrotech / Dark Electro',        genre: 'Dark Electro', country: 'Mexico',                   isEuNonGerman: false, spotifyMonthlyListeners: 22_500  },
  { name: 'Cattac',                 subgenre: 'Dark Rock / Goth',                genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_100   },
  { name: 'Centhron',               subgenre: 'Aggrotech / EBM',                 genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 31_200  },
  { name: 'Chabtan',                subgenre: 'Death Metal / Mayan Metal',       genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 6_700   },
  { name: 'Chrom',                  subgenre: 'Synthpop',                        genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 14_800  },
  { name: 'Cima Muta',              subgenre: 'Cinematic Dark Ambient',          genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 2_600   },
  { name: 'Circuit Preacher',       subgenre: 'Industrial Rock',                 genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_900   },
  { name: 'Combichrist',            subgenre: 'Industrial Metal / Aggrotech',    genre: 'Metal',        country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 324_000 },
  { name: 'Covenant',               subgenre: 'Futurepop',                       genre: 'Dark Electro', country: 'Sweden',                   isEuNonGerman: true,  spotifyMonthlyListeners: 142_000 },
  { name: 'Dance My Darling',       subgenre: 'Gothic Pop / Synthwave',          genre: 'Goth',         country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 7_800   },
  { name: 'Dead Lights',            subgenre: 'Industrial Pop',                  genre: 'Dark Electro', country: 'UK / Netherlands',         isEuNonGerman: false, spotifyMonthlyListeners: 9_200   },
  { name: 'Dust In Mind',           subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 35_600  },
  { name: 'Eisenwut',               subgenre: 'Industrial Metal / NDH',          genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_900   },
  { name: 'Extize',                 subgenre: 'Cyberpunk / Industrial',          genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 41_300  },
  { name: 'Faderhead',              subgenre: 'Electro / EBM',                   genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 28_700  },
  { name: 'Fallcie',                subgenre: 'Female Fronted Metal',            genre: 'Metal',        country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 6_200   },
  { name: 'Fourth Circle',          subgenre: 'Symphonic Metal',                 genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_800   },
  { name: 'Freak Injection',        subgenre: 'Electro Rock / Glitch',           genre: 'Dark Electro', country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 3_400   },
  { name: 'Freaky Mind',            subgenre: 'Aggrotech / Electro',             genre: 'Dark Electro', country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 5_100   },
  { name: 'Frozen Plasma',          subgenre: 'Futurepop / Synthpop',            genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 56_800  },
  { name: 'Grendel',                subgenre: 'Dark Electro / Industrial',       genre: 'Dark Electro', country: 'Netherlands',              isEuNonGerman: true,  spotifyMonthlyListeners: 44_100  },
  { name: 'H.EXE',                  subgenre: 'Dark Electro / Industrial Metal', genre: 'Dark Electro', country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 7_600   },
  { name: 'Heldmaschine',           subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 73_200  },
  { name: 'Her Own World',          subgenre: 'Darkwave / Industrial',           genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_700   },
  { name: 'Kami No Ikari',          subgenre: 'Cyber Metal',                     genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 5_900   },
  { name: 'Kyunaa',                 subgenre: 'Dark Pop',                        genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_500   },
  { name: 'Logical Terror',         subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 11_200  },
  { name: 'Lord of the Lost',       subgenre: 'Gothic Metal',                    genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 892_000 },
  { name: 'Metallspürhunde',        subgenre: 'Electro Rock / New Wave',         genre: 'Dark Electro', country: 'Switzerland',              isEuNonGerman: true,  spotifyMonthlyListeners: 16_400  },
  { name: 'Misscore',               subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_300   },
  { name: 'Moonlight Asylum',       subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 6_600   },
  { name: 'Morgenstern',            subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 19_800  },
  { name: 'Mortes',                 subgenre: 'Dark Wave / Gothic',              genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_200   },
  { name: 'Moyra',                  subgenre: 'Melodic Death Metal',             genre: 'Metal',        country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 8_100   },
  { name: 'Nachtmahr',              subgenre: 'Industrial / EBM',                genre: 'Dark Electro', country: 'Austria',                  isEuNonGerman: true,  spotifyMonthlyListeners: 62_400  },
  { name: 'Neuroklast',             subgenre: 'Industrial / Aggrotech',          genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 9_300   },
  { name: 'Noisuf-X',               subgenre: 'Industrial / TBM',               genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 33_600  },
  { name: 'Ocean Dark',             subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_700   },
  { name: 'Octo Crura',             subgenre: 'Dark Ritual / Gothic',            genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 2_100   },
  { name: 'Omnimar',                subgenre: 'Dark Pop',                        genre: 'Goth',         country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 24_700  },
  { name: 'Ost+Front',              subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 185_000 },
  { name: 'Phosgore',               subgenre: 'Dark Electro / Industrial',       genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 27_100  },
  { name: 'Pzytechz',               subgenre: 'Dark Electro',                    genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_700   },
  { name: 'Rabia Sorda',            subgenre: 'Industrial / Electro',            genre: 'Dark Electro', country: 'Germany / Mexico',         isEuNonGerman: false, spotifyMonthlyListeners: 39_800  },
  { name: 'Rotersand',              subgenre: 'Futurepop',                       genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 48_700  },
  { name: 'Shiv-R',                 subgenre: 'Industrial / Dark Electro',       genre: 'Dark Electro', country: 'Australia',                isEuNonGerman: false, spotifyMonthlyListeners: 7_400   },
  { name: 'Sickret',                subgenre: 'Nu Metal',                        genre: 'Metal',        country: 'Switzerland',              isEuNonGerman: true,  spotifyMonthlyListeners: 13_200  },
  { name: 'Solitary Experiments',   subgenre: 'Futurepop / Synthpop',            genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 38_900  },
  { name: 'Stahlmann',              subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 126_000 },
  { name: 'Suicide Commando',       subgenre: 'Electro-Industrial',              genre: 'Dark Electro', country: 'Belgium',                  isEuNonGerman: true,  spotifyMonthlyListeners: 88_500  },
  { name: 'SynthAttack',            subgenre: 'Dark Electro / EBM',              genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 21_300  },
  { name: 'The Black Capes',        subgenre: 'Gothic Rock',                     genre: 'Goth',         country: 'Greece',                   isEuNonGerman: true,  spotifyMonthlyListeners: 6_400   },
  { name: 'The Original Sin',       subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_200   },
  { name: 'The Silverblack',        subgenre: 'Industrial Metal',                genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 17_600  },
  { name: 'TOAL',                   subgenre: 'Dark Ambient / New Wave',         genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_300   },
  { name: 'Vioflesh',               subgenre: 'Dark Pop / Synthpop',             genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_200   },
  { name: 'White Ritual',           subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 7_900   },
  { name: 'X-Rx',                   subgenre: 'Industrial Dance',                genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 16_100  },
  { name: 'Xordia',                 subgenre: 'Dark Rock / Metal',               genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_700   },
]

/** Thematic track title suffixes per genre for generating realistic track names. */
const TRACK_TITLE_TEMPLATES: Record<Genre, string[]> = {
  Goth: [
    'Eternal Shadows', 'Crimson Veil', 'Cathedral Remains', 'Weeping Black',
    'Pale Devotion', 'Shroud of Night', 'Mourning Star', 'Velvet Abyss',
    'Hollow Sanctum', 'Gothic Lullaby',
  ],
  Metal: [
    'Iron Dominion', 'Void Hammer', 'Steel Cathedral', 'Raging Abyss',
    'Titan Collapse', 'Hellfire March', 'Abyssal Throne', 'Warlord Rising',
    'Chaos Eruption', 'Death Resurgence',
  ],
  'Dark Electro': [
    'Signal Decay', 'Binary Collapse', 'Neural Override', 'System Failure',
    'Void Protocol', 'Pulse Annihilation', 'Circuit Wraith', 'Frequency Zero',
    'Static Oblivion', 'Transmission End',
  ],
}

/** Album title templates by genre for generating realistic release names. */
const ALBUM_TITLE_TEMPLATES: Record<Genre, string[]> = {
  Goth: [
    'Nocturnal Requiem', 'Absinthe Visions', 'The Dark Covenant', 'Shadows Eternal',
    'Mourning Tide', 'Velvet Ruins', 'Gothic Elegy', 'The Pale Archive',
  ],
  Metal: [
    'Forged in Darkness', 'Siege of Eternity', 'Chaos Dominion', 'The Iron Testament',
    'Warlord Chronicles', 'Abyssal Sovereignty', "Titan's Wrath", 'Death Incarnate',
  ],
  'Dark Electro': [
    'Binary Apocalypse', 'Neural Collapse', 'System Override', 'Static Prophecy',
    'Pulse Annihilation', 'Frequency War', 'Digital Abyss', 'Circuit Oblivion',
  ],
}

/**
 * Builds the full seed dataset of bands from the raw artist list.
 * Tiers are calculated automatically from the listener counts.
 */
function buildSeedBands(): Band[] {
  return RAW_ARTISTS.map((artist, idx) => ({
    id: `band-${idx + 1}`,
    name: artist.name,
    genre: artist.genre,
    spotifyMonthlyListeners: artist.spotifyMonthlyListeners,
    tier: getTierFromListeners(artist.spotifyMonthlyListeners),
  }))
}

/**
 * Generates one primary track per band for chart seeding.
 * Each track is assigned the band's primary genre and a seeded title.
 */
function buildSeedTracks(bands: Band[]): Track[] {
  return bands.map((band, idx) => {
    const templates = TRACK_TITLE_TEMPLATES[band.genre]
    const title = templates[idx % templates.length]
    return {
      id: `track-${band.id}`,
      bandId: band.id,
      title,
      submittedAt: Date.now() - idx * 86_400_000,
      category: band.genre,
    }
  })
}

/**
 * Generates one album per band for album-category seeding.
 */
function buildSeedAlbumTracks(bands: Band[]): Track[] {
  return bands.map((band, idx) => {
    const templates = ALBUM_TITLE_TEMPLATES[band.genre]
    const title = templates[idx % templates.length]
    return {
      id: `album-${band.id}`,
      bandId: band.id,
      title,
      submittedAt: Date.now() - idx * 86_400_000 - 30 * 86_400_000,
      category: band.genre,
    }
  })
}

/** Pre-built seed bands derived from the Artists_for_Tests.pdf test dataset. */
export const SEED_BANDS: readonly Band[] = Object.freeze(buildSeedBands())

/** Pre-built seed tracks (one per band) for chart population. */
export const SEED_TRACKS: readonly Track[] = Object.freeze([
  ...buildSeedTracks(SEED_BANDS as Band[]),
  ...buildSeedAlbumTracks(SEED_BANDS as Band[]),
])
