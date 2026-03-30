import { cn } from '../../lib/utils'

type BadgeVariant = 'open' | 'in_progress' | 'resolved' | 'active' | 'completed' | 'archived' | 'default'

const variants: Record<BadgeVariant, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-50 text-slate-700 border-slate-200',
  archived: 'bg-slate-50 text-slate-400 border-slate-200',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
}

const labels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
}

export function Badge({ variant = 'default', children, className }: {
  variant?: BadgeVariant
  children?: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border',
      variants[variant],
      className,
    )}>
      {children ?? labels[variant] ?? variant}
    </span>
  )
}
