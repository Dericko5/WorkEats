import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

export async function checkConfig() {
  const { data } = await client.get('/config');
  return data; // { hasApiKey: bool }
}

export async function saveApiKey(apiKey) {
  const { data } = await client.post('/config', { apiKey });
  return data; // { ok: true }
}

export async function geocode(address) {
  const { data } = await client.get('/geocode', { params: { address } });
  return data; // { lat, lng, formattedAddress }
}

export async function fetchRestaurants(lat, lng) {
  const { data } = await client.get('/restaurants', { params: { lat, lng } });
  return data.restaurants; // array
}

export async function fetchNetworkInfo() {
  const { data } = await client.get('/network-info');
  return data; // { ip, port, url, qrDataUrl }
}

export function photoUrl(ref, maxwidth = 400) {
  return `/api/photo?ref=${encodeURIComponent(ref)}&maxwidth=${maxwidth}`;
}

export function mapsUrl(lat, lng, name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${lat},${lng}`;
}

export function mapsDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
