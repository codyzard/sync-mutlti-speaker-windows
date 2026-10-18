export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    appName: 'Multi-Speaker Studio',
    appSubtitle: 'WASAPI Audio Router',
    navMixer: 'Bảng Điều Khiển (Mixer)',
    navDevices: 'Quản Lý Output',
    navPresets: 'Cấu Hình Nhanh (Presets)',
    navSettings: 'Cài Đặt Hệ Thống',
    engineStatus: 'Trạng thái Engine',
    statusRunning: 'Đang hoạt động',
    statusPaused: 'Tạm dừng',
    activeOutputs: 'Thiết bị đang phát',
    devicesUnit: 'loa',
    bufferLatency: 'Bộ đệm WASAPI',
    minimizeToTray: 'Thu nhỏ xuống Khay (Tray)',

    // Header Titles
    mixerTitle: 'Bảng Điều Khiển & Đồng Bộ Âm Thanh',
    mixerDesc:
      'Phát âm thanh đồng thời ra nhiều loa và điều chỉnh âm lượng trực tiếp từ nút Chuột / Windows Volume.',
    devicesTitle: 'Quản Lý & Tuỳ Chỉnh Thiết Bị Output',
    devicesDesc:
      'Đặt tên gợi nhớ cho từng loa, ẩn các cổng âm thanh ảo không dùng tới hoặc chọn nguồn phát chính.',
    presetsTitle: 'Tổ Hợp Loa Lưu Sẵn (Presets)',
    presetsDesc:
      'Lưu các bộ kết hợp loa khác nhau (VD: 2 Loa Bluetooth, Loa Bàn + Màn Hình) để chuyển đổi chỉ với 1 cú click.',
    settingsTitle: 'Cài Đặt Hệ Thống & WASAPI Engine',
    settingsDesc:
      'Tuỳ chỉnh khởi động cùng Windows, bộ đệm âm thanh độ trễ thấp, Bluetooth Auto-Failover và công cụ hệ thống.',

    rescanBtn: 'Quét lại Output',
    winSoundBtn: 'Windows Sound',

    // Master Panel
    masterBadge: 'NGUỒN PHÁT CHÍNH (MASTER)',
    multiOutputToggle: 'Phát Đa Loa (Multi-Output)',
    mouseVolSyncToggle: 'Đồng Bộ Volume Chuột / Windows',
    masterVolLabel: 'Âm lượng Tổng Windows (Nhận nút Forward / Back trên chuột)',
    signalPeak: 'Tín hiệu Peak',
    muteTooltip: 'Tắt / Bật tiếng toàn bộ loa',

    // Filter Bar
    searchPlaceholder: 'Tìm kiếm tên loa hoặc cổng output...',
    showHiddenLabel: 'Hiện cả các cổng Output đã ẩn',
    dragHint: 'Kéo thả thẻ loa để sắp xếp vị trí ưu tiên',
    pinToTopTooltip: 'Đưa loa này lên vị trí đầu tiên',
    pinToTopBtn: 'Đưa lên đầu',
    resetOrderBtn: 'Đặt lại thứ tự',
    toastOrderUpdated: 'Đã lưu thứ tự sắp xếp loa.',

    // Speaker Card
    tagDisconnected: 'Ngắt Bluetooth (Tự kết nối khi bật lại)',
    tagMaster: 'Loa Chính (Master Output)',
    tagSynced: 'Đang phát song song',
    tagIdle: 'Đang tắt đồng bộ',
    tagHidden: 'Đã ẩn',
    winVolumeLabel: 'Âm lượng Windows riêng',
    trimRatioLabel: 'Tỷ lệ khuếch đại theo Loa Chính (Trim)',
    delayCompLabel: 'Bù độ trễ âm thanh (Delay)',
    balanceLabel: 'Cân bằng kênh L / R',
    balanceCenter: 'Giữa (Stereo)',
    statusStreaming: 'Đang truyền tải PCM',
    statusStandby: 'Chờ kích hoạt',
    setAsMasterBtn: 'Đặt làm Loa Chính',
    winDefaultLabel: 'Mặc định Windows',

    // Devices Tab
    allDevicesHeading: 'Danh sách tất cả thiết bị Output',
    allDevicesSub:
      'Đặt tên riêng dễ nhớ cho từng loa (VD: "Loa Bluetooth Trái", "Loa Phải") hoặc ẩn các thiết bị ảo để màn hình chính gọn gàng.',
    statusLabel: 'Trạng thái',
    renamePlaceholder: 'Nhập tên gợi nhớ cho thiết bị này...',
    saveBtn: 'Lưu tên',
    cancelBtn: 'Huỷ',
    renameBtn: 'Đổi tên',
    hideBtn: 'Ẩn bớt',
    unhideBtn: 'Hiện lại',
    makeMasterBtn: 'Chọn làm Master',
    toastSavedName: 'Đã lưu tên thiết bị thành công.',
    toastHidden: 'Đã ẩn thiết bị khỏi bảng điều khiển chính.',
    toastShown: 'Đã hiển thị lại thiết bị trên bảng điều khiển.',

    // Presets Tab
    newPresetHeading: 'Lưu tổ hợp loa hiện tại thành Preset mới',
    newPresetPlaceholder: 'Nhập tên cấu hình (VD: 2 Loa Bluetooth JBL + Soundcore)...',
    savePresetBtn: 'Lưu Cấu Hình Hiện Tại',
    noPresetsText:
      'Chưa có cấu hình nào được lưu. Hãy bật các loa bạn muốn kết hợp ở tab Mixer rồi lưu lại tại đây.',
    presetDevicesCount: 'Số loa kết hợp',
    applyPresetBtn: 'Kích hoạt cấu hình này',
    toastPresetSaved: 'Đã lưu cấu hình Preset mới.',
    toastPresetApplied: 'Đã kích hoạt cấu hình: ',

    // Settings Tab
    engineSectionTitle: 'Động Cơ Âm Thanh WASAPI & Bluetooth Thông Minh',
    languageTitle: 'Ngôn ngữ giao diện (Interface Language)',
    languageDesc: 'Chuyển đổi ngôn ngữ hiển thị giữa Tiếng Việt và Tiếng Anh (English).',
    autoFailoverTitle: 'Tự động chuyển Loa Chính khi tắt 1 loa Bluetooth (Auto-Failover)',
    autoFailoverDesc:
      'Khi dùng 2 loa Bluetooth mà tắt nguồn chiếc loa đang làm Loa Chính, phần mềm tự động chuyển chiếc loa còn lại làm Loa Chính để nhạc không bị ngắt và nút chuột vẫn chỉnh được âm lượng.',
    autoReconnectTitle: 'Tự động kết nối lại khi bật nguồn loa Bluetooth (Auto-Reconnect)',
    autoReconnectDesc:
      'Khi bạn bật nguồn lại chiếc loa Bluetooth đã tắt trước đó, phần mềm tự động ghép phát nhạc trở lại trong vòng 1 giây.',
    bufferSizeTitle: 'Kích thước bộ đệm âm thanh WASAPI (Audio Buffer)',
    bufferSizeDesc:
      'Giảm xuống (20–35ms) để có độ trễ thấp nhất, hoặc tăng lên (60–100ms) nếu sóng Bluetooth yếu bị vấp tiếng.',

    desktopSectionTitle: 'Tích Hợp Hệ Điều Hành Windows & Khởi Động',
    startupTitle: 'Tự khởi động cùng Windows (Launch at Windows Startup)',
    startupDesc: 'Tự động chạy phần mềm và đồng bộ loa ngay khi bạn đăng nhập vào Windows.',
    closeToTrayTitle: 'Thu nhỏ xuống khay hệ thống khi bấm nút X (Close to System Tray)',
    closeToTrayDesc:
      'Giữ phần mềm chạy ngầm ở góc phải thanh Taskbar khi đóng cửa sổ để nút chuột luôn đồng bộ âm lượng.',
    startMinTitle: 'Khởi động ở chế độ chạy ngầm (Start Minimized in Tray)',
    startMinDesc: 'Khi mở phần mềm sẽ thu nhỏ ngay dưới khay hệ thống mà không hiện cửa sổ.',
    shortcutTitle: 'Tạo Shortcut khởi chạy nhanh trong thư mục dự án',
    shortcutDesc: 'Tạo biểu tượng "Multi-Speaker Sync Studio.lnk" kèm Icon chính thức trong thư mục dự án.',
    shortcutBtn: 'Tạo Shortcut',
    toastShortcutOk: 'Đã tạo Shortcut "Multi-Speaker Sync Studio.lnk" trong thư mục dự án.',
    toastShortcutErr: 'Không thể tạo Shortcut tự động.',
    winToolsTitle: 'Công cụ quản lý Âm thanh & Bluetooth của Windows',
    winToolsDesc: 'Mở nhanh cài đặt Bluetooth, Sound Control Panel (mmsys.cpl) hoặc Volume Mixer.',
    btSettingsBtn: 'Cài đặt Bluetooth',
    volMixerBtn: 'Volume Mixer',
    soundCplBtn: 'Sound Control Panel',
  },
  en: {
    appName: 'Multi-Speaker Studio',
    appSubtitle: 'WASAPI Audio Router',
    navMixer: 'Audio Mixer Console',
    navDevices: 'Output Devices',
    navPresets: 'Speaker Presets',
    navSettings: 'System Settings',
    engineStatus: 'Engine Status',
    statusRunning: 'Active',
    statusPaused: 'Paused',
    activeOutputs: 'Active Outputs',
    devicesUnit: 'speakers',
    bufferLatency: 'WASAPI Buffer',
    minimizeToTray: 'Minimize to System Tray',

    // Header Titles
    mixerTitle: 'Multi-Speaker Routing & Volume Sync Console',
    mixerDesc:
      'Stream audio simultaneously across multiple speakers and control hardware volume directly via Mouse buttons / Windows Volume.',
    devicesTitle: 'Output Device Management & Customization',
    devicesDesc:
      'Assign custom labels to your speakers, hide unused virtual audio endpoints, or switch the primary Master output.',
    presetsTitle: 'Saved Speaker Combinations (Presets)',
    presetsDesc:
      'Save different speaker setups (e.g., Dual Bluetooth Speakers, Desk + Monitor) and switch with a single click.',
    settingsTitle: 'System Preferences & WASAPI Engine',
    settingsDesc:
      'Configure Windows startup behavior, low-latency WASAPI buffer size, Bluetooth Auto-Failover, and OS audio utilities.',

    rescanBtn: 'Rescan Outputs',
    winSoundBtn: 'Windows Sound',

    // Master Panel
    masterBadge: 'PRIMARY OUTPUT (MASTER)',
    multiOutputToggle: 'Multi-Speaker Routing',
    mouseVolSyncToggle: 'Mouse / Windows Volume Sync',
    masterVolLabel: 'Windows Master Volume (Linked to Mouse Forward / Back & Media Keys)',
    signalPeak: 'Peak Level',
    muteTooltip: 'Mute / Unmute all synced speakers',

    // Filter Bar
    searchPlaceholder: 'Filter by speaker name or endpoint...',
    showHiddenLabel: 'Show hidden output endpoints',
    dragHint: 'Drag and drop speaker cards to customize order',
    pinToTopTooltip: 'Pin this speaker to the top position',
    pinToTopBtn: 'Pin to Top',
    resetOrderBtn: 'Reset Order',
    toastOrderUpdated: 'Speaker display order saved.',

    // Speaker Card
    tagDisconnected: 'Bluetooth Offline (Auto-Reconnects on Power On)',
    tagMaster: 'Master Output (Loopback Source)',
    tagSynced: 'Streaming in Parallel',
    tagIdle: 'Sync Disabled',
    tagHidden: 'Hidden',
    winVolumeLabel: 'Windows Endpoint Volume',
    trimRatioLabel: 'Master Volume Trim Ratio',
    delayCompLabel: 'Acoustic Delay Compensation',
    balanceLabel: 'L / R Channel Balance',
    balanceCenter: 'Center (Stereo)',
    statusStreaming: 'PCM Stream Active',
    statusStandby: 'Standby',
    setAsMasterBtn: 'Set as Master',
    winDefaultLabel: 'Windows Default',

    // Devices Tab
    allDevicesHeading: 'All Detected Audio Output Endpoints',
    allDevicesSub:
      'Set friendly custom names for each speaker (e.g., "Left Bluetooth Speaker", "Right Speaker") or hide unused virtual drivers.',
    statusLabel: 'Status',
    renamePlaceholder: 'Enter custom label for this speaker...',
    saveBtn: 'Save Label',
    cancelBtn: 'Cancel',
    renameBtn: 'Rename',
    hideBtn: 'Hide',
    unhideBtn: 'Unhide',
    makeMasterBtn: 'Set as Master',
    toastSavedName: 'Custom speaker label saved.',
    toastHidden: 'Endpoint hidden from the main Mixer view.',
    toastShown: 'Endpoint restored to the main Mixer view.',

    // Presets Tab
    newPresetHeading: 'Save Current Speaker Routing as a New Preset',
    newPresetPlaceholder: 'Enter preset name (e.g., Dual Bluetooth JBL + Soundcore)...',
    savePresetBtn: 'Save Current Setup',
    noPresetsText:
      'No presets saved yet. Enable your desired speakers in the Mixer tab and save the combination here.',
    presetDevicesCount: 'Synced speakers',
    applyPresetBtn: 'Activate Preset',
    toastPresetSaved: 'New speaker preset saved.',
    toastPresetApplied: 'Activated preset: ',

    // Settings Tab
    engineSectionTitle: 'WASAPI Audio Engine & Smart Bluetooth Failover',
    languageTitle: 'Interface Language / Ngôn ngữ hiển thị',
    languageDesc: 'Switch application interface between English and Vietnamese (Tiếng Việt).',
    autoFailoverTitle: 'Smart Bluetooth Master Auto-Failover',
    autoFailoverDesc:
      'If the current Bluetooth Master speaker is powered off, automatically promote the remaining active Bluetooth speaker to Windows Default so playback and mouse volume controls continue uninterrupted.',
    autoReconnectTitle: 'Automatic Bluetooth Hot-Reconnect',
    autoReconnectDesc:
      'Automatically resume parallel audio streaming and volume sync within 1 second when a powered-off Bluetooth speaker is turned back on.',
    bufferSizeTitle: 'WASAPI Shared Buffer Duration',
    bufferSizeDesc:
      'Lower (20–35ms) for minimal latency, or increase (60–100ms) for maximum stability over weak Bluetooth connections.',

    desktopSectionTitle: 'Windows Desktop Integration & Startup',
    startupTitle: 'Launch at Windows Startup',
    startupDesc: 'Automatically start Multi-Speaker Studio and sync speakers when logging into Windows.',
    closeToTrayTitle: 'Close Window to System Tray',
    closeToTrayDesc:
      'Keep the audio engine running in the background tray when closing the window so mouse volume keys stay synced.',
    startMinTitle: 'Start Minimized in System Tray',
    startMinDesc: 'Launch silently into the Windows System Tray without opening the main window.',
    shortcutTitle: 'Create Project Launch Shortcut',
    shortcutDesc: 'Create a "Multi-Speaker Sync Studio.lnk" shortcut with the official app icon in the project folder.',
    shortcutBtn: 'Create Shortcut',
    toastShortcutOk: 'Created "Multi-Speaker Sync Studio.lnk" in the project folder.',
    toastShortcutErr: 'Could not create shortcut automatically.',
    winToolsTitle: 'Windows Audio & Bluetooth Utilities',
    winToolsDesc: 'Quickly open Windows Bluetooth devices, Sound Control Panel (mmsys.cpl), or Volume Mixer.',
    btSettingsBtn: 'Bluetooth Settings',
    volMixerBtn: 'Volume Mixer',
    soundCplBtn: 'Sound Control Panel',
  },
};
