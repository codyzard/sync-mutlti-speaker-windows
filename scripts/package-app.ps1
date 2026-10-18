$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectDir "release\Multi-Speaker Sync Studio"
$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

Write-Host "Stopping running instances..." -ForegroundColor Cyan
Get-Process -Name "Multi-Speaker Sync Studio","electron","AudioEngine" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 400

# Ensure icons exist
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "generate-icon.ps1")

# Compile StampIcon.exe
$binDir = Join-Path $projectDir "bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }
$stampExe = Join-Path $binDir "StampIcon.exe"
& $cscPath /nologo /optimize+ /target:exe /out:$stampExe (Join-Path $projectDir "native\StampIcon.cs")

if (Test-Path $releaseDir) {
    Remove-Item $releaseDir -Recurse -Force
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null

Write-Host "Copying Electron runtime..." -ForegroundColor Cyan
Copy-Item -Path (Join-Path $projectDir "node_modules\electron\dist\*") -Destination $releaseDir -Recurse -Force

$exeFile = Join-Path $releaseDir "Multi-Speaker Sync Studio.exe"
Rename-Item -Path (Join-Path $releaseDir "electron.exe") -NewName "Multi-Speaker Sync Studio.exe"

# Remove default_app.asar if present
$defaultAsar = Join-Path $releaseDir "resources\default_app.asar"
if (Test-Path $defaultAsar) {
    Remove-Item $defaultAsar -Force
}

# Create resources/app, resources/bin, resources/assets
$appResDir = Join-Path $releaseDir "resources\app"
$binResDir = Join-Path $releaseDir "resources\bin"
$assetsResDir = Join-Path $releaseDir "resources\assets"
New-Item -ItemType Directory -Path $appResDir -Force | Out-Null
New-Item -ItemType Directory -Path $binResDir -Force | Out-Null
New-Item -ItemType Directory -Path $assetsResDir -Force | Out-Null

Write-Host "Packaging application files, icons & WASAPI AudioEngine..." -ForegroundColor Cyan
Copy-Item -Path (Join-Path $projectDir "package.json") -Destination $appResDir -Force
Copy-Item -Path (Join-Path $projectDir "dist") -Destination (Join-Path $appResDir "dist") -Recurse -Force
Copy-Item -Path (Join-Path $projectDir "dist-electron") -Destination (Join-Path $appResDir "dist-electron") -Recurse -Force
Copy-Item -Path (Join-Path $projectDir "assets") -Destination (Join-Path $appResDir "assets") -Recurse -Force
Copy-Item -Path (Join-Path $projectDir "assets\*") -Destination $assetsResDir -Recurse -Force
Copy-Item -Path (Join-Path $projectDir "bin\AudioEngine.exe") -Destination (Join-Path $binResDir "AudioEngine.exe") -Force

# Stamp custom icon.ico directly into the Windows PE executable!
$icoPath = Join-Path $projectDir "assets\icon.ico"
& $stampExe $exeFile $icoPath

# Also create a convenient shortcut right at the root of f:\audio-controller with the custom icon
$lnkPath = Join-Path $projectDir "Multi-Speaker Sync Studio.lnk"
if (Test-Path $lnkPath) { Remove-Item $lnkPath -Force }
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($lnkPath)
$Shortcut.TargetPath = $exeFile
$Shortcut.WorkingDirectory = $releaseDir
$Shortcut.IconLocation = "$exeFile,0"
$Shortcut.Description = "Windows Multi-Speaker Sync Studio"
$Shortcut.Save()

# Refresh Windows Explorer icon cache
& ie4uinit.exe -show -ErrorAction SilentlyContinue

Write-Host "Successfully built standalone app with custom icon at: $exeFile" -ForegroundColor Green
