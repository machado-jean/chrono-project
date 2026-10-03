CREATE TABLE gantt_history_state (
    project_id TEXT PRIMARY KEY NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    undo_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(undo_json)),
    redo_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(redo_json)),
    updated_at TEXT NOT NULL
) STRICT;

UPDATE app_metadata SET value = '7' WHERE key = 'schema_version';
