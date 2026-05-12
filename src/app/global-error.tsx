'use client'

/**
 * Next.js global error boundary.
 * Catches errors that bubble up past all nested error boundaries, including
 * errors in the root layout.  Must render its own `<html>` and `<body>` tags
 * because the root layout is unavailable when this boundary is triggered.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
        <h1 className="text-2xl font-bold">A critical error occurred</h1>
        <p className="text-sm opacity-70">{error.message}</p>
        <button
          onClick={reset}
          className="rounded bg-primary px-4 py-2 text-white"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
