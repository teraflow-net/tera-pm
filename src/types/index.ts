export interface Project {
  id: string
  name: string
  base_url: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  widget_project_id: string
  existing_url: string | null
  benchmark_url: string | null
  new_site_url: string | null
  widget_installed: boolean
  review_token: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

export interface ProjectPage {
  id: string
  project_id: string
  path: string
  label: string
  sort_order: number
  created_at: string
}

export interface FeedbackStats {
  total: number
  open: number
  in_progress: number
  resolved: number
}
