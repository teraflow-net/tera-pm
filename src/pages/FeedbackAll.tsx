import { useEffect, useState } from 'react'
import {
  MessageSquare, Globe, Image as ImageIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useFeedbackStore } from '../store/useStore'
import { formatDate, formatRelative, cn } from '../lib/utils'
import type { ReviewComment } from '../lib/supabase'

export function FeedbackAll() {
  const { feedbacks, fetchFeedbacks, updateFeedbackStatus, loading } = useFeedbackStore()
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const filtered = filter === 'all' ? feedbacks : feedbacks.filter(f => f.status === filter)

  const openCount = feedbacks.filter(f => f.status === 'open').length
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length

  // Group by project_id
  const grouped = filtered.reduce<Record<string, ReviewComment[]>>((acc, f) => {
    acc[f.project_id] = acc[f.project_id] || []
    acc[f.project_id].push(f)
    return acc
  }, {})

  const handleStatusChange = async (id: string, status: ReviewComment['status']) => {
    await updateFeedbackStatus(id, status)
  }

  return (
    <>
      <Header
        title="All Feedback"
        subtitle={`${feedbacks.length} total across all projects`}
      />

      <div className="p-6 overflow-y-auto flex-1">
        {/* Stats + Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {openCount} open</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {inProgressCount} in progress</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {resolvedCount} resolved</span>
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
                {f === 'all' ? `All (${feedbacks.length})` :
                 f === 'open' ? `Open (${openCount})` :
                 f === 'in_progress' ? `In Progress (${inProgressCount})` :
                 `Resolved (${resolvedCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center">
            <MessageSquare size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No feedback found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([projectId, projectFeedbacks]) => (
            <div key={projectId} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{projectId}</span>
                  <span className="text-xs text-slate-400">{projectFeedbacks.length} items</span>
                </div>
              </div>

              {projectFeedbacks.map((feedback, i) => {
                const isExpanded = expandedId === feedback.id
                return (
                  <div
                    key={feedback.id}
                    className={cn(i < projectFeedbacks.length - 1 && 'border-b border-slate-50')}
                  >
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
                          {feedback.author_name} · {feedback.page_url} · {formatRelative(feedback.created_at)}
                        </div>
                      </div>
                      {feedback.image_url && <ImageIcon size={14} className="text-slate-300 mr-2" />}
                      <Badge variant={feedback.status} />
                      <div className="ml-2">
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 bg-slate-50/50">
                        <div className="border border-slate-200 rounded-lg bg-white p-4">
                          <div className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{feedback.content}</div>
                          {feedback.image_url && (
                            <a href={feedback.image_url} target="_blank" rel="noreferrer" className="block mb-3">
                              <img src={feedback.image_url} alt="Screenshot" className="max-w-sm rounded-lg border border-slate-200" />
                            </a>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                            <span>Pin: ({feedback.x_percent.toFixed(1)}%, {feedback.y_percent.toFixed(1)}%)</span>
                            {feedback.meta_browser && <span>{feedback.meta_browser}</span>}
                            {feedback.meta_os && <span>{feedback.meta_os}</span>}
                            <span>{formatDate(feedback.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 mr-2">Status:</span>
                            {feedback.status !== 'in_progress' && (
                              <Button variant="secondary" size="sm" onClick={() => handleStatusChange(feedback.id, 'in_progress')}>
                                In Progress
                              </Button>
                            )}
                            {feedback.status !== 'resolved' && (
                              <Button variant="primary" size="sm" onClick={() => handleStatusChange(feedback.id, 'resolved')}>
                                Resolve
                              </Button>
                            )}
                            {feedback.status === 'resolved' && (
                              <Button variant="ghost" size="sm" onClick={() => handleStatusChange(feedback.id, 'open')}>
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
