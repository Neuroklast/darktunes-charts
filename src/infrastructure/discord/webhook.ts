/**
 * @module infrastructure/discord/webhook
 *
 * Posts messages to a Discord channel via a webhook URL.
 * Used to announce chart publications, compilation releases, and other
 * community-relevant events.
 *
 * Requires the DISCORD_WEBHOOK_URL environment variable to be set.
 * If it is not set, all webhook calls silently succeed (no-op) — this
 * allows the application to run without Discord integration configured.
 */

export interface DiscordEmbed {
  title: string
  description?: string
  color?: number
  url?: string
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  footer?: { text: string }
  timestamp?: string
}

export interface DiscordWebhookPayload {
  content?: string
  embeds?: DiscordEmbed[]
  username?: string
  avatar_url?: string
}

const DARKTUNES_PURPLE = 0x7c3aed

/**
 * Sends a message to the configured Discord webhook.
 *
 * @param payload - Discord webhook payload including optional embeds.
 * @throws {Error} when the Discord API returns a non-2xx status.
 */
export async function sendDiscordWebhook(payload: DiscordWebhookPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    // No-op: Discord integration not configured
    return
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)')
    throw new Error(`Discord webhook failed: ${response.status} ${body}`)
  }
}

/**
 * Sends a chart publication announcement to Discord.
 *
 * @param categoryName - Human-readable category name.
 * @param periodLabel  - Period label (e.g. "April 2026").
 * @param topEntries   - Top 3 entries for the announcement.
 * @param chartUrl     - Deep link to the chart page.
 */
export async function announceChartPublication(
  categoryName: string,
  periodLabel: string,
  topEntries: Array<{ rank: number; artist: string; title: string; score: number }>,
  chartUrl: string,
): Promise<void> {
  const fields = topEntries.slice(0, 3).map((e) => ({
    name: `#${e.rank} ${e.artist}`,
    value: `*${e.title}* — ${e.score.toFixed(1)} pts`,
    inline: false,
  }))

  await sendDiscordWebhook({
    embeds: [
      {
        title: `📊 ${categoryName} Charts — ${periodLabel}`,
        description: 'Die neuen DarkTunes Charts sind veröffentlicht!',
        color: DARKTUNES_PURPLE,
        url: chartUrl,
        fields,
        footer: { text: 'DarkTunes Community Charts' },
        timestamp: new Date().toISOString(),
      },
    ],
  })
}
