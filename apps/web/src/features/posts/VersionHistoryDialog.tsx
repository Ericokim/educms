import { useState } from 'react'
import { History } from 'lucide-react'
import { ROLES } from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime } from '@/lib/format'
import { usePostVersions, useRollbackPost } from './hooks'

export function VersionHistoryDialog({ postId }: { postId: number }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<{ id: number; n: number } | null>(null)
  const versions = usePostVersions(postId, open)
  const rollback = useRollbackPost(postId)

  const canRollback = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <History aria-hidden="true" /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            A snapshot is saved every time the content changes.
          </DialogDescription>
        </DialogHeader>
        {versions.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : versions.isError ? (
          <ErrorState
            message="The version history couldn’t be loaded."
            onRetry={() => versions.refetch()}
          />
        ) : versions.data.length === 0 ? (
          <EmptyState title="No versions yet" />
        ) : (
          <ul className="divide-y">
            {versions.data.map((version, index) => (
              <li key={version.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    v{version.versionNumber} · {version.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {version.createdBy ?? 'unknown'} · {formatDateTime(version.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={version.status} />
                  {canRollback && index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={rollback.isPending}
                      onClick={() =>
                        setRollbackTarget({ id: version.id, n: version.versionNumber })
                      }
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <ConfirmDialog
          open={rollbackTarget !== null}
          onOpenChange={(isOpen) => !isOpen && setRollbackTarget(null)}
          title={`Restore version ${rollbackTarget?.n}?`}
          description="The post content will be replaced with this version. The current state is kept in history."
          confirmLabel="Restore"
          onConfirm={() => {
            if (rollbackTarget) rollback.mutate(rollbackTarget.id)
            setRollbackTarget(null)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
