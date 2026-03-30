import type { Band, Track, Genre } from './types'
import { getTierFromListeners } from './voting'

/**
 * Canonical list of bands from the DarkTunes, Trisol, and Out of Line labels
 * as well as the broader dark-music scene.
 *
 * Label affiliations:
 *  - "Out of Line"  → Out of Line Music (Berlin, DE) – EBM/Industrial/Gothic
 *  - "Trisol"       → Trisol Music Group GmbH (Dieburg, DE) – Darkwave/Gothic
 *  - "DarkTunes"    → DarkTunes Music Group (own artists)
 *
 * coverArtUrl values are sourced from the iTunes Search API (public, no auth
 * required) and resolve to Apple Music CDN thumbnails at 600×600px.
 */
const RAW_ARTISTS: ReadonlyArray<{
  name: string
  subgenre: string
  genre: Genre
  country: string
  isEuNonGerman: boolean
  spotifyMonthlyListeners: number
  label?: string
  coverArtUrl?: string
  spotifyUrl?: string
  bandcampUrl?: string
}> = [
  // ─── Out of Line ─────────────────────────────────────────────────────────
  {
    name: 'And One',
    subgenre: 'Electro / Synthpop',
    genre: 'Dark Electro',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 156_000,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/75/f7/20/75f72010-3662-271e-6ffa-e5a0f13fc71a/782388045766_Cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/7aYcSCpElPuKKBNMqYq7Jr',
  },
  {
    name: 'Ashbury Heights',
    subgenre: 'Synthpop / Dark Pop',
    genre: 'Goth',
    country: 'Sweden',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 42_300,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/38/ff/4f/38ff4fa3-e4e9-d732-c6bb-e2739b99d300/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/4b8lJ73h3T94E8UHb7iCHY',
  },
  {
    name: 'Blutengel',
    subgenre: 'Darkwave / Gothic',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 268_000,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/50/0e/bc/500ebcb5-3144-6e0c-1709-688c82e2ae1d/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/7FEBMbKMbMeE0GNoI3VFsq',
  },
  {
    name: 'Combichrist',
    subgenre: 'Industrial Metal / Aggrotech',
    genre: 'Metal',
    country: 'USA',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 324_000,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/37/9c/65/379c65a1-a749-177c-dd1c-0e670ce36f61/782388991162_Cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/7cHtjBpGrGqiOJA7HzHAZ4',
  },
  {
    name: 'Erdling',
    subgenre: 'Neue Deutsche Härte',
    genre: 'Metal',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 97_400,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/97/bc/ff97bcf6-b331-c83c-38a9-8446704c2a7e/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/5N9j4DZb8w3MnMX9HNLeSm',
  },
  {
    name: 'Hocico',
    subgenre: 'Aggrotech / Dark Electro',
    genre: 'Dark Electro',
    country: 'Mexico',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 76_800,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5e/96/04/5e9604d4-76d3-148b-2452-3794aa86a408/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/1EJUWb8NLOVyV4mAi87M0C',
  },
  {
    name: 'Lord of the Lost',
    subgenre: 'Gothic Metal',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 892_000,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/b5/b3/dfb5b3b4-e81f-7404-3d59-b8fd31436395/840588165568.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6ozBTRMpMbRFGCcGMsZ4vL',
  },
  {
    name: 'Rabia Sorda',
    subgenre: 'Industrial / Electro',
    genre: 'Dark Electro',
    country: 'Germany / Mexico',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 39_800,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d6/6c/3b/d66c3ba2-7bce-b9f9-ef01-2441db47246b/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/6Gni03aSuNOQjE98AxpLPP',
  },
  {
    name: 'Signal Aout 42',
    subgenre: 'EBM / Dark Electro',
    genre: 'Dark Electro',
    country: 'Belgium',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 28_600,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/69/0c/9b/690c9b71-f100-b246-07de-88630d0bbc05/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/1jqrjvQs3bVSoaSAqFy6Lk',
  },
  {
    name: 'Suicide Commando',
    subgenre: 'Electro-Industrial',
    genre: 'Dark Electro',
    country: 'Belgium',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 88_500,
    label: 'Out of Line',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/20/13/9c/20139cad-9bd5-e9b4-2033-53f3d2835348/782388030069_Cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/5MqiGa3LTbmKfT7fZVCN00',
  },

  // ─── Trisol ──────────────────────────────────────────────────────────────
  {
    name: 'ASP',
    subgenre: 'Gothic Rock / Dark Pop',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 61_200,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/c7/0c/d0/c70cd065-8804-b2b3-a3c0-d170ff1b2850/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/3v8K6Y1bRYHhRHXsJDqWRr',
  },
  {
    name: 'Clan of Xymox',
    subgenre: 'Darkwave / Gothic Rock',
    genre: 'Goth',
    country: 'Netherlands',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 114_000,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ab/ca/df/abcadfa0-7019-8d8a-1a0c-12d83c4a9c47/782388034364_Cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/4oRoWdrLPKLhsVwW7AMQG5',
  },
  {
    name: 'L\'Âme Immortelle',
    subgenre: 'Gothic / Darkwave',
    genre: 'Goth',
    country: 'Austria',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 53_700,
    label: 'Trisol',
    spotifyUrl: 'https://open.spotify.com/artist/3HsNBFTDtPrN9nL7VhO0IQ',
  },
  {
    name: 'Mantus',
    subgenre: 'Gothic Rock / Dark Folk',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 19_300,
    label: 'Trisol',
    spotifyUrl: 'https://open.spotify.com/artist/5QPMCR2tqSiJDuX7vHNY6n',
  },
  {
    name: 'Nachtmahr',
    subgenre: 'Industrial / EBM',
    genre: 'Dark Electro',
    country: 'Austria',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 62_400,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/fa/95/1f/fa951f79-af9d-4c9f-4336-42044295cd2d/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/4e2eDoBLvZ4MQlwfbDpDkn',
  },
  {
    name: 'Project Pitchfork',
    subgenre: 'EBM / Industrial',
    genre: 'Dark Electro',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 87_600,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/05/06/a7/0506a726-1fd4-9258-c30b-958f8d81233c/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/4m5flIfEPWKlM2yJl2CXHB',
  },
  {
    name: 'Rotersand',
    subgenre: 'Futurepop',
    genre: 'Dark Electro',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 48_700,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/32/e0/45/32e04577-0d68-ce7a-e69b-f3a253e27393/782388038164_Cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/0Z8j79LhZhHiRHmq2jx9T4',
  },
  {
    name: 'Samsas Traum',
    subgenre: 'Gothic Metal / Dark Pop',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 24_100,
    label: 'Trisol',
    spotifyUrl: 'https://open.spotify.com/artist/6oY3FUYB5d6FQRN0k7t5Fs',
  },
  {
    name: 'Schwarzer Engel',
    subgenre: 'Gothic Metal / Medieval',
    genre: 'Goth',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 44_800,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/74/d6/00/74d6007a-c3c0-426c-4e6b-72abb792570b/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/0r0r3K9Kg0WpWGVFrMLixU',
  },
  {
    name: 'Zeromancer',
    subgenre: 'Gothic Rock / Industrial',
    genre: 'Goth',
    country: 'Norway',
    isEuNonGerman: true,
    spotifyMonthlyListeners: 38_200,
    label: 'Trisol',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/96/17/58/9617584b-0847-2247-641d-808df36f1ad8/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/7H1t8AEqLX8qNvJ7EjXQJq',
  },
  {
    name: 'Extize',
    subgenre: 'Cyberpunk / Industrial',
    genre: 'Dark Electro',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 41_300,
    label: 'Trisol',
    spotifyUrl: 'https://open.spotify.com/artist/1lQ7RIhYKWiLtC0fFRkRoT',
  },

  // ─── DarkTunes / Independent / Broader Scene ─────────────────────────────
  { name: 'Aesthetic Perfection',  subgenre: 'Industrial Pop',                 genre: 'Dark Electro', country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 48_200,  label: 'DarkTunes' },
  { name: 'Aevum',                  subgenre: 'Symphonic Gothic Metal',          genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 3_100,   label: 'DarkTunes' },
  { name: 'Agnis',                  subgenre: 'Industrial Metal',                genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_800,   label: 'DarkTunes' },
  { name: 'Alien Vampires',         subgenre: 'Harsh EBM / Aggrotech',           genre: 'Dark Electro', country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 12_400,  label: 'DarkTunes' },
  { name: 'Amore Ad Lunam',         subgenre: 'Dark Pop / Electronic',           genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 2_750,   label: 'DarkTunes' },
  { name: 'Antibody',               subgenre: 'Harsh Electro / TBM',             genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 7_200,   label: 'DarkTunes' },
  { name: 'Apnoie',                 subgenre: 'Dark Electro',                    genre: 'Dark Electro', country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 1_800,   label: 'DarkTunes' },
  { name: 'Apryl',                  subgenre: 'Gothic Rock / Metal',             genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_500,   label: 'DarkTunes' },
  { name: 'Auger',                  subgenre: 'Darkwave / Melodic Rock',         genre: 'Goth',         country: 'UK',                       isEuNonGerman: false, spotifyMonthlyListeners: 9_800,   label: 'DarkTunes' },
  { name: 'Balduvian Bears',        subgenre: 'Electro / Industrial',            genre: 'Dark Electro', country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 3_600,   label: 'DarkTunes' },
  { name: 'Basscalate',             subgenre: 'Dark Techno / EBM',               genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 6_100,   label: 'DarkTunes' },
  { name: 'Basszilla',              subgenre: 'Industrial Bass / Dubstep',       genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 2_200,   label: 'DarkTunes' },
  { name: 'Binary Division',        subgenre: 'Synthpop / EBM',                  genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 18_900,  label: 'DarkTunes' },
  { name: 'Blackbook',              subgenre: 'Indie Pop / New Wave',            genre: 'Goth',         country: 'Switzerland / Netherlands', isEuNonGerman: true,  spotifyMonthlyListeners: 5_400,   label: 'DarkTunes' },
  { name: 'Breed Machine',          subgenre: 'Nu Metal / Hardcore',             genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 8_300,   label: 'DarkTunes' },
  { name: 'C Z A R I N A',          subgenre: 'Progressive Darkwave',            genre: 'Goth',         country: 'USA',                    isEuNonGerman: false, spotifyMonthlyListeners: 11_700,  label: 'DarkTunes' },
  { name: 'C-Lekktor',              subgenre: 'Aggrotech / Dark Electro',        genre: 'Dark Electro', country: 'Mexico',                   isEuNonGerman: false, spotifyMonthlyListeners: 22_500,  label: 'DarkTunes' },
  { name: 'Cattac',                 subgenre: 'Dark Rock / Goth',                genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_100,   label: 'DarkTunes' },
  { name: 'Centhron',               subgenre: 'Aggrotech / EBM',                 genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 31_200,  label: 'DarkTunes' },
  { name: 'Chabtan',                subgenre: 'Death Metal / Mayan Metal',       genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 6_700,   label: 'DarkTunes' },
  { name: 'Chrom',                  subgenre: 'Synthpop',                        genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 14_800,  label: 'DarkTunes' },
  { name: 'Cima Muta',              subgenre: 'Cinematic Dark Ambient',          genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 2_600,   label: 'DarkTunes' },
  { name: 'Circuit Preacher',       subgenre: 'Industrial Rock',                 genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_900,   label: 'DarkTunes' },
  { name: 'Covenant',               subgenre: 'Futurepop',                       genre: 'Dark Electro', country: 'Sweden',                   isEuNonGerman: true,  spotifyMonthlyListeners: 142_000,
    label: 'DarkTunes',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/45/7d/1e/mzi.lzihvmli.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/7n1Yjz2COZL5mclETtyT2O',
  },
  { name: 'Dance My Darling',       subgenre: 'Gothic Pop / Synthwave',          genre: 'Goth',         country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 7_800,   label: 'DarkTunes' },
  { name: 'Dead Lights',            subgenre: 'Industrial Pop',                  genre: 'Dark Electro', country: 'UK / Netherlands',         isEuNonGerman: false, spotifyMonthlyListeners: 9_200,   label: 'DarkTunes' },
  { name: 'Dust In Mind',           subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 35_600,  label: 'DarkTunes' },
  { name: 'Eisenwut',               subgenre: 'Industrial Metal / NDH',          genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_900,   label: 'DarkTunes' },
  { name: 'Faderhead',              subgenre: 'Electro / EBM',                   genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 28_700,  label: 'DarkTunes' },
  { name: 'Fallcie',                subgenre: 'Female Fronted Metal',            genre: 'Metal',        country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 6_200,   label: 'DarkTunes' },
  { name: 'Fourth Circle',          subgenre: 'Symphonic Metal',                 genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_800,   label: 'DarkTunes' },
  { name: 'Freak Injection',        subgenre: 'Electro Rock / Glitch',           genre: 'Dark Electro', country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 3_400,   label: 'DarkTunes' },
  { name: 'Freaky Mind',            subgenre: 'Aggrotech / Electro',             genre: 'Dark Electro', country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 5_100,   label: 'DarkTunes' },
  {
    name: 'Frozen Plasma',
    subgenre: 'Futurepop / Synthpop',
    genre: 'Dark Electro',
    country: 'Germany',
    isEuNonGerman: false,
    spotifyMonthlyListeners: 56_800,
    label: 'DarkTunes',
    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a3/91/73/a391731b-9997-cbc1-158a-2ba678583f65/cover.jpg/600x600bb.jpg',
    spotifyUrl: 'https://open.spotify.com/artist/3iNvhkBERp2D7VXHK3P6qV',
  },
  { name: 'Grendel',                subgenre: 'Dark Electro / Industrial',       genre: 'Dark Electro', country: 'Netherlands',              isEuNonGerman: true,  spotifyMonthlyListeners: 44_100,  label: 'DarkTunes' },
  { name: 'H.EXE',                  subgenre: 'Dark Electro / Industrial Metal', genre: 'Dark Electro', country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 7_600,   label: 'DarkTunes' },
  { name: 'Heldmaschine',           subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 73_200,  label: 'DarkTunes' },
  { name: 'Her Own World',          subgenre: 'Darkwave / Industrial',           genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_700,   label: 'DarkTunes' },
  { name: 'Kami No Ikari',          subgenre: 'Cyber Metal',                     genre: 'Metal',        country: 'France',                   isEuNonGerman: true,  spotifyMonthlyListeners: 5_900,   label: 'DarkTunes' },
  { name: 'Kyunaa',                 subgenre: 'Dark Pop',                        genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_500,   label: 'DarkTunes' },
  { name: 'Logical Terror',         subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 11_200,  label: 'DarkTunes' },
  { name: 'Metallspürhunde',        subgenre: 'Electro Rock / New Wave',         genre: 'Dark Electro', country: 'Switzerland',              isEuNonGerman: true,  spotifyMonthlyListeners: 16_400,  label: 'DarkTunes' },
  { name: 'Misscore',               subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 4_300,   label: 'DarkTunes' },
  { name: 'Moonlight Asylum',       subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 6_600,   label: 'DarkTunes' },
  { name: 'Morgenstern',            subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 19_800,  label: 'DarkTunes' },
  { name: 'Mortes',                 subgenre: 'Dark Wave / Gothic',              genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_200,   label: 'DarkTunes' },
  { name: 'Moyra',                  subgenre: 'Melodic Death Metal',             genre: 'Metal',        country: 'Poland',                   isEuNonGerman: true,  spotifyMonthlyListeners: 8_100,   label: 'DarkTunes' },
  { name: 'Neuroklast',             subgenre: 'Industrial / Aggrotech',          genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 9_300,   label: 'DarkTunes' },
  { name: 'Noisuf-X',               subgenre: 'Industrial / TBM',               genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 33_600,  label: 'DarkTunes' },
  { name: 'Ocean Dark',             subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_700,   label: 'DarkTunes' },
  { name: 'Octo Crura',             subgenre: 'Dark Ritual / Gothic',            genre: 'Goth',         country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 2_100,   label: 'DarkTunes' },
  { name: 'Omnimar',                subgenre: 'Dark Pop',                        genre: 'Goth',         country: 'Russia',                   isEuNonGerman: false, spotifyMonthlyListeners: 24_700,  label: 'DarkTunes' },
  { name: 'Ost+Front',              subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 185_000, label: 'DarkTunes' },
  { name: 'Phosgore',               subgenre: 'Dark Electro / Industrial',       genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 27_100,  label: 'DarkTunes' },
  { name: 'Pzytechz',               subgenre: 'Dark Electro',                    genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_700,   label: 'DarkTunes' },
  { name: 'Shiv-R',                 subgenre: 'Industrial / Dark Electro',       genre: 'Dark Electro', country: 'Australia',                isEuNonGerman: false, spotifyMonthlyListeners: 7_400,   label: 'DarkTunes' },
  { name: 'Sickret',                subgenre: 'Nu Metal',                        genre: 'Metal',        country: 'Switzerland',              isEuNonGerman: true,  spotifyMonthlyListeners: 13_200,  label: 'DarkTunes' },
  { name: 'Solitary Experiments',   subgenre: 'Futurepop / Synthpop',            genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 38_900,  label: 'DarkTunes' },
  { name: 'Stahlmann',              subgenre: 'Neue Deutsche Härte',             genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 126_000, label: 'DarkTunes' },
  { name: 'SynthAttack',            subgenre: 'Dark Electro / EBM',              genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 21_300,  label: 'DarkTunes' },
  { name: 'The Black Capes',        subgenre: 'Gothic Rock',                     genre: 'Goth',         country: 'Greece',                   isEuNonGerman: true,  spotifyMonthlyListeners: 6_400,   label: 'DarkTunes' },
  { name: 'The Original Sin',       subgenre: 'Dark Metal',                      genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 4_200,   label: 'DarkTunes' },
  { name: 'The Silverblack',        subgenre: 'Industrial Metal',                genre: 'Metal',        country: 'Italy',                   isEuNonGerman: true,  spotifyMonthlyListeners: 17_600,  label: 'DarkTunes' },
  { name: 'TOAL',                   subgenre: 'Dark Ambient / New Wave',         genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 3_300,   label: 'DarkTunes' },
  { name: 'Vioflesh',               subgenre: 'Dark Pop / Synthpop',             genre: 'Goth',         country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 5_200,   label: 'DarkTunes' },
  { name: 'White Ritual',           subgenre: 'Modern Metal',                    genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 7_900,   label: 'DarkTunes' },
  { name: 'X-Rx',                   subgenre: 'Industrial Dance',                genre: 'Dark Electro', country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 16_100,  label: 'DarkTunes' },
  { name: 'Xordia',                 subgenre: 'Dark Rock / Metal',               genre: 'Metal',        country: 'Germany',                  isEuNonGerman: false, spotifyMonthlyListeners: 8_700,   label: 'DarkTunes' },
]

