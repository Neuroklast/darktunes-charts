import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { Warning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/** Inline card shown when a view component throws an error. */
export function ErrorFallbackCard({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Card className="p-8 glassmorphism text-center">
      <Warning className="w-12 h-12 mx-auto mb-4 text-destructive" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">Something went wrong</h3>
      <p className="text-muted-foreground text-sm mb-4">
        {error instanceof Error ? error.message : 'An unexpected error occurred'}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try Again
      </Button>
    </Card>
  )
}

export { ReactErrorBoundary as ErrorBoundary }
