import { contextBridge, ipcRenderer } from 'electron';

export interface SpeakerDevice {
  id: string;
  name: string;
  customLabel?: string;
  hidden?: boolean;
  isMaster: boolean;
  connected?: boolean;
  enabled: boolean;
  volume: number;
  muted: boolean;
  peak: number;
  trimRatio: number;
  delayMs: number;
  balance: number;
}

export interface SpeakerPreset {
  id: string;
  name: string;
  masterDeviceId: string;
  speakers: Record<
    string,
    {
      name?: string;
      enabled: boolean;
      trimRatio: number;
      delayMs: number;
      balance: number;
    }
  >;
}

export interface AppSettings {
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

export interface EngineState {
  type: 'state';
  routingEnabled: boolean;
  volumeSyncEnabled: boolean;
  bufferMs: number;
  autoFailover: boolean;
  autoReconnect: boolean;
  masterDeviceId: string;
  devices: SpeakerDevice[];
  presets: SpeakerPreset[];
  settings: AppSettings;
}

contextBridge.exposeInMainWorld('audioApi', {
  onStateUpdate: (callback: (state: EngineState) => void) => {
    const handler = (_event: unknown, state: EngineState) => callback(state);
    ipcRenderer.on('audio:state', handler);
    return () => ipcRenderer.removeListener('audio:state', handler);
  },
  onError: (callback: (msg: string) => void) => {
    const handler = (_event: unknown, msg: string) => callback(msg);
    ipcRenderer.on('audio:error', handler);
    return () => ipcRenderer.removeListener('audio:error', handler);
  },
  refreshDevices: () => ipcRenderer.invoke('audio:refresh'),
  setMasterVolume: (vol: number) => ipcRenderer.invoke('audio:setMasterVolume', vol),
  setMasterMute: (mute: boolean) => ipcRenderer.invoke('audio:setMasterMute', mute),
  setRoutingEnabled: (enabled: boolean) => ipcRenderer.invoke('audio:setRouting', enabled),
  setVolumeSyncEnabled: (enabled: boolean) => ipcRenderer.invoke('audio:setVolSync', enabled),
  setDefaultDevice: (deviceId: string) => ipcRenderer.invoke('audio:setDefaultDevice', deviceId),
  setDeviceVolume: (deviceId: string, vol: number) => ipcRenderer.invoke('audio:setDeviceVolume', deviceId, vol),
  configSpeaker: (config: {
    id: string;
    name?: string;
    customLabel?: string;
    hidden?: boolean;
    enabled: boolean;
    trimRatio: number;
    delayMs: number;
    balance: number;
  }) => ipcRenderer.invoke('audio:configSpeaker', config),
  savePreset: (name: string) => ipcRenderer.invoke('audio:savePreset', name),
  applyPreset: (presetId: string) => ipcRenderer.invoke('audio:applyPreset', presetId),
  deletePreset: (presetId: string) => ipcRenderer.invoke('audio:deletePreset', presetId),
  updateAppSettings: (patch: Partial<AppSettings>) => ipcRenderer.invoke('audio:updateSettings', patch),
  openWindowsSoundControl: (tab?: 'playback' | 'mixer' | 'bluetooth') =>
    ipcRenderer.invoke('system:openSoundControl', tab),
  createDesktopShortcut: () => ipcRenderer.invoke('system:createDesktopShortcut'),
  minimizeToTray: () => ipcRenderer.invoke('window:minimizeToTray'),
});
