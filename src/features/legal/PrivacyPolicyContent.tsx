import { Lock } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * Datenschutzerklärung compliant with DSGVO Art. 13 / Art. 14.
 *
 * Required for any website that processes personal data of EU residents.
 * This policy covers: data categories collected, legal basis, retention,
 * user rights (Art. 15–21 DSGVO), and contact for data protection requests.
 */
export function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Lock className="w-6 h-6 text-accent" weight="duotone" />
        <h2 className="font-display text-2xl font-bold tracking-tight">Datenschutzerklärung</h2>
      </div>
      <p className="text-xs text-muted-foreground">Gemäß DSGVO Art. 13/14 – Stand: März 2025</p>
      <Card className="p-6 glassmorphism space-y-5">
        <section>
          <h3 className="font-semibold mb-2">1. Verantwortliche Stelle</h3>
          <p className="text-sm text-muted-foreground">
            darkTunes Music Group<br />
            [PLATZHALTER: vollständige Adresse]<br />
            E-Mail: datenschutz@darktunes.de
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">2. Datenschutzbeauftragter</h3>
          <p className="text-sm text-muted-foreground">
            [PLATZHALTER: Name des DSB oder „Kein Datenschutzbeauftragter benannt (Schwellenwert nicht erreicht, §38 BDSG)"]
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">3. Welche Daten wir verarbeiten</h3>
          <div className="text-sm text-muted-foreground space-y-3">
            <p><strong className="text-foreground">3.1 Keine serverseitige Verarbeitung:</strong> darkTunes Charts verarbeitet <em>keine</em> personenbezogenen Daten auf einem Server. Alle Daten verbleiben ausschließlich in Ihrem Browser (localStorage).</p>
            <p><strong className="text-foreground">3.2 Lokal gespeicherte Daten:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Anonyme Sitzungs-ID (UUID v4, generiert im Browser, kein Personenbezug)</li>
              <li>Ihre Abstimmungen (Tracks und Kreditanzahl)</li>
              <li>Ihr DSGVO-Zustimmungsstatus und Zeitstempel</li>
              <li>Transparenz-Protokolleinträge Ihrer Abstimmungen</li>
            </ul>
            <p><strong className="text-foreground">3.3 Server-Logs:</strong> Die Hosting-Infrastruktur (GitHub) kann Standard-Serverlogs (IP-Adresse, Zeitstempel, aufgerufene URL) erfassen. Hierüber informiert GitHub in seiner eigenen{' '}
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                Datenschutzerklärung
              </a>.
            </p>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">4. Rechtsgrundlagen (Art. 6 DSGVO)</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong className="text-foreground">Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung: Speicherung von Abstimmungsdaten im Browser nach Ihrer ausdrücklichen Zustimmung.</p>
            <p>• <strong className="text-foreground">Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigte Interessen: Erkennung von Bot-Aktivität zum Schutz der Chartintegrität.</p>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">5. Speicherdauer</h3>
          <p className="text-sm text-muted-foreground">
            Lokale Daten werden gespeichert, bis Sie den Browser-Speicher löschen oder die Funktion „Alle Daten löschen" in der App nutzen. Eine automatische Löschung nach Ablauf des Abstimmungszeitraums ist geplant.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">6. Ihre Rechte (Art. 15–21 DSGVO)</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• <strong className="text-foreground">Auskunft (Art. 15):</strong> Da alle Daten lokal in Ihrem Browser liegen, können Sie diese jederzeit in den Browser-Entwicklertools einsehen.</p>
            <p>• <strong className="text-foreground">Löschung (Art. 17):</strong> Nutzen Sie die Schaltfläche „Alle Daten löschen" in der App oder löschen Sie den localStorage Ihres Browsers.</p>
            <p>• <strong className="text-foreground">Widerspruch (Art. 21):</strong> Sie können die Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen (Schaltfläche „Einwilligung zurückziehen").</p>
            <p>• <strong className="text-foreground">Beschwerde:</strong> Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, z.B. dem Landesbeauftragten für Datenschutz und Informationsfreiheit des zuständigen Bundeslandes.</p>
          </div>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">7. Einsatz von KI-Analyse</h3>
          <p className="text-sm text-muted-foreground">
            Der „AI Scout" analysiert ausschließlich öffentlich verfügbare Streaming-Wachstumsdaten und anonyme Abstimmungsgeschwindigkeit. Es werden keine personenbezogenen Daten für KI-Analysen verwendet. Die Vorhersagen sind algorithmisch und unterliegen keiner automatisierten Einzelentscheidung im Sinne des Art. 22 DSGVO.
          </p>
        </section>
        <Separator />
        <section>
          <h3 className="font-semibold mb-2">8. Kontakt Datenschutz</h3>
          <p className="text-sm text-muted-foreground">
            Datenschutzanfragen bitte ausschließlich per E-Mail an: <span className="text-accent">datenschutz@darktunes.de</span>
          </p>
        </section>
      </Card>
    </div>
  )
}
