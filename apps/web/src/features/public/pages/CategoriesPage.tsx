import { FolderTree } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { usePublicCategories } from '../hooks'

export function CategoriesPage() {
  useDocumentMeta('Categories — EduCMS', 'Browse published content by category.')
  const categories = usePublicCategories()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-muted-foreground">Find content by topic area</p>
      </header>

      {categories.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : categories.isError ? (
        <ErrorState
          message="The categories couldn’t be loaded."
          onRetry={() => categories.refetch()}
        />
      ) : categories.data.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="flex flex-col rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
            >
              <h2 className="text-lg font-semibold">{category.name}</h2>
              {category.description && (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              )}
              <p className="mt-auto pt-3 text-sm font-medium text-muted-foreground">
                {category.postCount} published article{category.postCount === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
