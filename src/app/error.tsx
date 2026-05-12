'use client'

/**
 * Next.js route-segment error boundary.
 * Catches runtime errors inside any route segment and displays a user-friendly
 * recovery UI without crashing the entire application.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  )
}
