use std::str::FromStr;

use sqlx::{migrate::Migrator, sqlite::SqliteConnectOptions, Connection, Row, SqliteConnection};

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

const PROJECT_ID: &str = "70000000-0000-4000-8000-000000000001";
const CALENDAR_ID: &str = "00000000-0000-4000-8000-000000000001";
const NOW: &str = "2026-10-07T15:00:00.000Z";

struct TaskSeed {
    id: &'static str,
    parent_id: Option<&'static str>,
    title: &'static str,
    description: &'static str,
    status: &'static str,
    priority: &'static str,
    progress: i64,
    start: &'static str,
    end: &'static str,
    duration: i64,
    deadline: Option<&'static str>,
    mode: &'static str,
    position: i64,
    assignee: Option<&'static str>,
    tags: &'static [&'static str],
}

struct DependencySeed {
    id: &'static str,
    predecessor_id: &'static str,
    successor_id: &'static str,
    lag_days: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    if std::env::args().nth(1).as_deref() != Some("--apply") {
        return Err("operação recusada sem --apply; feche o Chrono Project e use npm run dev:seed-advanced-audit".into());
    }

    let database_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri must be inside the repository")
        .join(".local")
        .join("data")
        .join("chronoproject.sqlite");
    let database_exists = database_path.exists();
    if let Some(parent) = database_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let url = format!(
        "sqlite:{}",
        database_path.to_string_lossy().replace('\\', "/")
    );
    let options = SqliteConnectOptions::from_str(&url)?
        .create_if_missing(true)
        .foreign_keys(true);
    let mut database = SqliteConnection::connect_with(&options).await?;
    if !database_exists {
        MIGRATOR.run(&mut database).await?;
    }
    let integrity: String = sqlx::query_scalar("PRAGMA quick_check")
        .fetch_one(&mut database)
        .await?;
    if integrity != "ok" {
        return Err(format!("integridade inválida antes do seed: {integrity}").into());
    }
    let schema_version: String =
        sqlx::query_scalar("SELECT value FROM app_metadata WHERE key = 'schema_version'")
            .fetch_one(&mut database)
            .await?;
    if schema_version != "9" {
        return Err(format!(
            "o banco está no schema {schema_version}; abra esta versão do Chrono Project uma vez para aplicar o schema 9 antes de executar o seed"
        )
        .into());
    }

