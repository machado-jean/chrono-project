param(
    [ValidateRange(1, 1024)]
    [double]$TargetLimitGiB = 30
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$targetPath = Join-Path $projectRoot 'src-tauri\target'
$executablePath = Join-Path $targetPath 'release\chrono-project.exe'
$inspectionRoot = Join-Path $projectRoot '.local\inspection'
$inspectionExecutable = Join-Path $inspectionRoot 'Chrono-Project-Inspection.exe'
$inspectionMetadata = Join-Path $inspectionRoot 'Chrono-Project-Inspection.build.json'

$inspectionRootFull = [System.IO.Path]::GetFullPath($inspectionRoot)
$expectedInspectionRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '.local\inspection'))
if ($inspectionRootFull -ne $expectedInspectionRoot -or -not $inspectionRootFull.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'A pasta de inspeção não corresponde a .local\inspection dentro do projeto.'
}

Push-Location $projectRoot
try {
    npm run tauri:build:test
    if ($LASTEXITCODE -ne 0) { throw 'A compilação de auditoria falhou.' }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $executablePath -PathType Leaf)) {
    throw "Executável não encontrado em $executablePath."
}

New-Item -ItemType Directory -Path $inspectionRoot -Force | Out-Null
$commit = (git -C $projectRoot rev-parse --short HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or -not $commit) { throw 'Não foi possível identificar o commit atual.' }
$workingTreeStatus = @(git -C $projectRoot status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível inspecionar o estado do working tree.' }
Copy-Item -LiteralPath $executablePath -Destination $inspectionExecutable -Force

$metadata = [ordered]@{
    product = 'Chrono Project'
    version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
    commit = (git -C $projectRoot rev-parse HEAD).Trim()
    workingTreeDirty = $workingTreeStatus.Count -gt 0
    builtAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    databaseMode = 'shared-dev-data'
    source = 'src-tauri/target/release/chrono-project.exe'
    sha256 = (Get-FileHash -LiteralPath $inspectionExecutable -Algorithm SHA256).Hash
    bytes = (Get-Item -LiteralPath $inspectionExecutable).Length
}
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível identificar o commit completo.' }
$metadata | ConvertTo-Json | Set-Content -LiteralPath $inspectionMetadata -Encoding utf8

$targetBytes = if (Test-Path -LiteralPath $targetPath) {
    $sum = (Get-ChildItem -LiteralPath $targetPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($null -eq $sum) { 0 } else { [double]$sum }
} else { 0 }
$targetGiB = $targetBytes / 1GB

Write-Host "Executável de inspeção atualizado em $inspectionExecutable"
Write-Host ('Arquivo único; cache Cargo: {0:N2} GiB de {1:N2} GiB.' -f $targetGiB, $TargetLimitGiB)

if ($targetGiB -ge $TargetLimitGiB) {
    Write-Warning 'O limite do cache Cargo foi atingido. O executável já está preservado; removendo somente os incrementais de debug.'
    & (Join-Path $PSScriptRoot 'Manage-BuildArtifacts.ps1') -WarnAtGiB $TargetLimitGiB -Clean
    if ($LASTEXITCODE -ne 0) { throw 'A limpeza dos artefatos Cargo falhou.' }
}
