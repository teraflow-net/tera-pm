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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f8fa' }}>
        <div className="text-sm" style={{ color: '#6b7684' }}>Loading...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f8fa' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#e5e8eb' }}>
            <Briefcase size={24} style={{ color: '#6b7684' }} />
          </div>
          <p className="text-sm" style={{ color: '#6b7684' }}>유효하지 않은 리뷰 링크입니다</p>
          <p className="text-xs mt-1" style={{ color: '#8b95a1' }}>링크를 다시 확인해 주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f8fa' }}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5e8eb' }}>
        <div className="mx-auto px-6 py-4 flex items-center justify-center" style={{ maxWidth: 720 }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3182f6' }}>
              <Briefcase size={16} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-base font-semibold" style={{ color: '#191f28' }}>{project.name}</h1>
              {project.client_name && (
                <p className="text-xs" style={{ color: '#6b7684' }}>{project.client_name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 py-8" style={{ maxWidth: 720 }}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-xs mb-1" style={{ color: '#6b7684' }}>총 피드백</div>
            <div className="text-2xl font-bold" style={{ color: '#191f28' }}>{feedbacks.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-xs mb-1" style={{ color: '#6b7684' }}>미확인</div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{openCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-xs mb-1" style={{ color: '#6b7684' }}>진행 중</div>
            <div className="text-2xl font-bold" style={{ color: '#3182f6' }}>{inProgressCount}</div>
          </div>
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <div className="text-xs mb-1" style={{ color: '#6b7684' }}>해결 완료</div>
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{resolvedCount}</div>
          </div>
        </div>

        {/* Progress bar */}
        {feedbacks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#6b7684' }}>진행률</span>
              <span className="text-xs" style={{ color: '#6b7684' }}>
                {feedbacks.length > 0 ? Math.round((resolvedCount / feedbacks.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: '#e5e8eb' }}>
              <div className="transition-all" style={{ background: '#10b981', width: `${(resolvedCount / feedbacks.length) * 100}%` }} />
              <div className="transition-all" style={{ background: '#3182f6', width: `${(inProgressCount / feedbacks.length) * 100}%` }} />
              <div className="transition-all" style={{ background: '#f59e0b', width: `${(openCount / feedbacks.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Pages */}
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#191f28' }}>제작 페이지 목록</h2>

        {pages.length === 0 ? (
          <div className="bg-white rounded-2xl px-5 py-12 text-center" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <Globe size={32} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
            <p className="text-sm" style={{ color: '#6b7684' }}>등록된 페이지가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e5e8eb', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            {pages.map((page, i) => {
              const pageFeedback = getPageFeedback(page.path)
              const pageOpen = pageFeedback.filter(f => f.status === 'open').length
              const pageResolved = pageFeedback.filter(f => f.status === 'resolved').length
              const isEnabled = page.feedback_enabled

              return (
                <div
                  key={page.id}
                  onClick={isEnabled ? () => window.open(getPageUrl(page.path), '_blank') : undefined}
                  className="flex items-center px-5 py-3 transition-colors"
                  style={{
                    borderBottom: i < pages.length - 1 ? '1px solid #f2f4f6' : undefined,
                    cursor: isEnabled ? 'pointer' : 'default',
                    opacity: isEnabled ? 1 : 0.45,
                    background: isEnabled ? undefined : '#fafbfc',
                  }}
                  onMouseEnter={e => { if (isEnabled) e.currentTarget.style.background = '#f7f8fa' }}
                  onMouseLeave={e => { if (isEnabled) e.currentTarget.style.background = '' }}
                >
                  {/* Left: label + path */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-medium truncate" style={{ color: isEnabled ? '#191f28' : '#8b95a1' }}>{page.label}</span>
                    <span className="text-xs truncate" style={{ color: '#8b95a1' }}>{page.path}</span>
                  </div>

                  {/* Center: feedback info */}
                  <div className="flex items-center gap-2 mx-4 shrink-0">
                    {isEnabled ? (
                      pageFeedback.length > 0 ? (
                        <>
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7684' }}>
                            <MessageSquare size={12} />
                            피드백 {pageFeedback.length}건
                          </span>
                          {pageOpen > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                              {pageOpen} open
                            </span>
                          )}
                          {pageResolved > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                              <CheckCircle size={10} />
                              {pageResolved}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs" style={{ color: '#8b95a1' }}>피드백 없음</span>
                      )
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: '#f2f4f6', color: '#8b95a1', border: '1px solid #e5e8eb' }}>
                        제작중
                      </span>
                    )}
                  </div>

                  {/* Right: external link icon */}
                  {isEnabled && (
                    <ExternalLink size={14} style={{ color: '#8b95a1' }} className="shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-2xl p-5" style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: '#1e40af' }}>피드백 남기는 방법</h3>
          <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: '#3b82f6' }}>
            <li>위 페이지를 클릭하면 해당 페이지가 새 탭에서 열립니다</li>
            <li>페이지 우측 하단의 피드백 위젯 버튼을 클릭하세요</li>
            <li>수정이 필요한 위치를 클릭하고 피드백을 남겨주세요</li>
            <li>스크린샷도 첨부할 수 있습니다</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
