import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleGrid } from '../components/ArticleGrid'
import { usePublicCategories, usePublicPosts } from '../hooks'

export function CategoryDetailPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(1)
  const categories = usePublicCategories()
  const posts = usePublicPosts({ page, limit: 9, categorySlug: slug })

  const category = categories.data?.find((c) => c.slug === slug)
  useDocumentMeta(
    `${category?.name ?? 'Category'} — EduCMS`,
    category?.description ?? undefined
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Category
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {category?.name ?? slug}
        </h1>
        {category?.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>
        )}
      </header>

      <ArticleGrid
        query={posts}
        page={page}
        onPageChange={setPage}
        emptyTitle="Nothing published here yet"
        emptyDescription="Articles in this category will appear once published."
      />
    </div>
  )
}
