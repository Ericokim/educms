import { Newspaper } from 'lucide-react'
import type { Paginated, PublicPostSummary } from '@educms/shared'
import type { UseQueryResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ArticleCard } from './ArticleCard'

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[16/9] rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

/** Listing body shared by articles, category, tag, and search pages. */
export function ArticleGrid({
  query,
  page,
  onPageChange,
  emptyTitle = 'No articles yet',
  emptyDescription = 'Check back soon for new content.',
}: {
  query: UseQueryResult<Paginated<PublicPostSummary>>
  page: number
  onPageChange: (page: number) => void
  emptyTitle?: string
  emptyDescription?: string
}) {
  if (query.isPending) return <ArticleGridSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        message="The articles couldn’t be loaded."
        onRetry={() => query.refetch()}
      />
    )
  }
  if (query.data.items.length === 0) {
    return <EmptyState icon={Newspaper} title={emptyTitle} description={emptyDescription} />
  }

  const { pagination } = query.data
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {query.data.items.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
