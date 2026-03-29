'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * LazyThreeScene — Dynamically imported 3D scene wrapper.
 *
 * Uses `next/dynamic` with `ssr: false` so the heavy three.js bundle is:
 * 1. Code-split into its own chunk (not included in the initial page JS).
 * 2. Never executed during server-side rendering (WebGL requires a browser).
 *
 * A Skeleton placeholder is rendered while the chunk loads.
 *
 * @see ThreeScene for the underlying component.
 */
const LazyThreeScene = dynamic(
  () => import('./ThreeScene'),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
    ssr: false,
  },
)

export { LazyThreeScene }
