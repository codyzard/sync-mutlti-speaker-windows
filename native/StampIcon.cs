using System;
using System.IO;
using System.Runtime.InteropServices;

class StampIcon
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr BeginUpdateResource(string pFileName, bool bDeleteExistingResources);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool UpdateResource(IntPtr hUpdate, IntPtr lpType, IntPtr lpName, ushort wLanguage, byte[] lpData, uint cbData);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool EndUpdateResource(IntPtr hUpdate, bool fDiscard);

    [DllImport("shell32.dll")]
    static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);

    static readonly IntPtr RT_ICON = (IntPtr)3;
    static readonly IntPtr RT_GROUP_ICON = (IntPtr)14;
    const int SHCNE_ASSOCCHANGED = 0x08000000;
    const uint SHCNF_IDLIST = 0x0000;

    static int Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("Usage: StampIcon.exe <exePath> <icoPath>");
            return 1;
        }

        string exePath = args[0];
        string icoPath = args[1];

        byte[] icoBytes = File.ReadAllBytes(icoPath);
        using (MemoryStream ms = new MemoryStream(icoBytes))
        using (BinaryReader br = new BinaryReader(ms))
        {
            ushort reserved = br.ReadUInt16();
            ushort type = br.ReadUInt16();
            ushort count = br.ReadUInt16();

            byte[] width = new byte[count];
            byte[] height = new byte[count];
            byte[] colorCount = new byte[count];
            byte[] entryReserved = new byte[count];
            ushort[] planes = new ushort[count];
            ushort[] bitCount = new ushort[count];
            uint[] bytesInRes = new uint[count];
            uint[] imageOffset = new uint[count];

            for (int i = 0; i < count; i++)
            {
                width[i] = br.ReadByte();
                height[i] = br.ReadByte();
                colorCount[i] = br.ReadByte();
                entryReserved[i] = br.ReadByte();
                planes[i] = br.ReadUInt16();
                bitCount[i] = br.ReadUInt16();
                bytesInRes[i] = br.ReadUInt32();
                imageOffset[i] = br.ReadUInt32();
            }

            IntPtr hUpdate = BeginUpdateResource(exePath, false);
            if (hUpdate == IntPtr.Zero)
            {
                Console.Error.WriteLine("BeginUpdateResource failed: " + Marshal.GetLastWin32Error());
                return 2;
            }

            // Build GRPICONDIR structure
            using (MemoryStream grpMs = new MemoryStream())
            using (BinaryWriter grpBw = new BinaryWriter(grpMs))
            {
                grpBw.Write(reserved);
                grpBw.Write(type);
                grpBw.Write(count);

                for (int i = 0; i < count; i++)
                {
                    ushort iconId = (ushort)(i + 1);
                    grpBw.Write(width[i]);
                    grpBw.Write(height[i]);
                    grpBw.Write(colorCount[i]);
                    grpBw.Write(entryReserved[i]);
                    grpBw.Write(planes[i]);
                    grpBw.Write(bitCount[i]);
                    grpBw.Write(bytesInRes[i]);
                    grpBw.Write(iconId);

                    byte[] imgData = new byte[bytesInRes[i]];
                    Array.Copy(icoBytes, (int)imageOffset[i], imgData, 0, (int)bytesInRes[i]);

                    // Update RT_ICON for language 1033 (en-US) and 0 (neutral)
                    UpdateResource(hUpdate, RT_ICON, (IntPtr)iconId, 1033, imgData, (uint)imgData.Length);
                    UpdateResource(hUpdate, RT_ICON, (IntPtr)iconId, 0, imgData, (uint)imgData.Length);
                }

                grpBw.Flush();
                byte[] grpBytes = grpMs.ToArray();

                // Electron's main icon group resource is named "IDR_MAINFRAME" or ID 1
                IntPtr idrMainFrame = Marshal.StringToHGlobalUni("IDR_MAINFRAME");
                UpdateResource(hUpdate, RT_GROUP_ICON, idrMainFrame, 1033, grpBytes, (uint)grpBytes.Length);
                UpdateResource(hUpdate, RT_GROUP_ICON, idrMainFrame, 0, grpBytes, (uint)grpBytes.Length);
                UpdateResource(hUpdate, RT_GROUP_ICON, (IntPtr)1, 1033, grpBytes, (uint)grpBytes.Length);
                UpdateResource(hUpdate, RT_GROUP_ICON, (IntPtr)1, 0, grpBytes, (uint)grpBytes.Length);
                Marshal.FreeHGlobal(idrMainFrame);
            }

            if (!EndUpdateResource(hUpdate, false))
            {
                Console.Error.WriteLine("EndUpdateResource failed: " + Marshal.GetLastWin32Error());
                return 3;
            }
        }

        // Flush Windows Explorer icon cache immediately
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, IntPtr.Zero, IntPtr.Zero);

        Console.WriteLine("Successfully stamped icon onto " + exePath);
        return 0;
    }
}
