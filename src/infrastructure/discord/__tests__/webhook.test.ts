import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock fetch globally ───────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  sendDiscordWebhook,
  announceChartPublication,
  type DiscordWebhookPayload,
} from '../webhook'

describe('Discord Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.DISCORD_WEBHOOK_URL
  })

  describe('sendDiscordWebhook', () => {
    it('is a no-op when DISCORD_WEBHOOK_URL is not set', async () => {
      await sendDiscordWebhook({ content: 'test' })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls the webhook URL with the payload when configured', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc'
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const payload: DiscordWebhookPayload = {
        content: 'Hello from test',
        embeds: [{ title: 'Test', color: 0x7c3aed }],
      }
      await sendDiscordWebhook(payload)

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://discord.com/api/webhooks/123/abc')
      expect(options.method).toBe('POST')
      const body = JSON.parse(options.body as string) as DiscordWebhookPayload
      expect(body.content).toBe('Hello from test')
    })

    it('throws when Discord returns a non-2xx status', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      } as unknown as Response)

      await expect(sendDiscordWebhook({ content: 'fail' })).rejects.toThrow(
        'Discord webhook failed: 400',
      )
    })
  })

  describe('announceChartPublication', () => {
    it('sends a formatted chart announcement embed', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/abc'
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      await announceChartPublication(
        'Best Track',
        'April 2026',
        [
          { rank: 1, artist: 'Xordia', title: 'The Iron Testament', score: 488.9 },
          { rank: 2, artist: 'Vioflesh', title: 'Nocturnal Requiem', score: 483.6 },
        ],
        'https://darktunes.com/charts',
      )

      expect(mockFetch).toHaveBeenCalledOnce()
      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string) as DiscordWebhookPayload

      expect(body.embeds).toHaveLength(1)
      const embed = body.embeds![0]
      expect(embed.title).toContain('Best Track')
      expect(embed.title).toContain('April 2026')
      expect(embed.url).toBe('https://darktunes.com/charts')
      expect(embed.fields).toHaveLength(2)
      expect(embed.fields![0].name).toContain('#1 Xordia')
    })
  })
})
