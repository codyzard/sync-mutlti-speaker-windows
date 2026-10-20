import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process';

interface SavedSpeakerSetting {
  name?: string;
  customLabel?: string;
  hidden?: boolean;
  enabled: boolean;
  trimRatio: number;
  delayMs: number;
  balance: number;
}

interface SpeakerPreset {
  id: string;
  name: string;
  masterDeviceId: string;
  speakers: Record<string, SavedSpeakerSetting>;
}

interface AppSettings {
  language?: 'vi' | 'en';
  deviceOrder?: string[];
  launchAtStartup: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  bufferMs: number;
  autoFailover: boolean;
  autoReconnect: boolean;
  showHiddenDevices: boolean;
}

interface PersistedConfig {
  routingEnabled: boolean;
  volumeSyncEnabled: boolean;
  speakers: Record<string, SavedSpeakerSetting>;
  presets: SpeakerPreset[];
  settings: AppSettings;
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let engineProc: ChildProcessWithoutNullStreams | null = null;
let isQuitting = false;
let latestEngineRawState: Record<string, unknown> | null = null;

const configPath = path.join(app.getPath('userData'), 'speaker-sync-config.json');

const defaultSettings: AppSettings = {
  language: 'vi',
  deviceOrder: [],
  launchAtStartup: false,
  startMinimized: false,
  closeToTray: true,
  bufferMs: 45,
  autoFailover: true,
  autoReconnect: true,
  showHiddenDevices: false,
};

function loadPersistedConfig(): PersistedConfig {
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return {
        routingEnabled: raw.routingEnabled ?? true,
        volumeSyncEnabled: raw.volumeSyncEnabled ?? true,
        speakers: raw.speakers || {},
        presets: Array.isArray(raw.presets) ? raw.presets : [],
        settings: { ...defaultSettings, ...(raw.settings || {}) },
      };
    }
  } catch {
    // ignore
  }
  return {
    routingEnabled: true,
    volumeSyncEnabled: true,
    speakers: {},
    presets: [],
    settings: { ...defaultSettings },
  };
}

let persistedConfig: PersistedConfig = loadPersistedConfig();

function savePersistedConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(persistedConfig, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err && (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED')) {
    return;
  }
  console.error('Uncaught exception in main process:', err);
});

function sendEngineCommand(cmd: string) {
  if (
    !isQuitting &&
    engineProc &&
    !engineProc.killed &&
    engineProc.exitCode === null &&
    engineProc.stdin &&
    !engineProc.stdin.destroyed &&
    engineProc.stdin.writable
  ) {
    try {
      engineProc.stdin.write(cmd + '\n', () => {});
    } catch {
      // ignore EPIPE or stream errors during exit
    }
  }
}

function stopAudioEngine() {
  isQuitting = true;
  const proc = engineProc;
  engineProc = null;
  if (!proc) return;
  try {
    proc.removeAllListeners('exit');
    proc.stdin?.destroy();
    proc.stdout?.destroy();
    proc.stderr?.destroy();
    if (!proc.killed && proc.exitCode === null) {
      proc.kill();
    }
  } catch {
    // ignore errors when stopping child process
  }
}

function enrichAndSendState(rawState: Record<string, unknown>) {
  if (isQuitting || !mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
    return;
  }
  latestEngineRawState = rawState;
  const rawDevices = (rawState.devices as Array<Record<string, unknown>>) || [];
  const orderList = persistedConfig.settings.deviceOrder || [];

  const enrichedDevices = rawDevices
    .map((d, originalIdx) => {
      const id = String(d.id || '');
      const saved = persistedConfig.speakers[id];
      const orderIdx = orderList.indexOf(id);
      return {
        ...d,
        customLabel: saved?.customLabel || '',
        hidden: Boolean(saved?.hidden),
        _sortKey: orderIdx !== -1 ? orderIdx : 10000 + originalIdx,
      };
    })
    .sort((a, b) => a._sortKey - b._sortKey);

  try {
    mainWindow.webContents.send('audio:state', {
      ...rawState,
      devices: enrichedDevices,
      presets: persistedConfig.presets,
      settings: persistedConfig.settings,
    });
  } catch {
    // ignore if window closed mid-send
  }
}

