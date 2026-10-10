ALTER TABLE projects ADD COLUMN critical_path_enabled INTEGER NOT NULL DEFAULT 0
    CHECK (critical_path_enabled IN (0, 1));

UPDATE app_metadata SET value = '9' WHERE key = 'schema_version';
