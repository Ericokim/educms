import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicPostDetail } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { mediaUrl } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { ArticleCard } from './ArticleCard'

/**
 * Renders an article exactly as readers see it. Used by the public detail
 * page and by the authenticated admin preview (which supplies a banner and
 * disables the interactive comment section).
 */
export function ArticleView({
  post,
  children,
}: {
  post: PublicPostDetail
  children?: React.ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="space-y-4">
        {post.categoryName &&
          (post.categorySlug ? (
            <Link to={`/categories/${post.categorySlug}`}>
              <Badge variant="secondary">{post.categoryName}</Badge>
            </Link>
          ) : (
            <Badge variant="secondary">{post.categoryName}</Badge>
          ))}
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">By {post.author}</span>
          <span aria-hidden="true">•</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
        </div>
      </header>

      {post.featuredImageUrl && (
        <img
          src={mediaUrl(post.featuredImageUrl)}
          alt=""
          className="mt-8 aspect-[2/1] w-full rounded-xl border object-cover"
        />
      )}

      <div
        className="prose prose-neutral mt-8 max-w-none leading-7 dark:prose-invert"
        // Content is authored by trusted staff through the admin editor.
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Tags:</span>
          {post.tags.map((tag) => (
            <Link key={tag.id} to={`/tags/${tag.slug}`}>
              <Badge variant="outline" className="hover:bg-accent">
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {post.related.length > 0 && (
        <section aria-label="Related articles" className="mt-12">
          <Separator className="mb-8" />
          <h2 className="mb-6 text-xl font-semibold tracking-tight">Related articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {post.related.map((related) => (
              <ArticleCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}

      {children}
    </article>
  )
}
