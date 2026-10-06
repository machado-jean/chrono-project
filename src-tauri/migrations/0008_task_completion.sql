ALTER TABLE tasks ADD COLUMN completed_date TEXT
CHECK (completed_date IS NULL OR length(completed_date) = 10);

-- Existing completed tasks predate the explicit completion date. Preserve them
-- by using the registered finish date and, when absent, the last update date.
UPDATE tasks
SET progress = 100,
    completed_date = COALESCE(end_date, substr(updated_at, 1, 10))
WHERE status = 'COMPLETED';

CREATE INDEX tasks_project_completed_date
ON tasks (project_id, completed_date);

-- History entries embed the former Task JSON shape and cannot safely restore
-- a completion transition without its factual completion date.
DELETE FROM gantt_history_state;

UPDATE app_metadata SET value = '8' WHERE key = 'schema_version';
