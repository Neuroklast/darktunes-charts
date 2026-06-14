'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface DJFeedbackFormProps {
  bandName: string
}

export function DJFeedbackForm({ bandName }: DJFeedbackFormProps) {
  const t = useTranslations('dashboard.dj.feedback')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 10) return

    setStatus('loading')
    setErrorMessage(null)

    setStatus('success')
    setMessage('')
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
