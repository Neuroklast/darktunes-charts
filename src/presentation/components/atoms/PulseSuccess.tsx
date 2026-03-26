'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface PulseSuccessProps {
  success: boolean
  children: React.ReactNode
  className?: string
}

/**
 * PulseSuccess — Green ring glow + scale pulse on successful action.
 *
 * Wraps any element and animates a success state transition.
 * GPU-only: boxShadow + scale. Suppressed for prefers-reduced-motion.
 */
export function PulseSuccess({ success, children, className }: PulseSuccessProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      animate={
        success && !shouldReduceMotion
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 0 0 0px rgba(0,255,102,0)',
                '0 0 0 4px rgba(0,255,102,0.4)',
                '0 0 0 0px rgba(0,255,102,0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
