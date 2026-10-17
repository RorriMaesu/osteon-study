# Osteon: allow this GitHub Pages origin to use your local Ollama.
# No administrator access, downloads, firewall changes or public server binding.
$ErrorActionPreference = 'Stop'
$studyOrigin = 'https://rorrimaesu.github.io'
$currentOrigins = [Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS', 'User')
$studyOrigins = @($currentOrigins -split ',' | Where-Object { $_ -and $_ -ne $studyOrigin }) + $studyOrigin
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', ($studyOrigins -join ','), 'User')
$env:OLLAMA_ORIGINS = $studyOrigins -join ','
$env:OLLAMA_HOST = '127.0.0.1:11434'
$studyOllama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
if (-not (Test-Path -LiteralPath $studyOllama)) {
  $studyOllama = (Get-Command ollama -ErrorAction SilentlyContinue).Source
}
if (-not $studyOllama) { Write-Host 'Install Ollama first from https://ollama.com/download/windows'; Read-Host 'Press Enter to close'; exit }
if (Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue) {
  Write-Host 'Ollama is already running. Quit it from its tray menu, then run this file again so it receives the new setting.'
} else {
  Start-Process -FilePath $studyOllama -ArgumentList 'serve' -WindowStyle Hidden
  Write-Host 'Started Ollama on this computer. Return to Osteon and click Connect. Allow the browser local-network prompt if shown.'
}
Write-Host 'Only the Osteon GitHub Pages origin was added. To undo, remove it from your user OLLAMA_ORIGINS environment variable.'
Read-Host 'Press Enter to close'
