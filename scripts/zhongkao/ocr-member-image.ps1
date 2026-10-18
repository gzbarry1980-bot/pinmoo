param([Parameter(Mandatory=$true)][string]$ImagePath)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
$ocrAsTask=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'} | Select-Object -First 1
function Await-OcrOperation($operation,[Type]$resultType){$task=$ocrAsTask.MakeGenericMethod($resultType).Invoke($null,@($operation));$task.Wait();return $task.Result}
$ocrFile=Await-OcrOperation ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path -LiteralPath $ImagePath).Path)) ([Windows.Storage.StorageFile])
$ocrStream=Await-OcrOperation ($ocrFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$ocrDecoder=Await-OcrOperation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($ocrStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$ocrEngine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('zh-Hans-CN'))
if(-not $ocrEngine){throw 'Chinese OCR language is not available.'}
$ocrWidth=[int]$ocrDecoder.PixelWidth;$ocrHeight=[int]$ocrDecoder.PixelHeight
if($ocrWidth -gt [Windows.Media.Ocr.OcrEngine]::MaxImageDimension){throw 'Image width exceeds OCR maximum; review manually.'}
$ocrSegments=@();$ocrTexts=@();$ocrLines=@()
for($ocrTop=0;$ocrTop -lt $ocrHeight;$ocrTop+=2900){
 $ocrTransform=[Windows.Graphics.Imaging.BitmapTransform]::new()
 $ocrBounds=[Windows.Graphics.Imaging.BitmapBounds]::new();$ocrBounds.X=0;$ocrBounds.Y=$ocrTop;$ocrBounds.Width=$ocrWidth;$ocrBounds.Height=[Math]::Min(3000,$ocrHeight-$ocrTop);$ocrTransform.Bounds=$ocrBounds
 $ocrBitmap=Await-OcrOperation ($ocrDecoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,[Windows.Graphics.Imaging.BitmapAlphaMode]::Ignore,$ocrTransform,[Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation,[Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
 $ocrResult=Await-OcrOperation ($ocrEngine.RecognizeAsync($ocrBitmap)) ([Windows.Media.Ocr.OcrResult])
 $lines=@($ocrResult.Lines | ForEach-Object {$_.Text});$ocrTexts+=$ocrResult.Text;$ocrLines+=$lines
 $ocrSegments+=@{offsetY=$ocrTop;lines=$lines};$ocrBitmap.Dispose()
}
$result=[ordered]@{engine='Windows.Media.Ocr zh-Hans-CN';width=$ocrWidth;height=$ocrHeight;text=($ocrTexts -join "`n");lines=$ocrLines;segments=$ocrSegments;status='ocr_unreviewed';note='Long images use overlapping crops; repeated boundary lines may occur.'}
$result | ConvertTo-Json -Depth 5 -Compress
$ocrStream.Dispose()
