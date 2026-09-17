param(
    [ValidateRange(1, 20)]
    [int]$Keep = 3,
    [ValidateRange(1, 1024)]
    [double]$TargetLimitGiB = 20,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$targetPath = Join-Path $projectRoot 'src-tauri\target'
$executablePath = Join-Path $targetPath 'release\chrono-project.exe'
$auditRoot = Join-Path $projectRoot '.local\audit-builds'

$auditRootFull = [System.IO.Path]::GetFullPath($auditRoot)
$expectedAuditRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.local\audit-builds'))
if ($auditRootFull -ne $expectedAuditRoot -or -not $auditRootFull.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'A pasta de auditoria não corresponde a .local\audit-builds dentro do projeto.'
}

if (-not $SkipBuild) {
    Push-Location $projectRoot
    try {
        npm run tauri:build:test
        if ($LASTEXITCODE -ne 0) { throw 'A compilação de auditoria falhou.' }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) {
    throw "Executável não encontrado em $executablePath."
}

New-Item -ItemType Directory -Path $auditRoot -Force | Out-Null
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$commit = (git -C $projectRoot rev-parse --short HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or -not $commit) { throw 'Não foi possível identificar o commit atual.' }
$buildDirectory = Join-Path $auditRoot "${timestamp}_${commit}"
if (Test-Path -LiteralPath $buildDirectory) { throw "A pasta de auditoria já existe: $buildDirectory" }
New-Item -ItemType Directory -Path $buildDirectory | Out-Null
$archivedExecutable = Join-Path $buildDirectory 'chrono-project.exe'
Copy-Item -LiteralPath $executablePath -Destination $archivedExecutable

$metadata = [ordered]@{
    product = 'Chrono Project'
    version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
    commit = (git -C $projectRoot rev-parse HEAD).Trim()
    builtAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    source = 'src-tauri/target/release/chrono-project.exe'
    sha256 = (Get-FileHash -LiteralPath $archivedExecutable -Algorithm SHA256).Hash
    bytes = (Get-Item -LiteralPath $archivedExecutable).Length
}
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível identificar o commit completo.' }
$metadata | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $buildDirectory 'build.json') -Encoding utf8

$builds = @(Get-ChildItem -LiteralPath $auditRoot -Directory | Sort-Object Name -Descending)
$staleBuilds = @($builds | Select-Object -Skip $Keep)
foreach ($stale in $staleBuilds) {
    $staleFull = [System.IO.Path]::GetFullPath($stale.FullName)
    $expectedPrefix = $auditRootFull.TrimEnd('\') + '\'
    if (-not $staleFull.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Recusa ao remover pasta fora da área de auditoria: $staleFull"
    }
    Remove-Item -LiteralPath $staleFull -Recurse -Force
}

$targetBytes = if (Test-Path -LiteralPath $targetPath) {
    $sum = (Get-ChildItem -LiteralPath $targetPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($null -eq $sum) { 0 } else { [double]$sum }
} else { 0 }
$targetGiB = $targetBytes / 1GB

$remaining = @(Get-ChildItem -LiteralPath $auditRoot -Directory | Sort-Object Name -Descending)
Write-Host "Build arquivado em $buildDirectory"
Write-Host ('Retenção: {0} de {1} builds; cache Cargo: {2:N2} GiB de {3:N2} GiB.' -f $remaining.Count, $Keep, $targetGiB, $TargetLimitGiB)

if ($targetGiB -ge $TargetLimitGiB) {
    Write-Warning 'O limite do cache Cargo foi atingido. O executável já está preservado; iniciando limpeza segura.'
    & (Join-Path $PSScriptRoot 'Manage-BuildArtifacts.ps1') -WarnAtGiB $TargetLimitGiB -Clean
    if ($LASTEXITCODE -ne 0) { throw 'A limpeza dos artefatos Cargo falhou.' }
}