    let tasks = task_seeds();
    let dependencies = dependency_seeds();
    let mut transaction = database.begin().await?;
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(PROJECT_ID)
        .execute(&mut *transaction)
        .await?;
    let position: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM projects WHERE is_archived = 0",
    )
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO projects (id, name, description, status, calendar_id, position, is_archived, critical_path_enabled, created_at, updated_at) \
         VALUES (?, ?, ?, 'ACTIVE', ?, ?, 0, 1, ?, ?)",
    )
    .bind(PROJECT_ID)
    .bind("Auditoria — planejamento avançado")
    .bind("Massa complementar para caminho crítico, cinco níveis, filtros e predecessoras em massa.")
    .bind(CALENDAR_ID)
    .bind(position)
    .bind(NOW)
    .bind(NOW)
    .execute(&mut *transaction)
    .await?;

    for task in &tasks {
        sqlx::query(
            "INSERT INTO tasks (id, code, project_id, parent_id, calendar_id, title, description, status, priority, progress, \
             start_date, end_date, duration_days, deadline_date, completed_date, scheduling_mode, position, assignee, notes, created_at, updated_at) \
             VALUES (?, NULL, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)",
        )
        .bind(task.id)
        .bind(PROJECT_ID)
        .bind(task.parent_id)
        .bind(task.title)
        .bind(task.description)
        .bind(task.status)
        .bind(task.priority)
        .bind(task.progress)
        .bind(task.start)
        .bind(task.end)
        .bind(task.duration)
        .bind(task.deadline)
        .bind(if task.status == "COMPLETED" { Some(task.end) } else { None })
        .bind(task.mode)
        .bind(task.position)
        .bind(task.assignee)
        .bind(NOW)
        .bind(NOW)
        .execute(&mut *transaction)
        .await?;
        for tag in task.tags {
            sqlx::query("INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING")
                .bind(tag)
                .execute(&mut *transaction)
                .await?;
            sqlx::query("INSERT INTO task_tags (task_id, tag_name) VALUES (?, ?)")
                .bind(task.id)
                .bind(tag)
                .execute(&mut *transaction)
                .await?;
        }
    }

    for dependency in &dependencies {
        sqlx::query(
            "INSERT INTO task_dependencies (id, project_id, predecessor_id, successor_id, dependency_type, lag_days, created_at, updated_at) \
             VALUES (?, ?, ?, ?, 'FS', ?, ?, ?)",
        )
        .bind(dependency.id)
        .bind(PROJECT_ID)
        .bind(dependency.predecessor_id)
        .bind(dependency.successor_id)
        .bind(dependency.lag_days)
        .bind(NOW)
        .bind(NOW)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;

    let integrity: String = sqlx::query_scalar("PRAGMA quick_check")
        .fetch_one(&mut database)
        .await?;
    let row = sqlx::query(
        "SELECT COUNT(*) AS tasks, SUM(CASE WHEN assignee IS NULL THEN 1 ELSE 0 END) AS unassigned, \
         COUNT(DISTINCT assignee) AS assignees FROM tasks WHERE project_id = ?",
    )
    .bind(PROJECT_ID)
    .fetch_one(&mut database)
    .await?;
    let dependency_count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM task_dependencies WHERE project_id = ?")
            .bind(PROJECT_ID)
            .fetch_one(&mut database)
            .await?;
    let max_depth: i64 = sqlx::query_scalar(
        "WITH RECURSIVE tree(id, depth) AS ( \
           SELECT id, 1 FROM tasks WHERE project_id = ? AND parent_id IS NULL \
           UNION ALL \
           SELECT child.id, tree.depth + 1 FROM tasks child JOIN tree ON child.parent_id = tree.id \
           WHERE child.project_id = ? \
         ) SELECT COALESCE(MAX(depth), 0) FROM tree",
    )
    .bind(PROJECT_ID)
    .bind(PROJECT_ID)
    .fetch_one(&mut database)
    .await?;
    let max_predecessors: i64 = sqlx::query_scalar(
        "SELECT COALESCE(MAX(amount), 0) FROM ( \
           SELECT COUNT(*) AS amount FROM task_dependencies WHERE project_id = ? GROUP BY successor_id \
         )",
    )
    .bind(PROJECT_ID)
    .fetch_one(&mut database)
    .await?;
    let project_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM projects")
        .fetch_one(&mut database)
        .await?;
    let legacy_target_column_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM pragma_table_info('projects') WHERE name = 'target_end_date'",
    )
    .fetch_one(&mut database)
    .await?;
    if !database_exists && project_count != 1 {
        return Err(format!(
            "o banco novo deveria conter apenas um projeto, mas contém {project_count}"
        )
        .into());
    }
    if legacy_target_column_count != 0 {
        return Err("a coluna legada target_end_date ainda existe".into());
    }
    println!(
        "Projeto de auditoria preparado: schema={}, projetos={}, tarefas={}, dependências={}, níveis={}, máximo de predecessoras={}, responsáveis={}, sem responsável={}, target_end_date=ausente, integridade={}",
        schema_version,
        project_count,
        row.get::<i64, _>("tasks"), dependency_count, max_depth, max_predecessors, row.get::<i64, _>("assignees"),
        row.get::<i64, _>("unassigned"), integrity,
    );
    Ok(())
}

