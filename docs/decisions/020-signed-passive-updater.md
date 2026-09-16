# ADR 020 — Atualização passiva assinada

## Estado

Implementada desde v0.1.3, registrada retrospectivamente em 08/09/2026.
Substitui a parte de download/instalação externa da ADR 018.

## Decisão vigente

Ao iniciar, o Chrono Project aciona uma única consulta pelo plugin nativo Tauri
Updater. Quando existe uma nova versão, o menu **Ajuda** é aberto automaticamente
com a versão disponível e as opções de instalação. **Ajuda > Verificar
atualizações** permanece disponível para repetir a consulta manualmente.
O endpoint é o asset `latest.json` da última release do repositório
`machado-jean/chrono-project`. O manifesto seleciona Windows x64 e contém versão,
URL e assinatura. O usuário confirma **Baixar e instalar atualização**.

O plugin verifica a assinatura com a chave pública incorporada. O NSIS usa
`passive`; após instalação bem-sucedida, a aplicação solicita reinício pelo
plugin Process. Falhas são informadas e não devem solicitar reinício.
O download offline continua como alternativa externa no navegador.

Falhas na consulta inicial são silenciosas e não bloqueiam a operação offline;
uma consulta manual continua apresentando o erro. Não há envio de conteúdo do workspace.
O banco permanece no perfil do usuário, separado dos binários.

## Chaves e publicação

Preservar a chave privada permanente em armazenamento seguro, fora do Git.
Distribuir a chave pública na configuração; nunca gerar uma chave nova apenas
para publicar uma versão. Assinatura do updater não é certificado Authenticode.

Publicar os dois instaladores, respectivos `.sig`, `latest.json` e hashes.
Conferir que assinatura, URL, versão e arquivo correspondem ao mesmo build.
Nenhuma publicação é executada sem autorização explícita.

## Evidências e limites

Os testes de UI simulam o plugin e cobrem sucesso, versão atual, erro de
consulta, download e assinatura. Não comprovam a execução real do NSIS.
O teste de atualização instalada e preservação está em
[vm-validation-record.md](../vm-validation-record.md).

Referências: [Tauri Updater](https://v2.tauri.app/plugin/updater/),
[configuração local](../../src-tauri/tauri.conf.json),
[implementação](../../src/components/WorkspaceHelpMenu.tsx).
