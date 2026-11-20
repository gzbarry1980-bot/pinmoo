$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskOutput = Join-Path $taskRoot '复核记录/word-render'
New-Item -ItemType Directory -Path $taskOutput -Force | Out-Null
$taskWord = New-Object -ComObject KWPS.Application
$taskExisting = $taskWord.Documents.Count
$taskVisible = $taskWord.Visible
$taskWord.Visible = $false
$taskWord.DisplayAlerts = 0
$taskResults = @()
try {
  foreach ($taskFile in Get-ChildItem -LiteralPath (Join-Path $taskRoot '平台Word') -Filter '*.docx' -File) {
    $taskDocument = $null
    try {
      $taskDocument = $taskWord.Documents.Open($taskFile.FullName, $false, $true)
      $taskPdf = Join-Path $taskOutput ($taskFile.BaseName + '.pdf')
      $taskDocument.ExportAsFixedFormat($taskPdf, 17)
      $taskResults += [pscustomobject]@{ docx=$taskFile.Name; pdf=$taskPdf; bytes=(Get-Item -LiteralPath $taskPdf).Length }
    } finally {
      if ($null -ne $taskDocument) { $taskDocument.Close(0); [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskDocument) | Out-Null }
    }
  }
} finally {
  if ($taskExisting -eq 0) { $taskWord.Quit() } else { $taskWord.Visible = $taskVisible }
  [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskWord) | Out-Null
}
$taskResults | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $taskOutput 'conversion.json') -Encoding utf8
Write-Output ('Rendered documents: ' + $taskResults.Count)
