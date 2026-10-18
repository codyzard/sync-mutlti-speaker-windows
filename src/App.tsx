import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  Check,
  Minimize2,
  Clock,
  Speaker,
  Settings,
  Bookmark,
  Layers,
  ExternalLink,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Plus,
  Monitor,
  Bluetooth,
  Globe,
  GripVertical,
  ArrowUpToLine,
  RotateCcw,
} from 'lucide-react';
import { AppSettings, EngineState, SpeakerDevice } from './types';
import { Language, translations } from './i18n';

type ActiveTab = 'mixer' | 'devices' | 'presets' | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mixer');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [state, setState] = useState<EngineState>({
    type: 'state',
    routingEnabled: true,
    volumeSyncEnabled: true,
    bufferMs: 45,
    autoFailover: true,
    autoReconnect: true,
    masterDeviceId: '',
    devices: [],
    presets: [],
    settings: {
      language: 'vi',
      deviceOrder: [],
      launchAtStartup: false,
      startMinimized: false,
      closeToTray: true,
      bufferMs: 45,
      autoFailover: true,
      autoReconnect: true,
      showHiddenDevices: false,
    },
  });

  const lang: Language = state.settings?.language === 'en' ? 'en' : 'vi';
  const t = translations[lang];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const unsubState = window.audioApi.onStateUpdate((newState) => {
      setState(newState);
    });
    const unsubErr = window.audioApi.onError((msg) => {
      showToast(msg);
    });
    window.audioApi.refreshDevices();

    return () => {
      unsubState();
      unsubErr();
    };
  }, []);

  const masterDevice: SpeakerDevice | undefined =
    state.devices.find((d) => d.isMaster) || state.devices[0];

  const activeOutputCount = state.devices.filter(
    (d) => d.connected !== false && (d.isMaster || d.enabled)
  ).length;

  const handleMasterVolumeChange = (val: number) => {
    window.audioApi.setMasterVolume(val);
  };

  const handleToggleMasterMute = () => {
    if (!masterDevice) return;
    window.audioApi.setMasterMute(!masterDevice.muted);
  };

  const handleSpeakerConfig = (
    dev: SpeakerDevice,
    patch: Partial<{
      customLabel: string;
      hidden: boolean;
      enabled: boolean;
      trimRatio: number;
      delayMs: number;
      balance: number;
    }>
  ) => {
    window.audioApi.configSpeaker({
      id: dev.id,
      name: dev.name,
      customLabel: patch.customLabel !== undefined ? patch.customLabel : dev.customLabel,
      hidden: patch.hidden !== undefined ? patch.hidden : dev.hidden,
      enabled: patch.enabled !== undefined ? patch.enabled : dev.enabled,
      trimRatio: patch.trimRatio !== undefined ? patch.trimRatio : dev.trimRatio,
      delayMs: patch.delayMs !== undefined ? patch.delayMs : dev.delayMs,
      balance: patch.balance !== undefined ? patch.balance : dev.balance,
    });
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    window.audioApi.updateAppSettings(patch);
  };

  const handleReorderDevices = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const currentList = [...state.devices];
    const fromIndex = currentList.findIndex((d) => d.id === sourceId);
    const toIndex = currentList.findIndex((d) => d.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);
    const newOrder = currentList.map((d) => d.id);

    // Optimistic UI update
    setState((prev) => ({
      ...prev,
      devices: currentList,
      settings: {
        ...prev.settings,
        deviceOrder: newOrder,
      },
    }));
    handleUpdateSettings({ deviceOrder: newOrder });
  };

  const handlePinToTop = (deviceId: string) => {
    const currentList = [...state.devices];
    const idx = currentList.findIndex((d) => d.id === deviceId);
    if (idx <= 0) return;

    const [moved] = currentList.splice(idx, 1);
    currentList.unshift(moved);
    const newOrder = currentList.map((d) => d.id);

    setState((prev) => ({
      ...prev,
      devices: currentList,
      settings: {
        ...prev.settings,
        deviceOrder: newOrder,
      },
    }));
    handleUpdateSettings({ deviceOrder: newOrder });
    showToast(t.toastOrderUpdated);
  };

  const handleResetOrder = () => {
    handleUpdateSettings({ deviceOrder: [] });
    window.audioApi.refreshDevices();
    showToast(t.toastOrderUpdated);
  };

  const preventSliderDrag = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const filteredDevices = state.devices.filter((d) => {
    if (!state.settings?.showHiddenDevices && d.hidden && activeTab === 'mixer') {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.customLabel && d.customLabel.toLowerCase().includes(q))
    );
  });

  const hasCustomOrder = Boolean(
    state.settings?.deviceOrder && state.settings.deviceOrder.length > 0
  );

  return (
    <div className="desktop-layout">
      {/* Left Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e06d3b"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 5v14" />
              </svg>
            </div>
            <div>
              <h1>{t.appName}</h1>
              <span>{t.appSubtitle}</span>
            </div>
          </div>

          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === 'mixer' ? 'active' : ''}`}
              onClick={() => setActiveTab('mixer')}
            >
              <span className="nav-item-left">
                <Sliders size={16} />
                {t.navMixer}
              </span>
              <span className="nav-count">{activeOutputCount}</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`}
              onClick={() => setActiveTab('devices')}
            >
              <span className="nav-item-left">
                <Layers size={16} />
                {t.navDevices}
              </span>
              <span className="nav-count">{state.devices.length}</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              <span className="nav-item-left">
                <Bookmark size={16} />
                {t.navPresets}
              </span>
              <span className="nav-count">{state.presets?.length || 0}</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="nav-item-left">
                <Settings size={16} />
                {t.navSettings}
              </span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="engine-status-card">
            <div className="status-line">
              <span>{t.engineStatus}</span>
              <strong style={{ color: state.routingEnabled ? '#3b9b6d' : '#d4943a' }}>
                {state.routingEnabled ? t.statusRunning : t.statusPaused}
              </strong>
            </div>
            <div className="status-line">
              <span>{t.activeOutputs}</span>
              <strong style={{ color: '#e06d3b' }}>
                {activeOutputCount} {t.devicesUnit}
              </strong>
            </div>
            <div className="status-line">
              <span>{t.bufferLatency}</span>
              <strong>{state.settings?.bufferMs ?? 45} ms</strong>
            </div>
          </div>

          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => window.audioApi.minimizeToTray()}
          >
            <Minimize2 size={14} />
            {t.minimizeToTray}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          <div className="page-title">
            {activeTab === 'mixer' && (
              <>
                <h2>{t.mixerTitle}</h2>
                <p>{t.mixerDesc}</p>
              </>
            )}
            {activeTab === 'devices' && (
              <>
                <h2>{t.devicesTitle}</h2>
                <p>{t.devicesDesc}</p>
              </>
            )}
            {activeTab === 'presets' && (
              <>
                <h2>{t.presetsTitle}</h2>
                <p>{t.presetsDesc}</p>
              </>
            )}
            {activeTab === 'settings' && (
              <>
                <h2>{t.settingsTitle}</h2>
                <p>{t.settingsDesc}</p>
              </>
            )}
          </div>

          <div className="header-actions">
            <div className="lang-switcher" title={t.languageTitle}>
              <button
                className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => handleUpdateSettings({ language: 'vi' })}
              >
                VI
              </button>
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleUpdateSettings({ language: 'en' })}
              >
                EN
              </button>
            </div>

            <button className="btn" onClick={() => window.audioApi.refreshDevices()}>
              <RefreshCw size={14} />
              {t.rescanBtn}
            </button>
            <button
              className="btn"
              onClick={() => window.audioApi.openWindowsSoundControl('playback')}
            >
              <ExternalLink size={14} />
              {t.winSoundBtn}
            </button>
          </div>
        </header>

        {toastMsg && <div className="toast-banner">{toastMsg}</div>}

        {/* TAB 1: MIXER */}
        {activeTab === 'mixer' && (
          <>
            <section className="master-panel">
              <div className="master-top">
                <div className="master-info">
                  <span className="badge-master">{t.masterBadge}</span>
                  <select
                    className="master-select"
                    value={masterDevice?.id || ''}
                    onChange={(e) => window.audioApi.setDefaultDevice(e.target.value)}
                  >
                    {state.devices
                      .filter((d) => d.connected !== false)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.customLabel ? `${d.customLabel} (${d.name})` : d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="toggles-group">
                  <div
                    className={`toggle-pill ${state.routingEnabled ? 'active' : ''}`}
                    onClick={() => window.audioApi.setRoutingEnabled(!state.routingEnabled)}
                  >
                    <span className={`status-dot ${state.routingEnabled ? 'on' : ''}`} />
                    <span>{t.multiOutputToggle}</span>
                  </div>

                  <div
                    className={`toggle-pill ${state.volumeSyncEnabled ? 'active' : ''}`}
                    onClick={() => window.audioApi.setVolumeSyncEnabled(!state.volumeSyncEnabled)}
                  >
                    <span className={`status-dot ${state.volumeSyncEnabled ? 'on' : ''}`} />
                    <span>{t.mouseVolSyncToggle}</span>
                  </div>
                </div>
              </div>

              {masterDevice && (
                <div className="master-volume-row">
                  <button
                    className={`mute-btn ${masterDevice.muted ? 'muted' : ''}`}
                    onClick={handleToggleMasterMute}
                    title={t.muteTooltip}
                  >
                    {masterDevice.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  <div className="slider-wrapper">
                    <div className="slider-labels">
                      <span>{t.masterVolLabel}</span>
                      <span>
                        {t.signalPeak}: {Math.round(masterDevice.peak * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={masterDevice.volume}
                      onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                    />
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{ width: `${Math.min(100, Math.round(masterDevice.peak * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="vol-number">{Math.round(masterDevice.volume * 100)}%</div>
                </div>
              )}
            </section>

            {/* Filter & Quick Actions Bar */}
            <div className="filter-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="drag-hint-badge">
                  <GripVertical size={13} color="#e06d3b" />
                  {t.dragHint}
                </span>
                {hasCustomOrder && (
                  <button className="btn btn-sm" onClick={handleResetOrder}>
                    <RotateCcw size={12} />
                    {t.resetOrderBtn}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label
                  style={{
                    fontSize: '0.78rem',
                    color: '#9e9c94',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.showHiddenDevices)}
                    onChange={(e) =>
                      handleUpdateSettings({ showHiddenDevices: e.target.checked })
                    }
                  />
                  {t.showHiddenLabel}
                </label>
              </div>
            </div>

            {/* Speaker Cards Grid (Drag & Drop Enabled) */}
            <section className="speakers-grid">
              {filteredDevices.map((dev, idx) => {
                const isConnected = dev.connected !== false;
                const isOutputActive = isConnected && (dev.isMaster || dev.enabled);
                const displayName = dev.customLabel || dev.name;
                const isDragging = draggedId === dev.id;
                const isDragOver = dragOverId === dev.id && draggedId !== dev.id;

                return (
                  <div
                    key={dev.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedId(dev.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', dev.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverId !== dev.id) {
                        setDragOverId(dev.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverId === dev.id) {
                        setDragOverId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const srcId = draggedId || e.dataTransfer.getData('text/plain');
                      if (srcId && srcId !== dev.id) {
                        handleReorderDevices(srcId, dev.id);
                      }
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    className={`speaker-card ${dev.isMaster ? 'master-card' : ''} ${
                      !dev.isMaster && dev.enabled && isConnected ? 'active' : ''
                    } ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    style={!isConnected ? { opacity: 0.65, borderStyle: 'dashed' } : undefined}
                  >
                    <div className="card-header">
                      <div className="card-header-left">
                        <div className="drag-controls">
                          <span className="drag-handle" title={t.dragHint}>
                            <GripVertical size={14} />
                          </span>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="pin-top-btn"
                              title={t.pinToTopTooltip}
                              onClick={() => handlePinToTop(dev.id)}
                            >
                              <ArrowUpToLine size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div className="speaker-name">{displayName}</div>
                          {dev.customLabel && <div className="speaker-hw-name">{dev.name}</div>}
                          <div className="speaker-tags">
                            {!isConnected ? (
                              <span className="tag offline-tag">{t.tagDisconnected}</span>
                            ) : dev.isMaster ? (
                              <span className="tag master-tag">{t.tagMaster}</span>
                            ) : dev.enabled ? (
                              <span className="tag sync-on">{t.tagSynced}</span>
                            ) : (
                              <span className="tag">{t.tagIdle}</span>
                            )}
                            {dev.hidden && <span className="tag">{t.tagHidden}</span>}
                          </div>
                        </div>
                      </div>

                      {!dev.isMaster ? (
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={dev.enabled}
                            onChange={(e) => handleSpeakerConfig(dev, { enabled: e.target.checked })}
                          />
                          <span className="switch-slider" />
                        </label>
                      ) : (
                        <span
                          className="badge-master"
                          style={{ fontSize: '0.64rem', padding: '3px 7px' }}
                        >
                          MASTER
                        </span>
                      )}
                    </div>

                    <div className="control-block">
                      <div className="control-row-label">
                        <span>{t.winVolumeLabel}</span>
                        <strong>{Math.round(dev.volume * 100)}%</strong>
                      </div>
                      <input
                        type="range"
                        draggable
                        onDragStart={preventSliderDrag}
                        min={0}
                        max={1}
                        step={0.01}
                        disabled={!isConnected}
                        value={dev.volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (dev.isMaster) {
                            handleMasterVolumeChange(v);
                          } else {
                            window.audioApi.setDeviceVolume(dev.id, v);
                          }
                        }}
                      />
                      <div className="meter-track">
                        <div
                          className="meter-fill"
                          style={{ width: `${Math.min(100, Math.round(dev.peak * 100))}%` }}
                        />
                      </div>
                    </div>

                    {!dev.isMaster && (
                      <>
                        <div className="control-block">
                          <div className="control-row-label">
                            <span>{t.trimRatioLabel}</span>
                            <strong>{Math.round(dev.trimRatio * 100)}%</strong>
                          </div>
                          <input
                            type="range"
                            draggable
                            onDragStart={preventSliderDrag}
                            min={0.1}
                            max={2.0}
                            step={0.05}
                            value={dev.trimRatio}
                            onChange={(e) =>
                              handleSpeakerConfig(dev, { trimRatio: parseFloat(e.target.value) })
                            }
                          />
                        </div>

                        <div className="control-block">
                          <div className="control-row-label">
                            <span>
                              <Clock size={11} style={{ display: 'inline', marginRight: 5 }} />
                              {t.delayCompLabel}
                            </span>
                            <strong>{dev.delayMs} ms</strong>
                          </div>
                          <input
                            type="range"
                            draggable
                            onDragStart={preventSliderDrag}
                            min={0}
                            max={350}
                            step={5}
                            value={dev.delayMs}
                            onChange={(e) =>
                              handleSpeakerConfig(dev, { delayMs: parseInt(e.target.value, 10) })
                            }
                          />
                        </div>

                        <div className="control-block">
                          <div className="control-row-label">
                            <span>{t.balanceLabel}</span>
                            <strong>
                              {dev.balance === 0
                                ? t.balanceCenter
                                : dev.balance < 0
                                ? `L ${Math.round(Math.abs(dev.balance) * 100)}%`
                                : `R ${Math.round(dev.balance * 100)}%`}
                            </strong>
                          </div>
                          <input
                            type="range"
                            draggable
                            onDragStart={preventSliderDrag}
                            min={-1}
                            max={1}
                            step={0.05}
                            value={dev.balance}
                            onChange={(e) =>
                              handleSpeakerConfig(dev, { balance: parseFloat(e.target.value) })
                            }
                          />
                        </div>
                      </>
                    )}

                    <div className="card-footer">
                      <span
                        style={{
                          fontSize: '0.73rem',
                          color: isOutputActive ? '#3b9b6d' : '#686660',
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <Speaker size={13} />
                        {isOutputActive ? t.statusStreaming : t.statusStandby}
                      </span>

                      {!dev.isMaster && isConnected ? (
                        <button
                          className="btn btn-sm"
                          onClick={() => window.audioApi.setDefaultDevice(dev.id)}
                        >
                          {t.setAsMasterBtn}
                        </button>
                      ) : dev.isMaster ? (
                        <span
                          style={{
                            fontSize: '0.73rem',
                            color: '#e06d3b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          <Check size={13} /> {t.winDefaultLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* TAB 2: OUTPUT DEVICE MANAGER (Also Drag & Drop Enabled) */}
        {activeTab === 'devices' && (
          <section className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                <Layers size={16} />
                {t.allDevicesHeading} ({state.devices.length})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="drag-hint-badge">
                  <GripVertical size={13} color="#e06d3b" />
                  {t.dragHint}
                </span>
                {hasCustomOrder && (
                  <button className="btn btn-sm" onClick={handleResetOrder}>
                    <RotateCcw size={12} />
                    {t.resetOrderBtn}
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#9e9c94' }}>{t.allDevicesSub}</p>

            {state.devices.map((dev, idx) => {
              const isDragging = draggedId === dev.id;
              const isDragOver = dragOverId === dev.id && draggedId !== dev.id;

              return (
                <div
                  key={dev.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedId(dev.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', dev.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverId !== dev.id) {
                      setDragOverId(dev.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === dev.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const srcId = draggedId || e.dataTransfer.getData('text/plain');
                    if (srcId && srcId !== dev.id) {
                      handleReorderDevices(srcId, dev.id);
                    }
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={`setting-row ${isDragging ? 'dragging' : ''} ${
                    isDragOver ? 'drag-over' : ''
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <span className="drag-handle" title={t.dragHint}>
                      <GripVertical size={15} />
                    </span>

                    <div className="setting-info" style={{ flex: 1 }}>
                      <h4>
                        {dev.customLabel ? `${dev.customLabel} ` : ''}
                        <span style={{ color: '#9e9c94', fontWeight: 400 }}>{dev.name}</span>
                      </h4>
                      <p>
                        ID: {dev.id} • {t.statusLabel}:{' '}
                        {dev.connected === false
                          ? t.tagDisconnected
                          : dev.isMaster
                          ? t.tagMaster
                          : dev.enabled
                          ? t.tagSynced
                          : t.tagIdle}
                      </p>

                      {editingId === dev.id && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input
                            type="text"
                            className="search-input"
                            placeholder={t.renamePlaceholder}
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              handleSpeakerConfig(dev, { customLabel: editingLabel.trim() });
                              setEditingId(null);
                              showToast(t.toastSavedName);
                            }}
                          >
                            {t.saveBtn}
                          </button>
                          <button className="btn btn-sm" onClick={() => setEditingId(null)}>
                            {t.cancelBtn}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {idx > 0 && (
                      <button
                        className="btn btn-sm"
                        title={t.pinToTopTooltip}
                        onClick={() => handlePinToTop(dev.id)}
                      >
                        <ArrowUpToLine size={13} />
                        {t.pinToTopBtn}
                      </button>
                    )}

                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setEditingId(dev.id);
                        setEditingLabel(dev.customLabel || '');
                      }}
                    >
                      <Edit3 size={13} />
                      {t.renameBtn}
                    </button>

                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        handleSpeakerConfig(dev, { hidden: !dev.hidden });
                        showToast(!dev.hidden ? t.toastHidden : t.toastShown);
                      }}
                    >
                      {dev.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      {dev.hidden ? t.unhideBtn : t.hideBtn}
                    </button>

                    {!dev.isMaster && dev.connected !== false && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => window.audioApi.setDefaultDevice(dev.id)}
                      >
                        {t.makeMasterBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* TAB 3: PRESETS */}
        {activeTab === 'presets' && (
          <>
            <section className="settings-section">
              <h3>
                <Plus size={16} />
                {t.newPresetHeading}
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ flex: 1 }}
                  placeholder={t.newPresetPlaceholder}
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    if (!newPresetName.trim()) return;
                    window.audioApi.savePreset(newPresetName.trim());
                    setNewPresetName('');
                    showToast(t.toastPresetSaved);
                  }}
                >
                  <Bookmark size={14} />
                  {t.savePresetBtn}
                </button>
              </div>
            </section>

            <section className="preset-grid">
              {(!state.presets || state.presets.length === 0) && (
                <div className="settings-section" style={{ gridColumn: '1 / -1' }}>
                  <p style={{ color: '#9e9c94', fontSize: '0.84rem' }}>{t.noPresetsText}</p>
                </div>
              )}

              {state.presets?.map((preset) => {
                const enabledList = Object.entries(preset.speakers).filter(
                  ([, cfg]) => cfg.enabled
                );
                return (
                  <div key={preset.id} className="preset-card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '0.94rem', color: '#f2f0eb' }}>
                        {preset.name}
                      </strong>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => window.audioApi.deletePreset(preset.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: '0.76rem',
                        color: '#9e9c94',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {t.presetDevicesCount}: {enabledList.length}
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 'auto', justifyContent: 'center' }}
                      onClick={() => {
                        window.audioApi.applyPreset(preset.id);
                        showToast(`${t.toastPresetApplied}${preset.name}`);
                      }}
                    >
                      {t.applyPresetBtn}
                    </button>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <>
            <section className="settings-section">
              <h3>
                <Globe size={16} />
                {t.languageTitle}
              </h3>
              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.languageTitle}</h4>
                  <p>{t.languageDesc}</p>
                </div>
                <div className="lang-switcher">
                  <button
                    className={`lang-btn ${lang === 'vi' ? 'active' : ''}`}
                    onClick={() => handleUpdateSettings({ language: 'vi' })}
                  >
                    Tiếng Việt (VI)
                  </button>
                  <button
                    className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => handleUpdateSettings({ language: 'en' })}
                  >
                    English (EN)
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h3>
                <Bluetooth size={16} />
                {t.engineSectionTitle}
              </h3>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.autoFailoverTitle}</h4>
                  <p>{t.autoFailoverDesc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.autoFailover)}
                    onChange={(e) => handleUpdateSettings({ autoFailover: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.autoReconnectTitle}</h4>
                  <p>{t.autoReconnectDesc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.autoReconnect)}
                    onChange={(e) => handleUpdateSettings({ autoReconnect: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info" style={{ flex: 1 }}>
                  <h4>
                    {t.bufferSizeTitle}:{' '}
                    <span style={{ color: '#e06d3b', fontFamily: "'JetBrains Mono', monospace" }}>
                      {state.settings?.bufferMs ?? 45} ms
                    </span>
                  </h4>
                  <p>{t.bufferSizeDesc}</p>
                </div>
                <div style={{ width: 220 }}>
                  <input
                    type="range"
                    min={20}
                    max={150}
                    step={5}
                    value={state.settings?.bufferMs ?? 45}
                    onChange={(e) =>
                      handleUpdateSettings({ bufferMs: parseInt(e.target.value, 10) })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h3>
                <Monitor size={16} />
                {t.desktopSectionTitle}
              </h3>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.startupTitle}</h4>
                  <p>{t.startupDesc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.launchAtStartup)}
                    onChange={(e) => handleUpdateSettings({ launchAtStartup: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.closeToTrayTitle}</h4>
                  <p>{t.closeToTrayDesc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.closeToTray)}
                    onChange={(e) => handleUpdateSettings({ closeToTray: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.startMinTitle}</h4>
                  <p>{t.startMinDesc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings?.startMinimized)}
                    onChange={(e) => handleUpdateSettings({ startMinimized: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.shortcutTitle}</h4>
                  <p>{t.shortcutDesc}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    const ok = await window.audioApi.createDesktopShortcut();
                    showToast(ok ? t.toastShortcutOk : t.toastShortcutErr);
                  }}
                >
                  {t.shortcutBtn}
                </button>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>{t.winToolsTitle}</h4>
                  <p>{t.winToolsDesc}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => window.audioApi.openWindowsSoundControl('bluetooth')}
                  >
                    {t.btSettingsBtn}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => window.audioApi.openWindowsSoundControl('mixer')}
                  >
                    {t.volMixerBtn}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => window.audioApi.openWindowsSoundControl('playback')}
                  >
                    {t.soundCplBtn}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
