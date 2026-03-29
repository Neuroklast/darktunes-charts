'use client'

/**
 * ThreeScene — Client-only 3D scene placeholder.
 *
 * This component is loaded lazily via `next/dynamic` in `LazyThreeScene`.
 * When three.js rendering is needed, add `three` back to dependencies and
 * implement the WebGL/Canvas logic here.
 *
 * @example
 * ```tsx
 * import { LazyThreeScene } from '@/presentation/components/atoms/LazyThreeScene'
 * <LazyThreeScene className="h-64 w-full" />
 * ```
 */

interface ThreeSceneProps {
  /** Optional CSS class name applied to the container element. */
  readonly className?: string
}

export default function ThreeScene({ className }: ThreeSceneProps) {
  return (
    <div
      data-testid="three-scene"
      className={className}
      role="img"
      aria-label="3D scene"
    >
      {/* Replace with three.js Canvas / WebGLRenderer when implemented */}
      <p className="flex h-full items-center justify-center text-sm text-white/40">
        3D Scene — not yet implemented
      </p>
    </div>
  )
}
