import { useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ArticleGrid } from '../components/ArticleGrid'
import { usePublicPosts } from '../hooks'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [input, setInput] = useState(query)
  const [page, setPage] = useState(1)

  useDocumentMeta(query ? `Search: ${query} — EduCMS` : 'Search — EduCMS')

  const posts = usePublicPosts({
    page,
    limit: 9,
    search: query.length >= 2 ? query : undefined,
  })

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearchParams(input.trim() ? { q: input.trim() } : {})
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="mt-1 text-muted-foreground">Find published articles and resources</p>
      </header>

      <form onSubmit={onSubmit} role="search" className="mb-8 flex w-full max-w-xl gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by title, summary, or content…"
            className="pl-9"
            aria-label="Search published content"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {query.length < 2 ? (
        <EmptyState
          icon={Search}
          title="Search the library"
          description="Type at least two characters to search published content."
        />
      ) : (
        <>
          {posts.data && (
            <p className="mb-6 text-sm text-muted-foreground">
              {posts.data.pagination.total} result
              {posts.data.pagination.total === 1 ? '' : 's'} for “{query}”
            </p>
          )}
          <ArticleGrid
            query={posts}
            page={page}
            onPageChange={setPage}
            emptyTitle={`No results for “${query}”`}
            emptyDescription="Try different keywords or browse the categories."
          />
        </>
      )}
    </div>
  )
}
