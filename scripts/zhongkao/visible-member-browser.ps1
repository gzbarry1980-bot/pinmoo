param([ValidateSet('Snapshot','Read','Address','Click','Scroll','Back')][string]$Action='Snapshot',[int]$X=1480,[int]$Y=580,[int]$Delta=-600)
# Only normal on-screen browser interaction. No session/cookie/database access.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class MemberPageUI {
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern void mouse_event(uint flags,uint dx,uint dy,int data,UIntPtr extra);
}
'@
$memberWindow=Get-Process | Where-Object { $_.ProcessName -eq 'ChatGPT' -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if(-not $memberWindow -or [MemberPageUI]::GetForegroundWindow() -ne $memberWindow.MainWindowHandle){throw 'The Codex window must be in the foreground; no interaction was performed.'}
$memberBounds=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds
if($memberBounds.Width -ne 1920 -or $memberBounds.Height -lt 1040){throw 'Screen geometry changed; inspect and recalibrate first.'}
function Click-MemberPage([int]$px,[int]$py){
 if($px -lt 1080 -or $px -gt 1895 -or $py -lt 95 -or $py -gt 1020){throw 'Point is outside the approved browser pane'}
 [MemberPageUI]::SetCursorPos($px,$py)|Out-Null
 [MemberPageUI]::mouse_event(2,0,0,0,[UIntPtr]::Zero)
 [MemberPageUI]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
}
if($Action -in @('Read','Address')){
 $memberOldClipboard=[System.Windows.Forms.Clipboard]::GetDataObject()
 $memberSavedClipboard=New-Object System.Windows.Forms.DataObject
 if($memberOldClipboard){foreach($memberFormat in $memberOldClipboard.GetFormats($false)){try{$memberSavedClipboard.SetData($memberFormat,$memberOldClipboard.GetData($memberFormat,$false))}catch{}}}
 try{
  if($Action -eq 'Address'){Click-MemberPage 1450 120}else{Click-MemberPage $X $Y}
  [System.Windows.Forms.Clipboard]::Clear()
  [System.Windows.Forms.SendKeys]::SendWait('^a');Start-Sleep -Milliseconds 120
  [System.Windows.Forms.SendKeys]::SendWait('^c');Start-Sleep -Milliseconds 250
  $memberVisibleText=[System.Windows.Forms.Clipboard]::GetText()
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}')
  Write-Output $memberVisibleText
 }finally{[System.Windows.Forms.Clipboard]::SetDataObject($memberSavedClipboard,$true)}
}
if($Action -eq 'Click'){Click-MemberPage $X $Y;Start-Sleep -Milliseconds 1800}
if($Action -eq 'Scroll'){[MemberPageUI]::SetCursorPos(1700,760)|Out-Null;[MemberPageUI]::mouse_event(2048,0,0,$Delta,[UIntPtr]::Zero);Start-Sleep -Milliseconds 300}
if($Action -eq 'Back'){Click-MemberPage 1098 120;Start-Sleep -Milliseconds 1600}
$memberOut='E:/pinmoo/guangzhou-zhongkao/research/member-resources-20261013'
[System.IO.Directory]::CreateDirectory($memberOut)|Out-Null
$memberImage=New-Object System.Drawing.Bitmap(840,990)
$memberGraphics=[System.Drawing.Graphics]::FromImage($memberImage)
$memberGraphics.CopyFromScreen([System.Drawing.Point]::new(1075,35),[System.Drawing.Point]::Empty,[System.Drawing.Size]::new(840,990))
$memberCapture=$memberOut+'/current-pane.png'
$memberImage.Save($memberCapture,[System.Drawing.Imaging.ImageFormat]::Png)
$memberGraphics.Dispose();$memberImage.Dispose()
Write-Output $memberCapture
