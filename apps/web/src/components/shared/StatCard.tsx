import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
