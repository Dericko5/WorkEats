require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

// ─── Config ───────────────────────────────────────────────────────────────────

// When launched from Electron, WORKEATS_CONFIG_PATH and WORKEATS_API_KEY are set.
// When run standalone (npm run start:server), read from .env or .workeats-config.json.

const CONFIG_PATH =
  process.env.WORKEATS_CONFIG_PATH ||
  path.join(process.cwd(), '.workeats-config.json');

let apiKey = process.env.WORKEATS_API_KEY || process.env.GOOGLE_API_KEY || '';

function loadConfigFromFile() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (cfg.apiKey) apiKey = cfg.apiKey;
    }
  } catch (_) {}
}

function saveConfigToFile(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

loadConfigFromFile();

// ─── Local IP ─────────────────────────────────────────────────────────────────

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Serve built React app (only in production)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ─── API routes ───────────────────────────────────────────────────────────────

// Config: check / save API key
app.get('/api/config', (req, res) => {
  res.json({ hasApiKey: !!apiKey });
});

app.post('/api/config', (req, res) => {
  const { apiKey: key } = req.body;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'apiKey is required' });
  }
  apiKey = key.trim();
  saveConfigToFile({ apiKey });
  res.json({ ok: true });
});

// Geocode: zip/city → { lat, lng }
app.get('/api/geocode', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address is required' });
  if (!apiKey) return res.status(401).json({ error: 'no_api_key' });

  try {
    const { data } = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { params: { address, key: apiKey } }
    );
    if (data.status !== 'OK') {
      return res.status(400).json({ error: data.status, details: data.error_message });
    }
    const { lat, lng } = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;
    res.json({ lat, lng, formattedAddress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restaurants: lat/lng → array of up to 60 nearby restaurants (3 pages)
app.get('/api/restaurants', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
  if (!apiKey) return res.status(401).json({ error: 'no_api_key' });

  const RADIUS = 8047; // 5 miles in meters
  const BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  try {
    const allResults = [];
    let pageToken = null;
    let pages = 0;

    do {
      const params = {
        location: `${lat},${lng}`,
        radius: RADIUS,
        type: 'restaurant',
        key: apiKey,
      };
      if (pageToken) {
        params.pagetoken = pageToken;
        // Google requires a short delay before using a page token
        await new Promise((r) => setTimeout(r, 1800));
      }

      const { data } = await axios.get(BASE, { params });

      if (data.status === 'ZERO_RESULTS' && pages === 0) {
        return res.json({ restaurants: [] });
      }
      if (!['OK', 'ZERO_RESULTS'].includes(data.status)) {
        return res.status(400).json({ error: data.status, details: data.error_message });
      }

      allResults.push(...(data.results || []));
      pageToken = data.next_page_token || null;
      pages++;
    } while (pageToken && pages < 3);

    // Normalize fields
    const restaurants = allResults.map((r) => ({
      place_id: r.place_id,
      name: r.name,
      vicinity: r.vicinity,
      rating: r.rating ?? null,
      user_ratings_total: r.user_ratings_total ?? 0,
      price_level: r.price_level ?? null,
      open_now: r.opening_hours?.open_now ?? null,
      photo_ref: r.photos?.[0]?.photo_reference ?? null,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    }));

    res.json({ restaurants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place photo proxy (keeps API key server-side)
app.get('/api/photo', async (req, res) => {
  const { ref, maxwidth = 400 } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });
  if (!apiKey) return res.status(401).json({ error: 'no_api_key' });

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/photo',
      {
        params: { photoreference: ref, maxwidth, key: apiKey },
        responseType: 'stream',
      }
    );
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Network info + QR code for phone access
app.get('/api/network-info', async (req, res) => {
  const ip = getLocalIP();
  // Use the actual port the server is listening on
  const port = activePort;
  const url = `http://${ip}:${port}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#f97316', light: '#0f0f13' },
    });
    res.json({ ip, port, url, qrDataUrl });
  } catch (_) {
    res.json({ ip, port, url, qrDataUrl: null });
  }
});

// SPA fallback (serve index.html for all non-API routes in production)
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

let activePort = 3000;

function createServer(port = 3000) {
  const p = parseInt(process.env.PORT || port, 10);
  activePort = p;

  const server = app.listen(p, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`\n  WorkEats server running`);
    console.log(`  Local:   http://localhost:${p}`);
    console.log(`  Network: http://${localIP}:${p}\n`);
  });

  return server;
}

module.exports = { createServer };

// Run standalone if called directly
if (require.main === module) {
  createServer(parseInt(process.env.PORT || '3000', 10));
}
