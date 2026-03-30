import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kixxlhrosxbcwdeofmgg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHhsaHJvc3hiY3dkZW9mbWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTI1NDksImV4cCI6MjA5MDEyODU0OX0._XkejZIIt_6XtNMkIo9SjtsLw6ikq5TDTuQd0-YbjxQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface ReviewComment {
  id: string
  project_id: string
  page_url: string
  x_percent: number
  y_percent: number
  content: string
  status: 'open' | 'in_progress' | 'resolved'
  author_name: string
  image_url: string | null
  created_at: string
  resolved_at: string | null
  meta_viewport: string | null
  meta_browser: string | null
  meta_os: string | null
}
