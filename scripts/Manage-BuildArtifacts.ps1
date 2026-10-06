param(
    [double]$WarnAtGiB = 30,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$targetPath = Join-Path $projectRoot 'src-tauri\target'
$debugIncrementalPath = Join-Path $targetPath 'debug\incremental'

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
        Write-Warning ('O diretório alcançou o limite de {0:N2} GiB. Execute npm run artifacts:clean para remover somente os incrementais de debug.' -f $WarnAtGiB)
    } else {
        Write-Host ('Dentro do limite de atenção de {0:N2} GiB.' -f $WarnAtGiB)
    }
    return
}

$expectedIncremental = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'src-tauri\target\debug\incremental'))
$resolvedIncremental = [System.IO.Path]::GetFullPath($debugIncrementalPath)
if ($resolvedIncremental -ne $expectedIncremental -or -not $resolvedIncremental.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'O diretório de limpeza não corresponde a src-tauri\target\debug\incremental dentro do projeto.'
}

if (-not (Test-Path -LiteralPath $resolvedIncremental -PathType Container)) {
    Write-Host 'Nenhum incremental de debug encontrado; nada foi removido.'
    return
}

$incrementalBytes = Get-DirectorySizeBytes $resolvedIncremental
Remove-Item -LiteralPath $resolvedIncremental -Recurse -Force

$remainingGiB = (Get-DirectorySizeBytes $targetPath) / 1GB
Write-Host ('Incrementais de debug removidos: {0:N2} GiB liberados.' -f ($incrementalBytes / 1GB))
Write-Host ('Cache Cargo restante: {0:N2} GiB. Dependências, release e instaladores foram preservados.' -f $remainingGiB)
Write-Host 'A próxima compilação de debug pode ser parcialmente mais demorada.'

