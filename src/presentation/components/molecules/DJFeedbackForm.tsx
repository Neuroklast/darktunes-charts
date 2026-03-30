'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitDJFeedback } from '@/application/actions/submitDJFeedback'

interface DJFeedbackFormProps {
  /** The band to send feedback to. */
  bandId: string
  /** Optional specific track the feedback is about. */
  trackId?: string
  /** Band name displayed in the form header. */
  bandName: string
}

/**
 * DJFeedbackForm molecule — Spec §9.2
 *
 * A text form that allows verified DJs to leave professional feedback
 * for bands (e.g. "Improve bass mix for club systems").
 * Rendered on the DJ Dashboard.
 */
export function DJFeedbackForm({ bandId, trackId, bandName }: DJFeedbackFormProps) {
  const t = useTranslations('dashboard.dj.feedback')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 10) return

    setStatus('loading')
    setErrorMessage(null)

    const result = await submitDJFeedback({ bandId, trackId, message })

    if (result.success) {
      setStatus('success')
      setMessage('')
    } else {
      setStatus('error')
      setErrorMessage(result.error ?? t('unknownError'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">
          {t('feedbackTo', { bandName })}
        </label>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t('placeholder')}
          rows={3}
          minLength={10}
          maxLength={2000}
          disabled={status === 'loading'}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('characters', { count: message.length })}
        </p>
      </div>

      {status === 'success' && (
        <p className="text-xs text-green-500">{t('success')}</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={status === 'loading' || message.trim().length < 10}
      >
        {status === 'loading' ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}
