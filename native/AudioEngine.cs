using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace AudioEngine
{
    #region Core Audio COM Interop

    internal enum EDataFlow
    {
        eRender = 0,
        eCapture = 1,
        eAll = 2
    }

    internal enum ERole
    {
        eConsole = 0,
        eMultimedia = 1,
        eCommunications = 2
    }

    internal enum AudioClientShareMode
    {
        Shared = 0,
        Exclusive = 1
    }

    [Flags]
    internal enum AudioClientStreamFlags : uint
    {
        None = 0,
        CrossProcess = 0x00010000,
        Loopback = 0x00020000,
        EventCallback = 0x00040000,
        NoPersist = 0x00080000,
        RateAdjust = 0x00100000,
        AutoConvertPCM = 0x80000000,
        SrcDefaultQuality = 0x08000000
    }

    [Flags]
    internal enum AudioClientBufferFlags : uint
    {
        None = 0,
        DataDiscontinuity = 0x1,
        Silent = 0x2,
        TimestampError = 0x4
    }

    [StructLayout(LayoutKind.Sequential)]
    internal struct PROPERTYKEY
    {
        public Guid fmtid;
        public uint pid;
        public PROPERTYKEY(Guid fmtid, uint pid)
        {
            this.fmtid = fmtid;
            this.pid = pid;
        }
    }

    [StructLayout(LayoutKind.Explicit, Size = 24)]
    internal struct PROPVARIANT
    {
        [FieldOffset(0)] public ushort vt;
        [FieldOffset(8)] public IntPtr pwszVal;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    internal struct WAVEFORMATEX
    {
        public ushort wFormatTag;
        public ushort nChannels;
        public uint nSamplesPerSec;
        public uint nAvgBytesPerSec;
        public ushort nBlockAlign;
        public ushort wBitsPerSample;
        public ushort cbSize;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    internal struct WAVEFORMATEXTENSIBLE
    {
        public WAVEFORMATEX Format;
        public ushort wValidBitsPerSample;
        public uint dwChannelMask;
        public Guid SubFormat;
    }

    [StructLayout(LayoutKind.Sequential)]
    internal struct AUDIO_VOLUME_NOTIFICATION_DATA
    {
        public Guid guidEventContext;
        [MarshalAs(UnmanagedType.Bool)]
        public bool bMuted;
        public float fMasterVolume;
        public uint nChannels;
        public float ChannelVolume;
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    internal class MMDeviceEnumeratorComObject { }

    [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDeviceEnumerator
    {
        int EnumAudioEndpoints(EDataFlow dataFlow, uint dwStateMask, out IMMDeviceCollection ppDevices);
        int GetDefaultAudioEndpoint(EDataFlow dataFlow, ERole role, out IMMDevice ppEndpoint);
        int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, out IMMDevice ppDevice);
        int RegisterEndpointNotificationCallback(IntPtr pClient);
        int UnregisterEndpointNotificationCallback(IntPtr pClient);
    }

    [ComImport, Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDeviceCollection
    {
        int GetCount(out uint pcDevices);
        int Item(uint nDevice, out IMMDevice ppDevice);
    }

    [ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDevice
    {
        int Activate(ref Guid iid, uint dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
        int OpenPropertyStore(uint stgmAccess, out IPropertyStore ppProperties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        int GetState(out uint pdwState);
    }

    [ComImport, Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IPropertyStore
    {
        int GetCount(out uint cProps);
        int GetAt(uint iProp, out PROPERTYKEY pkey);
        int GetValue(ref PROPERTYKEY key, out PROPVARIANT pv);
        int SetValue(ref PROPERTYKEY key, ref PROPVARIANT propvar);
        int Commit();
    }

    [ComImport, Guid("657804FA-D6AD-4496-8A60-352752AF4F89"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioEndpointVolumeCallback
    {
        [PreserveSig]
        int OnNotify(IntPtr pNotify);
    }

    [ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioEndpointVolume
    {
        int RegisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int UnregisterControlChangeNotify(IAudioEndpointVolumeCallback pNotify);
        int GetChannelCount(out uint pnChannelCount);
        int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
        int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
        int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
        int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
        int GetVolumeStepInfo(out uint pnStep, out uint pnStepCount);
        int VolumeStepUp(ref Guid pguidEventContext);
        int VolumeStepDown(ref Guid pguidEventContext);
        int QueryHardwareSupport(out uint pdwHardwareSupportMask);
        int GetVolumeRange(out float pflVolumeMindB, out float pflVolumeMaxdB, out float pflVolumeIncrementdB);
    }

    [ComImport, Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioMeterInformation
    {
        int GetPeakValue(out float pfPeak);
    }

    [ComImport, Guid("1CB9AD4C-DBFA-4c32-B178-C2F568A703B2"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioClient
    {
        int Initialize(AudioClientShareMode ShareMode, AudioClientStreamFlags StreamFlags, long hnsBufferDuration, long hnsPeriodicity, IntPtr pFormat, IntPtr AudioSessionGuid);
        int GetBufferSize(out uint pNumBufferFrames);
        int GetStreamLatency(out long phnsLatency);
        int GetCurrentPadding(out uint pNumPaddingFrames);
        int IsFormatSupported(AudioClientShareMode ShareMode, IntPtr pFormat, out IntPtr ppClosestMatch);
        int GetMixFormat(out IntPtr ppDeviceFormat);
        int GetDevicePeriod(out long phnsDefaultDevicePeriod, out long phnsMinimumDevicePeriod);
        int Start();
        int Stop();
        int Reset();
        int SetEventHandle(IntPtr eventHandle);
        int GetService(ref Guid riid, [MarshalAs(UnmanagedType.IUnknown)] out object ppv);
    }

    [ComImport, Guid("C8ADBD64-E71E-48a0-A4DE-185C395CD317"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioCaptureClient
    {
        int GetBuffer(out IntPtr ppData, out uint pNumFramesToRead, out AudioClientBufferFlags pdwFlags, out ulong pu64DevicePosition, out ulong pu64QPCPosition);
        int ReleaseBuffer(uint NumFramesRead);
        int GetNextPacketSize(out uint pNumFramesInNextPacket);
    }

    [ComImport, Guid("F294ACFC-3146-4483-A7BF-ADDCA7C260E2"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioRenderClient
    {
        int GetBuffer(uint NumFramesRequested, out IntPtr ppData);
        int ReleaseBuffer(uint NumFramesWritten, uint dwFlags);
    }

    #endregion

    public class SpeakerConfig
    {
        public string Id = "";
        public string Name = "";
        public string CustomLabel = "";
        public bool Enabled = false;
        public float TrimRatio = 1.0f; // 0.0 to 2.0 (1.0 = 100% of Master Volume)
        public int DelayMs = 0;        // 0 to 500 ms delay compensation
        public float Balance = 0.0f;   // -1.0 (Left) to +1.0 (Right)
    }

    internal class TargetRenderStream : IDisposable
    {
        public string DeviceId;
        public SpeakerConfig Config;
        private IMMDevice _device;
        private IAudioClient _audioClient;
        private IAudioRenderClient _renderClient;
        private uint _bufferFrames;
        private int _sampleRate;
        private int _channels;

        // Ring buffer of interleaved float samples (stereo 2ch at capture sample rate)
        private float[] _ringBuffer;
        private int _writePos;
        private int _readPos;
        private int _availableSamples;
        private readonly object _lock = new object();
        private bool _disposed = false;
        public bool IsFaulted = false;

        public TargetRenderStream(IMMDevice device, string deviceId, SpeakerConfig config, IntPtr captureWaveFormatPtr, int sampleRate, int channels, int bufferMs)
        {
            DeviceId = deviceId;
            Config = config;
            _device = device;
            _sampleRate = sampleRate;
            _channels = channels;

            // 2 seconds stereo float ring buffer
            int maxSamples = Math.Max(sampleRate * channels * 2, 192000);
            _ringBuffer = new float[maxSamples];

            Guid iidAudioClient = new Guid("1CB9AD4C-DBFA-4c32-B178-C2F568A703B2");
            object obj;
            _device.Activate(ref iidAudioClient, 23, IntPtr.Zero, out obj);
            _audioClient = (IAudioClient)obj;

            // Initialize with AutoConvertPCM so Windows resamples/remixes automatically if target speaker has different sample rate or channel count!
            AudioClientStreamFlags flags = AudioClientStreamFlags.AutoConvertPCM | AudioClientStreamFlags.SrcDefaultQuality;
            long hnsBuffer = Math.Max(15, Math.Min(250, bufferMs)) * 10000L;
            int hr = _audioClient.Initialize(AudioClientShareMode.Shared, flags, hnsBuffer, 0, captureWaveFormatPtr, IntPtr.Zero);
            if (hr != 0)
            {
                throw new Exception("IAudioClient.Initialize failed with HRESULT 0x" + hr.ToString("X8"));
            }

            _audioClient.GetBufferSize(out _bufferFrames);

            Guid iidRenderClient = new Guid("F294ACFC-3146-4483-A7BF-ADDCA7C260E2");
            object renderObj;
            _audioClient.GetService(ref iidRenderClient, out renderObj);
            _renderClient = (IAudioRenderClient)renderObj;

            _audioClient.Start();
        }

        public void PushSamples(float[] interleavedSamples, int sampleCount)
        {
            if (_disposed || IsFaulted || !Config.Enabled) return;

            lock (_lock)
            {
                int capacity = _ringBuffer.Length;
                // Desired delay in samples
                int delayFrames = (int)((Config.DelayMs / 1000.0) * _sampleRate);
                int maxAllowedBuffered = delayFrames * _channels + (_sampleRate * _channels / 15); // ~66ms headroom above delay

                // Prevent drift accumulation: if buffer exceeds target delay + headroom, drop oldest samples
                if (_availableSamples + sampleCount > Math.Min(capacity, maxAllowedBuffered))
                {
                    int targetKeep = delayFrames * _channels + (_sampleRate * _channels / 50); // reset to delay + 20ms
                    if (_availableSamples > targetKeep)
                    {
                        int drop = _availableSamples - targetKeep;
                        _readPos = (_readPos + drop) % capacity;
                        _availableSamples -= drop;
                    }
                }

                for (int i = 0; i < sampleCount; i++)
                {
                    _ringBuffer[_writePos] = interleavedSamples[i];
                    _writePos = (_writePos + 1) % capacity;
                }
                _availableSamples = Math.Min(capacity, _availableSamples + sampleCount);
            }
        }

        public unsafe void PumpToHardware()
        {
            if (_disposed || IsFaulted) return;

            try
            {
                uint padding;
                int hr = _audioClient.GetCurrentPadding(out padding);
                if (hr != 0)
                {
                    // AUDCLNT_E_DEVICE_INVALIDATED (0x88890004) - Bluetooth speaker turned off
                    IsFaulted = true;
                    return;
                }

                uint availableFrames = _bufferFrames - padding;
                if (availableFrames == 0) return;

                lock (_lock)
                {
                    if (!Config.Enabled)
                    {
                        _availableSamples = 0;
                        _readPos = _writePos;
                        return;
                    }

                    int delaySamples = (int)((Config.DelayMs / 1000.0) * _sampleRate) * _channels;
                    int readySamples = _availableSamples - delaySamples;
                    if (readySamples < _channels) return;

                    uint framesToWrite = Math.Min(availableFrames, (uint)(readySamples / _channels));
                    if (framesToWrite == 0) return;

                    IntPtr pData;
                    if (_renderClient.GetBuffer(framesToWrite, out pData) != 0)
                    {
                        IsFaulted = true;
                        return;
                    }

                    float* dst = (float*)pData.ToPointer();
                    int samplesToWrite = (int)framesToWrite * _channels;
                    int capacity = _ringBuffer.Length;

                    float leftGain = 1.0f;
                    float rightGain = 1.0f;
                    if (Config.Balance < 0f) rightGain = 1.0f + Config.Balance;
                    else if (Config.Balance > 0f) leftGain = 1.0f - Config.Balance;

                    for (int i = 0; i < samplesToWrite; i++)
                    {
                        float sample = _ringBuffer[_readPos];
                        _readPos = (_readPos + 1) % capacity;

                        if (_channels >= 2)
                        {
                            int ch = i % _channels;
                            if (ch == 0) sample *= leftGain;
                            else if (ch == 1) sample *= rightGain;
                        }
                        dst[i] = sample;
                    }

                    _availableSamples -= samplesToWrite;
                    if (_renderClient.ReleaseBuffer(framesToWrite, 0) != 0)
                    {
                        IsFaulted = true;
                    }
                }
            }
            catch
            {
                IsFaulted = true;
            }
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            try { if (_audioClient != null) _audioClient.Stop(); } catch { }
            try { if (_renderClient != null) Marshal.ReleaseComObject(_renderClient); } catch { }
            try { if (_audioClient != null) Marshal.ReleaseComObject(_audioClient); } catch { }
            try { if (_device != null) Marshal.ReleaseComObject(_device); } catch { }
        }
    }

    [ComImport, Guid("294935CE-F637-4E7C-A41B-AB255460B862")]
    internal class PolicyConfigVistaComObject { }

    [ComImport, Guid("568b9108-44bf-40b4-9006-86afe5b5a620"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IPolicyConfigVista
    {
        int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, out IntPtr ppFormat);
        int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, int bDefault, out IntPtr ppFormat);
        int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, IntPtr pEndpointFormat, IntPtr mixFormat);
        int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, int bDefault, out long pmftDefaultPeriod, out long pmftMinimumPeriod);
        int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, long pmftPeriod);
        int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, out IntPtr pMode);
        int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, IntPtr mode);
        int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, ref PROPERTYKEY key, out PROPVARIANT pv);
        int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, ref PROPERTYKEY key, ref PROPVARIANT pv);
        int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, ERole role);
        int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string pszDeviceName, int bVisible);
    }

    internal class MasterVolumeCallback : IAudioEndpointVolumeCallback
    {
        private readonly Action<float, bool, Guid> _onVolumeChanged;

        public MasterVolumeCallback(Action<float, bool, Guid> onVolumeChanged)
        {
            _onVolumeChanged = onVolumeChanged;
        }

        public int OnNotify(IntPtr pNotify)
        {
            try
            {
                AUDIO_VOLUME_NOTIFICATION_DATA data = (AUDIO_VOLUME_NOTIFICATION_DATA)Marshal.PtrToStructure(pNotify, typeof(AUDIO_VOLUME_NOTIFICATION_DATA));
                _onVolumeChanged(data.fMasterVolume, data.bMuted, data.guidEventContext);
            }
            catch { }
            return 0;
        }
    }

    class Program
    {
        [DllImport("ole32.dll")]
        private static extern int PropVariantClear(ref PROPVARIANT pvar);

        private static readonly Guid AppEventContext = new Guid("9B4E23D1-7A1E-42C9-B322-8F0011223344");
        private static readonly Guid IID_IAudioEndpointVolume = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
        private static readonly Guid IID_IAudioMeterInformation = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");
        private static readonly Guid IID_IAudioClient = new Guid("1CB9AD4C-DBFA-4c32-B178-C2F568A703B2");
        private static readonly Guid IID_IAudioCaptureClient = new Guid("C8ADBD64-E71E-48a0-A4DE-185C395CD317");
        private static readonly Guid KSDATAFORMAT_SUBTYPE_IEEE_FLOAT = new Guid("00000003-0000-0010-8000-00aa00389b71");
        private static readonly PROPERTYKEY PKEY_Device_FriendlyName = new PROPERTYKEY(new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), 14);

        private static IMMDeviceEnumerator _enumerator;
        private static readonly ConcurrentDictionary<string, SpeakerConfig> _speakerConfigs = new ConcurrentDictionary<string, SpeakerConfig>();
        private static string _masterDeviceId = "";
        private static bool _routingEnabled = true;
        private static bool _volumeSyncEnabled = true;
        private static int _bufferMs = 45;
        private static bool _autoFailover = true;
        private static bool _autoReconnect = true;
        private static volatile bool _running = true;
        private static volatile bool _needsRestartEngine = true;

        private static IMMDevice _currentMasterDevice;
        private static IAudioEndpointVolume _currentMasterVolume;
        private static MasterVolumeCallback _masterVolumeCallback;

        private static readonly object _consoleLock = new object();

        static void Main(string[] args)
        {
            Console.InputEncoding = Encoding.UTF8;
            Console.OutputEncoding = Encoding.UTF8;

            _enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());

            // Start stdin command reader thread
            Thread cmdThread = new Thread(CommandReaderLoop) { IsBackground = true };
            cmdThread.Start();

            // Start level meter & status broadcast thread
            Thread meterThread = new Thread(MeterAndStatusLoop) { IsBackground = true };
            meterThread.Start();

            // Main audio loopback + sync loop
            AudioEngineLoop();
        }

        private static void EmitJson(string json)
        {
            lock (_consoleLock)
            {
                Console.WriteLine(json);
                Console.Out.Flush();
            }
        }

        private static string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
        }

        private static string GetDeviceFriendlyName(IMMDevice device)
        {
            try
            {
                IPropertyStore store;
                if (device.OpenPropertyStore(0, out store) == 0 && store != null)
                {
                    PROPVARIANT pv;
                    PROPERTYKEY key = PKEY_Device_FriendlyName;
                    if (store.GetValue(ref key, out pv) == 0)
                    {
                        string name = Marshal.PtrToStringUni(pv.pwszVal);
                        PropVariantClear(ref pv);
                        Marshal.ReleaseComObject(store);
                        return name ?? "Unknown Speaker";
                    }
                    Marshal.ReleaseComObject(store);
                }
            }
            catch { }
            return "Audio Device";
        }

        private static void CommandReaderLoop()
        {
            try
            {
                string line;
                while ((line = Console.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (string.IsNullOrEmpty(line)) continue;

                    string[] parts = line.Split('|');
                    string cmd = parts[0].ToUpperInvariant();

                    switch (cmd)
                    {
                        case "LIST":
                            SendDeviceList();
                            break;

                        case "SET_MASTER_VOL":
                            if (parts.Length >= 2)
                            {
                                float vol;
                                if (float.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out vol))
                                {
                                    SetMasterVolumeScalar(Math.Max(0f, Math.Min(1f, vol)));
                                }
                            }
                            break;

                        case "SET_MASTER_MUTE":
                            if (parts.Length >= 2)
                            {
                                bool mute = parts[1] == "1" || parts[1].Equals("true", StringComparison.OrdinalIgnoreCase);
                                SetMasterMute(mute);
                            }
                            break;

                        case "SET_ROUTING":
                            if (parts.Length >= 2)
                            {
                                _routingEnabled = parts[1] == "1" || parts[1].Equals("true", StringComparison.OrdinalIgnoreCase);
                                _needsRestartEngine = true;
                                SendDeviceList();
                            }
                            break;

                        case "SET_VOL_SYNC":
                            if (parts.Length >= 2)
                            {
                                _volumeSyncEnabled = parts[1] == "1" || parts[1].Equals("true", StringComparison.OrdinalIgnoreCase);
                                if (_volumeSyncEnabled) SyncAllTargetVolumesFromMaster();
                                SendDeviceList();
                            }
                            break;

                        case "SET_ENGINE_SETTINGS":
                            // SET_ENGINE_SETTINGS|bufferMs|autoFailover(0/1)|autoReconnect(0/1)
                            if (parts.Length >= 4)
                            {
                                int buf = 45;
                                int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out buf);
                                int clampedBuf = Math.Max(15, Math.Min(250, buf));
                                bool restart = clampedBuf != _bufferMs;
                                _bufferMs = clampedBuf;
                                _autoFailover = parts[2] == "1" || parts[2].Equals("true", StringComparison.OrdinalIgnoreCase);
                                _autoReconnect = parts[3] == "1" || parts[3].Equals("true", StringComparison.OrdinalIgnoreCase);
                                if (restart) _needsRestartEngine = true;
                                SendDeviceList();
                            }
                            break;

                        case "CONFIG_SPEAKER":
                            // CONFIG_SPEAKER|deviceId|enabled(0/1)|trimRatio(0.0-2.0)|delayMs(0-500)|balance(-1.0..1.0)|name
                            if (parts.Length >= 6)
                            {
                                string id = parts[1];
                                bool enabled = parts[2] == "1" || parts[2].Equals("true", StringComparison.OrdinalIgnoreCase);
                                float trim = 1.0f;
                                float.TryParse(parts[3], NumberStyles.Float, CultureInfo.InvariantCulture, out trim);
                                int delayMs = 0;
                                int.TryParse(parts[4], NumberStyles.Integer, CultureInfo.InvariantCulture, out delayMs);
                                float balance = 0.0f;
                                float.TryParse(parts[5], NumberStyles.Float, CultureInfo.InvariantCulture, out balance);

                                SpeakerConfig cfg = _speakerConfigs.GetOrAdd(id, k => new SpeakerConfig { Id = k });
                                bool enabledChanged = cfg.Enabled != enabled;
                                cfg.Enabled = enabled;
                                cfg.TrimRatio = Math.Max(0f, Math.Min(2.0f, trim));
                                cfg.DelayMs = Math.Max(0, Math.Min(500, delayMs));
                                cfg.Balance = Math.Max(-1f, Math.Min(1f, balance));
                                if (parts.Length >= 7 && !string.IsNullOrEmpty(parts[6]))
                                {
                                    cfg.Name = parts[6];
                                }

                                if (enabledChanged)
                                {
                                    _needsRestartEngine = true;
                                }
                                SyncAllTargetVolumesFromMaster();
                                SendDeviceList();
                            }
                            break;

                        case "SET_DEVICE_VOL":
                            // Direct override of a specific device's Windows volume
                            if (parts.Length >= 3)
                            {
                                string devId = parts[1];
                                float v;
                                if (float.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out v))
                                {
                                    SetSpecificDeviceVolume(devId, Math.Max(0f, Math.Min(1f, v)));
                                }
                            }
                            break;

                        case "SET_DEFAULT_DEVICE":
                            if (parts.Length >= 2)
                            {
                                string devId = parts[1];
                                SetDefaultAudioDevice(devId);
                                _needsRestartEngine = true;
                                SendDeviceList();
                            }
                            break;

                        case "QUIT":
                            _running = false;
                            return;
                    }
                }
            }
            catch { }
        }

        private static void SetDefaultAudioDevice(string deviceId)
        {
            try
            {
                IPolicyConfigVista policy = (IPolicyConfigVista)(new PolicyConfigVistaComObject());
                policy.SetDefaultEndpoint(deviceId, ERole.eConsole);
                policy.SetDefaultEndpoint(deviceId, ERole.eMultimedia);
                policy.SetDefaultEndpoint(deviceId, ERole.eCommunications);
                Marshal.ReleaseComObject(policy);
            }
            catch { }
        }

        private static void SetMasterVolumeScalar(float level)
        {
            try
            {
                if (_currentMasterVolume != null)
                {
                    Guid ctx = Guid.Empty;
                    _currentMasterVolume.SetMasterVolumeLevelScalar(level, ref ctx);
                    if (_volumeSyncEnabled)
                    {
                        SyncAllTargetVolumes(level, null);
                    }
                }
            }
            catch { }
        }

        private static void SetMasterMute(bool mute)
        {
            try
            {
                if (_currentMasterVolume != null)
                {
                    Guid ctx = Guid.Empty;
                    _currentMasterVolume.SetMute(mute, ref ctx);
                    if (_volumeSyncEnabled)
                    {
                        SyncAllTargetVolumes(null, mute);
                    }
                }
            }
            catch { }
        }

        private static void SetSpecificDeviceVolume(string deviceId, float level)
        {
            try
            {
                IMMDevice dev;
                if (_enumerator.GetDevice(deviceId, out dev) == 0 && dev != null)
                {
                    Guid iid = IID_IAudioEndpointVolume;
                    object obj;
                    if (dev.Activate(ref iid, 23, IntPtr.Zero, out obj) == 0 && obj != null)
                    {
                        IAudioEndpointVolume epVol = (IAudioEndpointVolume)obj;
                        Guid ctx = AppEventContext;
                        epVol.SetMasterVolumeLevelScalar(level, ref ctx);
                        Marshal.ReleaseComObject(epVol);
                    }
                    Marshal.ReleaseComObject(dev);
                }
            }
            catch { }
        }

        private static void SyncAllTargetVolumesFromMaster()
        {
            try
            {
                if (_currentMasterVolume == null) return;
                float masterVol;
                bool masterMute;
                _currentMasterVolume.GetMasterVolumeLevelScalar(out masterVol);
                _currentMasterVolume.GetMute(out masterMute);
                SyncAllTargetVolumes(masterVol, masterMute);
            }
            catch { }
        }

        private static void SyncAllTargetVolumes(float? masterVol, bool? masterMute)
        {
            if (!_volumeSyncEnabled) return;

            foreach (var kv in _speakerConfigs)
            {
                SpeakerConfig cfg = kv.Value;
                if (!cfg.Enabled || cfg.Id == _masterDeviceId) continue;

                try
                {
                    IMMDevice dev;
                    if (_enumerator.GetDevice(cfg.Id, out dev) == 0 && dev != null)
                    {
                        Guid iid = IID_IAudioEndpointVolume;
                        object obj;
                        if (dev.Activate(ref iid, 23, IntPtr.Zero, out obj) == 0 && obj != null)
                        {
                            IAudioEndpointVolume epVol = (IAudioEndpointVolume)obj;
                            Guid ctx = AppEventContext;

                            if (masterVol.HasValue)
                            {
                                float targetVol = Math.Max(0f, Math.Min(1f, masterVol.Value * cfg.TrimRatio));
                                epVol.SetMasterVolumeLevelScalar(targetVol, ref ctx);
                            }
                            if (masterMute.HasValue)
                            {
                                epVol.SetMute(masterMute.Value, ref ctx);
                            }

                            Marshal.ReleaseComObject(epVol);
                        }
                        Marshal.ReleaseComObject(dev);
                    }
                }
                catch { }
            }
        }

        private static void SendDeviceList()
        {
            try
            {
                IMMDeviceCollection collection;
                if (_enumerator.EnumAudioEndpoints(EDataFlow.eRender, 1 /* DEVICE_STATE_ACTIVE */, out collection) != 0 || collection == null)
                {
                    return;
                }

                uint count;
                collection.GetCount(out count);

                HashSet<string> activeIds = new HashSet<string>();
                for (uint i = 0; i < count; i++)
                {
                    IMMDevice d;
                    if (collection.Item(i, out d) == 0 && d != null)
                    {
                        string did;
                        d.GetId(out did);
                        if (!string.IsNullOrEmpty(did)) activeIds.Add(did);
                        Marshal.ReleaseComObject(d);
                    }
                }

                string defaultId = "";
                IMMDevice defaultDev;
                if (_enumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eMultimedia, out defaultDev) == 0 && defaultDev != null)
                {
                    defaultDev.GetId(out defaultId);
                    Marshal.ReleaseComObject(defaultDev);
                }

                // Auto-Failover for Bluetooth Speakers:
                if (_autoFailover && !string.IsNullOrEmpty(_masterDeviceId) && !activeIds.Contains(_masterDeviceId))
                {
                    foreach (var kv in _speakerConfigs)
                    {
                        if (kv.Key != _masterDeviceId && kv.Value.Enabled && activeIds.Contains(kv.Key))
                        {
                            SetDefaultAudioDevice(kv.Key);
                            defaultId = kv.Key;
                            break;
                        }
                    }
                }

                if (!string.IsNullOrEmpty(defaultId) && defaultId != _masterDeviceId)
                {
                    _masterDeviceId = defaultId;
                    _needsRestartEngine = true;
                }

                StringBuilder sb = new StringBuilder();
                sb.Append("{\"type\":\"state\",\"routingEnabled\":")
                  .Append(_routingEnabled ? "true" : "false")
                  .Append(",\"volumeSyncEnabled\":")
                  .Append(_volumeSyncEnabled ? "true" : "false")
                  .Append(",\"bufferMs\":").Append(_bufferMs)
                  .Append(",\"autoFailover\":").Append(_autoFailover ? "true" : "false")
                  .Append(",\"autoReconnect\":").Append(_autoReconnect ? "true" : "false")
                  .Append(",\"masterDeviceId\":\"")
                  .Append(EscapeJson(_masterDeviceId))
                  .Append("\",\"devices\":[");

                bool first = true;
                for (uint i = 0; i < count; i++)
                {
                    IMMDevice dev;
                    if (collection.Item(i, out dev) != 0 || dev == null) continue;

                    string id;
                    dev.GetId(out id);
                    string name = GetDeviceFriendlyName(dev);
                    bool isDefault = (id == _masterDeviceId);

                    float vol = 0f;
                    bool muted = false;
                    float peak = 0f;

                    try
                    {
                        Guid iidVol = IID_IAudioEndpointVolume;
                        object volObj;
                        if (dev.Activate(ref iidVol, 23, IntPtr.Zero, out volObj) == 0 && volObj != null)
                        {
                            IAudioEndpointVolume epVol = (IAudioEndpointVolume)volObj;
                            epVol.GetMasterVolumeLevelScalar(out vol);
                            epVol.GetMute(out muted);
                            Marshal.ReleaseComObject(epVol);
                        }

                        Guid iidMeter = IID_IAudioMeterInformation;
                        object meterObj;
                        if (dev.Activate(ref iidMeter, 23, IntPtr.Zero, out meterObj) == 0 && meterObj != null)
                        {
                            IAudioMeterInformation meter = (IAudioMeterInformation)meterObj;
                            meter.GetPeakValue(out peak);
                            Marshal.ReleaseComObject(meter);
                        }
                    }
                    catch { }

                    SpeakerConfig cfg = _speakerConfigs.GetOrAdd(id, k => new SpeakerConfig
                    {
                        Id = k,
                        Name = name,
                        Enabled = false,
                        TrimRatio = 1.0f,
                        DelayMs = 0,
                        Balance = 0.0f
                    });
                    cfg.Name = name;

                    if (!first) sb.Append(",");
                    first = false;

                    sb.Append("{")
                      .Append("\"id\":\"").Append(EscapeJson(id)).Append("\",")
                      .Append("\"name\":\"").Append(EscapeJson(name)).Append("\",")
                      .Append("\"isMaster\":").Append(isDefault ? "true" : "false").Append(",")
                      .Append("\"connected\":true,")
                      .Append("\"enabled\":").Append((isDefault || cfg.Enabled) ? "true" : "false").Append(",")
                      .Append("\"volume\":").Append(vol.ToString("0.000", CultureInfo.InvariantCulture)).Append(",")
                      .Append("\"muted\":").Append(muted ? "true" : "false").Append(",")
                      .Append("\"peak\":").Append(peak.ToString("0.000", CultureInfo.InvariantCulture)).Append(",")
                      .Append("\"trimRatio\":").Append(cfg.TrimRatio.ToString("0.00", CultureInfo.InvariantCulture)).Append(",")
                      .Append("\"delayMs\":").Append(cfg.DelayMs).Append(",")
                      .Append("\"balance\":").Append(cfg.Balance.ToString("0.00", CultureInfo.InvariantCulture))
                      .Append("}");

                    Marshal.ReleaseComObject(dev);
                }

                // Also include configured Bluetooth speakers that are currently powered off / disconnected
                foreach (var kv in _speakerConfigs)
                {
                    SpeakerConfig cfg = kv.Value;
                    if (!activeIds.Contains(cfg.Id) && cfg.Enabled && !string.IsNullOrEmpty(cfg.Name))
                    {
                        if (!first) sb.Append(",");
                        first = false;

                        sb.Append("{")
                          .Append("\"id\":\"").Append(EscapeJson(cfg.Id)).Append("\",")
                          .Append("\"name\":\"").Append(EscapeJson(cfg.Name)).Append("\",")
                          .Append("\"isMaster\":false,")
                          .Append("\"connected\":false,")
                          .Append("\"enabled\":true,")
                          .Append("\"volume\":0.000,")
                          .Append("\"muted\":false,")
                          .Append("\"peak\":0.000,")
                          .Append("\"trimRatio\":").Append(cfg.TrimRatio.ToString("0.00", CultureInfo.InvariantCulture)).Append(",")
                          .Append("\"delayMs\":").Append(cfg.DelayMs).Append(",")
                          .Append("\"balance\":").Append(cfg.Balance.ToString("0.00", CultureInfo.InvariantCulture))
                          .Append("}");
                    }
                }

                sb.Append("]}");
                Marshal.ReleaseComObject(collection);

                EmitJson(sb.ToString());
            }
            catch (Exception ex)
            {
                EmitJson("{\"type\":\"error\",\"message\":\"" + EscapeJson(ex.Message) + "\"}");
            }
        }

        private static void MeterAndStatusLoop()
        {
            int tick = 0;
            while (_running)
            {
                Thread.Sleep(80);
                tick++;
                SendDeviceList();
            }
        }

        private static unsafe void AudioEngineLoop()
        {
            while (_running)
            {
                _needsRestartEngine = false;
                IntPtr mixFormatPtr = IntPtr.Zero;
                IAudioClient captureAudioClient = null;
                IAudioCaptureClient captureClient = null;
                List<TargetRenderStream> targetStreams = new List<TargetRenderStream>();

                try
                {
                    if (_currentMasterVolume != null && _masterVolumeCallback != null)
                    {
                        try { _currentMasterVolume.UnregisterControlChangeNotify(_masterVolumeCallback); } catch { }
                        try { Marshal.ReleaseComObject(_currentMasterVolume); } catch { }
                        _currentMasterVolume = null;
                    }
                    if (_currentMasterDevice != null)
                    {
                        try { Marshal.ReleaseComObject(_currentMasterDevice); } catch { }
                        _currentMasterDevice = null;
                    }

                    // 1. Get Default Render Device (Master Speaker)
                    if (_enumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eMultimedia, out _currentMasterDevice) != 0 || _currentMasterDevice == null)
                    {
                        Thread.Sleep(500);
                        continue;
                    }

                    _currentMasterDevice.GetId(out _masterDeviceId);

                    string masterName = GetDeviceFriendlyName(_currentMasterDevice);
                    SpeakerConfig masterCfg = _speakerConfigs.GetOrAdd(_masterDeviceId, k => new SpeakerConfig
                    {
                        Id = k,
                        Name = masterName,
                        Enabled = false,
                        TrimRatio = 1.0f,
                        DelayMs = 0,
                        Balance = 0.0f
                    });
                    masterCfg.Name = masterName;

                    // 2. Register hardware/Windows volume callback on Master Speaker
                    Guid iidVol = IID_IAudioEndpointVolume;
                    object volObj;
                    if (_currentMasterDevice.Activate(ref iidVol, 23, IntPtr.Zero, out volObj) == 0 && volObj != null)
                    {
                        _currentMasterVolume = (IAudioEndpointVolume)volObj;
                        _masterVolumeCallback = new MasterVolumeCallback((newVol, newMute, ctx) =>
                        {
                            if (_volumeSyncEnabled)
                            {
                                SyncAllTargetVolumes(newVol, newMute);
                            }
                        });
                        _currentMasterVolume.RegisterControlChangeNotify(_masterVolumeCallback);
                        SyncAllTargetVolumesFromMaster();
                    }

                    // 3. Set up WASAPI Loopback Capture on Master Speaker if routing is enabled
                    if (_routingEnabled)
                    {
                        Guid iidClient = IID_IAudioClient;
                        object clientObj;
                        if (_currentMasterDevice.Activate(ref iidClient, 23, IntPtr.Zero, out clientObj) == 0 && clientObj != null)
                        {
                            captureAudioClient = (IAudioClient)clientObj;
                            captureAudioClient.GetMixFormat(out mixFormatPtr);

                            WAVEFORMATEX fmt = (WAVEFORMATEX)Marshal.PtrToStructure(mixFormatPtr, typeof(WAVEFORMATEX));
                            int sampleRate = (int)fmt.nSamplesPerSec;
                            int channels = fmt.nChannels;

                            int hr = captureAudioClient.Initialize(
                                AudioClientShareMode.Shared,
                                AudioClientStreamFlags.Loopback,
                                200000,
                                0,
                                mixFormatPtr,
                                IntPtr.Zero);

                            if (hr == 0)
                            {
                                Guid iidCapture = IID_IAudioCaptureClient;
                                object capObj;
                                captureAudioClient.GetService(ref iidCapture, out capObj);
                                captureClient = (IAudioCaptureClient)capObj;

                                foreach (var kv in _speakerConfigs)
                                {
                                    SpeakerConfig cfg = kv.Value;
                                    if (cfg.Enabled && cfg.Id != _masterDeviceId)
                                    {
                                        try
                                        {
                                            IMMDevice targetDev;
                                            if (_enumerator.GetDevice(cfg.Id, out targetDev) == 0 && targetDev != null)
                                            {
                                                uint state;
                                                if (targetDev.GetState(out state) == 0 && state == 1 /* DEVICE_STATE_ACTIVE */)
                                                {
                                                    var renderStream = new TargetRenderStream(targetDev, cfg.Id, cfg, mixFormatPtr, sampleRate, channels, _bufferMs);
                                                    targetStreams.Add(renderStream);
                                                }
                                                else
                                                {
                                                    Marshal.ReleaseComObject(targetDev);
                                                }
                                            }
                                        }
                                        catch
                                        {
                                        }
                                    }
                                }

                                captureAudioClient.Start();

                                float[] tempSamples = new float[sampleRate * channels];
                                long lastHotplugCheckTicks = Environment.TickCount;

                                Thread.CurrentThread.Priority = ThreadPriority.Highest;

                                while (_running && !_needsRestartEngine)
                                {
                                    uint packetSize = 0;
                                    if (captureClient.GetNextPacketSize(out packetSize) != 0)
                                    {
                                        break;
                                    }

                                    bool hadPackets = false;
                                    while (packetSize > 0)
                                    {
                                        hadPackets = true;
                                        IntPtr pData;
                                        uint numFramesRead;
                                        AudioClientBufferFlags flags;
                                        ulong devPos, qpcPos;

                                        if (captureClient.GetBuffer(out pData, out numFramesRead, out flags, out devPos, out qpcPos) != 0)
                                        {
                                            break;
                                        }

                                        int sampleCount = (int)numFramesRead * channels;
                                        if (sampleCount > tempSamples.Length)
                                        {
                                            tempSamples = new float[sampleCount * 2];
                                        }

                                        if ((flags & AudioClientBufferFlags.Silent) != 0 || pData == IntPtr.Zero)
                                        {
                                            Array.Clear(tempSamples, 0, sampleCount);
                                        }
                                        else
                                        {
                                            Marshal.Copy(pData, tempSamples, 0, sampleCount);
                                        }

                                        captureClient.ReleaseBuffer(numFramesRead);

                                        for (int s = 0; s < targetStreams.Count; s++)
                                        {
                                            targetStreams[s].PushSamples(tempSamples, sampleCount);
                                        }

                                        if (captureClient.GetNextPacketSize(out packetSize) != 0)
                                        {
                                            break;
                                        }
                                    }

                                    for (int s = targetStreams.Count - 1; s >= 0; s--)
                                    {
                                        targetStreams[s].PumpToHardware();
                                        if (targetStreams[s].IsFaulted)
                                        {
                                            targetStreams[s].Dispose();
                                            targetStreams.RemoveAt(s);
                                        }
                                    }

                                    long nowTicks = Environment.TickCount;
                                    if (_autoReconnect && (nowTicks - lastHotplugCheckTicks >= 1000))
                                    {
                                        lastHotplugCheckTicks = nowTicks;
                                        foreach (var kv in _speakerConfigs)
                                        {
                                            SpeakerConfig cfg = kv.Value;
                                            if (!cfg.Enabled || cfg.Id == _masterDeviceId) continue;

                                            bool alreadyStreaming = false;
                                            for (int s = 0; s < targetStreams.Count; s++)
                                            {
                                                if (targetStreams[s].DeviceId == cfg.Id)
                                                {
                                                    alreadyStreaming = true;
                                                    break;
                                                }
                                            }

                                            if (!alreadyStreaming)
                                            {
                                                try
                                                {
                                                    IMMDevice targetDev;
                                                    if (_enumerator.GetDevice(cfg.Id, out targetDev) == 0 && targetDev != null)
                                                    {
                                                        uint state;
                                                        if (targetDev.GetState(out state) == 0 && state == 1 /* DEVICE_STATE_ACTIVE */)
                                                        {
                                                            var renderStream = new TargetRenderStream(targetDev, cfg.Id, cfg, mixFormatPtr, sampleRate, channels, _bufferMs);
                                                            targetStreams.Add(renderStream);
                                                            SyncAllTargetVolumesFromMaster();
                                                        }
                                                        else
                                                        {
                                                            Marshal.ReleaseComObject(targetDev);
                                                        }
                                                    }
                                                }
                                                catch { }
                                            }
                                        }
                                    }

                                    if (!hadPackets)
                                    {
                                        Thread.Sleep(2);
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        while (_running && !_needsRestartEngine)
                        {
                            Thread.Sleep(100);
                        }
                    }
                }
                catch (Exception ex)
                {
                    EmitJson("{\"type\":\"error\",\"message\":\"Engine loop warning: " + EscapeJson(ex.Message) + "\"}");
                    Thread.Sleep(500);
                }
                finally
                {
                    for (int i = 0; i < targetStreams.Count; i++)
                    {
                        targetStreams[i].Dispose();
                    }
                    targetStreams.Clear();

                    try { if (captureAudioClient != null) captureAudioClient.Stop(); } catch { }
                    try { if (captureClient != null) Marshal.ReleaseComObject(captureClient); } catch { }
                    try { if (captureAudioClient != null) Marshal.ReleaseComObject(captureAudioClient); } catch { }
                    if (mixFormatPtr != IntPtr.Zero)
                    {
                        Marshal.FreeCoTaskMem(mixFormatPtr);
                    }
                }
            }
        }
    }
}
