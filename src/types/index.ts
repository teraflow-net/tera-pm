export interface Project {
  id: string
  name: string
  base_url: string | null
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  widget_project_id: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

export interface FeedbackStats {
  total: number
  open: number
  in_progress: number
  resolved: number
}
