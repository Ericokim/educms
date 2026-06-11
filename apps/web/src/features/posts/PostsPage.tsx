import { useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, ExternalLink, FileText, MoreHorizontal, PlusCircle, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ROLES } from '@educms/shared'
import type { PostListItem } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
import { useAuth } from '@/features/auth/auth-context'
import { formatDate } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import {
  useArchivePost,
  useCategories,
  useDeletePost,
  usePosts,
  usePublishPost,
} from './hooks'

const PAGE_SIZE = 10

export function PostsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('all')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const [deleteTarget, setDeleteTarget] = useState<PostListItem | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<PostListItem | null>(null)

  const filters = {
    page,
    limit: PAGE_SIZE,
    status: status === 'all' ? undefined : status,
    categoryId: categoryId === 'all' ? undefined : Number(categoryId),
    search: debouncedSearch || undefined,
  }
  const posts = usePosts(filters)
  const categories = useCategories()

  const publishMutation = usePublishPost()
  const archiveMutation = useArchivePost()
  const deleteMutation = useDeletePost()

  const canModerate = user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR
  const isAdmin = user?.role === ROLES.ADMIN

  function resetToFirstPage() {
    setPage(1)
  }

  const pagination = posts.data?.pagination

  // Clamp the page when deletions empty the last page of results.
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) {
    setPage(pagination.totalPages)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            {canModerate ? 'Manage all content' : 'Manage your content'}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/posts/new">
            <PlusCircle aria-hidden="true" /> New post
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetToFirstPage()
            }}
            className="pl-9"
            aria-label="Search posts"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            resetToFirstPage()
          }}
        >
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value)
            resetToFirstPage()
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.data?.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || status !== 'all' || categoryId !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setStatus('all')
              setCategoryId('all')
              resetToFirstPage()
            }}
          >
            <X aria-hidden="true" /> Reset filters
          </Button>
        )}
      </div>

      {posts.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : posts.isError ? (
        <ErrorState message="The posts couldn’t be loaded." onRetry={() => posts.refetch()} />
      ) : posts.data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts found"
          description={
            debouncedSearch || status !== 'all' || categoryId !== 'all'
              ? 'Try adjusting your filters or search.'
              : 'Create your first post to get started.'
          }
        >
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/posts/new">New post</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell text-right">Views</TableHead>
                  <TableHead className="hidden sm:table-cell">Updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.data.items.map((post) => (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/posts/${post.id}/edit`)}
                  >
                    <TableCell>
                      <p className="font-medium">{post.title}</p>
                      <p className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="font-normal">
                            {tag.name}
                          </Badge>
                        ))}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{post.author}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {post.categoryName ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-right tabular-nums text-muted-foreground">
                      {post.viewCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${post.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/admin/posts/${post.id}/edit`)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => navigate(`/admin/posts/${post.id}/preview`)}
                          >
                            <Eye aria-hidden="true" /> Preview
                          </DropdownMenuItem>
                          {post.status === 'published' && (
                            <DropdownMenuItem asChild>
                              <a
                                href={`/articles/${post.slug}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink aria-hidden="true" /> View public page
                              </a>
                            </DropdownMenuItem>
                          )}
                          {canModerate && post.status !== 'published' && (
                            <DropdownMenuItem onSelect={() => publishMutation.mutate(post.id)}>
                              Publish
                            </DropdownMenuItem>
                          )}
                          {canModerate && post.status === 'published' && (
                            <DropdownMenuItem onSelect={() => setArchiveTarget(post)}>
                              Archive
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteTarget(post)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} posts
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
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive this post?"
        description={`“${archiveTarget?.title}” will no longer be visible to readers. You can republish it later.`}
        confirmLabel="Archive"
        onConfirm={() => {
          if (archiveTarget) archiveMutation.mutate(archiveTarget.id)
          setArchiveTarget(null)
        }}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this post?"
        description={`“${deleteTarget?.title}” and its version history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