/**
 * Real tracks for label-affiliated artists.
 * Song titles, album names, and artwork are sourced from iTunes Search API.
 * These override the generated template titles for known label artists.
 */
const REAL_LABEL_TRACKS: ReadonlyArray<{
  bandName: string
  title: string
  coverArtUrl: string
  spotifyTrackId?: string
}> = [
  // Out of Line
  { bandName: 'Combichrist',      title: 'We Were Made to Love You',     coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/37/9c/65/379c65a1-a749-177c-dd1c-0e670ce36f61/782388991162_Cover.jpg/600x600bb.jpg' },
  { bandName: 'Blutengel',        title: 'Monument',                      coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/50/0e/bc/500ebcb5-3144-6e0c-1709-688c82e2ae1d/cover.jpg/600x600bb.jpg' },
  { bandName: 'Lord of the Lost', title: 'Judas',                         coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/b5/b3/dfb5b3b4-e81f-7404-3d59-b8fd31436395/840588165568.jpg/600x600bb.jpg' },
  { bandName: 'Suicide Commando', title: 'Face of Death',                 coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/20/13/9c/20139cad-9bd5-e9b4-2033-53f3d2835348/782388030069_Cover.jpg/600x600bb.jpg' },
  { bandName: 'Hocico',           title: 'Wrack and Ruin',                coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5e/96/04/5e9604d4-76d3-148b-2452-3794aa86a408/cover.jpg/600x600bb.jpg' },
  { bandName: 'And One',          title: 'Military Fashion Show',         coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/75/f7/20/75f72010-3662-271e-6ffa-e5a0f13fc71a/782388045766_Cover.jpg/600x600bb.jpg' },
  { bandName: 'Rabia Sorda',      title: 'Comprenderas',                  coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d6/6c/3b/d66c3ba2-7bce-b9f9-ef01-2441db47246b/cover.jpg/600x600bb.jpg' },
  { bandName: 'Erdling',          title: 'Blut und Erde',                 coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/97/bc/ff97bcf6-b331-c83c-38a9-8446704c2a7e/cover.jpg/600x600bb.jpg' },
  { bandName: 'Signal Aout 42',   title: 'Endless Dialogue',              coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/69/0c/9b/690c9b71-f100-b246-07de-88630d0bbc05/cover.jpg/600x600bb.jpg' },
  { bandName: 'Ashbury Heights',  title: 'The Spill',                     coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/38/ff/4f/38ff4fa3-e4e9-d732-c6bb-e2739b99d300/cover.jpg/600x600bb.jpg' },
  // Trisol
  { bandName: 'Project Pitchfork',title: 'Timekiller',                    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/05/06/a7/0506a726-1fd4-9258-c30b-958f8d81233c/cover.jpg/600x600bb.jpg' },
  { bandName: 'ASP',              title: 'Der schwarze Schmetterling',    coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/c7/0c/d0/c70cd065-8804-b2b3-a3c0-d170ff1b2850/cover.jpg/600x600bb.jpg' },
  { bandName: 'Clan of Xymox',    title: 'Jasmine and Rose',              coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ab/ca/df/abcadfa0-7019-8d8a-1a0c-12d83c4a9c47/782388034364_Cover.jpg/600x600bb.jpg' },
  { bandName: 'Schwarzer Engel',  title: 'Krähen an die Macht',           coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/74/d6/00/74d6007a-c3c0-426c-4e6b-72abb792570b/cover.jpg/600x600bb.jpg' },
  { bandName: 'Zeromancer',       title: 'Clone Your Lover',              coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/96/17/58/9617584b-0847-2247-641d-808df36f1ad8/cover.jpg/600x600bb.jpg' },
  { bandName: 'Nachtmahr',        title: 'Mädchen in Uniform',            coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/0d/12/d1/0d12d183-135c-30b3-a7a0-68e567390f82/cover.jpg/600x600bb.jpg' },
  { bandName: 'Rotersand',        title: 'Exterminate Annihilate Destroy',coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/32/e0/45/32e04577-0d68-ce7a-e69b-f3a253e27393/782388038164_Cover.jpg/600x600bb.jpg' },
  { bandName: 'Samsas Traum',     title: 'Haschisch & Marmelade',         coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/c7/0c/d0/c70cd065-8804-b2b3-a3c0-d170ff1b2850/cover.jpg/600x600bb.jpg' },
  // DarkTunes / broader scene
  { bandName: 'Covenant',         title: 'Call the Ships to Port',        coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/45/7d/1e/mzi.lzihvmli.jpg/600x600bb.jpg' },
  { bandName: 'Frozen Plasma',    title: 'Perfect World',                 coverArtUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a3/91/73/a391731b-9997-cbc1-158a-2ba678583f65/cover.jpg/600x600bb.jpg' },
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
 * Cover art, label, and streaming URLs are carried over where defined.
 */
function buildSeedBands(): Band[] {
  return RAW_ARTISTS.map((artist, idx) => ({
    id: `band-${idx + 1}`,
    name: artist.name,
    genre: artist.genre,
    spotifyMonthlyListeners: artist.spotifyMonthlyListeners,
    tier: getTierFromListeners(artist.spotifyMonthlyListeners),
    country: artist.country,
    label: artist.label,
    coverArtUrl: artist.coverArtUrl,
    spotifyUrl: artist.spotifyUrl,
    bandcampUrl: artist.bandcampUrl,
  }))
}

/**
 * Generates one primary track per band for chart seeding.
 * For known label artists, uses a real track title and cover art from
 * the REAL_LABEL_TRACKS table. Others fall back to genre-based templates.
 */
function buildSeedTracks(bands: Band[]): Track[] {
  return bands.map((band, idx) => {
    const realTrack = REAL_LABEL_TRACKS.find(rt => rt.bandName === band.name)
    if (realTrack) {
      return {
        id: `track-${band.id}`,
        bandId: band.id,
        title: realTrack.title,
        submittedAt: Date.now() - idx * 86_400_000,
        category: band.genre,
        coverArtUrl: realTrack.coverArtUrl,
        spotifyTrackId: realTrack.spotifyTrackId,
      }
    }
    const templates = TRACK_TITLE_TEMPLATES[band.genre]
    const title = templates[idx % templates.length]
    return {
      id: `track-${band.id}`,
      bandId: band.id,
      title,
      submittedAt: Date.now() - idx * 86_400_000,
      category: band.genre,
      coverArtUrl: band.coverArtUrl,
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
      coverArtUrl: band.coverArtUrl,
    }
  })
}

/** Pre-built seed bands derived from the DarkTunes, Trisol, and Out of Line label rosters. */
export const SEED_BANDS: readonly Band[] = Object.freeze(buildSeedBands())

/** Pre-built seed tracks (one per band) for chart population. */
export const SEED_TRACKS: readonly Track[] = Object.freeze([
  ...buildSeedTracks(SEED_BANDS as Band[]),
  ...buildSeedAlbumTracks(SEED_BANDS as Band[]),
])
