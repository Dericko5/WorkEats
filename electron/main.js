const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const isDev = process.env.ELECTRON_IS_DEV === 'true';

// In dev, load .env so GOOGLE_API_KEY can be set there for convenience
if (isDev) {
  try { require('dotenv').config(); } catch (_) {}
}
const PROD_PORT = 3000;
const DEV_API_PORT = 3001;

let mainWindow;

// ─── Config helpers ────────────────────────────────────────────────────────────

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function saveConfig(config) {
  const p = getConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
}

// ─── Express server ─────────────────────────────────────────────────────────────

function startServer(apiKey, port) {
  // Pass config path and api key to server via env vars before requiring it
  process.env.WORKEATS_API_KEY = apiKey || '';
  process.env.WORKEATS_CONFIG_PATH = getConfigPath();

  const { createServer } = require('../server/index');
  createServer(port);
}

// ─── Window ─────────────────────────────────────────────────────────────────────

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#0f0f13',
    title: 'WorkEats',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(url);

  // Open external links in default browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url: u }) => {
    shell.openExternal(u);
    return { action: 'deny' };
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  const config = loadConfig();

  if (isDev) {
    // Dev: API server on 3001, Vite dev server on 5173
    startServer(config.apiKey || process.env.GOOGLE_API_KEY || '', DEV_API_PORT);
    createWindow(`http://localhost:5173`);
  } else {
    // Prod: single server on 3000 serves both API + built React files
    startServer(config.apiKey || '', PROD_PORT);
    createWindow(`http://localhost:${PROD_PORT}`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const config = loadConfig();
    createWindow(isDev ? 'http://localhost:5173' : `http://localhost:${PROD_PORT}`);
  }
});

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('get-network-info', () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return {
          ip: iface.address,
          port: isDev ? DEV_API_PORT : PROD_PORT,
        };
      }
    }
  }
  return { ip: '127.0.0.1', port: isDev ? DEV_API_PORT : PROD_PORT };
});
