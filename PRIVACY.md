# Privacidade / Privacy

## Princípio

O Chrono Project é local-first. Projetos, tarefas, calendários, templates,
histórico, backups e preferências permanecem no computador do usuário. O
aplicativo não exige conta e não possui backend próprio.

## Dados armazenados

A instalação atual mantém o workspace em:

```text
%APPDATA%\chronoproject\chronoproject.sqlite
```

Backups automáticos ficam sob o mesmo perfil e logs técnicos ficam em
`%LOCALAPPDATA%\chronoproject\logs\`. Exportações `.chronoproject`, backups
escolhidos manualmente e PDFs são gravados somente no local selecionado pelo
usuário.

Esses arquivos podem conter nomes de projetos, tarefas, responsáveis,
descrições, observações e outras informações inseridas pelo usuário. Cabe ao
usuário controlar acesso, cópias e compartilhamento desses arquivos.

## Rede e telemetria

O Chrono Project não envia telemetria, conteúdo de projetos ou métricas de uso.
O uso normal funciona offline depois da instalação.

A rede pode ser usada apenas em ações ou contingências explícitas:

- **Ajuda > Verificar atualizações** consulta a release pública no GitHub;
- baixar/instalar uma atualização obtém o instalador publicado e verifica sua
  assinatura;
- o instalador padrão pode baixar o WebView2 oficial quando ausente;
- links externos e instalação pelo WinGet usam os serviços escolhidos pelo
  usuário.

Essas operações podem expor aos respectivos provedores dados técnicos comuns de
conexão, como endereço IP e user agent, conforme as políticas deles. O Chrono
Project não acrescenta o conteúdo do workspace a essas solicitações.

## Retenção e exclusão

Desinstalar remove os binários, mas preserva dados do perfil para evitar perda
silenciosa. Para apagar definitivamente, primeiro faça o backup desejado,
desinstale o aplicativo e remova manualmente os diretórios de dados e logs.

Atualização e reinstalação não devem apagar o banco. Perfis antigos não são
mesclados automaticamente com o perfil atual.

## Relatórios e suporte

Não envie bancos, backups, exports ou logs reais em Issues públicas. Use dados
artificiais e remova nomes, caminhos, credenciais e informações de clientes.
Vulnerabilidades ou possível exposição de dados devem ser relatadas pelo canal
privado descrito em [SECURITY.md](SECURITY.md).

## Alterações desta política

Mudanças que introduzam telemetria, conta, sincronização ou serviço remoto
exigem decisão explícita, documentação e comunicação antes de serem ativadas.

## English summary

Chrono Project is local-first, has no account requirement, sends no telemetry,
and does not upload project content. Normal use works offline. Network access is
limited to explicit update checks/downloads, external links, WinGet, or the
standard installer's WebView2 contingency. Uninstalling preserves user data to
avoid silent loss. Never post real databases, backups, exports, logs, personal
paths, credentials, or customer information in public Issues.
