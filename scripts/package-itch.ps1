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

$items = @('index.html', 'style.css', 'release-config.js', 'THIRD_PARTY_NOTICES.md', 'generated', 'assets', 'lib')
$items += Get-ChildItem -Path $root -File -Filter '*.js' | Where-Object { $_.Name -notin @('playwright.config.js') } | ForEach-Object Name
foreach ($item in $items | Select-Object -Unique) {
    $source = Join-Path $root $item
    if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination $staging -Recurse -Force }
}
@"
Lift Operator itch.io package
Build: $build
Commit: $commit
Source: GitHub Pages release tree

Open index.html in a current desktop browser, or upload this ZIP as an HTML5 project on itch.io.
See THIRD_PARTY_NOTICES.md and assets/audio/ATTRIBUTION.md in the source repository before public distribution.
"@ | Set-Content -LiteralPath (Join-Path $staging 'BUILD.txt') -Encoding utf8

Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $archive -Force
Remove-Item -LiteralPath $staging -Recurse -Force
Write-Output "Created $archive"
