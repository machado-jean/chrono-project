use std::collections::{HashMap, HashSet};

use chrono::{Datelike, Duration, NaiveDate, Weekday};
use sqlx::{Connection, Row, SqliteConnection};

const EXPECTED_TASKS: usize = 205;
const EXPECTED_LEAVES: usize = 120;
const BASE_DATE: &str = "2026-10-05";
const UPDATED_AT: &str = "2026-10-05T12:00:00.000Z";

#[derive(Clone)]
struct Task {
    id: String,
    project_id: String,
    parent_id: Option<String>,
    title: String,
}

fn outline(title: &str) -> Result<Vec<u32>, String> {
    title
        .strip_prefix("Tarefa ")
        .ok_or_else(|| format!("título inesperado: {title}"))?
        .split('.')
        .map(|part| {
            part.parse::<u32>()
                .map_err(|_| format!("título inesperado: {title}"))
        })
        .collect()
}

fn is_working_day(date: NaiveDate) -> bool {
    !matches!(date.weekday(), Weekday::Sat | Weekday::Sun)
}

fn add_working_days(mut date: NaiveDate, days: usize) -> NaiveDate {
    for _ in 0..days {
        loop {
            date += Duration::days(1);
            if is_working_day(date) {
                break;
            }
        }
    }
    date
}

fn working_days_inclusive(mut start: NaiveDate, end: NaiveDate) -> i64 {
    let mut count = 0;
    while start <= end {
        if is_working_day(start) {
            count += 1;
        }
        start += Duration::days(1);
    }
    count
}

