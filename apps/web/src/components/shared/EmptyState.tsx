import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  children,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
