# Multi-Speaker Sync Studio (Windows WASAPI Audio Router)

**[English](#english-documentation) | [Tiếng Việt](#tài-liệu-tiếng-việt)**

---

<a name="english-documentation"></a>
## 🇬🇧 English Documentation

**Multi-Speaker Sync Studio** is a native Windows desktop application powered by a zero-dependency C# **WASAPI Shared-Mode Loopback Engine** and an **Electron + React + TypeScript** hardware console interface.

It enables Windows 10/11 users to **stream system audio simultaneously across 2, 3, or more speakers** (Bluetooth speakers, wired speakers, USB DACs, monitor speakers) while keeping **Windows hardware volume & Mouse Forward/Back volume keys** synchronized in real time—without installing complex virtual audio cable drivers like Voicemeeter.

### Key Features
1. **Multi-Speaker Simultaneous Playback (WASAPI Loopback)**
   - Captures PCM audio directly from your primary Windows output endpoint and streams it in parallel to any number of secondary speakers with automatic sample-rate conversion (`AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM`).
2. **Hardware Mouse / Keyboard Volume Synchronization**
   - Hooks directly into Windows `IAudioEndpointVolumeCallback`. When you adjust system volume using **Mouse Forward/Back buttons**, a keyboard volume wheel, or the Windows taskbar slider, all active speakers scale their hardware volume and mute state together according to their configured Trim Ratio.
3. **Smart Dual-Bluetooth Auto-Failover & Hot-Reconnect**
   - **Auto-Failover:** If you use 2 Bluetooth speakers and power off the primary (Master) speaker, the engine immediately promotes the remaining active Bluetooth speaker to Windows Default (`IPolicyConfigVista`) so audio and mouse volume controls continue without interruption.
   - **Hot-Reconnect:** When a powered-off Bluetooth speaker is turned back on, the engine detects it and resumes parallel audio streaming within 1 second.
4. **Acoustic Calibration Per Speaker**
   - Independent **Trim Ratio** (`10%` – `200%`), **Delay Compensation** (`0` – `350 ms`) to align Bluetooth latency with wired/monitor speakers, and **L/R Stereo Channel Balance** (useful for turning two Bluetooth speakers into dedicated Left and Right stereo channels).
5. **Bilingual Hardware UI & System Tray Integration**
   - Instant toggle between **English (`EN`)** and **Vietnamese (`VI`)** in both the main console and System Tray menu.
   - Supports **Launch at Windows Startup**, **Start Minimized**, **Close to System Tray**, and one-click **Speaker Presets**.

---

### Download & Installation (Pre-built via GitHub Actions)

1. Go to the **[Actions](https://github.com/codyzard/sync-mutlti-speaker-windows/actions)** tab of this repository.
2. Select **Build Windows App (Manual & Release)** on the left sidebar.
3. Click **Run workflow** -> **Run workflow** (optionally enter a release tag like `v1.0.0` to also publish a GitHub Release).
4. Once the build finishes, scroll down to **Artifacts** and download **`Multi-Speaker-Sync-Studio-Windows-x64`**.
5. Extract the ZIP folder and run **`Multi-Speaker Sync Studio.exe`**.

---

### How to Use

1. **Select Your Master Output:**
   - In the **Audio Mixer Console** tab, choose your primary speaker under **PRIMARY OUTPUT (MASTER)**. This device receives volume commands from your Mouse / Windows volume keys.
2. **Enable Additional Speakers:**
   - Toggle the switch on any secondary speaker card to start streaming audio in parallel.
3. **Calibrate Volume, Delay & Balance:**
   - Adjust **Trim Ratio** if one speaker is naturally louder/quieter than the Master.
   - Adjust **Acoustic Delay Compensation (ms)** if one speaker lags behind another.
   - Adjust **L / R Channel Balance** if you want Speaker A to play the Left channel and Speaker B to play the Right channel.
4. **Save Presets & Configure Startup:**
   - Open **Speaker Presets** to save combinations for quick switching from the System Tray.
   - Open **System Settings** to enable **Launch at Windows Startup** and **Close Window to System Tray**.

---

### Building from Source Locally

**Prerequisites:** Windows 10/11 (x64), Node.js 18+, and .NET Framework 4.x (`csc.exe` is built into Windows at `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`).

```powershell
# 1. Install dependencies
npm install

# 2. Build native WASAPI engine, frontend, and standalone Windows executable
npm run package
```

The standalone application will be output to `release/Multi-Speaker Sync Studio/Multi-Speaker Sync Studio.exe`.

---
---

<a name="tài-liệu-tiếng-việt"></a>
## 🇻🇳 Tài Liệu Tiếng Việt

**Multi-Speaker Sync Studio** là ứng dụng Windows Desktop chuyên dụng giúp **phát âm thanh đồng thời ra 2, 3 hoặc nhiều loa cùng lúc** (2 loa Bluetooth, loa có dây, loa màn hình, USB DAC) và **đồng bộ âm lượng trực tiếp với nút Chuột (Forward / Back) hoặc phím tăng giảm âm lượng Windows** mà không cần cài đặt phần mềm phức tạp như Voicemeeter.

### Tính Năng Nổi Bật
1. **Phát Nhạc Song Song Đa Loa (WASAPI Loopback)**
   - Thu trực tiếp luồng âm thanh số PCM từ thiết bị phát chính (Master) và phát đồng thời sang tất cả các loa phụ được bật với bộ chuyển đổi tần số lấy mẫu tự động (`AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM`).
2. **Đồng Bộ Âm Lượng Chuột (Forward/Back) & Windows Volume**
   - Lắng nghe trực tiếp sự kiện phần cứng `IAudioEndpointVolumeCallback` của Windows. Khi bạn bấm nút tăng/giảm âm lượng trên chuột hoặc bàn phím, toàn bộ các loa đang phát sẽ tự động tăng/giảm và Mute đồng bộ theo đúng tỷ lệ khuếch đại (Trim) bạn cài đặt.
3. **Chế Độ Bluetooth Thông Minh (Auto-Failover & Auto-Reconnect)**
   - **Tự động chuyển Loa Chính (Auto-Failover):** Khi đang dùng 2 loa Bluetooth mà bạn tắt nguồn chiếc loa đang làm Loa Chính, phần mềm tự động chuyển chiếc loa còn lại lên làm Loa Chính mặc định của Windows để nhạc không bị ngắt và nút chuột vẫn điều khiển được âm lượng.
   - **Tự động kết nối lại (Auto-Reconnect):** Khi bạn bật nguồn lại chiếc loa Bluetooth vừa tắt, ứng dụng tự động nhận diện và phát nhạc song song trở lại trong vòng 1 giây.
4. **Cân Chỉnh Âm Học Chi Tiết Từng Loa**
   - Tuỳ chỉnh **Tỷ lệ khuếch đại (Trim %)**, **Bù độ trễ (Delay 0–350ms)** để khớp nhịp giữa các loa Bluetooth/loa màn hình, và **Cân bằng kênh Trái/Phải (L/R Balance)** để biến 2 loa rời thành hệ thống âm thanh vòm Trái – Phải thực thụ.
5. **Giao Diện Song Ngữ (Việt / Anh) & Chạy Ngầm Khay Hệ Thống**
   - Chuyển đổi tức thì giữa **Tiếng Việt (`VI`)** và **Tiếng Anh (`EN`)** ngay trên thanh công cụ hoặc trong Cài đặt.
   - Hỗ trợ **Tự khởi động cùng Windows**, **Thu nhỏ xuống System Tray khi đóng cửa sổ**, và chuyển đổi nhanh cấu hình loa từ góc phải màn hình.

---

### Cách Tải Bản Build Sẵn Trên GitHub Actions

1. Truy cập tab **[Actions](https://github.com/codyzard/sync-mutlti-speaker-windows/actions)** trên kho lưu trữ GitHub này.
2. Chọn workflow **Build Windows App (Manual & Release)** ở cột bên trái.
3. Bấm nút **Run workflow** -> **Run workflow** (có thể nhập thêm tag như `v1.0.0` nếu muốn tự động tạo bản phát hành tại mục Releases).
4. Sau khi quá trình build hoàn tất (khoảng 1–2 phút), kéo xuống mục **Artifacts** và tải file **`Multi-Speaker-Sync-Studio-Windows-x64`**.
5. Giải nén file ZIP và mở **`Multi-Speaker Sync Studio.exe`** để sử dụng ngay.

---

### Hướng Dẫn Sử Dụng Nhanh

1. **Bước 1 — Chọn Loa Chính (Master):**
   - Tại tab **Bảng Điều Khiển (Mixer)**, chọn một loa đang hoạt động ở mục **NGUỒN PHÁT CHÍNH (MASTER)**. Đây là loa nhận lệnh tăng/giảm âm lượng trực tiếp từ nút chuột của bạn.
2. **Bước 2 — Bật Loa Thứ 2 (hoặc Thứ 3):**
   - Gạt công tắc bật ở thẻ của chiếc loa thứ 2. Cả 2 loa sẽ lập tức phát nhạc song song và đồng bộ âm lượng theo nút chuột.
3. **Bước 3 — Tuỳ Chỉnh Độ Trễ & Kênh Trái/Phải (Tuỳ chọn):**
   - Kéo thanh **Bù độ trễ (Delay)** nếu 1 trong 2 loa phát sớm hơn loa kia.
   - Kéo thanh **Cân bằng kênh L / R** về `L 100%` cho loa bên trái và `R 100%` cho loa bên phải nếu muốn tách kênh Stereo.
4. **Bước 4 — Bật Tự Khởi Động Cùng Windows:**
   - Vào tab **Cài Đặt Hệ Thống** -> bật **Tự khởi động cùng Windows** và **Thu nhỏ xuống khay hệ thống khi bấm nút X**.

---

### Tự Build Từ Mã Nguồn Trên Máy Cá Nhân

```powershell
# 1. Cài đặt các gói thư viện
npm install

# 2. Biên dịch WASAPI C# Engine, giao diện React và đóng gói file .exe
npm run package
```

Bản chạy độc lập sau khi đóng gói sẽ nằm tại thư mục: `release/Multi-Speaker Sync Studio/Multi-Speaker Sync Studio.exe`.
