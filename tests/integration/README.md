# Testes de integração

A integração nativa é coberta atualmente pelos testes da crate Rust em
`src-tauri`: SQLite, migrations até o schema 9, transações, scheduler persistido,
templates, backup e pacotes `.chronoproject`. A jornada de aplicação que combina
interface, estado e domínio fica em `tests/e2e/chronoproject.application.e2e.test.tsx`.

Este diretório permanece reservado para cenários TypeScript/Tauri que precisem
de uma fronteira própria no futuro; não contém uma suíte paralela vazia nem
substitui `npm run test:e2e`.
