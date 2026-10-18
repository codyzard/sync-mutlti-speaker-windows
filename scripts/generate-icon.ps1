Add-Type -AssemblyName System.Drawing

$projectDir = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $projectDir "assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir | Out-Null
}

function Create-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Margin so border isn't clipped
    $pad = [float]([Math]::Max(1.0, $size * 0.04))
    $boxSize = [float]($size - ($pad * 2.0))
    $radius = [float]($boxSize * 0.22)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2.0
    $path.AddArc($pad, $pad, $d, $d, 180, 90)
    $path.AddArc($pad + $boxSize - $d, $pad, $d, $d, 270, 90)
    $path.AddArc($pad + $boxSize - $d, $pad + $boxSize - $d, $d, $d, 0, 90)
    $path.AddArc($pad, $pad + $boxSize - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    # Warm Obsidian surface (#1c1c19 -> RGB 28, 28, 25) matching .brand-icon in App UI
    $brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 28, 28, 25))
    $g.FillPath($brushBg, $path)

    # Crisp 1px-scaled technical border (#2e2e2a -> RGB 46, 46, 42)
    $borderWidth = [float]([Math]::Max(1.0, $size * 0.035))
    $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 52, 52, 47), $borderWidth)
    $g.DrawPath($penBorder, $path)

    # Draw 5 vertical Acoustic Amber (#e06d3b -> RGB 224, 109, 59) waveform bars
    # Matches exact SVG path in App.tsx: M3 10v4 M7 7v10 M11 4v16 M15 8v8 M19 5v14 (centered in 24x24 viewBox)
    $amberBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 224, 109, 59))
    $barWidth = [float]([Math]::Max(1.5, $size * 0.068))

    # Normalized 24-unit coordinates shifted by +1.0 to center x={3,7,11,15,19} at {4,8,12,16,20}
    $bars = @(
        @{ x = 5.4;  y1 = 9.8; y2 = 14.2 },
        @{ x = 8.7;  y1 = 7.0; y2 = 17.0 },
        @{ x = 12.0; y1 = 4.2; y2 = 19.8 },
        @{ x = 15.3; y1 = 8.0; y2 = 16.0 },
        @{ x = 18.6; y1 = 5.2; y2 = 18.8 }
    )

    foreach ($b in $bars) {
        $cx = [float](($b.x / 24.0) * $size)
        $top = [float](($b.y1 / 24.0) * $size)
        $bottom = [float](($b.y2 / 24.0) * $size)
        $h = [float]([Math]::Max($barWidth, $bottom - $top))
        $left = [float]($cx - ($barWidth / 2.0))
        $g.FillRectangle($amberBrush, $left, $top, $barWidth, $h)
    }

    $amberBrush.Dispose()
    $penBorder.Dispose()
    $brushBg.Dispose()
    $path.Dispose()
    $g.Dispose()
    return $bmp
}

$bmp256 = Create-IconBitmap 256
$pngPath = Join-Path $assetsDir "icon.png"
$icoPath = Join-Path $assetsDir "icon.ico"

$bmp256.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Write standard Windows Vista+ PNG-compressed ICO file (256x256, 64x64, 48x48, 32x32, 16x16)
$sizes = @(256, 64, 48, 32, 16)
$pngBuffers = New-Object System.Collections.Generic.List[byte[]]

foreach ($sz in $sizes) {
    $b = Create-IconBitmap $sz
    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBuffers.Add($ms.ToArray())
    $ms.Dispose()
    $b.Dispose()
}
$bmp256.Dispose()

$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR Header (6 bytes)
$bw.Write([uint16]0)             # Reserved
$bw.Write([uint16]1)             # Type 1 = ICO
$bw.Write([uint16]$sizes.Count)  # Image count

$offset = 6 + (16 * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz = $sizes[$i]
    $data = $pngBuffers[$i]
    $wByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bw.Write($wByte)            # Width
    $bw.Write($wByte)            # Height
    $bw.Write([byte]0)           # ColorCount
    $bw.Write([byte]0)           # Reserved
    $bw.Write([uint16]1)         # Planes
    $bw.Write([uint16]32)        # BitCount
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $bw.Write($pngBuffers[$i])
}

$bw.Flush()
$bw.Close()
$fs.Dispose()

Write-Host "Generated icons: $icoPath and $pngPath" -ForegroundColor Green
