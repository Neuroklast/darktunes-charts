import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDiscordWebhook } from '@/infrastructure/discord/webhook'

/**
 * POST /api/admin/discord/test-webhook
 *
 * Sends a test message to the configured Discord webhook URL.
 * Allows admins to verify the Discord integration is working.
 *
 * Requires: DISCORD_WEBHOOK_URL environment variable to be set.
 * Requires: Admin role.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role via user metadata
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!process.env.DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'DISCORD_WEBHOOK_URL is not configured' },
        { status: 422 },
      )
    }

    await sendDiscordWebhook({
      embeds: [
        {
          title: '🔧 DarkTunes Webhook Test',
          description: 'Der Discord-Webhook ist korrekt konfiguriert.',
          color: 0x7c3aed,
          footer: { text: 'DarkTunes Admin' },
          timestamp: new Date().toISOString(),
        },
      ],
    })

    return NextResponse.json({ success: true, message: 'Test message sent to Discord.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
