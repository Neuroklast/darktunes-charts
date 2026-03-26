'use client'

import { useEffect } from 'react'
import { motion, useAnimate, useReducedMotion } from 'framer-motion'

interface ShakeFieldProps {
  error: boolean
  children: React.ReactNode
  className?: string
}

/**
 * ShakeField — Horizontal shake animation triggered on validation error.
 *
 * Wraps any input field and shakes it left-right when `error` transitions
 * from falsy to truthy. Uses GPU-only x-transform for performance.
 * Suppressed when the user prefers reduced motion (WCAG 2.1 SC 2.3.3).
 */
export function ShakeField({ error, children, className }: ShakeFieldProps) {
  const shouldReduceMotion = useReducedMotion()
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (!error || shouldReduceMotion) return
    void animate(scope.current, { x: [0, -8, 8, -6, 6, -4, 4, 0] }, { duration: 0.32, ease: 'easeInOut' })
  }, [error, shouldReduceMotion, animate, scope])

  return (
    <motion.div ref={scope} className={className}>
      {children}
    </motion.div>
  )
}