function startAudioEngine() {
  if (isQuitting) return;

  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, 'bin', 'AudioEngine.exe')
    : path.join(__dirname, '..', 'bin', 'AudioEngine.exe');

  if (!fs.existsSync(exePath)) {
    console.error('AudioEngine.exe not found at:', exePath);
    return;
  }

  engineProc = spawn(exePath, [], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  engineProc.on('error', () => {});
  engineProc.stdin.on('error', () => {});
  engineProc.stdout.on('error', () => {});
  engineProc.stderr.on('error', () => {});

  let stdoutBuffer = '';
  engineProc.stdout.on('data', (chunk: Buffer) => {
    if (isQuitting) return;
    stdoutBuffer += chunk.toString('utf-8');
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === 'state') {
          enrichAndSendState(parsed);
        } else if (parsed.type === 'error') {
          if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
            mainWindow.webContents.send('audio:error', parsed.message);
          }
        }
      } catch {
        // ignore malformed json line
      }
    }
  });

  engineProc.on('exit', () => {
    if (!isQuitting) {
      setTimeout(() => startAudioEngine(), 1500);
    }
  });

  // Restore saved settings into the C# WASAPI engine
  sendEngineCommand(`SET_ROUTING|${persistedConfig.routingEnabled ? '1' : '0'}`);
  sendEngineCommand(`SET_VOL_SYNC|${persistedConfig.volumeSyncEnabled ? '1' : '0'}`);
  sendEngineCommand(
    `SET_ENGINE_SETTINGS|${persistedConfig.settings.bufferMs}|${
      persistedConfig.settings.autoFailover ? '1' : '0'
    }|${persistedConfig.settings.autoReconnect ? '1' : '0'}`
  );

  for (const [id, cfg] of Object.entries(persistedConfig.speakers)) {
    const safeName = (cfg.name || '').replace(/\|/g, ' ');
    sendEngineCommand(
      `CONFIG_SPEAKER|${id}|${cfg.enabled ? '1' : '0'}|${cfg.trimRatio.toFixed(2)}|${Math.round(
        cfg.delayMs
      )}|${cfg.balance.toFixed(2)}|${safeName}`
    );
  }

  sendEngineCommand('LIST');
}

