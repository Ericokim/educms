import { POST_STATUSES, type PostStatus } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<PostStatus, string> = {
  [POST_STATUSES.PUBLISHED]:
    'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  [POST_STATUSES.DRAFT]:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  [POST_STATUSES.ARCHIVED]:
    'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}
