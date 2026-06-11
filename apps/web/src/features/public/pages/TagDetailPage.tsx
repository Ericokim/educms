import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleGrid } from '../components/ArticleGrid'
import { usePublicPosts } from '../hooks'

export function TagDetailPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(1)
  const posts = usePublicPosts({ page, limit: 9, tagSlug: slug })

  const tagName = posts.data?.items[0]?.tags.find((t) => t.slug === slug)?.name ?? slug
  useDocumentMeta(`#${tagName} — EduCMS`)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Tag
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">#{tagName}</h1>
      </header>

      <ArticleGrid
        query={posts}
        page={page}
        onPageChange={setPage}
        emptyTitle="No articles with this tag yet"
        emptyDescription="Tagged articles will appear once published."
      />
    </div>
  )
}
