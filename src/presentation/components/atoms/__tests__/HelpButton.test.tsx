import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { HelpButton } from '../HelpButton'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'

// Framer Motion's useReducedMotion hook needs mocking in jsdom
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useReducedMotion: () => true,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: Record<string, unknown>) => (
        <div {...filterDomProps(props)}>{children as React.ReactNode}</div>
      ),
      aside: ({ children, ...props }: Record<string, unknown>) => (
        <aside {...filterDomProps(props)}>{children as React.ReactNode}</aside>
      ),
    },
  }
})

/** Filter out non-DOM props injected by framer-motion mocks. */
function filterDomProps(props: Record<string, unknown>): Record<string, unknown> {
  const nonDom = new Set(['variants', 'initial', 'animate', 'exit', 'transition'])
  return Object.fromEntries(Object.entries(props).filter(([key]) => !nonDom.has(key)))
}

/**
 * Render helper that wraps the component with NextIntlClientProvider.
 * Allows testing with different locales and message sets.
 */
function renderWithIntl(
  ui: React.ReactElement,
  { locale, messages }: { locale: string; messages: Record<string, unknown> }
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

describe('HelpButton (i18n)', () => {
  describe('German locale (de)', () => {
    const intlProps = { locale: 'de', messages: deMessages }

    it('renders the (?) trigger button with translated aria-label', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      const button = screen.getByRole('button', { name: deMessages.help.fanVoting.ariaLabel })
      expect(button).toBeDefined()
      expect(button.textContent).toBe('?')
    })

    it('opens panel with translated title on click', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: deMessages.help.fanVoting.ariaLabel }))
      expect(screen.getByText(deMessages.help.fanVoting.title)).toBeDefined()
    })

    it('opens panel with translated description on click', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: deMessages.help.fanVoting.ariaLabel }))
      // Description contains newlines; use substring match to avoid whitespace normalization issues
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'P' && element.textContent?.includes('Quadratic Voting') === true
      )).toBeDefined()
    })

    it('uses defaultAriaLabel when no helpKey and no ariaLabel provided', () => {
      renderWithIntl(
        <HelpButton title="Custom" description="Custom desc" />,
        intlProps
      )
      const button = screen.getByRole('button', { name: deMessages.help.defaultAriaLabel })
      expect(button).toBeDefined()
    })

    it('renders close button with translated aria-label', () => {
      renderWithIntl(<HelpButton helpKey="tier" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: deMessages.help.tier.ariaLabel }))
      const closeButton = screen.getByRole('button', { name: deMessages.help.closePanel })
      expect(closeButton).toBeDefined()
    })

    it.each([
      'fanVoting',
      'djBallot',
      'tier',
      'bandVote',
      'voterStructure',
      'superListener',
      'chartTrend',
      'voteVelocity',
      'conversionRate',
      'peerReview',
    ] as const)('renders correct title for helpKey="%s"', (helpKey) => {
      const helpMessages = deMessages.help as Record<string, Record<string, string>>
      renderWithIntl(<HelpButton helpKey={helpKey} />, intlProps)
      const ariaLabel = helpMessages[helpKey].ariaLabel
      fireEvent.click(screen.getByRole('button', { name: ariaLabel }))
      expect(screen.getByText(helpMessages[helpKey].title)).toBeDefined()
    })
  })

  describe('English locale (en)', () => {
    const intlProps = { locale: 'en', messages: enMessages }

    it('renders the (?) trigger button with translated aria-label', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      const button = screen.getByRole('button', { name: enMessages.help.fanVoting.ariaLabel })
      expect(button).toBeDefined()
      expect(button.textContent).toBe('?')
    })

    it('opens panel with translated title on click', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: enMessages.help.fanVoting.ariaLabel }))
      expect(screen.getByText(enMessages.help.fanVoting.title)).toBeDefined()
    })

    it('opens panel with translated description on click', () => {
      renderWithIntl(<HelpButton helpKey="fanVoting" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: enMessages.help.fanVoting.ariaLabel }))
      // Description contains newlines; use substring match to avoid whitespace normalization issues
      expect(screen.getByText((_content, element) =>
        element?.tagName === 'P' && element.textContent?.includes('Quadratic Voting') === true
      )).toBeDefined()
    })

    it('uses defaultAriaLabel when no helpKey and no ariaLabel provided', () => {
      renderWithIntl(
        <HelpButton title="Custom" description="Custom desc" />,
        intlProps
      )
      const button = screen.getByRole('button', { name: enMessages.help.defaultAriaLabel })
      expect(button).toBeDefined()
    })

    it('renders close button with translated aria-label', () => {
      renderWithIntl(<HelpButton helpKey="tier" />, intlProps)
      fireEvent.click(screen.getByRole('button', { name: enMessages.help.tier.ariaLabel }))
      const closeButton = screen.getByRole('button', { name: enMessages.help.closePanel })
      expect(closeButton).toBeDefined()
    })

    it.each([
      'fanVoting',
      'djBallot',
      'tier',
      'bandVote',
      'voterStructure',
      'superListener',
      'chartTrend',
      'voteVelocity',
      'conversionRate',
      'peerReview',
    ] as const)('renders correct title for helpKey="%s"', (helpKey) => {
      const helpMessages = enMessages.help as Record<string, Record<string, string>>
      renderWithIntl(<HelpButton helpKey={helpKey} />, intlProps)
      const ariaLabel = helpMessages[helpKey].ariaLabel
      fireEvent.click(screen.getByRole('button', { name: ariaLabel }))
      expect(screen.getByText(helpMessages[helpKey].title)).toBeDefined()
    })
  })

  describe('backward compatibility', () => {
    const intlProps = { locale: 'de', messages: deMessages }

    it('renders custom title/description when helpKey is not provided', () => {
      renderWithIntl(
        <HelpButton
          title="Custom Title"
          description="Custom description text"
          ariaLabel="Custom help"
        />,
        intlProps
      )
      fireEvent.click(screen.getByRole('button', { name: 'Custom help' }))
      expect(screen.getByText('Custom Title')).toBeDefined()
      expect(screen.getByText('Custom description text')).toBeDefined()
    })

    it('allows ariaLabel override even with helpKey', () => {
      renderWithIntl(
        <HelpButton helpKey="fanVoting" ariaLabel="Override label" />,
        intlProps
      )
      const button = screen.getByRole('button', { name: 'Override label' })
      expect(button).toBeDefined()
    })
  })

  describe('message completeness', () => {
    const helpKeys = [
      'fanVoting',
      'djBallot',
      'tier',
      'bandVote',
      'voterStructure',
      'superListener',
      'chartTrend',
      'voteVelocity',
      'conversionRate',
      'peerReview',
    ] as const

    it('all help keys have title, description, and ariaLabel in de.json', () => {
      const deHelp = deMessages.help as Record<string, Record<string, string>>
      for (const key of helpKeys) {
        expect(deHelp[key]).toBeDefined()
        expect(deHelp[key].title).toBeTruthy()
        expect(deHelp[key].description).toBeTruthy()
        expect(deHelp[key].ariaLabel).toBeTruthy()
      }
    })

    it('all help keys have title, description, and ariaLabel in en.json', () => {
      const enHelp = enMessages.help as Record<string, Record<string, string>>
      for (const key of helpKeys) {
        expect(enHelp[key]).toBeDefined()
        expect(enHelp[key].title).toBeTruthy()
        expect(enHelp[key].description).toBeTruthy()
        expect(enHelp[key].ariaLabel).toBeTruthy()
      }
    })

    it('de.json and en.json have the same help keys', () => {
      const deHelp = deMessages.help as Record<string, unknown>
      const enHelp = enMessages.help as Record<string, unknown>
      expect(Object.keys(deHelp).sort()).toEqual(Object.keys(enHelp).sort())
    })

    it('help descriptions contain newlines for proper formatting', () => {
      const deHelp = deMessages.help as Record<string, Record<string, string>>
      // These keys are known to have multi-paragraph descriptions
      expect(deHelp.fanVoting.description).toContain('\n')
      expect(deHelp.djBallot.description).toContain('\n')
      expect(deHelp.tier.description).toContain('\n')
      expect(deHelp.bandVote.description).toContain('\n')
    })
  })
})
