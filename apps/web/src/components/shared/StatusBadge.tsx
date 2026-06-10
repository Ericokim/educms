import type { CommentStatus, PostStatus } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = PostStatus | CommentStatus

const STATUS_STYLES: Record<Status, string> = {
  published:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  approved:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  draft:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  pending:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  spam: 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  archived:
    'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  trash:
    'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}