fn dependency_id(index: usize) -> String {
    format!("90000000-0000-4000-8000-{index:012}")
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    if std::env::args().nth(1).as_deref() != Some("--apply") {
        return Err(
            "operação recusada sem --apply; feche o Chrono Project e use npm run dev:seed-schedule"
                .into(),
        );
    }

    let database_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri must be inside the repository")
        .join(".local")
        .join("data")
        .join("chronoproject.sqlite");
    let url = format!(
        "sqlite:{}",
        database_path.to_string_lossy().replace('\\', "/")
    );
    let mut database = SqliteConnection::connect(&url).await?;
    let integrity: String = sqlx::query_scalar("PRAGMA quick_check")
        .fetch_one(&mut database)
        .await?;
    if integrity != "ok" {
        return Err(format!("integridade inválida antes do seed: {integrity}").into());
    }

    let rows = sqlx::query("SELECT id, project_id, parent_id, title FROM tasks")
        .fetch_all(&mut database)
        .await?;
    let tasks: Vec<Task> = rows
        .into_iter()
        .map(|row| Task {
            id: row.get("id"),
            project_id: row.get("project_id"),
            parent_id: row.get("parent_id"),
            title: row.get("title"),
        })
        .collect();
    if tasks.len() != EXPECTED_TASKS {
        return Err(format!(
            "o seed exige {EXPECTED_TASKS} tarefas; encontradas {}",
            tasks.len()
        )
        .into());
    }
    let project_ids: HashSet<&str> = tasks.iter().map(|task| task.project_id.as_str()).collect();
    if project_ids.len() != 1 {
        return Err(format!(
            "o seed exige uma única estrutura de projeto; encontrados {} projetos",
            project_ids.len()
        )
        .into());
    }

    let parent_ids: HashSet<&str> = tasks
        .iter()
        .filter_map(|task| task.parent_id.as_deref())
        .collect();
    let mut leaves: Vec<Task> = tasks
        .iter()
        .filter(|task| !parent_ids.contains(task.id.as_str()))
        .cloned()
        .collect();
    leaves.sort_by_key(|task| outline(&task.title).unwrap_or_default());
    if leaves.len() != EXPECTED_LEAVES {
        return Err(format!(
            "o seed exige {EXPECTED_LEAVES} tarefas-folha; encontradas {}",
            leaves.len()
        )
        .into());
    }

    let by_title: HashMap<&str, &Task> = tasks
        .iter()
        .map(|task| (task.title.as_str(), task))
        .collect();
    let mut schedule: HashMap<String, (NaiveDate, NaiveDate, i64)> = HashMap::new();
    let mut dependencies = Vec::new();
    let base = NaiveDate::parse_from_str(BASE_DATE, "%Y-%m-%d")?;
    let mut previous_end = base;

    for (index, task) in leaves.iter().enumerate() {
        let parts = outline(&task.title)?;
        let lag = if index == 0 {
            0
        } else if index % 11 == 0 {
            2
        } else if index % 4 == 0 {
            1
        } else {
            0
        };
        let start = if index == 0 {
            base
        } else {
            add_working_days(previous_end, lag)
        };
        let duration = 2 + (index % 4) as i64;
        let end = add_working_days(start, (duration - 1) as usize);
        schedule.insert(task.id.clone(), (start, end, duration));

        if index > 0 {
            let previous = &leaves[index - 1];
            let previous_parts = outline(&previous.title)?;
            let predecessor = if parts[0] != previous_parts[0] {
                let name = format!("Tarefa {}", previous_parts[0]);
                by_title
                    .get(name.as_str())
                    .ok_or("resumo de fase não encontrado")?
            } else if parts.get(1) != previous_parts.get(1) {
                let name = format!("Tarefa {}.{}", previous_parts[0], previous_parts[1]);
                by_title
                    .get(name.as_str())
                    .ok_or("resumo de bloco não encontrado")?
            } else {
                previous
            };
            dependencies.push((
                dependency_id(index),
                task.project_id.clone(),
                predecessor.id.clone(),
                task.id.clone(),
                lag as i64,
            ));
        }
        previous_end = end;
    }

    let mut summaries: Vec<Task> = tasks
        .iter()
        .filter(|task| parent_ids.contains(task.id.as_str()))
        .cloned()
        .collect();
    summaries
        .sort_by_key(|task| std::cmp::Reverse(outline(&task.title).map_or(0, |parts| parts.len())));
    for summary in &summaries {
        let child_ranges: Vec<(NaiveDate, NaiveDate)> = tasks
            .iter()
            .filter(|task| task.parent_id.as_deref() == Some(summary.id.as_str()))
            .filter_map(|task| schedule.get(&task.id).map(|(start, end, _)| (*start, *end)))
            .collect();
        if child_ranges.is_empty() {
            return Err(format!("resumo sem cronograma derivável: {}", summary.title).into());
        }
        let start = child_ranges
            .iter()
            .map(|range| range.0)
            .min()
            .expect("children exist");
        let end = child_ranges
            .iter()
            .map(|range| range.1)
            .max()
            .expect("children exist");
        schedule.insert(
            summary.id.clone(),
            (start, end, working_days_inclusive(start, end)),
        );
    }

    let mut transaction = database.begin().await?;
    sqlx::query("DELETE FROM task_dependencies")
        .execute(&mut *transaction)
        .await?;
    for task in &tasks {
        let (start, end, duration) = schedule.get(&task.id).ok_or("tarefa sem cronograma")?;
        sqlx::query(
            "UPDATE tasks SET start_date = ?, end_date = ?, duration_days = ?, scheduling_mode = 'AUTO', updated_at = ? WHERE id = ?",
        )
        .bind(start.format("%Y-%m-%d").to_string())
        .bind(end.format("%Y-%m-%d").to_string())
        .bind(duration)
        .bind(UPDATED_AT)
        .bind(&task.id)
        .execute(&mut *transaction)
        .await?;
    }
    for (id, project_id, predecessor_id, successor_id, lag) in &dependencies {
        sqlx::query(
            "INSERT INTO task_dependencies (id, project_id, predecessor_id, successor_id, dependency_type, lag_days, created_at, updated_at) VALUES (?, ?, ?, ?, 'FS', ?, ?, ?)",
        )
        .bind(id)
        .bind(project_id)
        .bind(predecessor_id)
        .bind(successor_id)
        .bind(lag)
        .bind(UPDATED_AT)
        .bind(UPDATED_AT)
        .execute(&mut *transaction)
        .await?;
    }
    transaction.commit().await?;

    let integrity: String = sqlx::query_scalar("PRAGMA quick_check")
        .fetch_one(&mut database)
        .await?;
    println!(
        "Base determinística atualizada: integridade={integrity}, tarefas={}, predecessoras={}",
        tasks.len(),
        dependencies.len()
    );
    Ok(())
}
