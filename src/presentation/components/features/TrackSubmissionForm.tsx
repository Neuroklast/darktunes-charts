'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrackSubmissionSchema, GENRE_VALUES } from '@/domain/releases/index'
import type { TrackSubmission } from '@/domain/releases/index'
import { ShakeField } from '@/presentation/components/atoms/ShakeField'
import { PulseSuccess } from '@/presentation/components/atoms/PulseSuccess'

const DEMO_BAND_ID = '00000000-0000-0000-0000-000000000001'

/**
 * TrackSubmissionForm — Self-service track ingestion form.
 *
 * Uses react-hook-form + Zod validation. On ISRC error, the field shakes.
 * On submission success, the submit area pulses green. Shows enrichment
 * status with a skeleton shimmer after successful submission.
 */
export function TrackSubmissionForm() {
  const [submitted, setSubmitted] = useState(false)
  const [enriching, setEnriching] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackSubmission>({
    resolver: zodResolver(TrackSubmissionSchema),
    defaultValues: { bandId: DEMO_BAND_ID },
  })

  async function onSubmit(_data: TrackSubmission) {
    setEnriching(false)
    setSubmitted(false)
    await new Promise((r) => setTimeout(r, 600)) // simulate API call
    setSubmitted(true)
    setEnriching(true)
    await new Promise((r) => setTimeout(r, 2000))
    setEnriching(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <input type="hidden" {...register('bandId')} />

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Track-Titel *
        </label>
        <input
          {...register('title')}
          placeholder="z.B. Schwarzes Herz"
          className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
        {errors.title && (
          <p className="text-xs" style={{ color: '#D30000' }}>{errors.title.message}</p>
        )}
      </div>

      {/* Genre */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Genre *
        </label>
        <select
          {...register('genre')}
          className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
        >
          <option value="">Genre wählen…</option>
          {GENRE_VALUES.map((g) => (
            <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {errors.genre && (
          <p className="text-xs" style={{ color: '#D30000' }}>{errors.genre.message}</p>
        )}
      </div>

      {/* ISRC — shakes on error */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          ISRC (optional)
        </label>
        <ShakeField error={!!errors.isrc}>
          <input
            {...register('isrc')}
            placeholder="z.B. DEA712345678"
            className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 font-mono"
          />
        </ShakeField>
        {errors.isrc && (
          <p className="text-xs" style={{ color: '#D30000' }}>{errors.isrc.message}</p>
        )}
      </div>

      {/* Spotify ID */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Spotify Track-ID (optional)
        </label>
        <input
          {...register('spotifyTrackId')}
          placeholder="z.B. 4uLU6hMCjMI75M1A2tKUQC"
          className="w-full bg-[#141414] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 font-mono"
        />
      </div>

      {/* Submit with pulse */}
      <PulseSuccess success={submitted}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#141414] border border-white/[0.12] hover:border-white/25 rounded-lg px-4 py-3 text-sm font-semibold text-white uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Einreichen…' : 'Track einreichen'}
        </button>
      </PulseSuccess>

      {/* Enrichment status */}
      {enriching && (
        <div className="skeleton-shimmer rounded-lg px-4 py-3 text-xs text-white/50">
          Metadata Bot wird ausgeführt…
        </div>
      )}
      {submitted && !enriching && (
        <p className="text-xs text-[#00FF66]">Track erfolgreich eingereicht.</p>
      )}
    </form>
  )
}
