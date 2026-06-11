import { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleCard } from '../components/ArticleCard'
import { ArticleGridSkeleton } from '../components/ArticleGrid'
import { usePublicCategories, usePublicPosts } from '../hooks'

export function HomePage() {
  useDocumentMeta(
    'EduCMS — Educational Articles and Resources',
    'Explore tutorials, announcements, course materials, research highlights, and campus updates.'
  )
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const latest = usePublicPosts({ limit: 7, sort: 'latest' })
  const popular = usePublicPosts({ limit: 5, sort: 'popular' })
  const categories = usePublicCategories()

  const [featured, ...rest] = latest.data?.items ?? []

  function onSearch(event: React.FormEvent) {
    event.preventDefault()
    if (searchTerm.trim()) navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Hero */}
      <section className="py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Learn. Discover. Share educational knowledge.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Explore tutorials, announcements, course materials, research highlights, and
          campus updates.
        </p>
        <form
          onSubmit={onSearch}
          className="mx-auto mt-8 flex w-full max-w-xl items-center gap-2"
          role="search"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles, resources, announcements…"
              className="h-11 pl-9"
              aria-label="Search published content"
            />
          </div>
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>
      </section>

      {/* Latest + featured */}
      <section aria-label="Latest articles" className="pb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Latest articles</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/articles">
              View all <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {latest.isPending ? (
          <ArticleGridSkeleton />
        ) : latest.isError || !featured ? (
          <EmptyState
            title="No published articles yet"
            description="Content will appear here as soon as it is published."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ArticleCard post={featured} featured />
            {rest.slice(0, 6).map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section aria-label="Browse categories" className="pb-14">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Browse categories</h2>
        {categories.isPending ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {categories.data
              ?.filter((category) => category.postCount > 0)
              .map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <p className="font-semibold">{category.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.postCount} article{category.postCount === 1 ? '' : 's'}
                  </p>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* Popular */}
      <section aria-label="Popular reads" className="pb-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Popular reads</h2>
        {popular.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <ol className="divide-y rounded-xl border bg-card">
            {popular.data?.items.map((post, index) => (
              <li key={post.id}>
                <Link
                  to={`/articles/${post.slug}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-accent"
                >
                  <span className="w-6 shrink-0 text-center text-lg font-bold text-muted-foreground/50">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.categoryName ?? 'General'} · {post.viewCount.toLocaleString()}{' '}
                      views
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
