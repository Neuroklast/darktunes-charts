'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface HelpPanelProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
}

const SLIDE_VARIANTS = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: '0%', opacity: 1 },
  exit: { x: '100%', opacity: 0 },
}

const INSTANT_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * HelpPanel — Slide-in side panel replacing the Dialog in HelpButton.
 *
 * Slides in from the right edge (cubic-bezier spring) over a semi-transparent
 * backdrop. Respects prefers-reduced-motion: if reduced, the panel appears
 * and disappears without sliding.
 */
export function HelpPanel({ open, onClose, title, description }: HelpPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const variants = shouldReduceMotion ? INSTANT_VARIANTS : SLIDE_VARIANTS
  const transition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            className="fixed top-0 right-0 h-full w-80 bg-[#0F0F0F] border-l border-white/[0.08] z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2
                className="text-lg font-bold uppercase tracking-wider text-white"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded text-white/50 hover:text-white transition-colors"
                aria-label="Panel schließen"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
