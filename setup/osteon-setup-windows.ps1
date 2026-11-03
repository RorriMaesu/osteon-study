# Osteon one-time local AI setup. Windows PowerShell 5.1 or PowerShell 7.
# No execution-policy changes, administrator elevation, firewall rules, or extra service.
[CmdletBinding()]
param([switch]$CheckOnly, [switch]$Undo, [switch]$HardwareOnly)
$ErrorActionPreference = 'Stop'
$studyOrigin = 'https://rorrimaesu.github.io'
$studySettings = Join-Path $env:LOCALAPPDATA 'Osteon\setup'

function Find-StudyOllama {
    $studyCommand = Get-Command ollama.exe -ErrorAction SilentlyContinue
    $studyCandidates = @((Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'))
    if ($env:ProgramFiles) { $studyCandidates += Join-Path $env:ProgramFiles 'Ollama\ollama.exe' }
    if ($studyCommand) { $studyCandidates += $studyCommand.Source }
    foreach ($studyCandidate in $studyCandidates) {
        if ($studyCandidate -and (Test-Path -LiteralPath $studyCandidate -PathType Leaf)) { return (Resolve-Path -LiteralPath $studyCandidate).Path }
    }
    return $null
}
function Get-StudyHardware {
    $studyReport = @{schema=1;os='windows';ramGB=$null;vramGB=$null;gpu='Not reported';threads=$null;freeDiskGB=$null}
    try {
        $studySystem = Get-CimInstance Win32_ComputerSystem
        $studyReport.ramGB = [math]::Round($studySystem.TotalPhysicalMemory / 1GB,1)
        $studyReport.threads = $studySystem.NumberOfLogicalProcessors
    } catch {}
    try { $studyReport.gpu = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ' / ' } catch {}
    $studySmi = Get-Command nvidia-smi.exe -ErrorAction SilentlyContinue
    if ($studySmi) {
        try {
            $studyGpuRows = & $studySmi.Source --query-gpu=name,memory.total --format=csv,noheader,nounits
            $studyGpu = $studyGpuRows | ForEach-Object {
                $studyParts = $_ -split ','
                [pscustomobject]@{Name=$studyParts[0].Trim();GB=[double]$studyParts[-1].Trim()/1024}
            } | Sort-Object GB -Descending | Select-Object -First 1
            $studyReport.gpu = $studyGpu.Name
            $studyReport.vramGB = [math]::Round($studyGpu.GB,1)
        } catch {}
    }
    try {
        $studyModelPath = if ($env:OLLAMA_MODELS) { $env:OLLAMA_MODELS } else { Join-Path $env:USERPROFILE '.ollama\models' }
        $studyDriveName = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($studyModelPath)).TrimEnd('\').TrimEnd(':')
        $studyDrive = Get-PSDrive -Name $studyDriveName -PSProvider FileSystem
        $studyReport.freeDiskGB = [math]::Round($studyDrive.Free / 1GB,1)
    } catch {}
    return $studyReport
}
function Test-StudyService {
    try { $studyVersion = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 3; return [bool]$studyVersion.version } catch { return $false }
}
function Open-StudyReport($studyReport) {
    $studyJson = $studyReport | ConvertTo-Json -Compress
    $studyEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($studyJson)).TrimEnd('=').Replace('+','-').Replace('/','_')
    Start-Process -FilePath ('https://rorrimaesu.github.io/osteon-study/#local-ai-setup='+$studyEncoded)
}
function Restart-StudyOllama([string]$studyExe) {
    $studyInstallRoot = [IO.Path]::GetFullPath((Split-Path -Parent $studyExe)).TrimEnd('\') + '\'
    $studySession = (Get-Process -Id $PID).SessionId
    $studyProcesses = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
        try { $_.ProcessName -match '^ollama(?:[ -]|$)' -and $_.SessionId -eq $studySession -and $_.Path -and [IO.Path]::GetFullPath($_.Path).StartsWith($studyInstallRoot,[StringComparison]::OrdinalIgnoreCase) } catch { $false }
    })
    if ($studyProcesses.Count -gt 0) {
        Write-Host 'Ollama must restart to receive the website setting.'
        Write-Host 'This stops current Ollama conversations and loaded models in this Windows session.'
        if ((Read-Host 'Type RESTART to continue, or press Enter to stop') -ne 'RESTART') { throw 'No restart performed. Finish other Ollama work, then run this assistant again.' }
        foreach ($studyProcess in $studyProcesses) { Stop-Process -Id $studyProcess.Id -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
    }
    if (Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 11434 is still in use. No other process was stopped. Quit the remaining Ollama instance or ask your computer administrator for help.'
    }
    Start-Process -FilePath $studyExe -ArgumentList 'serve' -WindowStyle Hidden
    for ($studyAttempt=0; $studyAttempt -lt 20; $studyAttempt++) {
        if (Test-StudyService) { return }
        Start-Sleep -Seconds 1
    }
    throw 'Ollama did not start in time. Open Ollama from the Start menu and use Check again in Osteon.'
}

try {
    Write-Host ''
    Write-Host 'OSTEON - LOCAL AI SETUP'
    Write-Host 'Your conversations stay on this computer. Models are downloaded separately in Osteon.'
    $studyExe = Find-StudyOllama
    $studyReport = Get-StudyHardware
    if ($CheckOnly) {
        [pscustomobject]@{installed=[bool]$studyExe;running=(Test-StudyService);hardware=$studyReport} | ConvertTo-Json -Depth 4
        exit 0
    }
    if ($Undo) {
        $studyBackup = Get-ChildItem -LiteralPath $studySettings -Filter 'settings-*.json' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if (-not $studyBackup) { throw 'No saved Osteon settings backup was found.' }
        Write-Host 'This restores the website and host settings saved before the last setup.'
        if ((Read-Host 'Type RESTORE to continue') -ne 'RESTORE') { exit 0 }
        $studyOld = Get-Content -LiteralPath $studyBackup.FullName -Raw | ConvertFrom-Json
        foreach ($studyName in @('OLLAMA_ORIGINS','OLLAMA_HOST')) {
            $studyValue = $studyOld.$studyName
            [Environment]::SetEnvironmentVariable($studyName,$studyValue,'User')
            [Environment]::SetEnvironmentVariable($studyName,$studyValue,'Process')
        }
        Write-Host 'Settings restored. Quit and reopen Ollama to apply them.'
        Read-Host 'Press Enter to close'; exit 0
    }
    Write-Host ''
    Write-Host 'This assistant will:'
    Write-Host '  1. Find Ollama, or download and open its official installer if it is missing.'
    Write-Host '  2. Save a backup of your Ollama website and host settings.'
    Write-Host '  3. Add https://rorrimaesu.github.io to the allowed websites, preserving existing entries.'
    Write-Host '  4. Keep Ollama on this computer only, and ask before restarting it.'
    Write-Host '  5. Return a RAM/GPU report to Osteon in a local browser fragment.'
    Write-Host 'No account names, serial numbers, conversations, or computer identifiers are collected.'
    $studyChoice = if ($HardwareOnly) { 'HARDWARE' } else { Read-Host 'Type SETUP to continue, HARDWARE for a report only, or press Enter to cancel' }
    if ($studyChoice -eq 'HARDWARE') {
        Write-Host 'Opening the hardware report in Osteon. No Ollama settings were changed.'
        Open-StudyReport $studyReport
        Read-Host 'Press Enter to close'; exit 0
    }
    if ($studyChoice -ne 'SETUP') { exit 0 }

    if (-not $studyExe) {
        Write-Host 'Downloading the official Ollama installer. This can take a few minutes...'
        $studyInstaller = Join-Path ([IO.Path]::GetTempPath()) ('osteon-ollama-'+[guid]::NewGuid().ToString('N')+'.exe')
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile $studyInstaller -UseBasicParsing -TimeoutSec 1800
            $studySignature = Get-AuthenticodeSignature -LiteralPath $studyInstaller
            if ($studySignature.Status -ne 'Valid' -or $studySignature.SignerCertificate.Subject -notmatch '(?i)Ollama') { throw 'The installer publisher could not be verified. Nothing was launched. Download Ollama manually from ollama.com.' }
            Write-Host 'Verified Ollama publisher. Follow the installer window, then close it when finished.'
            Start-Process -FilePath $studyInstaller -Wait
        } finally {
            if ($studyInstaller -and (Test-Path -LiteralPath $studyInstaller)) { Remove-Item -LiteralPath $studyInstaller -Force }
        }
        $studyExe = Find-StudyOllama
        if (-not $studyExe) { throw 'Ollama was not found after installation. Open it from the Start menu, then run this assistant again.' }
    }
    New-Item -ItemType Directory -Path $studySettings -Force | Out-Null
    $studyOld = @{OLLAMA_ORIGINS=[Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS','User');OLLAMA_HOST=[Environment]::GetEnvironmentVariable('OLLAMA_HOST','User')}
    # Preserve inherited system origins as well as user-specific entries.
    $studyOrigins = @($env:OLLAMA_ORIGINS -split ','; $studyOld.OLLAMA_ORIGINS -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -Unique
    $studyOrigins = (@($studyOrigins | Where-Object { $_ -ne $studyOrigin }) + $studyOrigin) -join ','
    # Only changes create a backup, so rerunning a successful setup does not
    # replace the settings that Undo should restore.
    $studyBackupPath = $null
    if ($studyOld.OLLAMA_ORIGINS -ne $studyOrigins -or $studyOld.OLLAMA_HOST -ne '127.0.0.1:11434') {
        $studyBackupPath = Join-Path $studySettings ('settings-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N')+'.json')
        $studyOld | ConvertTo-Json | Set-Content -LiteralPath $studyBackupPath -Encoding UTF8
    }
    [Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS',$studyOrigins,'User')
    [Environment]::SetEnvironmentVariable('OLLAMA_HOST','127.0.0.1:11434','User')
    $env:OLLAMA_ORIGINS = $studyOrigins
    $env:OLLAMA_HOST = '127.0.0.1:11434'
    Restart-StudyOllama $studyExe
    $studyReport = Get-StudyHardware
    if ($studyReport.freeDiskGB -ne $null -and $studyReport.freeDiskGB -lt 8) { Write-Host 'Storage is low. Consider freeing space before downloading a model.' }
    Write-Host ''
    Write-Host 'Ollama is responding on this computer. Osteon still needs to verify browser permission and a model.'
    Write-Host 'Opening Osteon. Click Check connection and allow the browser connection if asked.'
    Write-Host 'If an exam is open in another tab, keep that tab; its answers are unchanged.'
    Open-StudyReport $studyReport
    if ($studyBackupPath) { Write-Host ('Settings backup: '+$studyBackupPath) }
    Write-Host 'To restore later, run this assistant with -Undo. No model files are removed.'
    Read-Host 'Press Enter to close'
} catch {
    Write-Host ''
    Write-Host ('Setup needs attention: '+$_.Exception.Message) -ForegroundColor Yellow
    Write-Host 'Your study tools still work without AI. Use the manual connection steps in Osteon if needed.'
    if (-not $CheckOnly) { Read-Host 'Press Enter to close' }
    exit 1
}
