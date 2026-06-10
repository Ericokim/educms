import type { Role } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<Role, string> = {
  admin:
    'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  editor:
    'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  author:
    'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
  subscriber:
    'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn('capitalize', ROLE_STYLES[role])}>
      {role}
    </Badge>
  )
}
