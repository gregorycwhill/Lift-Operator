param(
    [string]$OutputDirectory = "dist"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$release = Get-Content (Join-Path $root 'release-config.js') -Raw
$build = if ($release -match "buildVersion:\s*'([^']+)'") { $Matches[1] } else { 'development' }
$commit = (git -C $root rev-parse --short HEAD).Trim()
$staging = Join-Path $root '.itch-staging'
$output = Join-Path $root $OutputDirectory
$archive = Join-Path $output ("Lift-Operator-{0}-{1}.zip" -f $build, $commit)

Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $staging, $output -Force | Out-Null

try {
    $items = @('index.html', 'style.css', 'release-config.js', 'LICENSE', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_LICENSES.md', 'generated', 'assets', 'lib')
    $items += Get-ChildItem -Path $root -File -Filter '*.js' | Where-Object { $_.Name -notin @('playwright.config.js') } | ForEach-Object Name
    foreach ($item in $items | Select-Object -Unique) {
        $source = Join-Path $root $item
        if (Test-Path -LiteralPath $source) {
            $destination = Join-Path $staging (Split-Path -Leaf $item)
            Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
        }
    }
    # Source screenshots and archive material are repository collateral, not shipped game assets.
    Remove-Item -LiteralPath (Join-Path $staging 'assets\media\archive') -Recurse -Force -ErrorAction SilentlyContinue
    @"
Lift Operator itch.io package
Build: $build
Commit: $commit
Source: GitHub Pages release tree

Open index.html in a current desktop browser, or upload this ZIP as an HTML5 project on itch.io.
See THIRD_PARTY_NOTICES.md and assets/audio/ATTRIBUTION.md in the source repository before public distribution.
"@ | Set-Content -LiteralPath (Join-Path $staging 'BUILD.txt') -Encoding utf8

    Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archiveStream = [System.IO.File]::Open($archive, [System.IO.FileMode]::CreateNew)
    $zip = New-Object System.IO.Compression.ZipArchive($archiveStream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -LiteralPath $staging -Recurse -File | ForEach-Object {
            $relative = $_.FullName.Substring($staging.Length).TrimStart('\', '/') -replace '\\', '/'
            $entry = $zip.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            $sourceStream = [System.IO.File]::OpenRead($_.FullName)
            try { $sourceStream.CopyTo($entryStream) } finally { $sourceStream.Dispose(); $entryStream.Dispose() }
        }
    } finally {
        $zip.Dispose()
        $archiveStream.Dispose()
    }
} finally {
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Output "Created $archive"
