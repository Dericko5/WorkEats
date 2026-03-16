# WorkEats 🍽️

Spin the roulette. Find your next meal within 5 miles.

WorkEats searches Google Maps for restaurants near you and picks one at random using a slot-machine animation. Run it as a **Windows .exe** (or Mac/Linux equivalent) and share it with any phone on your WiFi via QR code.

---

## Quick Start

### 1. Install Node.js

Download and install [Node.js 20+](https://nodejs.org/) if you don't already have it.

### 2. Get a Google API Key (free for personal use)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (e.g. "WorkEats")
3. Go to **APIs & Services → Library** and enable:
   - **Places API**
   - **Geocoding API**
4. Go to **APIs & Services → Credentials → + Create Credentials → API Key**
5. Copy your key — you'll paste it into the app on first launch

> **Cost:** Google gives $200/month free credit. Each search costs ~$0.002. You'd need 100,000 searches/month to exceed the free tier.

### 3. Install & Run

```bash
npm install
npm run dev
```

The app opens automatically. On first run, paste your Google API key into the setup screen. It's saved locally — you won't need to enter it again.

---

## Usage

1. **Enter a zip code or city** (e.g. `90210` or `Austin, TX`)
2. Click **Find Food Near Me**
3. Click **Spin the Wheel!** — watch the slot machine spin
4. See your random restaurant pick with rating, price, and address
5. Click **Get Directions** to open Google Maps
6. Click **Reroll** to spin again — the current pick is excluded *for that spin only*, then comes back

---

## Build a Distributable .exe

```bash
npm run dist
```

This creates `release/WorkEats Setup.exe` (Windows), `release/WorkEats.dmg` (Mac), or a `.AppImage` (Linux). The installer bundles Node.js — no separate installation needed on the target machine.

---

## Run on Your Phone

1. Make sure your PC and phone are on the **same WiFi network**
2. Open WorkEats on your PC
3. Click **📱 Use on Phone** in the top-right corner
4. Scan the QR code or type the URL into your phone's browser

---

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Vite + Express + Electron) |
| `npm run build` | Build React app to `dist/` |
| `npm run dist` | Build + package as installer |
| `npm run start:server` | Run standalone server (no Electron, access via browser) |

For `npm run start:server`, create a `.env` file:
```
GOOGLE_API_KEY=your_key_here
PORT=3000
```
Then open `http://localhost:3000` in your browser.

---

## Tech Stack

- **Electron** — desktop app shell
- **React + Vite** — UI
- **Express** — local server (API proxy + static files)
- **Google Places API** — restaurant search
- **Google Geocoding API** — zip/city → coordinates
