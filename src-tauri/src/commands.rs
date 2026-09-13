use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_log::log::warn;
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::{
    database,
    persistence::{
        self, BaselineBundleRecord, CalendarRecord, DuplicationBundleRecord, ProjectRecord,
        ScheduleChangeSetRecord, TaskRecord, TaskTemplateBundleRecord, WorkspaceData,
    },
    portability::{
        self, BackupResult, ExportResult, ImportPackagePreview, ImportResult, ImportSelection,
        RestoreResult,
    },
};

async fn sqlite_pool(db_instances: &DbInstances) -> Result<sqlx::SqlitePool, String> {
    let instances = db_instances.0.read().await;
    let database_url = database::database_url();
    let database = instances
        .get(&database_url)
        .ok_or_else(|| "O banco de dados do ProjectFlow não foi carregado.".to_owned())?;

    let DbPool::Sqlite(pool) = database;
    Ok(pool.clone())
}

#[tauri::command]
pub fn database_url() -> String {
    database::database_url()
}

#[tauri::command]
pub async fn save_calendar(
    db_instances: State<'_, DbInstances>,
    calendar: CalendarRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_calendar(&pool, &calendar)
        .await
        .map_err(|error| format!("Não foi possível salvar o calendário: {error}"))
}

#[tauri::command]
pub async fn load_workspace(db_instances: State<'_, DbInstances>) -> Result<WorkspaceData, String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::load_workspace(&pool)
        .await
        .map_err(|error| format!("Não foi possível carregar o workspace: {error}"))
}

#[tauri::command]
pub async fn save_project(
    db_instances: State<'_, DbInstances>,
    project: ProjectRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_project(&pool, &project)
        .await
        .map_err(|error| format!("Não foi possível salvar o projeto: {error}"))
}

#[tauri::command]
pub async fn reorder_projects(
    db_instances: State<'_, DbInstances>,
    project_ids: Vec<String>,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::reorder_projects(&pool, &project_ids)
        .await
        .map_err(|error| format!("Não foi possível reordenar os projetos: {error}"))
}

#[tauri::command]
pub async fn delete_project(
    db_instances: State<'_, DbInstances>,
    project_id: String,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::delete_project(&pool, &project_id)
        .await
        .map_err(|error| format!("Não foi possível excluir o projeto: {error}"))
}

#[tauri::command]
pub async fn save_task(
    db_instances: State<'_, DbInstances>,
    task: TaskRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_task(&pool, &task)
        .await
        .map_err(|error| format!("Não foi possível salvar a tarefa: {error}"))
}

#[tauri::command]
pub async fn save_baseline(
    db_instances: State<'_, DbInstances>,
    bundle: BaselineBundleRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_baseline(&pool, &bundle)
        .await
        .map_err(|error| format!("Não foi possível salvar o plano de referência: {error}"))
}

#[tauri::command]
pub async fn delete_project_baselines(
    db_instances: State<'_, DbInstances>,
    project_id: String,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::delete_project_baselines(&pool, &project_id)
        .await
        .map_err(|error| format!("Não foi possível excluir o plano de referência: {error}"))
}

#[tauri::command]
pub async fn reorder_tasks(
    db_instances: State<'_, DbInstances>,
    task_ids: Vec<String>,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::reorder_tasks(&pool, &task_ids)
        .await
        .map_err(|error| format!("Não foi possível reordenar as tarefas: {error}"))
}

#[tauri::command]
pub async fn apply_schedule_changes(
    db_instances: State<'_, DbInstances>,
    changes: ScheduleChangeSetRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::apply_schedule_changes(&pool, &changes)
        .await
        .map_err(|error| format!("Não foi possível atualizar o cronograma: {error}"))
}

#[tauri::command]
pub async fn delete_task_tree(
    db_instances: State<'_, DbInstances>,
    task_id: String,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::delete_task_tree(&pool, &task_id)
        .await
        .map_err(|error| format!("Não foi possível excluir a tarefa: {error}"))
}

#[tauri::command]
pub async fn save_duplication_bundle(
    db_instances: State<'_, DbInstances>,
    bundle: DuplicationBundleRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_duplication_bundle(&pool, &bundle)
        .await
        .map_err(|error| format!("Não foi possível duplicar a estrutura: {error}"))
}

#[tauri::command]
pub async fn save_template_bundle(
    db_instances: State<'_, DbInstances>,
    bundle: TaskTemplateBundleRecord,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::save_template_bundle(&pool, &bundle)
        .await
        .map_err(|error| format!("Não foi possível salvar o template: {error}"))
}

