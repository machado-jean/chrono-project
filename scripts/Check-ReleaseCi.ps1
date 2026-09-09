[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^v\d+\.\d+\.\d+$')]
    [string]$Tag,

    [string]$Repository = 'machado-jean/project-flow',

    [ValidateRange(1, 30)]
    [int]$WaitMinutes = 5
)

$ErrorActionPreference = 'Stop'
$deadline = (Get-Date).AddMinutes($WaitMinutes)
$run = $null

do {
    $json = gh run list --repo $Repository --workflow CI --branch $Tag --limit 10 `
        --json databaseId,status,conclusion,headBranch,headSha,url
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível consultar o GitHub Actions.'
    }

    $run = @($json | ConvertFrom-Json) |
        Where-Object { $_.headBranch -eq $Tag } |
        Select-Object -First 1

    if (-not $run) {
        Start-Sleep -Seconds 5
    }
} while (-not $run -and (Get-Date) -lt $deadline)

if (-not $run) {
    throw "Nenhuma execução do workflow CI foi encontrada para a tag $Tag."
}

Write-Host "CI da tag: $($run.url)"
if ($run.status -ne 'completed') {
    gh run watch $run.databaseId --repo $Repository --exit-status
    if ($LASTEXITCODE -ne 0) {
        throw "O CI da tag $Tag falhou. Use: gh run view $($run.databaseId) --repo $Repository --log-failed"
    }
} elseif ($run.conclusion -ne 'success') {
    throw "O CI da tag $Tag terminou como '$($run.conclusion)'. Use: gh run view $($run.databaseId) --repo $Repository --log-failed"
}

Write-Host "CI da tag $Tag concluído com sucesso no commit $($run.headSha)."
