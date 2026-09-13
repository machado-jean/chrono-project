ALTER TABLE tasks ADD COLUMN deadline_date TEXT
CHECK (deadline_date IS NULL OR length(deadline_date) = 10);

CREATE INDEX tasks_project_deadline ON tasks (project_id, deadline_date);

CREATE TABLE project_baselines (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL CHECK (length(created_at) > 0),
    replaced_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;

CREATE UNIQUE INDEX project_baselines_single_active
ON project_baselines (project_id)
WHERE is_active = 1;

CREATE INDEX project_baselines_history
ON project_baselines (project_id, created_at DESC);

CREATE TABLE baseline_tasks (
    baseline_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    outline TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    duration_days INTEGER,
    progress INTEGER NOT NULL CHECK (progress BETWEEN 0 AND 100),
    PRIMARY KEY (baseline_id, task_id),
    CHECK (
        (start_date IS NULL AND end_date IS NULL AND duration_days IS NULL)
        OR
        (
            start_date IS NOT NULL
            AND end_date IS NOT NULL
            AND duration_days IS NOT NULL
            AND duration_days >= 1
            AND length(start_date) = 10
            AND length(end_date) = 10
            AND end_date >= start_date
        )
    ),
    FOREIGN KEY (baseline_id) REFERENCES project_baselines (id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;

UPDATE app_metadata SET value = '5' WHERE key = 'schema_version';
