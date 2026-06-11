import {
  ArrowRight,
  Check,
  Eye,
  FileText,
  FilePen,
  Image,
  MessagesSquare,
  PlusCircle,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import type { ActivityEntry } from '@educms/shared'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuth } from '@/features/auth/auth-context'
import { useCommentModeration } from '@/features/comments/hooks'
import { ArticleCard } from '@/features/public/components/ArticleCard'
import { usePublicCategories, usePublicPosts } from '@/features/public/hooks'
import { formatDateTime } from '@/lib/format'
import { useDashboard } from './useDashboard'

function describeActivity(entry: ActivityEntry): string {
  const who = entry.username ?? 'Someone'
  switch (entry.action) {
    case 'auth.login':
      return `${who} logged in`
    default: {
      const entity = entry.entityType
        ? ` (${entry.entityType}${entry.entityId !== null ? ` #${entry.entityId}` : ''})`
        : ''
      return `${who}: ${entry.action}${entity}`
    }
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}

/** Reader-focused dashboard for subscribers. */
function SubscriberDashboard({ firstName }: { firstName: string }) {
  const latest = usePublicPosts({ limit: 3, sort: 'latest' })
  const categories = usePublicCategories()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Browse the latest published educational content.
          </p>
        </div>
        <Button asChild>
          <Link to="/articles">
            Browse articles <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <section aria-label="Latest articles">
        <h2 className="mb-4 text-base font-semibold">Latest articles</h2>
        {latest.isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : latest.isError || latest.data.items.length === 0 ? (
          <EmptyState
            title="Nothing published yet"
            description="New articles will appear here as soon as they are published."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.data.items.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {categories.data && categories.data.some((c) => c.postCount > 0) && (
        <section aria-label="Recommended categories">
          <h2 className="mb-4 text-base font-semibold">Recommended categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.data
              .filter((c) => c.postCount > 0)
              .map((category) => (
                <Button key={category.id} asChild variant="outline" size="sm">
                  <Link to={`/categories/${category.slug}`}>
                    {category.name}
                    <span className="text-muted-foreground">({category.postCount})</span>
                  </Link>
                </Button>
              ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const isStaff = !!user && STAFF_ROLES.includes(user.role)
  const dashboard = useDashboard(isStaff)
  const { approve } = useCommentModeration()

  if (!user) return null

  const firstName = user.firstName ?? user.username

  if (!isStaff) {
    return <SubscriberDashboard firstName={firstName} />
  }

  const heading = (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1 text-muted-foreground">Here’s what’s happening across your site.</p>
    </div>
  )

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        {heading}
        <DashboardSkeleton />
      </div>
    )
  }

  if (dashboard.isError) {
    return (
      <div className="space-y-6">
        {heading}
        <ErrorState
          message="The dashboard data couldn’t be loaded."
          onRetry={() => dashboard.refetch()}
        />
      </div>
    )
  }

  const { stats, recentPosts, pendingComments, recentActivity } = dashboard.data
  const canModerate = user.role === ROLES.ADMIN || user.role === ROLES.EDITOR

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {heading}
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/posts/new">
              <PlusCircle aria-hidden="true" /> New post
            </Link>
          </Button>
          {canModerate && (
            <Button asChild variant="outline">
              <Link to="/admin/comments">Review comments</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Published posts"
          value={stats.publishedPosts}
          icon={FileText}
          hint={`${stats.archivedPosts} archived`}
        />
        <StatCard label="Drafts" value={stats.draftPosts} icon={FilePen} />
        <StatCard
          label="Pending comments"
          value={stats.pendingComments}
          icon={MessagesSquare}
        />
        <StatCard label="Active users" value={stats.activeUsers} icon={Users} />
        <StatCard label="Total views" value={stats.totalViews.toLocaleString()} icon={Eye} />
        <StatCard label="Media files" value={stats.mediaCount} icon={Image} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent posts</CardTitle>
            <CardDescription>The latest updates across all content</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <EmptyState
                title="No posts yet"
                description="Create your first post to see it here."
              />
            ) : (
              <ul className="divide-y">
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.author} · {formatDateTime(post.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={post.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending comments</CardTitle>
              <CardDescription>Awaiting moderation</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingComments.length === 0 ? (
                <EmptyState
                  title="All caught up"
                  description="No comments are waiting for review."
                />
              ) : (
                <ul className="divide-y">
                  {pendingComments.map((comment) => (
                    <li key={comment.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm">“{comment.excerpt}”</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {comment.author} on {comment.postTitle} ·{' '}
                          {formatDateTime(comment.createdAt)}
                        </p>
                      </div>
                      {canModerate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => approve.mutate(comment.id)}
                          aria-label={`Approve comment by ${comment.author}`}
                        >
                          <Check aria-hidden="true" /> Approve
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Actions like logins and edits will show up here."
                />
              ) : (
                <ul className="space-y-2">
                  {recentActivity.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate">{describeActivity(entry)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
