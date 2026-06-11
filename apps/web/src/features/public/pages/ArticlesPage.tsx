import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleGrid } from '../components/ArticleGrid'
import { usePublicCategories, usePublicPosts } from '../hooks'

export function ArticlesPage() {
  useDocumentMeta('Articles — EduCMS', 'Browse all published educational articles.')
  const [page, setPage] = useState(1)
  const [categorySlug, setCategorySlug] = useState('all')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const categories = usePublicCategories()
  const posts = usePublicPosts({
    page,
    limit: 9,
    sort,
    categorySlug: categorySlug === 'all' ? undefined : categorySlug,
    search: debouncedSearch || undefined,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
        <p className="mt-1 text-muted-foreground">
          Tutorials, announcements, and resources from our educators
        </p>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search articles…"
            className="pl-9"
            aria-label="Search articles"
          />
        </div>
        <Select
          value={categorySlug}
          onValueChange={(value) => {
            setCategorySlug(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.data
              ?.filter((c) => c.postCount > 0)
              .map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as 'latest' | 'popular')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36" aria-label="Sort articles">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Most viewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ArticleGrid
        query={posts}
        page={page}
        onPageChange={setPage}
        emptyTitle="No articles found"
        emptyDescription="Try a different search or category."
      />
    </div>
  )
}
