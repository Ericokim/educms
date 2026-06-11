import { ArrowLeft, Eye } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import type { PublicPostDetail } from '@educms/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ArticleView } from '@/features/public/components/ArticleView'
import { usePost } from './hooks'

function estimateReadingMinutes(content: string): number {
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/**
 * Authenticated preview: renders the post through the exact public article
 * layout without publishing anything. RBAC comes from the admin post API
 * (authors can only load their own posts).
 */
export function PostPreviewPage() {
  const { id } = useParams()
  const postId = id !== undefined ? Number(id) : undefined
  const post = usePost(postId)

  if (post.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <Skeleton className="h-12 w-5/6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (post.isError) {
    return (
      <ErrorState
        message="This post couldn’t be loaded for preview."
        onRetry={() => post.refetch()}
      />
    )
  }

  const data = post.data
  const previewPost: PublicPostDetail = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    author: data.author,
    categoryName: data.categoryName,
    categorySlug: null,
    tags: data.tags,
    featuredImageUrl: data.featuredImageUrl,
    publishedAt: data.publishedAt ?? data.updatedAt,
    viewCount: data.viewCount,
    readingMinutes: estimateReadingMinutes(data.content),
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    metaKeywords: data.metaKeywords,
    related: [],
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          Preview mode — this post is not published yet.
          <StatusBadge status={data.status} />
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/posts/${data.id}/edit`}>
            <ArrowLeft aria-hidden="true" /> Back to editor
          </Link>
        </Button>
      </div>
      <div className="rounded-lg border bg-background">
        <ArticleView post={previewPost} />
      </div>
    </div>
  )
}
