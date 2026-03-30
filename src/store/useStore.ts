import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Project, ProjectPage } from '../types'
import type { ReviewComment } from '../lib/supabase'

interface ProjectStore {
  projects: Project[]
  loading: boolean
  fetchProjects: () => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'created_at'>) => Promise<Project | null>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  generateReviewToken: (projectId: string) => Promise<string | null>
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

  updateProject: async (id, updates) => {
    const { data } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (data) {
      set({ projects: get().projects.map(p => p.id === id ? { ...p, ...data } : p) })
    }
  },

  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    set({ projects: get().projects.filter(p => p.id !== id) })
  },

  generateReviewToken: async (projectId) => {
    const token = crypto.randomUUID().slice(0, 8)
    const { error } = await supabase
      .from('projects')
      .update({ review_token: token })
      .eq('id', projectId)

    if (error) return null
    set({ projects: get().projects.map(p => p.id === projectId ? { ...p, review_token: token } : p) })
    return token
  },
}))

interface PageStore {
  pages: ProjectPage[]
  loading: boolean
  fetchPages: (projectId: string) => Promise<void>
  addPage: (page: Omit<ProjectPage, 'id' | 'created_at'>) => Promise<ProjectPage | null>
  deletePage: (id: string) => Promise<void>
}

export const usePageStore = create<PageStore>((set, get) => ({
  pages: [],
  loading: false,

  fetchPages: async (projectId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('project_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    set({ pages: data ?? [], loading: false })
  },

  addPage: async (page) => {
    const { data, error } = await supabase
      .from('project_pages')
      .insert(page)
      .select()
      .single()

    if (error || !data) return null
    set({ pages: [...get().pages, data] })
    return data
  },

  deletePage: async (id) => {
    await supabase.from('project_pages').delete().eq('id', id)
    set({ pages: get().pages.filter(p => p.id !== id) })
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
