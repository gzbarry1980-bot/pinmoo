param(
 [Parameter(Mandatory=$true)][string]$ImageDirectory,
 [Parameter(Mandatory=$true)][string]$OutputDirectory
)
# Derived OCR artifacts only. Originals are read-only; these results are not public data.
$memberImageRoot=(Resolve-Path -LiteralPath $ImageDirectory).Path
$memberOutputRoot=[IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $memberOutputRoot | Out-Null
$memberImages=Get-ChildItem -LiteralPath $memberImageRoot -File -Recurse | Where-Object {$_.Extension -in @('.png','.jpg','.jpeg','.webp','.gif')}
$memberDone=0;$memberFailed=0;$memberSkipped=0
foreach($memberImage in $memberImages){
 $memberHash=(Get-FileHash -LiteralPath $memberImage.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
 $memberOutput=Join-Path $memberOutputRoot ($memberHash+'.json')
 if(Test-Path -LiteralPath $memberOutput){$memberSkipped++;continue}
 try{
  $memberOcr=(& "$PSScriptRoot/ocr-member-image.ps1" -ImagePath $memberImage.FullName | Out-String) | ConvertFrom-Json
  $memberOcr | Add-Member -NotePropertyName sourceImage -NotePropertyValue $memberImage.FullName
  $memberOcr | Add-Member -NotePropertyName sourceSHA256 -NotePropertyValue $memberHash
  [IO.File]::WriteAllText($memberOutput,($memberOcr | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
  $memberDone++
 }catch{
  $memberError=[ordered]@{status='ocr_failed';sourceImage=$memberImage.FullName;sourceSHA256=$memberHash;error=$_.Exception.Message}
  [IO.File]::WriteAllText($memberOutput,($memberError | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
  $memberFailed++
 }
 if(($memberDone+$memberFailed)%25 -eq 0){Write-Output "OCR progress: $memberDone completed, $memberFailed failed, $memberSkipped reused"}
}
[ordered]@{images=$memberImages.Count;completed=$memberDone;failed=$memberFailed;reused=$memberSkipped;status='ocr_unreviewed';output=$memberOutputRoot} | ConvertTo-Json -Compress
