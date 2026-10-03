DROP TRIGGER IF EXISTS task_dependencies_require_leaf_tasks;
DROP TRIGGER IF EXISTS task_dependencies_require_leaf_tasks_on_update;
DROP TRIGGER IF EXISTS tasks_parent_must_not_have_dependencies_on_insert;
DROP TRIGGER IF EXISTS tasks_parent_must_not_have_dependencies_on_update;
DROP TRIGGER IF EXISTS task_template_dependencies_require_leaf_items;
DROP TRIGGER IF EXISTS task_template_dependencies_require_leaf_items_on_update;
DROP TRIGGER IF EXISTS task_template_parent_must_not_have_dependencies_on_insert;
DROP TRIGGER IF EXISTS task_template_parent_must_not_have_dependencies_on_update;

CREATE TRIGGER task_dependencies_reject_summary_successor
BEFORE INSERT ON task_dependencies
WHEN EXISTS (
    SELECT 1 FROM tasks WHERE parent_id = NEW.successor_id
)
BEGIN
    SELECT RAISE(ABORT, 'summary tasks cannot be dependency successors');
END;

CREATE TRIGGER task_dependencies_reject_summary_successor_on_update
BEFORE UPDATE OF successor_id ON task_dependencies
WHEN EXISTS (
    SELECT 1 FROM tasks WHERE parent_id = NEW.successor_id
)
BEGIN
    SELECT RAISE(ABORT, 'summary tasks cannot be dependency successors');
END;

CREATE TRIGGER tasks_parent_must_not_be_dependency_successor_on_insert
BEFORE INSERT ON tasks
WHEN NEW.parent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM task_dependencies WHERE successor_id = NEW.parent_id
)
BEGIN
    SELECT RAISE(ABORT, 'a dependency successor cannot become a summary task');
END;

CREATE TRIGGER tasks_parent_must_not_be_dependency_successor_on_update
BEFORE UPDATE OF parent_id ON tasks
WHEN NEW.parent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM task_dependencies WHERE successor_id = NEW.parent_id
)
BEGIN
    SELECT RAISE(ABORT, 'a dependency successor cannot become a summary task');
END;

CREATE TRIGGER task_template_dependencies_reject_summary_successor
BEFORE INSERT ON task_template_dependencies
WHEN EXISTS (
    SELECT 1 FROM task_template_items WHERE parent_id = NEW.successor_id
)
BEGIN
    SELECT RAISE(ABORT, 'summary template items cannot be dependency successors');
END;

CREATE TRIGGER task_template_dependencies_reject_summary_successor_on_update
BEFORE UPDATE OF successor_id ON task_template_dependencies
WHEN EXISTS (
    SELECT 1 FROM task_template_items WHERE parent_id = NEW.successor_id
)
BEGIN
    SELECT RAISE(ABORT, 'summary template items cannot be dependency successors');
END;

CREATE TRIGGER task_template_parent_must_not_be_dependency_successor_on_insert
BEFORE INSERT ON task_template_items
WHEN NEW.parent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM task_template_dependencies WHERE successor_id = NEW.parent_id
)
BEGIN
    SELECT RAISE(ABORT, 'a template dependency successor cannot become a summary');
END;

CREATE TRIGGER task_template_parent_must_not_be_dependency_successor_on_update
BEFORE UPDATE OF parent_id ON task_template_items
WHEN NEW.parent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM task_template_dependencies WHERE successor_id = NEW.parent_id
)
BEGIN
    SELECT RAISE(ABORT, 'a template dependency successor cannot become a summary');
END;

UPDATE app_metadata SET value = '6' WHERE key = 'schema_version';
