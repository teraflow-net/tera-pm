CREATE TABLE IF NOT EXISTS project_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_pages_project ON project_pages(project_id);
ALTER TABLE project_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read project_pages" ON project_pages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert project_pages" ON project_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update project_pages" ON project_pages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete project_pages" ON project_pages FOR DELETE USING (true);
