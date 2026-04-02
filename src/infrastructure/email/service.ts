/**
 * @module infrastructure/email/service
 *
 * Email delivery service using Resend (https://resend.com).
 * Provides typed template functions for all transactional emails.
 *
 * Requires the RESEND_API_KEY environment variable.
 * If the key is not set, emails are logged to the console (dev mode)
 * and the function returns successfully — no network calls are made.
 *
 * @see ADR-021: Email delivery via Resend
 */

const RESEND_API = 'https://api.resend.com/emails'
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'DarkTunes <noreply@darktunes.com>'

interface EmailPayload {
  to: string[]
  subject: string
  html: string
}

/**
 * Sends an email via Resend.
 * Falls back to console.log in dev if RESEND_API_KEY is not set.
 */
async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Development fallback — log instead of sending
    console.log('[email:dev]', JSON.stringify(payload, null, 2))
    return
  }

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)')
    throw new Error(`Resend API error ${response.status}: ${body}`)
  }
}

/**
 * Sends a welcome email to a newly registered user.
 *
 * @param to          - Recipient email address.
 * @param displayName - User's display name.
 */
export async function sendWelcomeEmail(to: string, displayName: string): Promise<void> {
  await sendEmail({
    to: [to],
    subject: 'Willkommen bei DarkTunes 🖤',
    html: `
      <h1>Willkommen, ${displayName}!</h1>
      <p>Du bist jetzt Teil der DarkTunes Community — der ersten demokratischen Dark-Music-Chartplattform.</p>
      <p>Du hast <strong>150 Voice Credits</strong> für das monatliche Fan-Voting erhalten.</p>
      <p><a href="https://darktunes.com/charts">Charts ansehen →</a></p>
      <hr />
      <p style="color:#666;font-size:12px;">DarkTunes · <a href="https://darktunes.com/privacy">Datenschutz</a> · <a href="https://darktunes.com/imprint">Impressum</a></p>
    `,
  })
}

/**
 * Sends a chart publication notification email.
 *
 * @param to           - Recipient email address.
 * @param categoryName - Name of the published chart category.
 * @param periodLabel  - Period label (e.g. "April 2026").
 * @param chartsUrl    - Deep link to the charts page.
 */
export async function sendChartPublishedEmail(
  to: string,
  categoryName: string,
  periodLabel: string,
  chartsUrl: string,
): Promise<void> {
  await sendEmail({
    to: [to],
    subject: `📊 DarkTunes ${categoryName} Charts — ${periodLabel}`,
    html: `
      <h2>Die ${categoryName} Charts für ${periodLabel} sind veröffentlicht!</h2>
      <p><a href="${chartsUrl}">Jetzt die aktuellen Charts ansehen →</a></p>
      <hr />
      <p style="color:#666;font-size:12px;">DarkTunes · <a href="https://darktunes.com/privacy">Datenschutz</a> · <a href="https://darktunes.com/imprint">Impressum</a></p>
    `,
  })
}

/**
 * Sends an award nomination notification to a band.
 *
 * @param to          - Recipient email address.
 * @param bandName    - Name of the nominated band.
 * @param awardName   - Name of the award category.
 * @param awardsUrl   - Link to the awards page.
 */
export async function sendAwardNominationEmail(
  to: string,
  bandName: string,
  awardName: string,
  awardsUrl: string,
): Promise<void> {
  await sendEmail({
    to: [to],
    subject: `🏆 ${bandName} wurde für den ${awardName} nominiert`,
    html: `
      <h2>Glückwunsch! ${bandName} wurde für den <em>${awardName}</em> nominiert.</h2>
      <p>Die DarkTunes Community hat dich nominiert. Das Voting ist jetzt offen.</p>
      <p><a href="${awardsUrl}">Zur Awards-Seite →</a></p>
      <hr />
      <p style="color:#666;font-size:12px;">DarkTunes · <a href="https://darktunes.com/privacy">Datenschutz</a></p>
    `,
  })
}

/**
 * Sends a DJ application status update email.
 *
 * @param to          - Recipient email address.
 * @param displayName - DJ's display name.
 * @param approved    - Whether the application was approved.
 */
export async function sendDJApplicationStatusEmail(
  to: string,
  displayName: string,
  approved: boolean,
): Promise<void> {
  const subject = approved
    ? '✅ Deine DJ-Bewerbung bei DarkTunes wurde angenommen'
    : '❌ Deine DJ-Bewerbung bei DarkTunes'

  const html = approved
    ? `
      <h2>Glückwunsch, ${displayName}!</h2>
      <p>Deine DJ-Bewerbung bei DarkTunes wurde <strong>angenommen</strong>.</p>
      <p>Du kannst ab sofort DJ-Ballots einreichen und an der Kuratierung teilnehmen.</p>
      <p><a href="https://darktunes.com/dashboard/dj">Zum DJ-Dashboard →</a></p>
    `
    : `
      <h2>Hallo ${displayName},</h2>
      <p>Deine DJ-Bewerbung wurde leider <strong>nicht angenommen</strong>.</p>
      <p>Du kannst dich in Zukunft erneut bewerben, wenn du mehr Events nachweisen kannst.</p>
    `

  await sendEmail({
    to: [to],
    subject,
    html: `${html}
      <hr />
      <p style="color:#666;font-size:12px;">DarkTunes · <a href="https://darktunes.com/privacy">Datenschutz</a></p>
    `,
  })
}
