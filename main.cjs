const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

let mainWindow = null;
let storePath = null;
let windowStatePath = null;
let store = {};
let windowState = {};
let stateWriteTimer = null;

const defaults = {
  desktop: {
    transparent: false,
    backgroundAlpha: 0.92,
    alwaysOnTop: false,
    clickThrough: false,
    opacity: 1,
    viewScale: 0.85
  }
};

function deepMerge(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object') {
      out[key] = deepMerge(base[key], value);
    } else out[key] = value;
  }
  return out;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); }
  catch { return fallback; }
}
async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}
function alphaColor(alpha, rgb = '111823') {
  const a = Math.max(0, Math.min(255, Math.round(Number(alpha) * 255))).toString(16).padStart(2, '0').toUpperCase();
  return `#${a}${rgb}`;
}
function applyDesktopState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const d = store.desktop || defaults.desktop;
  try { mainWindow.setAlwaysOnTop(!!d.alwaysOnTop, d.alwaysOnTop ? 'screen-saver' : 'normal'); } catch {}
  try { mainWindow.setIgnoreMouseEvents(!!d.clickThrough, { forward: true }); } catch {}
  try { mainWindow.setOpacity(Math.max(0.25, Math.min(1, Number(d.opacity) || 1))); } catch {}
  try { mainWindow.setBackgroundColor(d.transparent ? '#00000000' : alphaColor(d.backgroundAlpha ?? 0.92)); } catch {}
  mainWindow.webContents.send('desktop:changed', d);
}
async function disableClickThrough() {
  if (!store.desktop?.clickThrough) return;
  store.desktop.clickThrough = false;
  try { await writeJson(storePath, store); }
  catch (err) { console.warn('Click-through recovery save failed', err); }
  applyDesktopState();
}
function scheduleWindowStateWrite() {
  clearTimeout(stateWriteTimer);
  stateWriteTimer = setTimeout(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    windowState.bounds = mainWindow.getBounds();
    try { await writeJson(windowStatePath, windowState); } catch (err) { console.warn('Window state save failed', err); }
  }, 200);
}

async function createWindow() {
  const bounds = windowState.bounds || {};
  mainWindow = new BrowserWindow({
    width: Number.isFinite(bounds.width) ? Math.max(900, bounds.width) : 1280,
    height: Number.isFinite(bounds.height) ? Math.max(560, bounds.height) : 720,
    x: Number.isFinite(bounds.x) ? bounds.x : undefined,
    y: Number.isFinite(bounds.y) ? bounds.y : undefined,
    minWidth: 900,
    minHeight: 520,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    backgroundColor: alphaColor(store.desktop?.backgroundAlpha ?? 0.92),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  // A click-through window cannot be clicked to turn click-through back off.
  // Keep an accessible keyboard escape hatch even if it is enabled mid-session.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape' && store.desktop?.clickThrough) {
      event.preventDefault();
      disableClickThrough();
    }
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited unexpectedly', details);
  });
  await mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('resize', scheduleWindowStateWrite);
  mainWindow.on('move', scheduleWindowStateWrite);
  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      windowState.bounds = mainWindow.getBounds();
      writeJson(windowStatePath, windowState).catch(() => {});
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  applyDesktopState();
}

app.whenReady().then(async () => {
  storePath = path.join(app.getPath('userData'), 'prototype-state.json');
  windowStatePath = path.join(app.getPath('userData'), 'window-state.json');
  store = deepMerge(defaults, await readJson(storePath, {}));
  // Never launch into an unclickable window. Click-through is session-only.
  store.desktop.clickThrough = false;
  windowState = await readJson(windowStatePath, {});

  ipcMain.handle('store:read', () => store);
  ipcMain.handle('store:write', async (_event, next) => {
    store = deepMerge(store, next || {});
    await writeJson(storePath, store);
    return store;
  });
  ipcMain.handle('desktop:get', () => store.desktop || defaults.desktop);
  ipcMain.handle('desktop:set', async (_event, patch) => {
    store.desktop = { ...(store.desktop || defaults.desktop), ...(patch || {}) };
    await writeJson(storePath, store);
    applyDesktopState();
    return store.desktop;
  });
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximizeToggle', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('window:quit', () => app.quit());
  ipcMain.handle('clipboard:writeText', (_event, text) => { clipboard.writeText(String(text ?? '')); return true; });

  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
