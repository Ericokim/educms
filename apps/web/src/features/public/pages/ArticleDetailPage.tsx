import { useParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleView } from '../components/ArticleView'
import { CommentSection } from '../components/CommentSection'
import { usePublicPost, useRecordView } from '../hooks'

export function ArticleDetailPage() {
  const { slug } = useParams()
  const post = usePublicPost(slug)
  useRecordView(post.data ? slug : undefined)
  useDocumentMeta(
    post.data ? (post.data.metaTitle ?? post.data.title) + ' — EduCMS' : 'EduCMS',
    post.data?.metaDescription ?? post.data?.excerpt ?? undefined
  )

  if (post.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-5/6" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="aspect-[2/1] w-full rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (post.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20">
        <ErrorState
          message="This article couldn’t be found. It may have been unpublished or the link is incorrect."
          onRetry={() => post.refetch()}
        />
      </div>
    )
  }

  return (
    <ArticleView post={post.data}>
      <CommentSection slug={post.data.slug} />
    </ArticleView>
  )
}
