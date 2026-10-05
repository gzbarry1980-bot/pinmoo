param([string]$Root='E:\pinmoo\guangzhou-zhongkao\research\wecom-source-20261005')
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.SoftwareBitmap,Windows.Foundation,ContentType=WindowsRuntime]
function Await-WinRT($Operation,$Type){
  $method=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'} | Select-Object -First 1
  $task=$method.MakeGenericMethod($Type).Invoke($null,@($Operation));$task.Wait();$task.Result
}
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if(!$engine){throw 'Windows OCR language unavailable'}
$manifest=Get-Content -LiteralPath (Join-Path $Root 'capture-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$outputDir=Join-Path $Root 'ocr';New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$all=New-Object System.Collections.Generic.List[string]
$all.Add('# 企微文档截图识别备份');$all.Add('OCR原文未逐格复核。水印、合并单元格与数字可能识别错误；不得直接作为官方数据使用。')
foreach($sheet in $manifest.sheets){
 $all.Add("`n## $($sheet.name)")
 foreach($capture in $sheet.captures){
  $path=Join-Path $Root $capture.file
  $file=Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
  $stream=Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder=Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap=Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $result=Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $lines=@($result.Lines | ForEach-Object { @{text=$_.Text;words=@($_.Words|ForEach-Object {@{text=$_.Text;x=$_.BoundingRect.X;y=$_.BoundingRect.Y;width=$_.BoundingRect.Width;height=$_.BoundingRect.Height}})} })
  $stem=[IO.Path]::GetFileNameWithoutExtension($path)
  @{source=$capture.file;lines=$lines;text=$result.Text} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $outputDir "$stem.json") -Encoding UTF8
  $all.Add("`n### $($capture.file)`n$($result.Text)")
  $bitmap.Dispose();$stream.Dispose()
 }
 Write-Output "OCR completed: $($sheet.name)"
}
$all | Set-Content -LiteralPath (Join-Path $Root 'ocr-full-unverified.md') -Encoding UTF8
