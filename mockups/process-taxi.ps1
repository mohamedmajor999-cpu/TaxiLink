Add-Type -AssemblyName System.Drawing
$srcPath = 'C:\Users\moham\Mes projets\TaxiLink\apps\web\public\icons\taxi-top-original.png'
$outPath = 'C:\Users\moham\Mes projets\TaxiLink\apps\web\public\icons\taxi-top-processed.png'

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width; $h = $src.Height
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

# Flood-fill BFS from the 4 corners to mark background pixels (near-white only)
$visited = New-Object 'bool[,]' $w, $h
$stack = New-Object System.Collections.Generic.Stack[object]
foreach ($seed in @(@(0,0), @(($w-1),0), @(0,($h-1)), @(($w-1),($h-1)))) {
    $stack.Push($seed)
}

while ($stack.Count -gt 0) {
    $p = $stack.Pop()
    $x = $p[0]; $y = $p[1]
    if ($x -lt 0 -or $x -ge $w -or $y -lt 0 -or $y -ge $h) { continue }
    if ($visited[$x, $y]) { continue }
    $i = $y * $stride + $x * 4
    # Only flood through near-white (tight tolerance to keep car body intact)
    if ($bytes[$i] -lt 245 -or $bytes[$i+1] -lt 245 -or $bytes[$i+2] -lt 245) { continue }
    $visited[$x, $y] = $true
    $bytes[$i+3] = 0  # Make transparent
    $stack.Push(@(($x+1), $y))
    $stack.Push(@(($x-1), $y))
    $stack.Push(@($x, ($y+1)))
    $stack.Push(@($x, ($y-1)))
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$src.UnlockBits($data)

# Save WITHOUT cropping — same dimensions as original
$src.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved: $($src.Width)x$($src.Height)"
$src.Dispose()
