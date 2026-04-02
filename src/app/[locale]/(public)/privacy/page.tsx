import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · DarkTunes',
  description: 'Datenschutzerklärung von DarkTunes gemäß DSGVO.',
}

/**
 * Datenschutzerklärung (Privacy Policy) — required by GDPR/DSGVO.
 * Plain text version — a production deployment requires a full legal review
 * by a certified data protection officer (Datenschutzbeauftragter).
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto prose prose-invert prose-sm">

        <h1>Datenschutzerklärung</h1>
        <p className="text-white/50 text-xs">Stand: April 2026</p>

        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der DSGVO ist der Betreiber von DarkTunes (darktunes.com).
          Kontakt: datenschutz@darktunes.com
        </p>

        <h2>2. Welche Daten wir erheben</h2>
        <ul>
          <li><strong>Konto-Daten:</strong> E-Mail-Adresse, Anzeigename (bei Registrierung)</li>
          <li><strong>Voting-Daten:</strong> Anonymisierte Stimmgewichte (kein Klarnamen-Bezug nach Löschung)</li>
          <li><strong>Zahlungsdaten:</strong> Über Stripe verarbeitet — wir speichern keine Kartendaten</li>
          <li><strong>Server-Logs:</strong> IP-Adresse, User-Agent (max. 7 Tage gespeichert)</li>
          <li><strong>Cookies:</strong> Session-Cookie (Supabase Auth), Präferenz-Cookie (Sprache)</li>
        </ul>

        <h2>3. Zweck der Verarbeitung</h2>
        <p>
          Wir verarbeiten deine Daten ausschließlich für den Betrieb der DarkTunes-Plattform:
          Benutzerauthentifizierung, Voting-Verarbeitung, Chart-Berechnung und Zahlungsabwicklung.
        </p>

        <h2>4. Rechtsgrundlagen</h2>
        <ul>
          <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) — für Konto und Abstimmung</li>
          <li>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) — für Server-Logs</li>
          <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) — für E-Mail-Digest</li>
        </ul>

        <h2>5. Deine Rechte</h2>
        <ul>
          <li><strong>Auskunft</strong> (Art. 15 DSGVO) — Du kannst jederzeit eine Kopie deiner Daten anfordern.</li>
          <li><strong>Berichtigung</strong> (Art. 16 DSGVO) — Falsche Daten können korrigiert werden.</li>
          <li><strong>Löschung</strong> (Art. 17 DSGVO) — Du kannst dein Konto und alle persönlichen Daten löschen.</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Export als JSON über dein Dashboard.</li>
          <li><strong>Widerspruch</strong> (Art. 21 DSGVO) — Gegen die Verarbeitung auf Basis berechtigter Interessen.</li>
        </ul>

        <p>
          Zur Ausübung deiner Rechte: Nutze die Datenschutz-Funktionen in deinem Konto-Dashboard
          oder kontaktiere uns unter datenschutz@darktunes.com.
        </p>

        <h2>6. Datenweitergabe</h2>
        <p>
          Wir geben Daten nur an folgende Dienstleister weiter, soweit für den Betrieb nötig:
        </p>
        <ul>
          <li><strong>Supabase</strong> (EU-Datenbankhosting) — Datenbank und Authentifizierung</li>
          <li><strong>Stripe</strong> (Zahlungsabwicklung) — Nur für Abonnements</li>
          <li><strong>Vercel</strong> (Hosting) — Serverless-Infrastruktur</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>
          DarkTunes verwendet nur technisch notwendige Cookies. Wir setzen keine Tracking-
          oder Werbe-Cookies ein. Ein Cookie-Opt-in ist für die Nutzung der Plattform nicht erforderlich.
        </p>

        <h2>8. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz: datenschutz@darktunes.com
        </p>
      </div>
    </main>
  )
}
