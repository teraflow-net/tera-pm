import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, AlertTriangle, Plus, CheckCircle,
  Clock, ArrowUpRight, Briefcase,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useProjectStore, useFeedbackStore } from '../store/useStore'
import { formatRelative, cn } from '../lib/utils'
import type { ReviewComment } from '../lib/supabase'

function ProgressRing({ value, size = 56, strokeWidth = 5, color = '#2563eb' }: {
  value: number; size?: number; strokeWidth?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, fetchProjects } = useProjectStore()
  const { feedbacks, fetchFeedbacks } = useFeedbackStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([fetchProjects(), fetchFeedbacks()]).then(() => setLoaded(true))
  }, [fetchProjects, fetchFeedbacks])

  const openCount = feedbacks.filter(f => f.status === 'open').length
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length
  const resolveRate = feedbacks.length > 0 ? Math.round((resolvedCount / feedbacks.length) * 100) : 0

  // Group feedbacks by project_id
  const feedbackByProject = feedbacks.reduce<Record<string, ReviewComment[]>>((acc, f) => {
    acc[f.project_id] = acc[f.project_id] || []
    acc[f.project_id].push(f)
    return acc
  }, {})

  if (!loaded) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`${projects.length} projects`}
        actions={
          <Button size="sm" onClick={() => navigate('/projects/new')}>
            <Plus size={14} />
            New Project
          </Button>
        }
      />

      <div className="p-6 overflow-y-auto flex-1">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Resolve Rate */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <ProgressRing value={resolveRate} color="#10b981" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-900">{resolveRate}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Resolve Rate</div>
              <div className="text-xs text-slate-400">{resolvedCount} / {feedbacks.length} resolved</div>
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500">Projects</div>
              <Briefcase size={14} className="text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{projects.length}</div>
            <div className="text-[11px] text-slate-400">
              {projects.filter(p => p.status === 'active').length} active
            </div>
          </div>

          {/* Total Feedback */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500">Total Feedback</div>
              <MessageSquare size={14} className="text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{feedbacks.length}</div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {openCount} open</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {inProgressCount} progress</span>
            </div>
          </div>

          {/* Unresolved */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500">Unresolved</div>
              <AlertTriangle size={14} className="text-slate-300" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-slate-900">{openCount + inProgressCount}</span>
              {openCount + inProgressCount > 0 && (
                <span className="text-xs text-amber-600 font-medium">needs attention</span>
              )}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-900">All Projects</h2>
              <span className="text-xs text-slate-400">{projects.length} total</span>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FolderOpen size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-4">No projects yet</p>
              <Button size="sm" onClick={() => navigate('/projects/new')}>
                <Plus size={14} />
                Create First Project
              </Button>
            </div>
          ) : (
            projects.map((project, i) => {
              const projectFeedbacks = feedbackByProject[project.widget_project_id] || []
              const projectOpen = projectFeedbacks.filter(f => f.status !== 'resolved').length
              const projectResolved = projectFeedbacks.filter(f => f.status === 'resolved').length
              const projectTotal = projectFeedbacks.length
              const healthPct = projectTotal > 0 ? Math.round((projectResolved / projectTotal) * 100) : 100

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={cn(
                    'flex items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group',
                    i < projects.length - 1 && 'border-b border-slate-50'
                  )}
                >
                  {/* Status */}
                  <div className="w-8 shrink-0">
                    {projectOpen > 0 ? (
                      <AlertTriangle size={16} className="text-amber-500" />
                    ) : (
                      <CheckCircle size={16} className="text-emerald-500" />
                    )}
                  </div>

                  {/* Name + URL */}
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</span>
                      <Badge variant={project.status} />
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {project.client_name && <span>{project.client_name} · </span>}
                      {project.base_url || project.widget_project_id}
                    </div>
                  </div>

                  {/* Feedback count */}
                  <div className="w-20 text-center shrink-0">
                    <div className="text-sm font-semibold text-slate-700">{projectTotal}</div>
                    <div className="text-[10px] text-slate-400">feedback</div>
                  </div>

                  {/* Health bar */}
                  <div className="w-28 shrink-0 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', projectOpen > 0 ? 'bg-amber-400' : 'bg-emerald-400')}
                          style={{ width: `${healthPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-7 text-right">{healthPct}%</span>
                    </div>
                  </div>

                  {/* Open issues */}
                  <div className="w-20 text-center shrink-0">
                    {projectOpen > 0 ? (
                      <Badge variant="open">{projectOpen} open</Badge>
                    ) : (
                      <Badge variant="resolved">OK</Badge>
                    )}
                  </div>

                  {/* Created */}
                  <div className="w-24 text-right shrink-0">
                    <div className="text-xs text-slate-500">
                      {formatRelative(project.created_at)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="w-8 text-right shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={14} className="text-blue-500" />
                  </div>
                </div>
              )
            })
          )}

          {/* Add project row */}
          <div
            onClick={() => navigate('/projects/new')}
            className="flex items-center justify-center px-5 py-4 cursor-pointer hover:bg-blue-50/50 transition-colors border-t border-slate-100"
          >
            <Plus size={14} className="text-slate-300 mr-2" />
            <span className="text-sm text-slate-400 font-medium">Add Project</span>
          </div>
        </div>

        {/* Recent Feedback */}
        {feedbacks.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Feedback</h2>
              <button
                onClick={() => navigate('/feedback')}
                className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            {feedbacks.slice(0, 8).map((feedback, i) => (
              <div
                key={feedback.id}
                className={cn(
                  'flex items-center px-5 py-3 hover:bg-slate-50 transition-colors',
                  i < Math.min(feedbacks.length, 8) - 1 && 'border-b border-slate-50'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0 mr-3',
                  feedback.status === 'open' ? 'bg-amber-500' :
                  feedback.status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'
                )} />

                <div className="flex-1 min-w-0 mr-4">
                  <div className="text-sm text-slate-700 truncate">{feedback.content}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {feedback.author_name} · {feedback.page_url} · {feedback.project_id}
                  </div>
                </div>

                <Badge variant={feedback.status} />

                <div className="w-24 text-right shrink-0 ml-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    <Clock size={10} />
                    {formatRelative(feedback.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
