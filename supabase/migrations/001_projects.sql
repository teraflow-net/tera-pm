-- Projects table for Tera PM
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  widget_project_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_widget_id ON projects(widget_project_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete projects" ON projects FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
