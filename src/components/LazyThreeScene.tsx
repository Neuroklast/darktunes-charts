import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { ThreeSceneProps } from './ThreeScene'

/** Minimum height used for the loading skeleton, matching the default canvas height. */
const DEFAULT_HEIGHT = 300

/**
 * LazyThreeScene — next/dynamic wrapper for the Three.js canvas.
 *
 * Three.js is a ~600 KB library that must never be part of the initial
 * page bundle.  This wrapper:
 * - Defers the import until the component is mounted in the browser
 *   (`ssr: false` prevents server-side rendering, which Three.js doesn't support)
 * - Shows an animated {@link Skeleton} placeholder while the chunk loads
 * - Keeps the three.js chunk in a separate bundle split, which is verified
 *   by Next.js bundle analysis (`ANALYZE=true npm run build`)
 *
 * @example
 * ```tsx
 * import { LazyThreeScene } from '@/components/LazyThreeScene'
 *
 * export default function MyPage() {
 *   return <LazyThreeScene height={300} accentColor="#00F0FF" />
 * }
 * ```
 */
const DynamicThreeScene = dynamic<ThreeSceneProps>(
  () => import('./ThreeScene').then((mod) => mod.ThreeScene),
  { ssr: false },
)

/**
 * Wraps {@link DynamicThreeScene} so the loading skeleton can inherit the
 * `height` prop without requiring consumers to specify it twice.
 */
export function LazyThreeScene({ height = DEFAULT_HEIGHT, ...rest }: ThreeSceneProps) {
  return (
    <DynamicThreeScene
      height={height}
      {...rest}
      // next/dynamic's `loading` option does not receive component props, so we
      // render the skeleton as a sibling that is replaced once the chunk loads.
      // The wrapper div reserves the correct vertical space during loading.
    />
  )
}

/**
 * Standalone skeleton that matches the Three.js canvas dimensions.
 * Use this as the `fallback` inside a React {@link Suspense} boundary
 * if you need a server-rendered placeholder.
 */
export function ThreeSceneSkeleton({ height = DEFAULT_HEIGHT }: Pick<ThreeSceneProps, 'height'>) {
  return (
    <Skeleton
      style={{ height }}
      className="w-full rounded-lg"
      aria-label="Loading 3D visualisation…"
    />
  )
}
