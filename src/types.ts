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

declare global {
  interface Window {
    audioApi: {
      onStateUpdate: (callback: (state: EngineState) => void) => () => void;
      onError: (callback: (msg: string) => void) => () => void;
      refreshDevices: () => Promise<void>;
      setMasterVolume: (vol: number) => Promise<void>;
      setMasterMute: (mute: boolean) => Promise<void>;
      setRoutingEnabled: (enabled: boolean) => Promise<void>;
      setVolumeSyncEnabled: (enabled: boolean) => Promise<void>;
      setDefaultDevice: (deviceId: string) => Promise<void>;
      setDeviceVolume: (deviceId: string, vol: number) => Promise<void>;
      configSpeaker: (config: {
        id: string;
        name?: string;
        customLabel?: string;
        hidden?: boolean;
        enabled: boolean;
        trimRatio: number;
        delayMs: number;
        balance: number;
      }) => Promise<void>;
      savePreset: (name: string) => Promise<void>;
      applyPreset: (presetId: string) => Promise<void>;
      deletePreset: (presetId: string) => Promise<void>;
      updateAppSettings: (patch: Partial<AppSettings>) => Promise<void>;
      openWindowsSoundControl: (tab?: 'playback' | 'mixer' | 'bluetooth') => Promise<void>;
      createDesktopShortcut: () => Promise<boolean>;
      minimizeToTray: () => Promise<void>;
    };
  }
}
