# Agent Instructions für Darktunes Charts

## 1. Technologischer Stack und Basisregeln

- Nutze zwingend **Next.js**, **React**, **Supabase** und **Tailwind CSS**
- Schreibe ausschließlich funktionalen und typisierten **TypeScript** Code
- Verwende strikte Typisierung und verbiete das Schlüsselwort `any` unter allen Umständen

## 2. Architektur und Clean Code

- Behalte eine saubere Trennung der Schichten bei
- Die Benutzeroberfläche darf **keine direkte Datenbanklogik** enthalten
- Verlagere Geschäftslogik und API-Aufrufe in separate Service-Funktionen
- Halte das **Single Responsibility Principle** ein
- Jede Funktion und jede Komponente übernimmt exakt eine Aufgabe
- Schreibe kleine, fokussierte Funktionen
- Wähle **aussagekräftige Namen** für Variablen und Funktionen

## 3. Verbotene Anti-Patterns

- Vermeide **magische Strings und magische Zahlen** — extrahiere diese in zentrale Konstanten
- Erstelle **keine tief verschachtelten Kontrollstrukturen** — nutze stattdessen Guard Clauses, um frühzeitig aus Funktionen zurückzukehren
- Verzichte auf **globale Zustände**
- Baue **keine monolithischen Komponenten**
- Ignoriere **keine Fehler** — jeder `catch`-Block muss eine explizite Fehlerbehandlung enthalten

## 4. Sicherheit und Guardrails

- Logge **niemals sensible Daten** (Passwörter, Tokens, API-Secrets) in der Konsole
- Verändere **keine Datenbankschemata ohne vorherige Absprache**
- Führe **keine destruktiven Operationen** (z. B. `DROP TABLE`, `DELETE` ohne `WHERE`) aus

## 5. Testing

- Schreibe für jede neue Geschäftslogik zwingend **Unit Tests**
- Passe bestehende Tests bei jeder Code-Änderung **direkt an**
