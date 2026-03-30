import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Project } from '../types'
import type { ReviewComment } from '../lib/supabase'

interface ProjectStore {
  projects: Project[]
  loading: boolean
  fetchProjects: () => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'created_at'>) => Promise<Project | null>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    set({ projects: data ?? [], loading: false })
  },

  addProject: async (project) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error || !data) return null
    set({ projects: [data, ...get().projects] })
    return data
  },

  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    set({ projects: get().projects.filter(p => p.id !== id) })
  },
}))

interface FeedbackStore {
  feedbacks: ReviewComment[]
  loading: boolean
  fetchFeedbacks: (projectId?: string) => Promise<void>
  updateFeedbackStatus: (id: string, status: ReviewComment['status']) => Promise<void>
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  feedbacks: [],
  loading: false,

  fetchFeedbacks: async (projectId?: string) => {
    set({ loading: true })
    let query = supabase
      .from('review_comments')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data } = await query
    set({ feedbacks: data ?? [], loading: false })
  },

  updateFeedbackStatus: async (id, status) => {
    const updates: Record<string, unknown> = { status }
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    await supabase.from('review_comments').update(updates).eq('id', id)

    set({
      feedbacks: get().feedbacks.map(f =>
        f.id === id ? { ...f, status, ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) } : f
      ),
    })
  },
}))
