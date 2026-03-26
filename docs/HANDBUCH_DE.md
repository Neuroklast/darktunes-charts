# darkTunes Charts — Benutzerhandbuch (Deutsch)

**Version 1.0 · Stand: März 2026**

---

## Inhaltsverzeichnis

1. [Über darkTunes Charts](#1-über-darktunes-charts)
2. [Erste Schritte](#2-erste-schritte)
3. [Nutzerrollen & Berechtigungen](#3-nutzerrollen--berechtigungen)
4. [Fan-Dashboard: Quadratic Voting](#4-fan-dashboard-quadratic-voting)
5. [DJ-Dashboard: Schulze-Methode](#5-dj-dashboard-schulze-methode)
6. [Band-Dashboard: Peer-Review & Tier-System](#6-band-dashboard-peer-review--tier-system)
7. [Charts & Kategorien](#7-charts--kategorien)
8. [A&R-Dashboard](#8-ar-dashboard)
9. [KI-Newcomer-Scout](#9-ki-newcomer-scout)
10. [Transparenz & Anti-Bot-System](#10-transparenz--anti-bot-system)
11. [Datenschutz & Rechtliches](#11-datenschutz--rechtliches)
12. [Deployment & Betrieb](#12-deployment--betrieb)
13. [API-Referenz](#13-api-referenz)
14. [Fehlerbehebung](#14-fehlerbehebung)

---

## 1. Über darkTunes Charts

darkTunes Charts ist eine **demokratische Musik-Chart-Plattform** für die Dark-Music-Szene (Goth, Metal, Dark Electro). Im Gegensatz zu herkömmlichen Pay-to-Win-Chartsystemen basiert darkTunes auf einem Drei-Säulen-Abstimmungsmodell:

| Säule | Methode | Anteil am Gesamt-Score |
|---|---|---|
| **Fans (Peoples Choice)** | Quadratic Voting (100 Credits/Monat) | 33,3 % |
| **DJs (Kuratoren)** | Schulze-Methode (Ranked-Choice Condorcet) | 33,3 % |
| **Bands (Peer Review)** | Cliquen-gewichtetes Netzwerkmodell | 33,3 % |

**Kernprinzipien:**
- **Keine Werbung** — Die Plattform ist werbefrei
- **Finanzielle Beiträge haben keinen Einfluss auf Rankings** — Geld kauft nur Kategoriezugang, nicht Platzierungen
- **Vollständige Transparenz** — Alle Abstimmungen sind im Transparenz-Log öffentlich einsehbar
- **Anti-Manipulation** — Drei unabhängige Sicherheitssysteme (Bot-Erkennung, Cliquen-Erkennung, Rate-Limiting)

---

## 2. Erste Schritte

### 2.1 Konto erstellen

1. Klicke auf **„Anmelden"** in der oberen Navigation
2. Wähle den Tab **„Konto erstellen"**
3. Wähle deine Rolle (Fan, Band, DJ, Redakteur)
4. Fülle alle Pflichtfelder aus
5. Klicke **„Konto erstellen"**

> **Hinweis für DJs:** DJ-Konten benötigen eine manuelle KYC-Verifizierung durch das darkTunes-Team. Du erhältst eine E-Mail, sobald dein Konto aktiviert wurde.

### 2.2 Navigation

Die Hauptnavigation enthält folgende Bereiche:

| Icon | Bereich | Beschreibung |
|---|---|---|
| 📊 | Charts | Aktuelle Monats-Charts mit allen Kategorien |
| ❤️ | Fan-Voting | Quadratic Voting Interface |
| 🎵 | DJ-Voting | Ranked-Choice Schulze-Ballot |
| 📋 | Kategorien | Alle Kategorien & Preise |
| 🤖 | KI-Scout | AI Breakthrough Predictions |
| 📈 | A&R | Label-Dashboard für Talentscouts |
| 🔍 | Transparenz | Öffentliches Abstimmungsprotokoll |
| 🛡️ | Bot-Schutz | Anti-Manipulation-Dashboard |

### 2.3 Demo-Zugang

Für Tests stehen folgende Demo-Accounts zur Verfügung (Passwort: `demo1234`):

```
admin@darktunes.com  — Admin-Vollzugriff
dj@darktunes.com     — Verifizierter DJ
band@darktunes.com   — Band-Konto (CZARINA)
editor@darktunes.com — Redakteur
fan@darktunes.com    — Standard-Fan
```

---

## 3. Nutzerrollen & Berechtigungen

### 3.1 Fan

- Erhält **100 Voice Credits** pro Kalendermonat
- Kann für alle nominierten Tracks abstimmen (Quadratic Voting)
- Kann das Voting anpassen, pausieren und zurücksetzen bis zur Einreichung
- Sieht eigene Abstimmungshistorie im Transparenz-Log

**Anmeldevoraussetzung:** E-Mail-Verifizierung (OAuth: Spotify, Apple, Google, Discord geplant)

### 3.2 DJ / Kurator

- Kann vollständige Rangordnungen (Rankings) für alle nominierten Tracks erstellen
- Stimme wird über die **Schulze-Methode** (Beatpath-Algorithmus) gewichtet
- **Muss manuell durch das darkTunes-Team verifiziert werden** (KYC-Prozess)
- KYC-Nachweise: aktive Club-Residencies, Webradio-Aktivitäten oder Festival-Bookings

**KYC-Prozess:**
1. Registrierung als DJ
2. E-Mail mit Nachweis-Dokumenten an: `kyc@darktunes.com`
3. Manuelle Prüfung durch Admin (i.d.R. 2–5 Werktage)
4. Aktivierungsmail mit DJ-Badge

### 3.3 Band / Künstler

- Kann **Tracks** für Chart-Kategorien einreichen
- Erste Kategorie pro Monat **kostenlos** (Freemium-Modell)
- Weitere Kategorien je nach Tier kostenpflichtig (siehe [Tier-System](#tier-system))
- Kann für **andere Bands** im Peer-Review abstimmen (nicht für sich selbst)
- Erhält DJ-Feedback zu eingereichten Tracks

**Anmeldevoraussetzung:** OAuth + Hintergrundprüfung zur Autorenschafts-Verifizierung

### 3.4 Redakteur

- Kann Spotlights und Artikel verfassen
- Kann Nominierungen für Sonderkategorien einreichen
- Zugang nur auf **Einladung** des darkTunes-Teams

### 3.5 Admin

- Voller Systemzugriff
- KYC-Verifizierung für DJs
- Bot-Alert-Review
- Benutzerverwaltung

### 3.6 A&R (Label)

- Zugang zum spezialisierten A&R-Dashboard
- Sieht Quadratic-Vote-Konzentrationen als Signal für loyale Fanbases
- Kann Talentberichte exportieren
- Datenzugang über digitales Mandat (Power of Attorney via RLS)

---

## 4. Fan-Dashboard: Quadratic Voting

### 4.1 Was ist Quadratic Voting?

Quadratic Voting (QV) ist ein wissenschaftliches Abstimmungsverfahren, das **Intensität der Präferenz** berücksichtigt. Das Kostenmodell:

```
Kosten = Stimmen²
```

| Stimmen | Kosten in Credits |
|---|---|
| 1 | 1 |
| 2 | 4 |
| 3 | 9 |
| 5 | 25 |
| 10 | 100 (gesamtes Monats-Budget) |

**Warum ist das fair?**
- Verhindert „Tyranny of the Majority" — reine Followerzahlen dominieren nicht
- Kleine, leidenschaftliche Fanbases können gezielt unterstützen
- Fans werden incentiviert, Credits auf mehrere Acts zu verteilen
- Bot-Farms verlieren quadratisch an Wirkung

### 4.2 So funktioniert das Fan-Voting

1. **Navigiere** zu „Fan-Voting" (Herz-Icon)
2. **Filtere** nach Genre (All / Goth / Metal / Dark Electro)
3. **Bewege den Slider** für den gewünschten Track — das Budget-Anzeige aktualisiert sich in Echtzeit
4. **Prüfe** deine verbleibenden Credits (oben rechts im Bereich)
5. **Klicke „Votes einreichen"** — Bestätigungsdialog erscheint
6. Optional: **„Alle zurücksetzen"** um neu zu beginnen

**Budget-Verwaltung:**
- Das Budget zeigt immer die verbleibenden Credits an
- Bei 90 % Auslastung erscheint eine Warnung
- Das Formular kann nicht eingereicht werden, wenn das Budget überschritten ist
- Credits werden am 1. jedes Monats zurückgesetzt

### 4.3 Abstimmungs-Transparenz

Jede eingereichte Stimme erscheint im Transparenz-Log mit:
- Anonymisierter Nutzer-ID (Hash)
- Zeitstempel
- Anzahl der Stimmen
- Verbrauchte Credits
- Angewandtes Gewicht (1,0 = volle Wertung)

---

## 5. DJ-Dashboard: Schulze-Methode

### 5.1 Was ist die Schulze-Methode?

Die Schulze-Methode (auch: Beatpath-Methode) ist ein **Condorcet-kompatibles Ranked-Choice-Verfahren**. Es findet den Kandidaten, der in **paarweisen Vergleichen** gegen alle anderen gewinnt.

**Algorithmische Schritte:**
1. Paarweise-Präferenzmatrix aufbauen
2. Stärkste Pfade via Floyd-Warshall-Algorithmus berechnen (O(n³))
3. Track mit stärkstem Beatpath gegen alle = Gewinner

**Warum nicht Borda-Count?** Der Borda-Count ist anfällig für strategisches Downvoting und den Spoiler-Effekt. Die Schulze-Methode eliminiert taktisches Abstimmen vollständig.

### 5.2 So funktioniert das DJ-Voting

> **Voraussetzung:** Verifiziertes DJ-Konto (KYC abgeschlossen)

1. **Navigiere** zu „DJ-Voting" (Disc-Icon)
2. Ziehe die Tracks per **Drag & Drop** in deine bevorzugte Reihenfolge
3. Track 1 = stärkste Präferenz
4. **Klicke „Ballot einreichen"**
5. Das System berechnet sofort das Schulze-Ergebnis und zeigt die Paarweise-Matrix

**Sichtbarkeit:**
- Die aktuelle Schulze-Rangliste ist nach der Einreichung sichtbar
- Die vollständige Paarweise-Matrix und Stärkste-Pfad-Matrix sind im Transparenz-Log einsehbar

---

## 6. Band-Dashboard: Peer-Review & Tier-System

### 6.1 Tier-System

Bands werden automatisch anhand ihrer **Spotify Monthly Listeners** klassifiziert:

| Tier | Spotify Listeners | Erste Kategorie | Zusatz-Kategorien |
|---|---|---|---|
| **Micro** (Underground) | 0 – 10.000 | Kostenlos | 5 €/Monat |
| **Emerging** (Small) | 10.001 – 50.000 | Kostenlos | 15 €/Monat |
| **Established** (Medium) | 50.001 – 250.000 | Kostenlos | 35 €/Monat |
| **International** (Large) | 250.001 – 1.000.000 | Kostenlos | 75 €/Monat |
| **Macro** (Crossover) | > 1.000.000 | Kostenlos | 150 €/Monat |

> **Wichtig:** Finanzielle Beiträge haben **keinerlei** Einfluss auf die Ranking-Algorithmen. Zahlungen schalten nur die Teilnahme an weiteren Kategorien frei.

### 6.2 Kategorie-Einreichung

1. **Öffne** „Kategorien" (Listen-Icon)
2. **Wähle** deine Kategorie(n) — erste ist kostenlos
3. **Kalkuliere** die Gesamtkosten mit dem eingebauten Rechner
4. **Reiche** deinen Track für jede gewählte Kategorie ein

### 6.3 Peer-Review Voting

1. **Navigiere** zu einem Voting-Bereich mit Band-Optionen
2. **Bewerte** andere Bands (nicht die eigene Band)
3. Das System berechnet automatisch den **Cliquen-Koeffizienten**

**Anti-Kollusions-Algorithmus:**
- Gegenseitiges Voting (A→B und B→A) wird automatisch abgewertet
- Je mehr gemeinsame Verbindungen in einer Voting-Ring, desto stärker der Penalty
- Gewicht-Multiplikator: 1,0 (sauber) bis 0,4 (starke Kollusion erkannt)

### 6.4 Chart-Platzierungs-Historie

In deinem Band-Dashboard siehst du:
- Aktuelle Platzierung in jeder eingetragenen Kategorie
- Historische Platzierungen (monatlich)
- DJ-Feedback-Zusammenfassung
- Voter-Struktur-Analyse (wie viele Fans, DJs, Peers)

---

## 7. Charts & Kategorien

### 7.1 Kategorie-Gruppen

| Gruppe | Kategorien |
|---|---|
| **Music Performance** | Track of the Month, Album of the Month, Voice of the Void, Riff Architect, Synthesis & Steel |
| **Visuals & Aesthetics** | Best Cover Art, Best Merch, Best Music Video |
| **Community & Spirit** | Chronicler of the Night, Dark Integrity Award, Lyricist of the Shadows |
| **Newcomer & Niche** | Underground Anthem (max. 10k Listeners), The Dark Concept |

### 7.2 Gewichtungen pro Kategorie

Jede Kategorie hat eigene Gewichtungen für die drei Voting-Säulen:

| Kategorie | Fan | DJ | Peer |
|---|---|---|---|
| Track of the Month | 40 % | 30 % | 30 % |
| Voice of the Void | 20 % | 20 % | 60 % |
| Best Cover Art | 70 % | 15 % | 15 % |
| Underground Anthem | 50 % | 25 % | 25 % |

### 7.3 Combined Charts

Der Combined Score wird berechnet als:
```
Combined = (Fan-Score × Fan-Gewicht) + (DJ-Score × DJ-Gewicht) + (Peer-Score × Peer-Gewicht)
```

Die Reihenfolge der Tracks auf der Homepage wird **zufällig randomisiert** (kein Reihenfolge-Bias).

### 7.4 Sonderkategorien & Special Awards

Auf der Charts-Seite werden zusätzlich angezeigt:
- **Band of the Day** — Deterministisch ausgewählt täglich um 00:00 UTC (Tier Micro/Emerging only)
- **Special Awards** — „Label of the Month", „Most Dedicated Fan Base" etc.

---

## 8. A&R-Dashboard

Das A&R-Dashboard ist für Label-Vertreter und Talentscouts konzipiert.

### 8.1 High-Intent-Signale

Das Dashboard zeigt Bands mit **hoher Quadratic-Vote-Konzentration** — ein Indikator für loyale Super-Listener, bevor ein Band mainstream wird.

### 8.2 Tier-Verteilung

Ein Balkendiagramm visualisiert die Tier-Verteilung aller registrierten Bands.

### 8.3 Top Bands nach Credits

Ranking der Bands nach insgesamt erhaltenen Fan-Credits — ein stärkeres Signal als reine Stimmenzahlen, da hohe Credits echte Leidenschaft erfordern.

### 8.4 Export

Der „Export Report"-Button erstellt einen CSV-Report aller angezeigten Daten für externe Analyse.

---

## 9. KI-Newcomer-Scout

### 9.1 Wie funktioniert der KI-Scout?

Der KI-Scout analysiert drei Signale für jede Band:

| Signal | Gewicht | Beschreibung |
|---|---|---|
| **Vote Velocity** | 40 % | Anstiegsrate der Fan-Votes in den letzten 30 Tagen |
| **Stream Growth** | 40 % | Prozentuales Wachstum der Spotify-Listeners |
| **Genre Momentum** | 20 % | Performance im Vergleich zum Genre-Durchschnitt |

**Confidence Score > 65 %** = Band wird voraussichtlich innerhalb von 3 Monaten ein Tier aufsteigen.

### 9.2 Interpretation

- **Grüner Badge „Breakthrough Likely"** — Hohe Wahrscheinlichkeit für viralen Durchbruch
- **Vote Velocity** zeigt das aktuell aktivste Fanbase-Wachstum
- **Stream Growth** misst absolutes Listener-Wachstum
- **Genre Momentum** zeigt, ob die Band ihren Genre-Zeitgeist trifft

---

## 10. Transparenz & Anti-Bot-System

### 10.1 Transparenz-Log

Jede Abstimmung wird mit folgenden Daten protokolliert:
- **Audit-ID** (UUID v4)
- **Zeitstempel**
- **Track-ID**
- **Anonymisierte Nutzer-ID** (Hash, keine PII)
- **Vote-Typ** (fan / dj / peer)
- **Rohstimmen**
- **Verbrauchte Credits** (nur Fan-Votes)
- **Angewandtes Gewicht** (1,0 = sauber, < 1,0 = Penalty)
- **Endgültiger Beitrag** (Rohstimmen × Gewicht)

Der Log ist öffentlich zugänglich über: `GET /api/transparency`

### 10.2 Bot-Erkennungs-System

Das System erkennt automatisch verdächtige Muster:

**Trigger:** ≥ 100 Stimmen innerhalb von 60 Sekunden

**Schweregrade:**
- **Low** — Erhöhtes Volumen, keine weiteren Auffälligkeiten
- **Medium** — Neue Konten (< 7 Tage alt) > 50 % oder IP-Cluster
- **High** — Neue Konten > 70 % UND IP-Cluster

**Was passiert:**
1. Verdächtige Stimmen werden automatisch in **Quarantäne** verschoben
2. Alert erscheint im Bot-Detection-Panel
3. Admin überprüft manuell und genehmigt/verwirft

### 10.3 Anti-Kollusions-Peer-Review

Für das Band-Peer-Review wird der **Cliquen-Koeffizient** berechnet:

1. **Reziprokes Voting erkennen**: Stimmt Band A für B und B für A?
2. **Gemeinsame Verbindungen zählen**: Wie viele Bands wählen beide?
3. **Penalty berechnen**: -15 % pro gemeinsamer Verbindung, max. -60 %
4. **Mindestgewicht**: 0,4 (40 % — nie komplett ignoriert)

---

## 11. Datenschutz & Rechtliches

### 11.1 DSGVO-Konformität

- Alle persönlichen Daten werden nur mit expliziter Einwilligung gespeichert
- Kein Tracking durch Drittanbieter
- Recht auf Datenlöschung (im Nutzerprofil unter „Datenschutz")
- Cookies: ausschließlich notwendige Session-Cookies

### 11.2 Voting-Anonymisierung

- Abstimmungen werden mit einem anonymisierten Nutzer-Hash gespeichert
- Die Verknüpfung zwischen Hash und echter Identität liegt nur beim Nutzer selbst
- Admins können einzelne Stimmen nicht einzelnen Personen zuordnen

### 11.3 Rechtliche Dokumente

- [Impressum](/#impressum)
- [Datenschutzerklärung](/#privacy)
- [Nutzungsbedingungen](/#terms)

---

## 12. Deployment & Betrieb

### 12.1 Voraussetzungen

- Node.js ≥ 20
- npm ≥ 9
- Vercel-Account
- Vercel CLI: `npm install -g vercel`

### 12.2 Deployment-Script

```bash
# Produktions-Deployment
./vercel-deploy.sh

# Preview-Deployment (zum Testen)
./vercel-deploy.sh --preview
```

Das Script führt automatisch aus:
1. Abhängigkeiten installieren (`npm ci`)
2. TypeScript-Prüfung (`tsc --noEmit`)
3. Tests (`npm test`)
4. Produktions-Build (`npm run build`)
5. Vercel-Deployment

### 12.3 Umgebungsvariablen

Alle Umgebungsvariablen sind in [`.env.example`](../.env.example) dokumentiert.

Wichtigste Variablen für die Produktion:

| Variable | Zweck |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify-API für Listener-Daten |
| `SPOTIFY_CLIENT_SECRET` | Spotify-API Authentifizierung |
| `EXCHANGE_RATE_API_KEY` | Währungskonvertierung (optional) |

### 12.4 In-Memory-Store vs. persistente Datenbank

Im Standard-Deployment verwendet darkTunes einen **In-Memory-Store** (api/_lib/store.ts), der bei jedem Cold-Start neu aus den Seed-Daten initialisiert wird.

**Für Produktionsbetrieb mit persistenten Daten** empfiehlt sich:
- Vercel KV (Redis) — einfachste Option
- Neon PostgreSQL + Prisma — für relationale Abfragen
- Supabase — für RLS und Auth-Integration

### 12.5 Monitoring

Empfohlene Monitoring-Stack:
- **Vercel Analytics** — Web Vitals, Performance
- **Vercel Logs** — Serverless Function Logs
- **Sentry** (optional) — Fehler-Tracking

---

## 13. API-Referenz

Alle API-Endpunkte sind unter `/api/` verfügbar.

### 13.1 Authentifizierung

Aktuell: Keine API-Authentifizierung (MVP). Produktions-Deployment sollte JWT-Bearer-Token hinzufügen.

### 13.2 Endpunkte

#### Bands

```
GET  /api/bands              — Alle registrierten Bands abrufen
POST /api/bands              — Neue Band registrieren
```

**POST /api/bands Body:**
```json
{
  "name": "Crematory",
  "genre": "Goth",
  "spotifyMonthlyListeners": 450000,
  "spotifyUrl": "https://open.spotify.com/artist/...",
  "bandcampUrl": "https://crematory.bandcamp.com"
}
```

#### Tracks

```
GET  /api/tracks             — Alle Tracks abrufen
POST /api/tracks             — Neuen Track einreichen
```

#### Charts

```
GET  /api/charts?limit=10    — Chart-Ranking abrufen
```

#### Votes

```
GET  POST /api/votes/fan     — Fan-Votes (Quadratic Voting)
GET  POST /api/votes/dj      — DJ-Ballots (Schulze-Methode)
GET  POST /api/votes/peer    — Peer-Review-Votes
```

**POST /api/votes/fan Body:**
```json
{
  "userId": "user-abc123",
  "votes": [
    { "trackId": "track-1", "votes": 3, "creditsSpent": 9 },
    { "trackId": "track-2", "votes": 2, "creditsSpent": 4 }
  ]
}
```

#### Transparenz & Sicherheit

```
GET  POST /api/transparency  — Transparenz-Log
GET  PUT  /api/bot-detection — Bot-Detection-Alerts
GET       /api/categories    — Kategorie-Definitionen
GET       /api/ai-prediction?bandId=X — KI-Prediction
GET       /api/spotify?bandId=X       — Spotify-Daten
```

---

## 14. Fehlerbehebung

### „Votes können nicht eingereicht werden"

**Ursache:** Budget überschritten (> 100 Credits)
**Lösung:** Stimmen reduzieren oder auf „Alle zurücksetzen" klicken

### „DJ-Zugang nicht verfügbar"

**Ursache:** KYC noch nicht abgeschlossen
**Lösung:** E-Mail-Bestätigung abwarten (2–5 Werktage)

### „Build schlägt fehl"

```bash
# TypeScript-Fehler prüfen
npx tsc --noEmit

# Abhängigkeiten neu installieren
rm -rf node_modules && npm install

# Tests isoliert prüfen
npm test
```

### „In-Memory-Store verliert Daten nach Reload"

**Ursache:** Jeder Cold-Start eines Vercel-Serverless-Instances initialisiert den Store neu
**Lösung:** Vercel KV (Redis) als persistenten Datenspeicher einbinden

### „Spotify-API gibt keine Daten zurück"

**Ursache:** `SPOTIFY_CLIENT_ID` und `SPOTIFY_CLIENT_SECRET` sind nicht gesetzt
**Lösung:** Umgebungsvariablen in Vercel setzen (siehe `.env.example`)

---

*darkTunes Charts — Fair · Transparent · Innovativ*
*© 2026 darkTunes. MIT-Lizenz.*