#[tauri::command]
pub async fn delete_template(
    db_instances: State<'_, DbInstances>,
    template_id: String,
) -> Result<(), String> {
    let pool = sqlite_pool(&db_instances).await?;
    persistence::delete_template(&pool, &template_id)
        .await
        .map_err(|error| format!("Não foi possível excluir o template: {error}"))
}

fn portability_staging_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_cache_dir()
        .map(|path| path.join("portability"))
        .map_err(|error| format!("Não foi possível resolver a pasta temporária: {error}"))
}

fn backup_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Não foi possível resolver a pasta do aplicativo: {error}"))?;
    Ok(database::database_backup_dir(&app_config_dir))
}

fn file_path(path: tauri_plugin_dialog::FilePath) -> Result<PathBuf, String> {
    path.into_path()
        .map_err(|error| format!("O caminho selecionado não é um arquivo local válido: {error}"))
}

fn with_extension(path: PathBuf, extension: &str) -> PathBuf {
    if path
        .extension()
        .is_some_and(|current| current.eq_ignore_ascii_case(extension))
    {
        path
    } else {
        path.with_extension(extension)
    }
}

fn validate_pdf_bytes(bytes: &[u8]) -> Result<(), String> {
    const MAX_PDF_SIZE: usize = 50 * 1024 * 1024;
    if bytes.len() > MAX_PDF_SIZE {
        return Err("O relatório PDF excede o limite de 50 MB.".to_owned());
    }
    if !bytes.starts_with(b"%PDF-") || !bytes.windows(5).rev().any(|window| window == b"%%EOF") {
        return Err("O arquivo gerado não possui uma estrutura PDF válida.".to_owned());
    }
    Ok(())
}

#[tauri::command]
pub async fn save_pdf_report(
    app: AppHandle,
    suggested_name: String,
    bytes: Vec<u8>,
) -> Result<Option<serde_json::Value>, String> {
    validate_pdf_bytes(&bytes)?;

    #[cfg(feature = "e2e")]
    let selected = e2e_path("PROJECTFLOW_E2E_PDF_PATH").map(tauri_plugin_dialog::FilePath::Path);
    #[cfg(not(feature = "e2e"))]
    let selected = None;

    let selected = match selected {
        Some(path) => Some(path),
        None => app
            .dialog()
            .file()
            .set_title("Salvar relatório PDF do ProjectFlow")
            .set_file_name(format!("{suggested_name}.pdf"))
            .add_filter("Documento PDF", &["pdf"])
            .blocking_save_file(),
    };
    let Some(selected) = selected else {
        return Ok(None);
    };
    let destination = with_extension(file_path(selected)?, "pdf");
    std::fs::write(&destination, bytes)
        .map_err(|error| format!("Não foi possível salvar o relatório PDF: {error}"))?;
    Ok(Some(
        serde_json::json!({ "path": destination.to_string_lossy() }),
    ))
}

fn portability_error(context: &str, error: String) -> String {
    warn!("ProjectFlow portability error during {context}: {error}");
    error
}

#[cfg(feature = "e2e")]
fn e2e_path(variable: &str) -> Option<PathBuf> {
    std::env::var_os(variable)
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
}

fn workspace_export_destination(app: &AppHandle) -> Result<Option<PathBuf>, String> {
    #[cfg(feature = "e2e")]
    if let Some(destination) = e2e_path("PROJECTFLOW_E2E_EXPORT_PATH") {
        return Ok(Some(with_extension(destination, "projectflow")));
    }

    app.dialog()
        .file()
        .set_title("Exportar workspace do ProjectFlow")
        .set_file_name(format!(
            "projectflow-workspace-{}.projectflow",
            chrono::Local::now().format("%Y%m%d")
        ))
        .add_filter("Pacote ProjectFlow", &["projectflow"])
        .blocking_save_file()
        .map(file_path)
        .transpose()
        .map(|path| path.map(|value| with_extension(value, "projectflow")))
}

fn import_package_path(app: &AppHandle) -> Result<Option<PathBuf>, String> {
    #[cfg(feature = "e2e")]
    if let Some(path) = e2e_path("PROJECTFLOW_E2E_IMPORT_PATH") {
        return Ok(Some(path));
    }

    app.dialog()
        .file()
        .set_title("Importar pacote do ProjectFlow")
        .add_filter("Pacote ProjectFlow", &["projectflow"])
        .blocking_pick_file()
        .map(file_path)
        .transpose()
}

