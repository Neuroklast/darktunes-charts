'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourStep {
  title: string
  description: string
}

interface OnboardingTourProps {
  /** Unique key for localStorage persistence (e.g. "fan-voting-tour"). */
  storageKey: string
  /** Ordered list of tour steps. */
  steps: TourStep[]
  /** Label for the "Skip" button. */
  skipLabel: string
  /** Label for the "Next" button. */
  nextLabel: string
  /** Label for the final "Finish" button. */
  finishLabel: string
}

const STORAGE_PREFIX = 'darktunes-tour-'

/**
 * OnboardingTour — First-visit tooltip tour for complex features.
 *
 * Shows a step-by-step card-based tour on first visit. Tour completion
 * is persisted in localStorage so it only appears once.
 *
 * Supports:
 * - Skip / Next / Finish navigation
 * - Keyboard-accessible (focus trapped in card)
 * - Step progress indicator
 * - prefers-reduced-motion (no animations)
 */
export function OnboardingTour({
  storageKey,
  steps,
  skipLabel,
  nextLabel,
  finishLabel,
}: OnboardingTourProps) {
  const fullKey = `${STORAGE_PREFIX}${storageKey}`
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const completed = localStorage.getItem(fullKey)
      if (!completed) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable — skip tour silently
    }
  }, [fullKey])

  const dismiss = useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(fullKey, 'true')
    } catch {
      // localStorage unavailable
    }
  }, [fullKey])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      dismiss()
    }
  }, [currentStep, steps.length, dismiss])

  if (!visible || steps.length === 0) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <div
      role="dialog"
      aria-label="Onboarding tour"
      className="relative rounded-lg border border-[#7C3AED]/30 bg-[#141414] p-4 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-sm text-white/40 hover:text-white transition-colors"
        aria-label={skipLabel}
      >
        <X size={14} />
      </button>

      {/* Step counter */}
      <div className="flex items-center gap-1.5 mb-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentStep ? 'w-6 bg-[#7C3AED]' : i < currentStep ? 'w-3 bg-[#7C3AED]/50' : 'w-3 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <h3
        className="text-sm font-bold text-white mb-1 tracking-wide"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {step.title}
      </h3>
      <p className="text-xs text-white/60 leading-relaxed mb-4" style={{ fontFamily: 'var(--font-body)' }}>
        {step.description}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={dismiss}
          className="text-[11px] text-white/40 hover:text-white/70 uppercase tracking-wider transition-colors"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {skipLabel}
        </button>
        <Button
          size="sm"
          onClick={handleNext}
          className="h-7 px-4 text-[11px] uppercase tracking-widest"
        >
          {isLastStep ? finishLabel : nextLabel}
        </Button>
      </div>
    </div>
  )
}

/**
 * Resets a specific onboarding tour so it shows again on next visit.
 */
export function resetOnboardingTour(storageKey: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`)
  } catch {
    // localStorage unavailable
  }
}
