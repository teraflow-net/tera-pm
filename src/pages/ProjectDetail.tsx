import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, ExternalLink, Copy, Check,
  Image as ImageIcon, Globe, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useProjectStore, useFeedbackStore } from '../store/useStore'
import { formatDate, formatRelative, cn } from '../lib/utils'
import type { ReviewComment } from '../lib/supabase'

export function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, fetchProjects } = useProjectStore()
  const { feedbacks, fetchFeedbacks, updateFeedbackStatus } = useFeedbackStore()
  const [copied, setCopied] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projects.length === 0) fetchProjects()
  }, [projects.length, fetchProjects])

  useEffect(() => {
    if (project) {
      fetchFeedbacks(project.widget_project_id)
    }
  }, [project, fetchFeedbacks])

  if (!project) {
    return (
      <>
        <Header title="Project not found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading or project not found...</div>
        </div>
      </>
    )
  }

  const filteredFeedbacks = filter === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.status === filter)

  const openCount = feedbacks.filter(f => f.status === 'open').length
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length

  // Group by page_url
  const groupedByPage = filteredFeedbacks.reduce<Record<string, ReviewComment[]>>((acc, f) => {
    acc[f.page_url] = acc[f.page_url] || []
    acc[f.page_url].push(f)
    return acc
  }, {})

  const widgetScript = `<script src="https://teraflow-net.github.io/tera-feedback-widget/feedback-widget.iife.js" data-project="${project.widget_project_id}" data-supabase-url="https://kixxlhrosxbcwdeofmgg.supabase.co" data-supabase-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHhsaHJvc3hiY3dkZW9mbWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTI1NDksImV4cCI6MjA5MDEyODU0OX0._XkejZIIt_6XtNMkIo9SjtsLw6ikq5TDTuQd0-YbjxQ" defer></script>`

  const copyScript = () => {
    navigator.clipboard.writeText(widgetScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStatusChange = async (id: string, status: ReviewComment['status']) => {
    await updateFeedbackStatus(id, status)
  }

  return (
    <>
      <Header
        title={project.name}
        subtitle={project.client_name ? `${project.client_name} · ${project.base_url || ''}` : project.base_url || ''}
        actions={
          <div className="flex items-center gap-2">
            {project.base_url && (
              <Button variant="ghost" size="sm" onClick={() => window.open(project.base_url!, '_blank')}>
                <ExternalLink size={14} />
                Visit Site
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} />
              Back
            </Button>
          </div>
        }
      />

      <div className="p-6 overflow-y-auto flex-1">
        {/* Widget Script */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Feedback Widget Script</h3>
              <p className="text-xs text-slate-400 mt-0.5">Copy and paste this into the client's website</p>
            </div>
            <Button variant="secondary" size="sm" onClick={copyScript}>
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Script'}
            </Button>
          </div>
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
            {widgetScript}
          </pre>
        </div>

        {/* Stats + Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-900">Feedback ({feedbacks.length})</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {openCount} open</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {inProgressCount} progress</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {resolvedCount} resolved</span>
            </div>
          </div>
          <div className="flex gap-1">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md cursor-pointer transition-colors',
                  filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback grouped by page */}
        {Object.keys(groupedByPage).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center">
            <MessageSquare size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No feedback yet</p>
            <p className="text-xs text-slate-300 mt-1">Install the widget script on the client's site to start collecting feedback</p>
          </div>
        ) : (
          Object.entries(groupedByPage).map(([pageUrl, pageFeedbacks]) => (
            <div key={pageUrl} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              {/* Page header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{pageUrl}</span>
                  <span className="text-xs text-slate-400">{pageFeedbacks.length} items</span>
                </div>
              </div>

              {/* Feedback items */}
              {pageFeedbacks.map((feedback, i) => {
                const isExpanded = expandedId === feedback.id
                return (
                  <div
                    key={feedback.id}
                    className={cn(
                      'border-b border-slate-50',
                      i === pageFeedbacks.length - 1 && 'border-b-0'
                    )}
                  >
                    {/* Row */}
                    <div
                      className="flex items-center px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0 mr-3',
                        feedback.status === 'open' ? 'bg-amber-500' :
                        feedback.status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'
                      )} />

                      <div className="flex-1 min-w-0 mr-4">
                        <div className="text-sm text-slate-700 truncate">{feedback.content}</div>
                        <div className="text-xs text-slate-400">
                          {feedback.author_name} · {formatRelative(feedback.created_at)}
                        </div>
                      </div>

                      {feedback.image_url && <ImageIcon size={14} className="text-slate-300 mr-2" />}
                      {feedback.meta_browser && <Globe size={14} className="text-slate-300 mr-2" />}

                      <Badge variant={feedback.status} />

                      <div className="ml-2">
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-slate-50/50">
                        <div className="border border-slate-200 rounded-lg bg-white p-4">
                          <div className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{feedback.content}</div>

                          {feedback.image_url && (
                            <a href={feedback.image_url} target="_blank" rel="noreferrer" className="block mb-3">
                              <img
                                src={feedback.image_url}
                                alt="Feedback screenshot"
                                className="max-w-sm rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                              />
                            </a>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                            <span>Pin: ({feedback.x_percent.toFixed(1)}%, {feedback.y_percent.toFixed(1)}%)</span>
                            {feedback.meta_browser && <span>{feedback.meta_browser}</span>}
                            {feedback.meta_os && <span>{feedback.meta_os}</span>}
                            {feedback.meta_viewport && <span>{feedback.meta_viewport}</span>}
                            <span>{formatDate(feedback.created_at)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 mr-2">Status:</span>
                            {feedback.status !== 'in_progress' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStatusChange(feedback.id, 'in_progress')}
                              >
                                In Progress
                              </Button>
                            )}
                            {feedback.status !== 'resolved' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStatusChange(feedback.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                            )}
                            {feedback.status === 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(feedback.id, 'open')}
                              >
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </>
  )
}