#[tauri::command]
pub async fn export_project(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    project_id: String,
    suggested_name: String,
) -> Result<Option<ExportResult>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Exportar projeto do ProjectFlow")
        .set_file_name(format!("{suggested_name}.projectflow"))
        .add_filter("Pacote ProjectFlow", &["projectflow"])
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(None);
    };
    let destination = with_extension(file_path(selected)?, "projectflow");
    let pool = sqlite_pool(&db_instances).await?;
    portability::export_project(
        &pool,
        &project_id,
        &destination,
        &portability_staging_dir(&app)?,
    )
    .await
    .map(Some)
    .map_err(|error| portability_error("project export", error))
}

#[tauri::command]
pub async fn export_workspace(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<ExportResult>, String> {
    let Some(destination) = workspace_export_destination(&app)? else {
        return Ok(None);
    };
    let pool = sqlite_pool(&db_instances).await?;
    portability::export_workspace(&pool, &destination, &portability_staging_dir(&app)?)
        .await
        .map(Some)
        .map_err(|error| portability_error("workspace export", error))
}

#[tauri::command]
pub async fn choose_import_package(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<ImportPackagePreview>, String> {
    let Some(path) = import_package_path(&app)? else {
        return Ok(None);
    };
    let pool = sqlite_pool(&db_instances).await?;
    portability::inspect_package(&pool, &path, &portability_staging_dir(&app)?)
        .await
        .map(Some)
        .map_err(|error| portability_error("package inspection", error))
}

#[tauri::command]
pub async fn apply_import_package(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    package_path: String,
    selection: ImportSelection,
) -> Result<ImportResult, String> {
    let pool = sqlite_pool(&db_instances).await?;
    portability::import_package(
        &pool,
        Path::new(&package_path),
        &portability_staging_dir(&app)?,
        &backup_dir(&app)?,
        &selection,
    )
    .await
    .map_err(|error| portability_error("package import", error))
}

#[tauri::command]
pub async fn create_backup(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<BackupResult>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Salvar backup do ProjectFlow")
        .set_file_name(format!(
            "projectflow-backup-{}.sqlite",
            chrono::Local::now().format("%Y%m%d-%H%M")
        ))
        .add_filter("Backup SQLite do ProjectFlow", &["sqlite"])
        .blocking_save_file();
    let Some(selected) = selected else {
        return Ok(None);
    };
    let destination = with_extension(file_path(selected)?, "sqlite");
    let pool = sqlite_pool(&db_instances).await?;
    portability::create_backup_at(&pool, &destination)
        .await
        .map(Some)
        .map_err(|error| portability_error("manual backup", error))
}

#[tauri::command]
pub fn open_backup_folder(app: AppHandle) -> Result<(), String> {
    let path = backup_dir(&app)?;
    std::fs::create_dir_all(&path)
        .map_err(|error| format!("Não foi possível preparar a pasta de backups: {error}"))?;
    std::process::Command::new("explorer.exe")
        .arg(&path)
        .spawn()
        .map_err(|error| format!("Não foi possível abrir a pasta de backups: {error}"))?;
    Ok(())
}

#[tauri::command]
pub async fn choose_restore_backup(app: AppHandle) -> Result<Option<ImportPackagePreview>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Selecionar backup do ProjectFlow")
        .add_filter("Backup SQLite do ProjectFlow", &["sqlite"])
        .blocking_pick_file();
    let Some(selected) = selected else {
        return Ok(None);
    };
    portability::inspect_backup(&file_path(selected)?)
        .await
        .map(Some)
        .map_err(|error| portability_error("backup inspection", error))
}

#[tauri::command]
pub async fn restore_backup(
    app: AppHandle,
    db_instances: State<'_, DbInstances>,
    backup_path: String,
) -> Result<RestoreResult, String> {
    let pool = sqlite_pool(&db_instances).await?;
    portability::restore_backup(&pool, Path::new(&backup_path), &backup_dir(&app)?)
        .await
        .map_err(|error| portability_error("backup restore", error))
}

#[cfg(test)]
mod tests {
    use super::validate_pdf_bytes;

    #[test]
    fn accepts_a_complete_pdf_envelope() {
        assert!(validate_pdf_bytes(b"%PDF-1.7\nconteudo\n%%EOF").is_ok());
    }

    #[test]
    fn rejects_content_without_a_pdf_envelope() {
        let error = validate_pdf_bytes(b"arquivo incorreto").expect_err("invalid PDF must fail");
        assert!(error.contains("estrutura PDF válida"));
    }
}
