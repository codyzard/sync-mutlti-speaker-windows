$ErrorActionPreference = "Stop"
$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$srcPath = Join-Path $PSScriptRoot "..\native\AudioEngine.cs"
$outDir = Join-Path $PSScriptRoot "..\bin"
$outPath = Join-Path $outDir "AudioEngine.exe"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# Stop existing AudioEngine.exe if running so we can overwrite it
Get-Process -Name "AudioEngine" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Compiling Windows Core Audio (WASAPI) Engine..." -ForegroundColor Cyan
& $cscPath /nologo /optimize+ /unsafe /target:exe /out:$outPath $srcPath

if ($LASTEXITCODE -ne 0) {
    throw "Failed to compile AudioEngine.cs"
}
Write-Host "Successfully built $outPath" -ForegroundColor Green
