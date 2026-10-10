# ADR 029 — Caminho crítico e margem da meta do projeto

## Estado

Aceita em 07/10/2026.

## Decisão

O caminho crítico é calculado em TypeScript puro a partir das tarefas-folha
programadas, dependências FS e calendários locais. O cálculo é uma projeção:
não persiste folga, não altera o scheduler e não cria outra fonte de verdade.

Uma passagem reversa parte do término previsto mais tardio da rede e acumula a
folga entre cada restrição FS e o início real da sucessora. Folga total zero
identifica o caminho crítico; um ou dois dias úteis identificam tarefas próximas
do crítico. Assim, alterar somente um prazo-limite não muda quais tarefas
controlam o término.

A meta final é derivada separadamente como o maior prazo-limite entre as tarefas
não canceladas. A diferença, em dias úteis, entre o término previsto da rede e
essa meta forma a margem global do projeto: positiva quando existe reserva, zero
quando coincidem e negativa quando a previsão já ultrapassa a meta.

A análise é uma preferência persistente e fica desativada por padrão. Quando
ativada sem qualquer prazo-limite, o caminho crítico continua disponível e
somente a margem da meta fica sem valor. Um diálogo apresenta uma rede com
caminhos paralelos, explica os dois indicadores e deixa explícito que a análise
não move tarefas.

Tarefas canceladas ou sem cronograma completo são ignoradas. Resumos recebem a
menor folga de seus descendentes apenas para visualização. Se não houver uma
relação FS válida entre tarefas programadas, a análise é declarada indisponível.

## Consequências

- Tabela, Gantt e filtros consomem o mesmo resultado determinístico.
- O realce combina texto/forma/contorno e não depende somente de cor.
- Mudanças de datas, calendários ou dependências recalculam a projeção em memória.
- PDF e explicação detalhada da predecessora controladora podem ser adicionados
  depois sem migration.
- A auditoria de desempenho específica foi adiada até a conclusão das features.
