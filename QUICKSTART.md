# darkTunes Charts — Quickstart / Schnellstart

> 🇩🇪 [Deutsch](#deutsch) · 🇬🇧 [English](#english)

---

## Deutsch

### Systemvoraussetzungen

| Voraussetzung | Mindestversion |
|---|---|
| Node.js | 20.x oder höher |
| npm | 9.x oder höher |
| Git | 2.x |

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/Neuroklast/darktunes-charts.git
cd darktunes-charts

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen konfigurieren (optional für Entwicklung)
cp .env.example .env.local
# .env.local mit deinen Werten befüllen (Spotify API usw.)

# 4. Entwicklungsserver starten
npm run dev
# → http://localhost:5173
```

### Verfügbare Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten (Hot Reload) |
| `npm run build` | Produktions-Build erstellen |
| `npm test` | Alle 115 Tests ausführen |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run lint` | Code-Qualitätsprüfung |
| `npm run preview` | Build lokal vorschauen |

### Demo-Zugänge

Im Entwicklungsmodus stehen diese Demo-Accounts zur Verfügung (Passwort: `demo1234`):

| E-Mail | Rolle | Berechtigungen |
|---|---|---|
| `admin@darktunes.com` | Admin | Voller Zugriff |
| `dj@darktunes.com` | DJ | Schulze-Ballot, DJ-Dashboard |
| `band@darktunes.com` | Band | Peer-Review, Kategorie-Einreichung |
| `editor@darktunes.com` | Redakteur | Spotlights, Nominierungen |
| `fan@darktunes.com` | Fan | Quadratic Voting (100 Credits/Monat) |

### Deployment auf Vercel

```bash
# Einmalig: Vercel CLI installieren
npm install -g vercel

# Zum Projekt anmelden
vercel login

# Preview-Deployment
./vercel-deploy.sh --preview

# Produktions-Deployment
./vercel-deploy.sh
```

Vollständige Anleitung: siehe [`docs/HANDBUCH_DE.md`](./docs/HANDBUCH_DE.md)

---

## English

### System Requirements

| Requirement | Minimum Version |
|---|---|
| Node.js | 20.x or higher |
| npm | 9.x or higher |
| Git | 2.x |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Neuroklast/darktunes-charts.git
cd darktunes-charts

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for development)
cp .env.example .env.local
# Fill in your values (Spotify API etc.)

# 4. Start development server
npm run dev
# → http://localhost:5173
```

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Create production build |
| `npm test` | Run all 115 tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Code quality check |
| `npm run preview` | Preview build locally |

### Demo Accounts

These demo accounts are available in development (password: `demo1234`):

| Email | Role | Permissions |
|---|---|---|
| `admin@darktunes.com` | Admin | Full access |
| `dj@darktunes.com` | DJ | Schulze ballot, DJ dashboard |
| `band@darktunes.com` | Band | Peer review, category submission |
| `editor@darktunes.com` | Editor | Spotlights, nominations |
| `fan@darktunes.com` | Fan | Quadratic voting (100 credits/month) |

### Deploy to Vercel

```bash
# One-time: install Vercel CLI
npm install -g vercel

# Log in to your account
vercel login

# Preview deployment
./vercel-deploy.sh --preview

# Production deployment
./vercel-deploy.sh
```

Full guide: see [`docs/MANUAL_EN.md`](./docs/MANUAL_EN.md)
