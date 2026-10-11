# Solução de problemas

Comece sempre preservando os dados. Não desinstale, apague pastas ou substitua
o SQLite antes de criar uma cópia do arquivo existente.

## O aplicativo não abre

1. Confirme que não existe outro `chrono-project.exe` preso no Gerenciador de
   Tarefas.
2. Reinicie o Windows e tente novamente.
3. Confirme que está usando Windows 11 x64 e o instalador correto.
4. Repare a instalação executando novamente o instalador da mesma versão.
5. Preserve banco e logs antes de abrir uma Issue.

Dados e binários são separados; reparar o aplicativo não deve remover o banco.

## Tela branca ou interface incompleta

- atualize o WebView2 Evergreen pelo mecanismo oficial da Microsoft;
- em ambiente isolado, reinstale usando o pacote offline do Chrono Project;
- não instale WebView2 Fixed Version nem faça downgrade global como tentativa
  automática;
- registre versão do Windows, WebView2 e Chrono Project.

## A atualização não aparece

Use **Ajuda > Verificar atualizações**. A consulta não ocorre automaticamente ao
abrir. Confirme acesso ao GitHub e compare a versão mostrada em Ajuda com a
[release estável](https://github.com/machado-jean/chrono-project/releases/latest).

O instalador offline continua disponível para atualização manual. Nunca mova
uma tag nem substitua um asset publicado para tentar corrigir uma atualização.

## O instalador padrão tenta acessar a internet

O pacote padrão usa o WebView2 já disponível no Windows e pode baixar o
bootstrapper oficial caso o runtime esteja ausente. Para instalação totalmente
sem rede, use `Chrono-Project-Windows-x64-Offline-Setup.exe`.

## Onde estão meus dados?

Instalação atual:

```text
Banco:   %APPDATA%\chronoproject\chronoproject.sqlite
Backups: %APPDATA%\chronoproject\backups\
Logs:    %LOCALAPPDATA%\chronoproject\logs\
```

Versões até 0.2.2 podem ter usado o perfil legado:

```text
%APPDATA%\io.github.machadojean.chronoproject\
```

Os dois perfis não são mesclados silenciosamente. Use a versão antiga para
exportar/criar backup e restaure pela versão atual.

## Uma migration ou o banco apresentou erro

- não edite `_sqlx_migrations`, schema ou checksum manualmente;
- copie o banco e os arquivos `-wal`/`-shm`, se existirem, com o aplicativo
  fechado;
- guarde a mensagem integral e a versão do aplicativo;
- tente restaurar apenas por **Arquivo > Backup e portabilidade**;
- se o banco for real, não o anexe publicamente.

O aplicativo possui compatibilidade conservadora para uma variante conhecida
de checksum. Qualquer outro caso deve falhar sem alterar dados de negócio.

## Alterações não foram salvas

Aguarde o indicador **Salvando…** desaparecer. Se a linha mostrar erro ou
alteração pendente, corrija o valor e use **Salvar**. Datas incompletas, ciclos,
relações duplicadas e hierarquia acima de cinco níveis são rejeitados.

Feche e reabra somente depois de confirmar que não existem linhas pendentes.

## Datas se moveram inesperadamente

Verifique:

- predecessoras e respectivos lags;
- calendário efetivo e feriados;
- cadeado `AUTO`/`MANUAL`;
- tarefa-resumo com descendentes alterados;
- histórico em **Editar** para desfazer a operação completa.

Prazo-limite e meta do projeto não movimentam tarefas. Apenas calendário,
duração, relações e alterações explícitas participam do scheduler.

## Importação ou restauração falhou

Não renomeie ZIPs arbitrários para `.chronoproject`. O pacote precisa manter
manifest, schema, hash e estrutura válidos. Importação rejeitada não deve
alterar o workspace. Restauração exige um backup SQLite íntegro e substitui todo
o workspace somente após confirmação.

## Como abrir um relato útil

Use o formulário de problema e informe:

- versão do Chrono Project e do Windows;
- instalador padrão, offline ou WinGet;
- passos mínimos com dados artificiais;
- mensagem de erro e trecho sanitizado do log;
- se o problema persiste depois de reiniciar.

Nunca publique banco, backup, `.chronoproject`, caminhos pessoais, credenciais
ou informações de clientes. Vulnerabilidades devem seguir
[SECURITY.md](../SECURITY.md).
