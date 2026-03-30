import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Globe, MessageSquare, ExternalLink, Briefcase, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useState } from 'react'
import type { Project, ProjectPage } from '../types'
import type { ReviewComment } from '../lib/supabase'

export function ClientReview() {
  const { token } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [pages, setPages] = useState<ProjectPage[]>([])
  const [feedbacks, setFeedbacks] = useState<ReviewComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) return

    const load = async () => {
      setLoading(true)

      // Fetch project by review_token
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('review_token', token)
        .single()

      if (!proj) {
        setError(true)
        setLoading(false)
        return
      }

      setProject(proj)

      // Fetch pages
      const { data: pagesData } = await supabase
        .from('project_pages')
        .select('*')
        .eq('project_id', proj.id)
        .order('sort_order', { ascending: true })

      setPages(pagesData ?? [])

      // Fetch feedbacks
      const { data: feedbackData } = await supabase
        .from('review_comments')
        .select('*')
        .eq('project_id', proj.widget_project_id)
        .order('created_at', { ascending: false })

      setFeedbacks(feedbackData ?? [])
      setLoading(false)
    }

    load()
  }, [token])

  const getPageUrl = (path: string) => {
    const base = project?.new_site_url || project?.base_url || ''
    return base ? `${base.replace(/\/$/, '')}${path}` : path
  }

  const feedbackByPage = useMemo(() => {
    return feedbacks.reduce<Record<string, ReviewComment[]>>((acc, f) => {
      acc[f.page_url] = acc[f.page_url] || []
      acc[f.page_url].push(f)
      return acc
    }, {})
  }, [feedbacks])

  const getPageFeedback = (path: string) => {
    const fullUrl = getPageUrl(path)
    const matched: ReviewComment[] = []
    for (const [pageUrl, items] of Object.entries(feedbackByPage)) {
      if (pageUrl === fullUrl || pageUrl.endsWith(path)) {
        matched.push(...items)
      }
    }
    return matched
  }

  const openCount = feedbacks.filter(f => f.status === 'open').length
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">유효하지 않은 리뷰 링크입니다</p>
          <p className="text-slate-500 text-xs mt-1">링크를 다시 확인해 주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">{project.name}</h1>
              {project.client_name && (
                <p className="text-xs text-slate-400">{project.client_name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-slate-400 mb-1">총 피드백</div>
            <div className="text-2xl font-bold text-white">{feedbacks.length}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-slate-400 mb-1">미확인</div>
            <div className="text-2xl font-bold text-amber-400">{openCount}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-slate-400 mb-1">진행 중</div>
            <div className="text-2xl font-bold text-blue-400">{inProgressCount}</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="text-xs text-slate-400 mb-1">해결 완료</div>
            <div className="text-2xl font-bold text-emerald-400">{resolvedCount}</div>
          </div>
        </div>

        {/* Progress bar */}
        {feedbacks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">진행률</span>
              <span className="text-xs text-slate-400">
                {feedbacks.length > 0 ? Math.round((resolvedCount / feedbacks.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 transition-all" style={{ width: `${(resolvedCount / feedbacks.length) * 100}%` }} />
              <div className="bg-blue-500 transition-all" style={{ width: `${(inProgressCount / feedbacks.length) * 100}%` }} />
              <div className="bg-amber-500 transition-all" style={{ width: `${(openCount / feedbacks.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Pages */}
        <h2 className="text-sm font-semibold text-white mb-4">페이지 목록</h2>

        {pages.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 px-5 py-12 text-center">
            <Globe size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">등록된 페이지가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {pages.map(page => {
              const pageFeedback = getPageFeedback(page.path)
              const pageOpen = pageFeedback.filter(f => f.status === 'open').length
              const pageResolved = pageFeedback.filter(f => f.status === 'resolved').length

              return (
                <div
                  key={page.id}
                  onClick={() => window.open(getPageUrl(page.path), '_blank')}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-slate-500" />
                      <span className="text-sm font-medium text-white">{page.label}</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-3">{page.path}</div>

                  <div className="flex items-center gap-3">
                    {pageFeedback.length > 0 ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MessageSquare size={12} />
                          {pageFeedback.length}
                        </span>
                        {pageOpen > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {pageOpen} open
                          </span>
                        )}
                        {pageResolved > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={10} />
                            {pageResolved}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-600">피드백 없음</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-2">피드백 남기는 방법</h3>
          <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
            <li>위 페이지 카드를 클릭하면 해당 페이지가 새 탭에서 열립니다</li>
            <li>페이지 우측 하단의 피드백 위젯 버튼을 클릭하세요</li>
            <li>수정이 필요한 위치를 클릭하고 피드백을 남겨주세요</li>
            <li>스크린샷도 첨부할 수 있습니다</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
