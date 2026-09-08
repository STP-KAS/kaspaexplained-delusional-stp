# Kaspa Explained STP - local preview (Windows)
$Host.UI.RawUI.WindowTitle = "Kaspa Explained STP"
Set-Location $PSScriptRoot

Write-Host "Kaspa Explained STP"

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$loopback = "http://127.0.0.1:8899/"
$url = "http://kaspaexplained-stp.localhost:8899/"
$busy = $false
try {
  $conn = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction Stop | Select-Object -First 1
  if ($conn) { $busy = $true }
} catch {}

Start-Process $url
if ($busy) {
  Write-Host "Already running. Opened $url"
  Write-Host "Also $loopback"
  exit 0
}

Write-Host "Open $url"
Write-Host "Also $loopback"
node scripts/static-preview.mjs dist
