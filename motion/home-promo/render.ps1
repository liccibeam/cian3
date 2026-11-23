$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$motionPython = Join-Path $repoRoot '.venv\Scripts\python.exe'
$skillScripts = Join-Path $repoRoot '.agents\skills\product-motion\scripts'
if (-not (Test-Path -LiteralPath $motionPython)) { throw 'Create the project .venv and install product-motion dependencies first.' }
function Invoke-MotionPython {
    param([string[]]$ToolArgs)
    & $motionPython -X utf8 @ToolArgs
    if ($LASTEXITCODE -ne 0) { throw "Motion command failed: $ToolArgs" }
}
Push-Location $PSScriptRoot
try {
    Invoke-MotionPython @((Join-Path $skillScripts 'verify_scene.py'), 'video.html', '--fmt', 'h', '--times', '0,1,3.2,3.7,5,7.5,8.7,9.6,10.4,12.3,13.5,14.97', '--json', 'build/scene-checks.json')
    Invoke-MotionPython @((Join-Path $skillScripts 'render.py'), 'video.html', 'stills', '--fmt', 'h', '--times', '1,3.2,5,8.7,10.4,13.5', '--sheet')
    Invoke-MotionPython @((Join-Path $skillScripts 'music.py'), 'plan.js', '--out', 'build/music.wav')
    & ffmpeg -y -v error -i build/music.wav -af 'loudnorm=I=-16:TP=-1.5:LRA=11' -ar 48000 build/music-normalized.wav
    if ($LASTEXITCODE -ne 0) { throw 'Music normalization failed.' }
    Invoke-MotionPython @((Join-Path $skillScripts 'render.py'), 'video.html', 'video', '--fmt', 'h', '--out', 'build/home-promo-picture.mp4')
    Invoke-MotionPython @((Join-Path $skillScripts 'assemble.py'), '--video', 'build/home-promo-picture.mp4', '--audio', 'build/music-normalized.wav', '--out', 'out/home-promo_16x9.mp4')
    $file = Get-Item -LiteralPath 'out/home-promo_16x9.mp4'
    if ($file.Length -gt 20000000) { throw "MP4 exceeds 20 MB: $($file.Length) bytes." }
    Invoke-MotionPython @((Join-Path $skillScripts 'verify_media.py'), 'plan.js', 'out/home-promo_16x9.mp4', '--sheet', '--times', '1,3.2,5,7.7,8.7,9.6,10.4,12.3,14', '--json', 'build/media-checks.json')
    Write-Host "Ready: $($file.FullName) ($($file.Length) bytes)"
} finally {
    Pop-Location
}
