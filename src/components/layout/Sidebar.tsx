import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Settings,
  MessageSquare,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useProjectStore } from '../../store/useStore'

export function Sidebar() {
  const { projects } = useProjectStore()
  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <aside className="w-60 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Briefcase size={18} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm tracking-tight">Tera PM</div>
          <div className="text-[10px] text-slate-500">Project Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {/* Main */}
        <div className="mb-6">
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Main
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
            )}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink
            to="/feedback"
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
            )}
          >
            <MessageSquare size={16} />
            All Feedback
          </NavLink>
        </div>

        {/* Projects */}
        <div className="mb-6">
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Projects</span>
            <ChevronDown size={12} />
          </div>
          {activeProjects.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <FolderOpen size={16} />
              <span className="truncate flex-1">{project.name}</span>
            </NavLink>
          ))}
          <NavLink
            to="/projects/new"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-colors"
          >
            <Plus size={16} />
            New Project
          </NavLink>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-700/50 px-2 py-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-800/50 hover:text-white transition-colors"
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
