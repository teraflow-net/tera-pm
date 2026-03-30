import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, ExternalLink, Copy, Check,
  Image as ImageIcon, Globe, ChevronDown, ChevronUp,
  Plus, Trash2, FileText, Settings, BarChart3,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useProjectStore, useFeedbackStore, usePageStore } from '../store/useStore'
import { formatDate, formatRelative, cn } from '../lib/utils'
import type { ReviewComment } from '../lib/supabase'

type Tab = 'pages' | 'feedback' | 'settings'

export function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects, fetchProjects, updateProject, deleteProject, generateReviewToken } = useProjectStore()
  const { feedbacks, fetchFeedbacks, updateFeedbackStatus } = useFeedbackStore()
  const { pages, fetchPages, addPage, deletePage, toggleFeedback } = usePageStore()

  const [activeTab, setActiveTab] = useState<Tab>('pages')
  const [copied, setCopied] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null)

  // Add page form
  const [newPath, setNewPath] = useState('')
  const [newLabel, setNewLabel] = useState('')

  // Settings form
  const [editName, setEditName] = useState('')
  const [editClientName, setEditClientName] = useState('')
  const [editClientEmail, setEditClientEmail] = useState('')
  const [editClientPhone, setEditClientPhone] = useState('')
  const [editExistingUrl, setEditExistingUrl] = useState('')
  const [editBenchmarkUrl, setEditBenchmarkUrl] = useState('')
  const [editNewSiteUrl, setEditNewSiteUrl] = useState('')

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projects.length === 0) fetchProjects()
  }, [projects.length, fetchProjects])

  useEffect(() => {
    if (project) {
      fetchFeedbacks(project.widget_project_id)
      fetchPages(project.id)
      setEditName(project.name)
      setEditClientName(project.client_name ?? '')
      setEditClientEmail(project.client_email ?? '')
      setEditClientPhone(project.client_phone ?? '')
      setEditExistingUrl(project.existing_url ?? '')
      setEditBenchmarkUrl(project.benchmark_url ?? '')
      setEditNewSiteUrl(project.new_site_url ?? '')
    }
  }, [project, fetchFeedbacks, fetchPages])

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

  const getPageFeedbackCount = (path: string) => {
    const fullUrl = getPageUrl(path)
    // Match by full URL or path suffix
    let count = 0
    for (const [pageUrl, items] of Object.entries(feedbackByPage)) {
      if (pageUrl === fullUrl || pageUrl.endsWith(path)) {
        count += items.length
      }
    }
    return count
  }

  const openCount = feedbacks.filter(f => f.status === 'open').length
  const inProgressCount = feedbacks.filter(f => f.status === 'in_progress').length
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length

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

  const widgetScript = `<script src="https://teraflow-net.github.io/tera-feedback-widget/feedback-widget.iife.js" data-project="${project.widget_project_id}" data-supabase-url="https://kixxlhrosxbcwdeofmgg.supabase.co" data-supabase-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHhsaHJvc3hiY3dkZW9mbWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTI1NDksImV4cCI6MjA5MDEyODU0OX0._XkejZIIt_6XtNMkIo9SjtsLw6ikq5TDTuQd0-YbjxQ" defer></script>`

  const reviewUrl = project.review_token
    ? `https://teraflow-net.github.io/tera-pm/#/review/${project.review_token}`
    : null

  const copyScript = () => {
    navigator.clipboard.writeText(widgetScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyReviewUrl = () => {
    if (!reviewUrl) return
    navigator.clipboard.writeText(reviewUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPath.trim() || !newLabel.trim() || !projectId) return
    const path = newPath.trim().startsWith('/') ? newPath.trim() : `/${newPath.trim()}`
    await addPage({
      project_id: projectId,
      path,
      label: newLabel.trim(),
      sort_order: pages.length,
    })
    setNewPath('')
    setNewLabel('')
  }

  const handleWidgetInstalled = async () => {
    await updateProject(project.id, { widget_installed: true })
    if (!project.review_token) {
      await generateReviewToken(project.id)
    }
  }

  const handleStatusChange = async (id: string, status: ReviewComment['status']) => {
    await updateFeedbackStatus(id, status)
  }

  const handleSaveProject = async () => {
    if (!projectId) return
    await updateProject(projectId, {
      name: editName,
      client_name: editClientName || null,
      client_email: editClientEmail || null,
      client_phone: editClientPhone || null,
      existing_url: editExistingUrl || null,
      benchmark_url: editBenchmarkUrl || null,
      new_site_url: editNewSiteUrl || null,
    })
  }

  const handleDeleteProject = async () => {
    if (!projectId) return
    if (!window.confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    await deleteProject(projectId)
    navigate('/')
  }

  // If a page is selected in feedback tab, show its feedbacks
  const selectedPageFeedbacks = selectedPageUrl
    ? feedbacks.filter(f => f.page_url === selectedPageUrl)
    : null

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pages', label: '제작 페이지 목록', icon: <FileText size={14} /> },
    { key: 'feedback', label: '피드백 현황', icon: <BarChart3 size={14} /> },
    { key: 'settings', label: '설정', icon: <Settings size={14} /> },
  ]

  return (
    <>
      <Header
        title={project.name}
        subtitle={project.client_name ? `${project.client_name} · ${project.new_site_url || project.base_url || ''}` : (project.new_site_url || project.base_url || '')}
        actions={
          <div className="flex items-center gap-2">
            {(project.new_site_url || project.base_url) && (
              <Button variant="ghost" size="sm" onClick={() => window.open(project.new_site_url || project.base_url!, '_blank')}>
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

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedPageUrl(null) }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        {/* ========== PAGES TAB ========== */}
        {activeTab === 'pages' && (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-500 mb-1">총 페이지</div>
                <div className="text-2xl font-bold text-slate-900">{pages.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-500 mb-1">전체 피드백</div>
                <div className="text-2xl font-bold text-slate-900">{feedbacks.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-500 mb-1">미해결</div>
                <div className="text-2xl font-bold text-amber-600">{openCount + inProgressCount}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-xs text-slate-500 mb-1">해결완료</div>
                <div className="text-2xl font-bold text-emerald-600">{resolvedCount}</div>
              </div>
            </div>

            {/* Add page form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">페이지 추가</h3>
              <form onSubmit={handleAddPage} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">페이지 이름</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="메인 페이지"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">경로 (path)</label>
                  <input
                    type="text"
                    value={newPath}
                    onChange={e => setNewPath(e.target.value)}
                    placeholder="/"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button type="submit" size="md" disabled={!newLabel.trim() || !newPath.trim()}>
                  <Plus size={14} />
                  추가
                </Button>
              </form>
            </div>

            {/* Page list */}
            {pages.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center">
                <FileText size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">등록된 페이지가 없습니다</p>
                <p className="text-xs text-slate-300 mt-1">위에서 페이지를 추가해 주세요</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">페이지 ({pages.length})</span>
                </div>
                {pages.map((page, i) => {
                  const feedbackCount = getPageFeedbackCount(page.path)
                  return (
                    <div
                      key={page.id}
                      className={cn(
                        'flex items-center px-5 py-3.5 hover:bg-slate-50 transition-colors group',
                        i < pages.length - 1 && 'border-b border-slate-50',
                        page.feedback_enabled && 'bg-emerald-50/50'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                        <span className="text-sm font-medium text-slate-900">{page.label}</span>
                        {page.feedback_enabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            피드백 요청중
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            제작중
                          </span>
                        )}
                        <span className="text-xs text-slate-400 truncate">{page.path}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFeedback(page.id, !page.feedback_enabled)}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-md cursor-pointer transition-colors border',
                            page.feedback_enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          {page.feedback_enabled ? '피드백 중지' : '피드백 요청'}
                        </button>
                        {feedbackCount > 0 && (
                          <span className="text-xs text-slate-500">
                            <MessageSquare size={12} className="inline mr-1" />
                            {feedbackCount}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getPageUrl(page.path), '_blank')}
                        >
                          <ExternalLink size={12} />
                          자세히 보기
                        </Button>
                        <button
                          onClick={() => deletePage(page.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ========== FEEDBACK TAB ========== */}
        {activeTab === 'feedback' && !selectedPageUrl && (
          <>
            {/* Stats bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-900">피드백 현황</span>
                <span className="text-xs text-slate-400">{feedbacks.length} total</span>
              </div>
              <div className="flex items-center gap-6 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-slate-700">{openCount}</span>
                  <span className="text-xs text-slate-400">open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-700">{inProgressCount}</span>
                  <span className="text-xs text-slate-400">in progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">{resolvedCount}</span>
                  <span className="text-xs text-slate-400">resolved</span>
                </div>
              </div>
              {/* Progress bar */}
              {feedbacks.length > 0 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(resolvedCount / feedbacks.length) * 100}%` }} />
                  <div className="bg-blue-500 transition-all" style={{ width: `${(inProgressCount / feedbacks.length) * 100}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${(openCount / feedbacks.length) * 100}%` }} />
                </div>
              )}
            </div>

            {/* Page grid */}
            {Object.keys(feedbackByPage).length === 0 && pages.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center">
                <MessageSquare size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">아직 피드백이 없습니다</p>
                <p className="text-xs text-slate-300 mt-1">위젯 스크립트를 클라이언트 사이트에 설치하세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {/* Cards from actual feedback pages */}
                {Object.entries(feedbackByPage).map(([pageUrl, pageFeedbacks]) => {
                  const pageOpen = pageFeedbacks.filter(f => f.status === 'open').length
                  const pageResolved = pageFeedbacks.filter(f => f.status === 'resolved').length
                  // Try to find a matching project page label
                  const matchedPage = pages.find(p => pageUrl === getPageUrl(p.path) || pageUrl.endsWith(p.path))
                  const label = matchedPage?.label || pageUrl.replace(/^https?:\/\/[^/]+/, '') || pageUrl

                  return (
                    <div
                      key={pageUrl}
                      onClick={() => setSelectedPageUrl(pageUrl)}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Globe size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-900 truncate">{label}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mb-3">{pageUrl}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-slate-700">{pageFeedbacks.length} feedback</span>
                        {pageOpen > 0 && <Badge variant="open">{pageOpen} open</Badge>}
                        {pageResolved > 0 && <Badge variant="resolved">{pageResolved}</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ========== FEEDBACK TAB - Page Detail ========== */}
        {activeTab === 'feedback' && selectedPageUrl && selectedPageFeedbacks && (
          <>
            <button
              onClick={() => setSelectedPageUrl(null)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 cursor-pointer"
            >
              <ArrowLeft size={14} />
              페이지 목록으로
            </button>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{selectedPageUrl}</span>
                <span className="text-xs text-slate-400">{selectedPageFeedbacks.length} items</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const base = project.new_site_url || project.base_url || ''
                    const url = selectedPageUrl.startsWith('http') ? selectedPageUrl : `${base.replace(/\/$/, '')}${selectedPageUrl}`
                    window.open(url, '_blank')
                  }}
                >
                  <ExternalLink size={12} />
                  라이브 사이트에서 보기
                </Button>
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
            </div>

            {/* Feedback list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {(filter === 'all' ? selectedPageFeedbacks : selectedPageFeedbacks.filter(f => f.status === filter)).map((feedback, i) => {
                const isExpanded = expandedId === feedback.id
                return (
                  <div
                    key={feedback.id}
                    className={cn(
                      'border-b border-slate-50',
                      i === selectedPageFeedbacks.length - 1 && 'border-b-0'
                    )}
                  >
                    <div
                      className="flex items-center px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                    >
                      {/* Pin number */}
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mr-3">
                        {i + 1}
                      </div>

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

              {selectedPageFeedbacks.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <MessageSquare size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">이 페이지에 피드백이 없습니다</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ========== SETTINGS TAB ========== */}
        {activeTab === 'settings' && (
          <>
            {/* Widget Script */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Feedback Widget Script</h3>
                  <p className="text-xs text-slate-400 mt-0.5">클라이언트 사이트의 {'<head>'} 또는 {'<body>'} 태그 안에 붙여넣으세요</p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyScript}>
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Script'}
                </Button>
              </div>
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                {widgetScript}
              </pre>

              {!project.widget_installed && (
                <div className="mt-4">
                  <Button size="sm" onClick={handleWidgetInstalled}>
                    <Check size={14} />
                    스크립트 추가 완료
                  </Button>
                </div>
              )}

              {project.widget_installed && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                  <Check size={14} />
                  위젯 설치 완료
                </div>
              )}
            </div>

            {/* Client Review URL */}
            {project.widget_installed && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">클라이언트 리뷰 URL</h3>
                    <p className="text-xs text-slate-400 mt-0.5">클라이언트에게 이 URL을 공유하세요</p>
                  </div>
                  {reviewUrl && (
                    <Button variant="secondary" size="sm" onClick={copyReviewUrl}>
                      {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copiedUrl ? 'Copied!' : 'Copy URL'}
                    </Button>
                  )}
                </div>
                {reviewUrl ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-blue-600 break-all">
                    {reviewUrl}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">리뷰 토큰을 생성 중입니다...</div>
                )}
              </div>
            )}

            {/* Project URLs */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">프로젝트 URL 정보</h3>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
                {project.existing_url && (
                  <>
                    <span className="text-slate-500">기존 사이트:</span>
                    <a href={project.existing_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{project.existing_url}</a>
                  </>
                )}
                {project.existing_url && project.benchmark_url && <span className="text-slate-300">|</span>}
                {project.benchmark_url && (
                  <>
                    <span className="text-slate-500">벤치마킹:</span>
                    <a href={project.benchmark_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{project.benchmark_url}</a>
                  </>
                )}
                {(project.existing_url || project.benchmark_url) && (project.new_site_url || project.base_url) && <span className="text-slate-300">|</span>}
                {(project.new_site_url || project.base_url) && (
                  <>
                    <span className="text-slate-500">신규 사이트:</span>
                    <a href={project.new_site_url || project.base_url!} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{project.new_site_url || project.base_url}</a>
                  </>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">클라이언트 정보</h3>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
                {project.client_name && (
                  <>
                    <span className="text-slate-500">이름:</span>
                    <span className="text-slate-700">{project.client_name}</span>
                  </>
                )}
                {project.client_name && project.client_email && <span className="text-slate-300">|</span>}
                {project.client_email && (
                  <>
                    <span className="text-slate-500">이메일:</span>
                    <span className="text-slate-700">{project.client_email}</span>
                  </>
                )}
                {(project.client_name || project.client_email) && project.client_phone && <span className="text-slate-300">|</span>}
                {project.client_phone && (
                  <>
                    <span className="text-slate-500">전화번호:</span>
                    <span className="text-slate-700">{project.client_phone}</span>
                  </>
                )}
              </div>
            </div>

            {/* Edit Project Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">프로젝트 정보 수정</h3>
                <Button size="sm" onClick={handleSaveProject}>저장</Button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">프로젝트 이름</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">클라이언트 이름</label>
                  <input type="text" value={editClientName} onChange={e => setEditClientName(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">클라이언트 이메일</label>
                  <input type="email" value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">클라이언트 전화번호</label>
                  <input type="tel" value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">기존 사이트</label>
                  <input type="url" value={editExistingUrl} onChange={e => setEditExistingUrl(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">벤치마킹 사이트</label>
                  <input type="url" value={editBenchmarkUrl} onChange={e => setEditBenchmarkUrl(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">신규 사이트</label>
                  <input type="url" value={editNewSiteUrl} onChange={e => setEditNewSiteUrl(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 border-2 border-red-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-red-600 mb-2">프로젝트 삭제</h3>
              <p className="text-xs text-slate-500 mb-4">프로젝트를 삭제하면 모든 페이지, 피드백 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
              <Button variant="danger" size="md" onClick={handleDeleteProject}>
                <Trash2 size={14} />
                프로젝트 삭제
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
