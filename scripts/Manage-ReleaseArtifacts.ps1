param(
    [ValidateRange(1, 20)]
    [int]$Keep = 3,
    [switch]$Clean,
    [switch]$CleanStaging
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$distributionRoot = Join-Path $projectRoot '.local\distribution'

if (-not (Test-Path -LiteralPath $distributionRoot -PathType Container)) {
    Write-Host 'Nenhuma pasta local de distribuição encontrada.'
    return
}

$expectedRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.local\distribution'))
$resolvedRoot = [System.IO.Path]::GetFullPath($distributionRoot)
if ($resolvedRoot -ne $expectedRoot -or -not $resolvedRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'A pasta de distribuição não corresponde a .local\distribution dentro do projeto.'
}

function Get-DirectorySizeBytes([string]$Path) {
    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -File -ErrorAction SilentlyContinue |
        Measure-Object Length -Sum).Sum
    if ($null -eq $sum) { return [double]0 }
    return [double]$sum
}

$versioned = @(
    Get-ChildItem -LiteralPath $resolvedRoot -Directory |
        Where-Object { $_.Name -match '^v(?<version>\d+\.\d+\.\d+)$' } |
        ForEach-Object {
            [PSCustomObject]@{
                Directory = $_
                Version = [version]$Matches.version
                SizeBytes = Get-DirectorySizeBytes $_.FullName
            }
        } |
        Sort-Object Version -Descending
)

$retained = @($versioned | Select-Object -First $Keep)
$expired = @($versioned | Select-Object -Skip $Keep)
$staging = @(
    Get-ChildItem -LiteralPath $resolvedRoot -Directory |
        Where-Object { $_.Name -match '^v\d+\.\d+\.\d+-(staging|new)$' } |
        ForEach-Object {
            [PSCustomObject]@{
                Directory = $_
                SizeBytes = Get-DirectorySizeBytes $_.FullName
            }
        }
)

Write-Host "Releases locais preservados (limite: $Keep):"
$retained | ForEach-Object {
    Write-Host ('  {0} — {1:N1} MiB' -f $_.Directory.Name, ($_.SizeBytes / 1MB))
}

if ($expired.Count -eq 0) {
    Write-Host 'Nenhum release versionado excede a retenção.'
} else {
    Write-Host 'Releases locais fora da retenção:'
    $expired | ForEach-Object {
        Write-Host ('  {0} — {1:N1} MiB' -f $_.Directory.Name, ($_.SizeBytes / 1MB))
    }
}

if ($staging.Count -gt 0) {
    Write-Host 'Pastas de staging detectadas (não removidas por padrão):'
    $staging | ForEach-Object {
        Write-Host ('  {0} — {1:N1} MiB' -f $_.Directory.Name, ($_.SizeBytes / 1MB))
    }
}

if (-not $Clean) {
    Write-Host 'Modo de inspeção. Use -Clean para aplicar a retenção.'
    return
}

foreach ($entry in $expired) {
    $target = [System.IO.Path]::GetFullPath($entry.Directory.FullName)
    if (-not $target.StartsWith("$resolvedRoot\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Destino inseguro: $target"
    }
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host "Removido: $($entry.Directory.Name)"
}

if ($CleanStaging) {
    foreach ($entry in $staging) {
        $target = [System.IO.Path]::GetFullPath($entry.Directory.FullName)
        if (-not $target.StartsWith("$resolvedRoot\", [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Destino inseguro: $target"
        }
        Remove-Item -LiteralPath $target -Recurse -Force
        Write-Host "Staging removido: $($entry.Directory.Name)"
    }
}

$freed = ($expired | Measure-Object SizeBytes -Sum).Sum
Write-Host ('Retenção aplicada. Espaço liberado: {0:N2} GiB.' -f ($freed / 1GB))

