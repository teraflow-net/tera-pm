ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT false;
