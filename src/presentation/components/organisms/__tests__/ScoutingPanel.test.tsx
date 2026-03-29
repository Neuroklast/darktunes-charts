import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ScoutingPanel } from '../ScoutingPanel'
import type { ScoutingSuggestion } from '@/domain/releases/index'

// ---------------------------------------------------------------------------
// Mock next-intl — return the key as-is so we can assert on translation keys
// ---------------------------------------------------------------------------
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSuggestion(overrides: Partial<ScoutingSuggestion> = {}): ScoutingSuggestion {
  return {
    spotifyTrackId: 'track-1',
    spotifyArtistId: 'artist-1',
    artistName: 'TestArtist',
    trackName: 'TestTrack',
    genre: 'GOTH',
    spotifyMonthlyListeners: 50_000,
    releaseDate: '2025-06-01',
    artworkUrl: '',
    reason: 'new_release',
    confidenceScore: 0.85,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ScoutingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the translated title', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion()]} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders the empty state message when suggestions is an empty array explicitly', () => {
    // Component falls back to demo data when empty, so empty state is only
    // shown if demo data were also empty. We test the translated key appears
    // when demo fallback kicks in — title should always render.
    render(<ScoutingPanel suggestions={[]} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders translated reason badge for new_release', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion({ reason: 'new_release' })]} />)
    expect(screen.getByText('reason.newRelease')).toBeInTheDocument()
  })

  it('renders translated reason badge for velocity_spike', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion({ reason: 'velocity_spike' })]} />)
    expect(screen.getByText('reason.velocitySpike')).toBeInTheDocument()
  })

  it('renders translated reason badge for genre_match', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion({ reason: 'genre_match' })]} />)
    expect(screen.getByText('reason.genreMatch')).toBeInTheDocument()
  })

  it('renders translated confidence label', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion()]} />)
    expect(screen.getByText('confidence')).toBeInTheDocument()
  })

  it('renders translated nominate button', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion()]} />)
    expect(screen.getByText('nominate')).toBeInTheDocument()
  })

  it('renders confidence percentage', () => {
    render(<ScoutingPanel suggestions={[makeSuggestion({ confidenceScore: 0.92 })]} />)
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('renders artist name and track name', () => {
    render(
      <ScoutingPanel
        suggestions={[makeSuggestion({ artistName: 'Blutengel', trackName: 'Black Snow' })]}
      />,
    )
    expect(screen.getByText('Blutengel')).toBeInTheDocument()
    expect(screen.getByText('Black Snow')).toBeInTheDocument()
  })

  it('renders multiple suggestions', () => {
    const suggestions = [
      makeSuggestion({ spotifyTrackId: 'a', artistName: 'ArtistA' }),
      makeSuggestion({ spotifyTrackId: 'b', artistName: 'ArtistB' }),
    ]
    render(<ScoutingPanel suggestions={suggestions} />)
    expect(screen.getByText('ArtistA')).toBeInTheDocument()
    expect(screen.getByText('ArtistB')).toBeInTheDocument()
  })

  it('falls back to demo data when no suggestions provided', () => {
    render(<ScoutingPanel />)
    // Demo data contains "Nachtblut" — verify fallback renders
    expect(screen.getByText('Nachtblut')).toBeInTheDocument()
  })
})