function updateTrayMenu() {
  if (!tray) return;

  const isEn = persistedConfig.settings.language === 'en';

  const presetItems: Electron.MenuItemConstructorOptions[] =
    persistedConfig.presets.length > 0
      ? persistedConfig.presets.map((p) => ({
          label: isEn ? `Preset: ${p.name}` : `Cấu hình: ${p.name}`,
          click: () => applySpeakerPreset(p.id),
        }))
      : [
          {
            label: isEn ? '(No saved presets)' : '(Chưa có cấu hình lưu sẵn)',
            enabled: false,
          },
        ];

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isEn ? 'Open Multi-Speaker Studio' : 'Mở Windows Multi-Speaker Studio',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    ...presetItems,
    { type: 'separator' },
    {
      label: isEn
        ? 'Windows Sound Control Panel (mmsys.cpl)'
        : 'Cài đặt Âm thanh Windows (mmsys.cpl)',
      click: () => exec('control mmsys.cpl sounds'),
    },
    { type: 'separator' },
    {
      label: isEn ? 'Quit Application' : 'Thoát hoàn toàn (Quit)',
      click: () => {
        stopAudioEngine();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function getAppIconPath(): string {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'icon.ico'),
    path.join(process.resourcesPath || '', 'assets', 'icon.ico'),
    path.join(__dirname, '..', 'assets', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function syncWindowsStartupRegistry(enable: boolean) {
  const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
  const valueName = 'MultiSpeakerSyncStudio';

  if (!enable) {
    exec(`reg delete "${regKey}" /v "${valueName}" /f`, () => {});
    return;
  }

  // Prefer the packaged standalone .exe in release/Multi-Speaker Sync Studio if available
  const packagedExe = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'Multi-Speaker Sync Studio.exe'
  );
  const localReleaseExe = path.resolve(
    __dirname,
    '..',
    'release',
    'Multi-Speaker Sync Studio',
    'Multi-Speaker Sync Studio.exe'
  );

  let launchCmd = `"${process.execPath}"`;
  if (fs.existsSync(packagedExe)) {
    launchCmd = `"${packagedExe}"`;
  } else if (fs.existsSync(localReleaseExe)) {
    launchCmd = `"${localReleaseExe}"`;
  } else if (!app.isPackaged) {
    const appRoot = path.resolve(__dirname, '..');
    launchCmd = `"${process.execPath}" "${appRoot}"`;
  }

  const escapedCmd = launchCmd.replace(/"/g, '\\"');
  exec(
    `reg add "${regKey}" /v "${valueName}" /t REG_SZ /d "${escapedCmd}" /f`,
    () => {}
  );
}

function createTray() {
  const iconPath = getAppIconPath();
  let icon = iconPath ? nativeImage.createFromPath(iconPath) : null;
  if (!icon || icon.isEmpty()) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" rx="5" fill="#1c1c19" stroke="#34342f" stroke-width="1.5"/><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 5v14" stroke="#e06d3b" stroke-width="2" stroke-linecap="square"/></svg>`;
    icon = nativeImage.createFromDataURL(
      `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
    );
  }

  tray = new Tray(icon);
  tray.setToolTip('Windows Multi-Speaker Sync Studio');
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow?.show();
    }
  });
}

function applySpeakerPreset(presetId: string) {
  const preset = persistedConfig.presets.find((p) => p.id === presetId);
  if (!preset) return;

  if (preset.masterDeviceId) {
    sendEngineCommand(`SET_DEFAULT_DEVICE|${preset.masterDeviceId}`);
  }

  // Turn off all current secondary speakers first, then enable preset's speakers
  for (const [id, cur] of Object.entries(persistedConfig.speakers)) {
    cur.enabled = false;
    const safeName = (cur.name || '').replace(/\|/g, ' ');
    sendEngineCommand(
      `CONFIG_SPEAKER|${id}|0|${cur.trimRatio.toFixed(2)}|${Math.round(cur.delayMs)}|${cur.balance.toFixed(2)}|${safeName}`
    );
  }

  for (const [id, cfg] of Object.entries(preset.speakers)) {
    persistedConfig.speakers[id] = {
      ...(persistedConfig.speakers[id] || {}),
      ...cfg,
    };
    const safeName = (cfg.name || '').replace(/\|/g, ' ');
    sendEngineCommand(
      `CONFIG_SPEAKER|${id}|${cfg.enabled ? '1' : '0'}|${cfg.trimRatio.toFixed(2)}|${Math.round(
        cfg.delayMs
      )}|${cfg.balance.toFixed(2)}|${safeName}`
    );
  }

  savePersistedConfig();
  sendEngineCommand('LIST');
}

function createWindow() {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 960,
    minHeight: 650,
    title: 'Windows Multi-Speaker Sync Studio',
    icon: iconPath || undefined,
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    show: !persistedConfig.settings.startMinimized,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = 'http://localhost:5173';
  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting && persistedConfig.settings.closeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.antigravity.multispeakersyncstudio');
  persistedConfig = loadPersistedConfig();
  if (persistedConfig.settings.launchAtStartup) {
    syncWindowsStartupRegistry(true);
  }
  createTray();
  createWindow();
  startAudioEngine();

  ipcMain.handle('audio:refresh', () => {
    sendEngineCommand('LIST');
  });

  ipcMain.handle('audio:setMasterVolume', (_e, vol: number) => {
    sendEngineCommand(`SET_MASTER_VOL|${vol.toFixed(3)}`);
  });

  ipcMain.handle('audio:setMasterMute', (_e, mute: boolean) => {
    sendEngineCommand(`SET_MASTER_MUTE|${mute ? '1' : '0'}`);
  });

  ipcMain.handle('audio:setRouting', (_e, enabled: boolean) => {
    persistedConfig.routingEnabled = enabled;
    savePersistedConfig();
    sendEngineCommand(`SET_ROUTING|${enabled ? '1' : '0'}`);
  });

  ipcMain.handle('audio:setVolSync', (_e, enabled: boolean) => {
    persistedConfig.volumeSyncEnabled = enabled;
    savePersistedConfig();
    sendEngineCommand(`SET_VOL_SYNC|${enabled ? '1' : '0'}`);
  });

  ipcMain.handle('audio:setDefaultDevice', (_e, deviceId: string) => {
    if (persistedConfig.speakers[deviceId]) {
      persistedConfig.speakers[deviceId].enabled = true;
    } else {
      persistedConfig.speakers[deviceId] = {
        enabled: true,
        trimRatio: 1.0,
        delayMs: 0,
        balance: 0.0,
      };
    }
    savePersistedConfig();
    sendEngineCommand(`CONFIG_SPEAKER|${deviceId}|1|1.00|0|0.00`);
    sendEngineCommand(`SET_DEFAULT_DEVICE|${deviceId}`);
  });

  ipcMain.handle('audio:setDeviceVolume', (_e, deviceId: string, vol: number) => {
    sendEngineCommand(`SET_DEVICE_VOL|${deviceId}|${vol.toFixed(3)}`);
  });

  ipcMain.handle(
    'audio:configSpeaker',
    (
      _e,
      config: {
        id: string;
        name?: string;
        customLabel?: string;
        hidden?: boolean;
        enabled: boolean;
        trimRatio: number;
        delayMs: number;
        balance: number;
      }
    ) => {
      const prev = persistedConfig.speakers[config.id];
      const finalName = config.name || prev?.name || '';
      const finalLabel =
        config.customLabel !== undefined ? config.customLabel : prev?.customLabel || '';
      const finalHidden = config.hidden !== undefined ? config.hidden : Boolean(prev?.hidden);

      persistedConfig.speakers[config.id] = {
        name: finalName,
        customLabel: finalLabel,
        hidden: finalHidden,
        enabled: config.enabled,
        trimRatio: config.trimRatio,
        delayMs: config.delayMs,
        balance: config.balance,
      };
      savePersistedConfig();
      const safeName = finalName.replace(/\|/g, ' ');
      sendEngineCommand(
        `CONFIG_SPEAKER|${config.id}|${config.enabled ? '1' : '0'}|${config.trimRatio.toFixed(
          2
        )}|${Math.round(config.delayMs)}|${config.balance.toFixed(2)}|${safeName}`
      );
      if (latestEngineRawState) {
        enrichAndSendState(latestEngineRawState);
      }
    }
  );

  ipcMain.handle('audio:savePreset', (_e, name: string) => {
    const masterId = String(latestEngineRawState?.masterDeviceId || '');
    const preset: SpeakerPreset = {
      id: 'preset_' + Date.now(),
      name: name.trim() || 'Cấu hình Loa',
      masterDeviceId: masterId,
      speakers: JSON.parse(JSON.stringify(persistedConfig.speakers)),
    };
    persistedConfig.presets.push(preset);
    savePersistedConfig();
    updateTrayMenu();
    if (latestEngineRawState) enrichAndSendState(latestEngineRawState);
  });

  ipcMain.handle('audio:applyPreset', (_e, presetId: string) => {
    applySpeakerPreset(presetId);
  });

  ipcMain.handle('audio:deletePreset', (_e, presetId: string) => {
    persistedConfig.presets = persistedConfig.presets.filter((p) => p.id !== presetId);
    savePersistedConfig();
    updateTrayMenu();
    if (latestEngineRawState) enrichAndSendState(latestEngineRawState);
  });

  ipcMain.handle('audio:updateSettings', (_e, patch: Partial<AppSettings>) => {
    persistedConfig.settings = {
      ...persistedConfig.settings,
      ...patch,
    };
    savePersistedConfig();
    updateTrayMenu();

    if (patch.launchAtStartup !== undefined) {
      syncWindowsStartupRegistry(persistedConfig.settings.launchAtStartup);
    }

    if (
      patch.bufferMs !== undefined ||
      patch.autoFailover !== undefined ||
      patch.autoReconnect !== undefined
    ) {
      sendEngineCommand(
        `SET_ENGINE_SETTINGS|${persistedConfig.settings.bufferMs}|${
          persistedConfig.settings.autoFailover ? '1' : '0'
        }|${persistedConfig.settings.autoReconnect ? '1' : '0'}`
      );
    }

    if (latestEngineRawState) enrichAndSendState(latestEngineRawState);
  });

  ipcMain.handle('system:openSoundControl', (_e, tab?: 'playback' | 'mixer' | 'bluetooth') => {
    if (tab === 'mixer') {
      shell.openExternal('ms-settings:apps-volume');
    } else if (tab === 'bluetooth') {
      shell.openExternal('ms-settings:bluetooth');
    } else {
      exec('control mmsys.cpl sounds');
    }
  });

  ipcMain.handle('system:createDesktopShortcut', async () => {
    const projectDir = app.isPackaged
      ? path.resolve(process.resourcesPath, '..', '..')
      : path.resolve(__dirname, '..');
    const shortcutPath = path.join(projectDir, 'Multi-Speaker Sync Studio.lnk');
    const iconPath = getAppIconPath();

    const ok = shell.writeShortcutLink(shortcutPath, {
      target: process.execPath,
      cwd: path.dirname(process.execPath),
      icon: iconPath || process.execPath,
      iconIndex: 0,
      description: 'Windows Multi-Speaker Audio Router & Volume Sync Studio',
    });
    return ok;
  });

  ipcMain.handle('window:minimizeToTray', () => {
    mainWindow?.hide();
  });
});

app.on('before-quit', () => {
  stopAudioEngine();
});
