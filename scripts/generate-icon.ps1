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
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded dark blue gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 14, 116, 144),
        [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
        45.0
    )

    $radius = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brushBg, $path)

    # Border glow
    $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 56, 189, 248), [Math]::Max(1, [int]($size * 0.03)))
    $g.DrawPath($penBorder, $path)

    # Draw Speaker Cone in White / Cyan
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 240, 249, 255))
    $speakerPts = @(
        (New-Object System.Drawing.PointF(($size * 0.20), ($size * 0.39))),
        (New-Object System.Drawing.PointF(($size * 0.33), ($size * 0.39))),
        (New-Object System.Drawing.PointF(($size * 0.48), ($size * 0.24))),
        (New-Object System.Drawing.PointF(($size * 0.48), ($size * 0.76))),
        (New-Object System.Drawing.PointF(($size * 0.33), ($size * 0.61))),
        (New-Object System.Drawing.PointF(($size * 0.20), ($size * 0.61)))
    )
    $g.FillPolygon($whiteBrush, $speakerPts)

    # Draw Dual Sound Waves in Neon Cyan & Emerald
    $penWave1 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), [Math]::Max(2, [int]($size * 0.065)))
    $penWave1.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWave1.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($penWave1, [float]($size * 0.40), [float]($size * 0.30), [float]($size * 0.26), [float]($size * 0.40), -50, 100)

    $penWave2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 52, 211, 153), [Math]::Max(2, [int]($size * 0.065)))
    $penWave2.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penWave2.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawArc($penWave2, [float]($size * 0.44), [float]($size * 0.18), [float]($size * 0.38), [float]($size * 0.64), -50, 100)

    $g.Dispose()
    return $bmp
}

$bmp256 = Create-IconBitmap 256
$pngPath = Join-Path $assetsDir "icon.png"
$icoPath = Join-Path $assetsDir "icon.ico"

$bmp256.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Write standard Windows Vista+ PNG-compressed ICO file (256x256, 64x64, 32x32, 16x16)
$sizes = @(256, 64, 32, 16)
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
