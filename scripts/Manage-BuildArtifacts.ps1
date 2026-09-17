param(
    [double]$WarnAtGiB = 20,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$manifestPath = Join-Path $projectRoot 'src-tauri\Cargo.toml'
$targetPath = Join-Path $projectRoot 'src-tauri\target'

function Get-DirectorySizeBytes([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { return 0 }
    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($null -eq $sum) { return 0 }
    return [double]$sum
}

$bytes = Get-DirectorySizeBytes $targetPath
$sizeGiB = $bytes / 1GB
Write-Host ('Artefatos Cargo: {0:N2} GiB em {1}' -f $sizeGiB, $targetPath)

if (-not $Clean) {
    if ($sizeGiB -ge $WarnAtGiB) {
        Write-Warning ('O diretório ultrapassou o limite de atenção de {0:N2} GiB. Execute npm run artifacts:clean quando puder recompilar do zero.' -f $WarnAtGiB)
    } else {
        Write-Host ('Dentro do limite de atenção de {0:N2} GiB.' -f $WarnAtGiB)
    }
    return
}

$expectedTarget = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'src-tauri\target'))
$resolvedTarget = [System.IO.Path]::GetFullPath($targetPath)
if ($resolvedTarget -ne $expectedTarget -or -not $resolvedTarget.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'O diretório de artefatos não corresponde a src-tauri\target dentro do projeto.'
}

Push-Location $projectRoot
try {
    cargo clean --manifest-path $manifestPath
    if ($LASTEXITCODE -ne 0) { throw 'cargo clean falhou.' }
} finally {
    Pop-Location
}

Write-Host 'Artefatos Cargo removidos. A próxima compilação será completa.'

