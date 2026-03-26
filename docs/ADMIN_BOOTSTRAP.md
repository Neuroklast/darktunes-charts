# Admin-Bootstrap — Erstes Admin-Konto einrichten

> **Sicherheitshinweis:** Admin-Konten können auf DarkTunes Charts **niemals** über den
> öffentlichen Registrierungsprozess oder einen standardisierten OAuth-Ablauf erstellt
> werden. Diese Einschränkung ist architektonisch beabsichtigt: Ein externer Anbieter
> (Spotify, Google, …) liefert nur eine verifizierte Identität, aber keine
> Plattform-spezifischen Berechtigungen. Das erste Admin-Konto erfordert einen einmaligen,
> manuellen Eingriff direkt in der Datenbank — danach kann das Admin-Dashboard genutzt
> werden, um weiteren Nutzern Rollen zuzuweisen.

---

## Schritt 1 — Mit OAuth einloggen

Melde dich mit dem gewünschten Admin-Konto über den regulären OAuth-Login
(z. B. Spotify oder Google) in der Anwendung an.

Supabase legt dadurch automatisch einen Standard-Benutzer **ohne** erweiterte
Berechtigungen an. Dein Profil wird in der Tabelle `public.users` mit der Standardrolle
`fan` gespeichert.

---

## Schritt 2 — Supabase Dashboard öffnen

Öffne das [Supabase Dashboard](https://app.supabase.com) und wähle dein Projekt aus.

---

## Schritt 3a — Rolle über den Table Editor ändern

1. Navigiere im linken Menü zu **Table Editor**.
2. Öffne die Tabelle **`users`** (unter dem Schema `public`).
3. Suche deinen Eintrag anhand der E-Mail-Adresse.
4. Klicke auf den Wert in der Spalte **`role`** und ändere ihn auf `admin`.
5. Speichere die Änderung.

---

## Schritt 3b — Alternativ: SQL Editor

Führe folgenden Befehl im **SQL Editor** von Supabase aus:

```sql
UPDATE public.users
SET role = 'ADMIN'
WHERE email = 'deine@email.de';
```

> Ersetze `deine@email.de` durch die E-Mail-Adresse des gewünschten Admin-Kontos.  
> Stelle sicher, dass du den korrekten Wert für die `role`-Enum verwendest
> (in Prisma: `ADMIN` in Großbuchstaben).

Nach Ausführung des Befehls sollte der Query `UPDATE 1` zurückgeben. Gibt er `UPDATE 0`
zurück, ist die E-Mail-Adresse nicht vorhanden — der OAuth-Login aus Schritt 1 war
möglicherweise nicht erfolgreich.

---

## Schritt 4 — Verifizierung

Logge dich aus und erneut ein. Die Anwendung liest die Rolle beim Login aus der Datenbank.
Das Admin-Dashboard unter `/admin` sollte nun zugänglich sein.

---

## Schritt 5 — Weitere Admins und Rollen via Dashboard vergeben

Sobald das erste Admin-Konto existiert, ist kein weiterer direkter Datenbankeingriff mehr
erforderlich. Im Admin-Dashboard (`/admin/users`) kannst du:

- Nutzern per Klick neue Rollen zuweisen (`fan`, `band`, `dj`, `editor`, `admin`, `ar`, `label`)
- DJ-Konten nach KYC-Prüfung als `isDJVerified = true` markieren
- Label-Vollmachten (`LabelBandMandate`) genehmigen oder widerrufen

---

## Sicherheitshinweise

| Regel | Begründung |
|---|---|
| Admin-Erstellung nur via direktem DB-Eingriff | Verhindert Privilege-Escalation durch kompromittierte OAuth-Tokens |
| Kein `ADMIN`-Wert in `user_metadata` von Supabase | Supabase `user_metadata` ist client-seitig schreibbar — niemals für Rollen nutzen |
| Rollenvergabe nur durch existierende Admins | Ensures least-privilege — nur wer bereits Admin ist, kann Admins ernennen |
| SQL-Eingriff nur via Supabase Dashboard (nicht lokal) | Verhindert versehentliche Produktions-Datenbank-Änderungen aus der lokalen Umgebung |

---

## Troubleshooting

**`UPDATE 0` — kein Datensatz aktualisiert**  
→ Der Nutzer hat sich noch nicht eingeloggt. Führe zuerst Schritt 1 aus.

**Rolle wird nach Login nicht erkannt**  
→ Stelle sicher, dass der Enum-Wert `ADMIN` (Großbuchstaben) korrekt eingetragen ist,
da Prisma Enums groß schreibt.

**Kein Zugriff auf `/admin` trotz korrekter Rolle**  
→ Überprüfe, ob die Middleware-Route-Guards `/admin` als protected path behandelt.
Siehe `src/middleware.ts` → `PROTECTED_PREFIXES`.

---

*Dieses Dokument beschreibt das einmalige Bootstrap-Verfahren. Weitere Verwaltung
erfolgt ausschließlich über das Admin-Dashboard.*
