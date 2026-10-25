Add-Type -AssemblyName System.Drawing

function Generate-MusifyIcon([string]$path, [int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Background squircle
    $corner = [float]($size * 0.22)
    $path_shape = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path_shape.AddArc([float]0, [float]0, [float]($corner * 2), [float]($corner * 2), [float]180, [float]90)
    $path_shape.AddArc([float]($size - $corner * 2), [float]0, [float]($corner * 2), [float]($corner * 2), [float]270, [float]90)
    $path_shape.AddArc([float]($size - $corner * 2), [float]($size - $corner * 2), [float]($corner * 2), [float]($corner * 2), [float]0, [float]90)
    $path_shape.AddArc([float]0, [float]($size - $corner * 2), [float]($corner * 2), [float]($corner * 2), [float]90, [float]90)
    $path_shape.CloseFigure()
    
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 14, 18))
    $g.FillPath($brush, $path_shape)

    # Border
    $penWidth = [float][Math]::Max(1.0, ($size * 0.015))
    $pen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::FromArgb(60, 255, 255, 255)), $penWidth
    $g.DrawPath($pen, $path_shape)

    # Outer glow ring
    $ringWidth = [float]($size * 0.03)
    $ringPen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.Color]::FromArgb(60, 237, 85, 100)), $ringWidth
    $g.DrawEllipse($ringPen, [float]($size * 0.16), [float]($size * 0.16), [float]($size * 0.68), [float]($size * 0.68))

    # Inner bars (Music wave)
    $pt1 = New-Object System.Drawing.Point 0, 0
    $pt2 = New-Object System.Drawing.Point 0, $size
    $c1 = [System.Drawing.Color]::FromArgb(255, 255, 107, 122)
    $c2 = [System.Drawing.Color]::FromArgb(255, 237, 85, 100)
    $barBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush -ArgumentList $pt1, $pt2, $c1, $c2

    $scale = [float]($size / 512.0)
    $bars = @(
        @{ x = 180; y = 210; w = 24; h = 92 },
        @{ x = 218; y = 160; w = 24; h = 192 },
        @{ x = 256; y = 130; w = 24; h = 252 },
        @{ x = 294; y = 175; w = 24; h = 162 },
        @{ x = 332; y = 225; w = 24; h = 62 }
    )

    foreach ($b in $bars) {
        $bx = [float]($b.x * $scale)
        $by = [float]($b.y * $scale)
        $bw = [float]($b.w * $scale)
        $bh = [float]($b.h * $scale)
        $bp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $bp.AddArc($bx, $by, $bw, $bw, [float]180, [float]180)
        $bp.AddArc($bx, [float]($by + $bh - $bw), $bw, $bw, [float]0, [float]180)
        $bp.CloseFigure()
        $g.FillPath($barBrush, $bp)
        $bp.Dispose()
    }

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $brush.Dispose()
    $pen.Dispose()
    $ringPen.Dispose()
    $barBrush.Dispose()
    $path_shape.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

Generate-MusifyIcon "D:\Istak\Musify\frontend\public\icons\icon-512.png" 512
Generate-MusifyIcon "D:\Istak\Musify\frontend\public\icons\icon-192.png" 192
Generate-MusifyIcon "D:\Istak\Musify\frontend\public\icons\apple-touch-icon.png" 180
Generate-MusifyIcon "D:\Istak\Musify\frontend\public\apple-touch-icon.png" 180

if (-not (Test-Path "D:\Istak\Musify\frontend\dist\icons")) {
    New-Item -ItemType Directory -Path "D:\Istak\Musify\frontend\dist\icons" -Force
}
Copy-Item "D:\Istak\Musify\frontend\public\icons\*" "D:\Istak\Musify\frontend\dist\icons\" -Force
Copy-Item "D:\Istak\Musify\frontend\public\apple-touch-icon.png" "D:\Istak\Musify\frontend\dist\apple-touch-icon.png" -Force

Write-Host "All icons generated and copied successfully!"
