import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks (hoisted before vi.mock factories) ─────────────────────────────────

const { mockHandleWebhook, mockAdBookingFindUnique, mockAdBookingUpdate } = vi.hoisted(() => ({
  mockHandleWebhook: vi.fn(),
  mockAdBookingFindUnique: vi.fn(),
  mockAdBookingUpdate: vi.fn(),
}))

vi.mock('@/infrastructure/payment/stripeAdapter', () => ({
  handleWebhook: mockHandleWebhook,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    adBooking: {
      findUnique: mockAdBookingFindUnique,
      update: mockAdBookingUpdate,
    },
  },
}))

import { POST } from '../webhook/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function webhookRequest(body: string, signature: string | null): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (signature !== null) {
    headers['stripe-signature'] = signature
  }
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers,
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/stripe/webhook – signature validation', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(webhookRequest('{}', null))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/missing stripe-signature/i)
  })
})

describe('POST /api/stripe/webhook – event handling', () => {
  it('returns 200 with received=true for checkout.session.completed', async () => {
    mockHandleWebhook.mockResolvedValue({
      type: 'checkout.session.completed',
      bandId: 'band-123',
      paidCategories: 2,
    })

    const res = await POST(webhookRequest('{}', 'whsec_test'))
    expect(res.status).toBe(200)

    const body = await res.json() as { received: boolean; processed: string }
    expect(body.received).toBe(true)
    expect(body.processed).toBe('checkout.session.completed')
  })

  it('returns 200 with processed=unhandled for unknown event types', async () => {
    mockHandleWebhook.mockResolvedValue({
      type: 'unhandled',
      eventType: 'payment_intent.created',
    })

    const res = await POST(webhookRequest('{}', 'whsec_test'))
    expect(res.status).toBe(200)

    const body = await res.json() as { received: boolean; processed: string }
    expect(body.received).toBe(true)
    expect(body.processed).toBe('unhandled')
  })

  it('returns 400 when handleWebhook throws (invalid signature)', async () => {
    mockHandleWebhook.mockRejectedValue(new Error('No signatures found matching the expected signature for payload'))

    const res = await POST(webhookRequest('{}', 'bad-signature'))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/signatures/i)
  })

  it('returns 400 with generic message when handleWebhook throws non-Error', async () => {
    mockHandleWebhook.mockRejectedValue('unexpected')

    const res = await POST(webhookRequest('{}', 'whsec_test'))
    expect(res.status).toBe(400)

    const body = await res.json() as { error: string }
    expect(body.error).toBe('Webhook processing failed')
  })

  it('activates AdBooking and returns 200 for ad-booking.activated event', async () => {
    mockHandleWebhook.mockResolvedValue({
      type: 'ad-booking.activated',
      bookingId: 'booking-xyz',
    })
    mockAdBookingFindUnique.mockResolvedValue({ id: 'booking-xyz', status: 'PENDING' })
    mockAdBookingUpdate.mockResolvedValue({ id: 'booking-xyz' })

    const res = await POST(webhookRequest('{}', 'whsec_test'))
    expect(res.status).toBe(200)

    const body = await res.json() as { received: boolean; processed: string }
    expect(body.received).toBe(true)
    expect(body.processed).toBe('ad-booking.activated')
    expect(mockAdBookingUpdate).toHaveBeenCalledWith({
      where: { id: 'booking-xyz' },
      data: { status: 'ACTIVE' },
    })
  })

  it('returns idempotent success when AdBooking is already ACTIVE', async () => {
    mockHandleWebhook.mockResolvedValue({
      type: 'ad-booking.activated',
      bookingId: 'booking-xyz',
    })
    mockAdBookingFindUnique.mockResolvedValue({ id: 'booking-xyz', status: 'ACTIVE' })

    const res = await POST(webhookRequest('{}', 'whsec_test'))
    expect(res.status).toBe(200)

    const body = await res.json() as { received: boolean; processed: string }
    expect(body.processed).toBe('ad-booking.already-active')
    expect(mockAdBookingUpdate).not.toHaveBeenCalled()
  })
})
