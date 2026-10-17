# Read-only hardware summary. No serial numbers, account names or machine identifiers.
$studyRam = $null; $studyGpu = 'Unknown'; $studyVram = $null; $studyThreads = $null
try { $studySystem = Get-CimInstance Win32_ComputerSystem; $studyRam = [math]::Round($studySystem.TotalPhysicalMemory / 1GB, 1); $studyThreads = $studySystem.NumberOfLogicalProcessors } catch {}
try { $studyGpu = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ' / ' } catch {}
$studySmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($studySmi) {
  try { $studyLines = & $studySmi.Source --query-gpu=name,memory.total --format=csv,noheader,nounits; $studyBest = $studyLines | ForEach-Object { $studyParts = $_ -split ','; [pscustomobject]@{Name=$studyParts[0].Trim(); GB=[double]$studyParts[-1].Trim()/1024} } | Sort-Object GB -Descending | Select-Object -First 1; $studyVram = [math]::Round($studyBest.GB,1); $studyGpu = $studyBest.Name } catch {}
}
$studyReport = @{schema=1;os='windows';ramGB=$studyRam;vramGB=$studyVram;gpu=$studyGpu;threads=$studyThreads}
$studyOutput = Join-Path ([Environment]::GetFolderPath('Desktop')) 'osteon-hardware.json'
$studyReport | ConvertTo-Json | Set-Content -LiteralPath $studyOutput -Encoding UTF8
Write-Host "Report saved to $studyOutput. Import it in Osteon's Device tab. Missing VRAM means Windows did not report a reliable total."
Read-Host 'Press Enter to close'
