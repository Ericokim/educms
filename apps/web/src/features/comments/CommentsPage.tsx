import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, MessagesSquare, ShieldAlert, Trash2 } from 'lucide-react'
import type { CommentItem } from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/lib/format'
import { useComments, useCommentModeration } from './hooks'

const PAGE_SIZE = 10

export function CommentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('pending')

  const filters = {
    page,
    limit: PAGE_SIZE,
    status: status === 'all' ? undefined : status,
  }
  const comments = useComments(filters)
  const { approve, spam, trash } = useCommentModeration()
  const [trashTarget, setTrashTarget] = useState<CommentItem | null>(null)

  const pagination = comments.data?.pagination

  // Clamp the page when moderation empties the last page of results.
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
    setPage(pagination.totalPages)
  }

  function actionsFor(comment: CommentItem) {
    const buttons: { label: string; icon: typeof Check; onClick: () => void }[] = []
    if (comment.status !== 'approved') {
      buttons.push({
        label: comment.status === 'trash' || comment.status === 'spam' ? 'Restore' : 'Approve',
        icon: Check,
        onClick: () => approve.mutate(comment.id),
      })
    }
    if (comment.status !== 'spam') {
      buttons.push({ label: 'Spam', icon: ShieldAlert, onClick: () => spam.mutate(comment.id) })
    }
    if (comment.status !== 'trash') {
      buttons.push({ label: 'Trash', icon: Trash2, onClick: () => setTrashTarget(comment) })
    }
    return buttons
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
          <p className="text-muted-foreground">Review and moderate reader comments</p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {comments.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : comments.isError ? (
        <ErrorState
          message="The comments couldn’t be loaded."
          onRetry={() => comments.refetch()}
        />
      ) : comments.data.items.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={status === 'pending' ? 'All caught up' : 'No comments found'}
          description={
            status === 'pending'
              ? 'No comments are waiting for review.'
              : 'Try a different status filter.'
          }
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comment</TableHead>
                  <TableHead className="hidden lg:table-cell">Post</TableHead>
                  <TableHead className="hidden sm:table-cell">Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-56 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.data.items.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 whitespace-normal text-sm">
                        {comment.content}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(comment.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-48">
                      <p className="truncate text-muted-foreground">{comment.postTitle}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{comment.author}</TableCell>
                    <TableCell>
                      <StatusBadge status={comment.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {actionsFor(comment).map((action) => (
                          <Button
                            key={action.label}
                            variant="ghost"
                            size="sm"
                            onClick={action.onClick}
                            aria-label={`${action.label} comment by ${comment.author}`}
                          >
                            <action.icon aria-hidden="true" />
                            <span className="hidden xl:inline">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} comments
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft aria-hidden="true" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={trashTarget !== null}
        onOpenChange={(open) => !open && setTrashTarget(null)}
        title="Move this comment to trash?"
        description={`The comment by ${trashTarget?.author} will be hidden from readers. You can restore it later from the Trash filter.`}
        confirmLabel="Move to trash"
        destructive
        onConfirm={() => {
          if (trashTarget) trash.mutate(trashTarget.id)
          setTrashTarget(null)
        }}
      />
    </div>
  )
}
