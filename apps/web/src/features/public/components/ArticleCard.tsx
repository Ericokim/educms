import { Clock, ImageIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicPostSummary } from '@educms/shared'
import { Badge } from '@/components/ui/badge'
import { mediaUrl } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ArticleCard({
  post,
  featured = false,
}: {
  post: PublicPostSummary
  featured?: boolean
}) {
  return (
    <Link
      to={`/articles/${post.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md',
        featured && 'md:col-span-2 md:row-span-2'
      )}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden bg-muted',
          featured ? 'aspect-[2/1]' : 'aspect-[16/9]'
        )}
      >
        {post.featuredImageUrl ? (
          <img
            src={mediaUrl(post.featuredImageUrl)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/40">
            <ImageIcon className={featured ? 'size-12' : 'size-8'} aria-hidden="true" />
          </div>
        )}
        {post.categoryName && (
          <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur hover:bg-background/90">
            {post.categoryName}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className={cn(
            'font-semibold leading-snug tracking-tight group-hover:underline',
            featured ? 'text-xl md:text-2xl' : 'text-base'
          )}
        >
          {post.title}
        </h3>
        {post.excerpt && (
          <p
            className={cn(
              'text-sm leading-relaxed text-muted-foreground',
              featured ? 'line-clamp-3' : 'line-clamp-2'
            )}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.author}</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
        </div>
      </div>
    </Link>
  )
}