fn task_seeds() -> Vec<TaskSeed> {
    vec![
        task(
            "71000000-0000-4000-8000-000000000001",
            None,
            "Execução integrada",
            "Resumo geral da massa avançada.",
            "NOT_STARTED",
            "CRITICAL",
            0,
            "2026-10-05",
            "2026-10-16",
            10,
            Some("2026-10-16"),
            "AUTO",
            0,
            Some("Ana"),
            &["auditoria", "crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000002",
            Some("71000000-0000-4000-8000-000000000001"),
            "Implantação principal",
            "Segundo nível.",
            "IN_PROGRESS",
            "HIGH",
            35,
            "2026-10-07",
            "2026-10-16",
            8,
            Some("2026-10-16"),
            "AUTO",
            0,
            Some("Ana"),
            &["implantação"],
        ),
        task(
            "71000000-0000-4000-8000-000000000003",
            Some("71000000-0000-4000-8000-000000000002"),
            "Pacote eletromecânico",
            "Terceiro nível e predecessora-resumo.",
            "IN_PROGRESS",
            "HIGH",
            30,
            "2026-10-07",
            "2026-10-09",
            3,
            Some("2026-10-10"),
            "AUTO",
            0,
            Some("Jean"),
            &["pacote"],
        ),
        task(
            "71000000-0000-4000-8000-000000000004",
            Some("71000000-0000-4000-8000-000000000003"),
            "Frente elétrica",
            "Quarto nível.",
            "IN_PROGRESS",
            "HIGH",
            40,
            "2026-10-08",
            "2026-10-09",
            2,
            Some("2026-10-09"),
            "AUTO",
            0,
            Some("Jean"),
            &["elétrica"],
        ),
        task(
            "71000000-0000-4000-8000-000000000005",
            Some("71000000-0000-4000-8000-000000000004"),
            "Lançamento de cabos críticos",
            "Quinto nível para validar o limite novo.",
            "IN_PROGRESS",
            "CRITICAL",
            50,
            "2026-10-08",
            "2026-10-09",
            2,
            Some("2026-10-09"),
            "AUTO",
            0,
            Some("Jean"),
            &["elétrica", "crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000006",
            Some("71000000-0000-4000-8000-000000000003"),
            "Inspeção mecânica",
            "Uma das predecessoras controladoras.",
            "NOT_STARTED",
            "HIGH",
            0,
            "2026-10-07",
            "2026-10-09",
            3,
            Some("2026-10-09"),
            "AUTO",
            1,
            Some("Bruna"),
            &["mecânica", "crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000007",
            Some("71000000-0000-4000-8000-000000000002"),
            "Liberação integrada",
            "Sucessora com quatro predecessoras para gerenciamento em massa.",
            "NOT_STARTED",
            "CRITICAL",
            0,
            "2026-10-13",
            "2026-10-16",
            4,
            Some("2026-10-16"),
            "AUTO",
            1,
            Some("Ana"),
            &["liberação", "crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000008",
            Some("71000000-0000-4000-8000-000000000002"),
            "Liberação após tarefa-resumo",
            "Valida uma tarefa-resumo usada como predecessora.",
            "NOT_STARTED",
            "NORMAL",
            0,
            "2026-10-09",
            "2026-10-14",
            4,
            Some("2026-10-15"),
            "AUTO",
            2,
            None,
            &["resumo"],
        ),
        task(
            "71000000-0000-4000-8000-000000000009",
            Some("71000000-0000-4000-8000-000000000001"),
            "Preparação paralela",
            "Ramo paralelo do cronograma.",
            "IN_PROGRESS",
            "NORMAL",
            60,
            "2026-10-05",
            "2026-10-13",
            7,
            Some("2026-10-13"),
            "AUTO",
            1,
            Some("Bruna"),
            &["paralelo"],
        ),
        task(
            "71000000-0000-4000-8000-000000000010",
            Some("71000000-0000-4000-8000-000000000009"),
            "Licenças e autorizações",
            "Tarefa sem responsável para o filtro correspondente.",
            "COMPLETED",
            "NORMAL",
            100,
            "2026-10-05",
            "2026-10-06",
            2,
            Some("2026-10-06"),
            "AUTO",
            0,
            None,
            &["documentação"],
        ),
        task(
            "71000000-0000-4000-8000-000000000011",
            Some("71000000-0000-4000-8000-000000000009"),
            "Documentação liberada",
            "Predecessora da liberação integrada.",
            "IN_PROGRESS",
            "HIGH",
            80,
            "2026-10-07",
            "2026-10-13",
            5,
            Some("2026-10-13"),
            "AUTO",
            1,
            Some("Bruna"),
            &["documentação", "crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000012",
            None,
            "Verificação quase crítica",
            "Termina um dia útil antes do projeto.",
            "NOT_STARTED",
            "NORMAL",
            0,
            "2026-10-14",
            "2026-10-15",
            2,
            Some("2026-10-16"),
            "AUTO",
            1,
            Some("Carlos"),
            &["quase crítico"],
        ),
        task(
            "71000000-0000-4000-8000-000000000013",
            None,
            "Atividade com folga",
            "Ramo independente com folga maior.",
            "NOT_STARTED",
            "LOW",
            0,
            "2026-10-05",
            "2026-10-09",
            5,
            Some("2026-10-16"),
            "AUTO",
            2,
            Some("Carlos"),
            &["folga"],
        ),
        task(
            "71000000-0000-4000-8000-000000000014",
            None,
            "Atividade manual bloqueada",
            "Tarefa manual para preservar datas e exibir conflitos quando provocados.",
            "BLOCKED",
            "HIGH",
            20,
            "2026-10-05",
            "2026-10-06",
            2,
            Some("2026-10-07"),
            "MANUAL",
            3,
            None,
            &["manual", "bloqueio"],
        ),
        task(
            "71000000-0000-4000-8000-000000000015",
            None,
            "Levantamento antecipado",
            "Predecessora não controladora com um dia de folga.",
            "COMPLETED",
            "NORMAL",
            100,
            "2026-10-07",
            "2026-10-08",
            2,
            Some("2026-10-08"),
            "AUTO",
            4,
            Some("Carlos"),
            &["quase crítico"],
        ),
    ]
}

#[allow(clippy::too_many_arguments)]
fn task(
    id: &'static str,
    parent_id: Option<&'static str>,
    title: &'static str,
    description: &'static str,
    status: &'static str,
    priority: &'static str,
    progress: i64,
    start: &'static str,
    end: &'static str,
    duration: i64,
    deadline: Option<&'static str>,
    mode: &'static str,
    position: i64,
    assignee: Option<&'static str>,
    tags: &'static [&'static str],
) -> TaskSeed {
    TaskSeed {
        id,
        parent_id,
        title,
        description,
        status,
        priority,
        progress,
        start,
        end,
        duration,
        deadline,
        mode,
        position,
        assignee,
        tags,
    }
}

fn dependency_seeds() -> Vec<DependencySeed> {
    vec![
        dependency(
            "72000000-0000-4000-8000-000000000001",
            "71000000-0000-4000-8000-000000000005",
            "71000000-0000-4000-8000-000000000007",
            0,
        ),
        dependency(
            "72000000-0000-4000-8000-000000000002",
            "71000000-0000-4000-8000-000000000006",
            "71000000-0000-4000-8000-000000000007",
            0,
        ),
        dependency(
            "72000000-0000-4000-8000-000000000003",
            "71000000-0000-4000-8000-000000000011",
            "71000000-0000-4000-8000-000000000007",
            0,
        ),
        dependency(
            "72000000-0000-4000-8000-000000000004",
            "71000000-0000-4000-8000-000000000015",
            "71000000-0000-4000-8000-000000000007",
            1,
        ),
        dependency(
            "72000000-0000-4000-8000-000000000005",
            "71000000-0000-4000-8000-000000000003",
            "71000000-0000-4000-8000-000000000008",
            0,
        ),
        dependency(
            "72000000-0000-4000-8000-000000000006",
            "71000000-0000-4000-8000-000000000010",
            "71000000-0000-4000-8000-000000000011",
            1,
        ),
    ]
}

fn dependency(
    id: &'static str,
    predecessor_id: &'static str,
    successor_id: &'static str,
    lag_days: i64,
) -> DependencySeed {
    DependencySeed {
        id,
        predecessor_id,
        successor_id,
        lag_days,
    }
}
