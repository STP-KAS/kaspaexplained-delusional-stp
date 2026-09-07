# Kaspa Explained UI — local preview (Windows)
$Host.UI.RawUI.WindowTitle = "Kaspa Explained UI"
Set-Location $PSScriptRoot

Write-Host "Kaspa Explained UI"

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$url = "http://127.0.0.1:8899/"
$busy = $false
try {
  $conn = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction Stop | Select-Object -First 1
  if ($conn) { $busy = $true }
} catch {}

Start-Process $url
if ($busy) {
  Write-Host "Already running. Opened $url"
  exit 0
}

Write-Host "Open $url"
node scripts/static-preview.mjs dist
