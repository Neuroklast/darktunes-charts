'use client'

import { forwardRef, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

type ObsidianCardProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode
  className?: string
}

/**
 * ObsidianCard — Liquid Obsidian design system base card.
 *
 * Micro-interactions:
 *   1. Cursor light: radial gradient follows the mouse over the card surface.
 *   2. Press depth: scale + inset shadow on tap (simulates Z-axis press).
 *   3. Hover lift: subtle upward translate on hover.
 *
 * All motion values are suppressed when the user prefers reduced motion
 * (WCAG 2.1 SC 2.3.3 / DIN EN ISO 9241-110 §8.7).
 */
export const ObsidianCard = forwardRef<HTMLDivElement, ObsidianCardProps>(
  function ObsidianCard({ children, className = '', style, onMouseMove, ...rest }, ref) {
    const shouldReduceMotion = useReducedMotion()
    const cardRef = useRef<HTMLDivElement | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (shouldReduceMotion || !cardRef.current || !overlayRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        overlayRef.current.style.backgroundImage = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.10) 0%, transparent 60%)`
        if (onMouseMove) onMouseMove(e)
      },
      [shouldReduceMotion, onMouseMove],
    )

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    return (
      <motion.div
        ref={setRefs}
        className={`relative overflow-hidden ${className}`}
        style={style}
        whileHover={shouldReduceMotion ? undefined : { y: -3 }}
        whileTap={
          shouldReduceMotion
            ? undefined
            : { scale: 0.985, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)' }
        }
        transition={{ duration: 0.15 }}
        onMouseMove={handleMouseMove}
        {...rest}
      >
        {/* Cursor light overlay */}
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          aria-hidden="true"
        />
        {children}
      </motion.div>
    )
  },
)
