import {
  Eye,
  FileText,
  FilePen,
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
import { useDashboard } from './useDashboard'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

export function DashboardPage() {
  const { user } = useAuth()
  const isStaff = !!user && STAFF_ROLES.includes(user.role)
  const dashboard = useDashboard(isStaff)

  if (!user) return null

  const heading = (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {user.firstName ?? user.username}
      </h1>
      <p className="text-muted-foreground">
        Here’s what’s happening across your site.
      </p>
    </div>
  )

  if (!isStaff) {
    return (
      <div className="space-y-6">
        {heading}
        <Card>
          <CardHeader>
            <CardTitle>Published content</CardTitle>
            <CardDescription>
              Browsing published posts and commenting arrives with the public content views
              in later phases.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

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
  const isAdmin = user.role === ROLES.ADMIN

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {heading}
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/posts">
              <PlusCircle aria-hidden="true" /> New post
            </Link>
          </Button>
          {(isAdmin || user.role === ROLES.EDITOR) && (
            <Button asChild variant="outline">
              <Link to="/comments">Review comments</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Published posts"
          value={stats.publishedPosts}
          icon={FileText}
          hint={`${stats.archivedPosts} archived`}
        />
        <StatCard label="Drafts" value={stats.draftPosts} icon={FilePen} />
        <StatCard label="Pending comments" value={stats.pendingComments} icon={MessagesSquare} />
        {isAdmin ? (
          <StatCard label="Active users" value={stats.activeUsers} icon={Users} />
        ) : (
          <StatCard label="Total views" value={stats.totalViews.toLocaleString()} icon={Eye} />
        )}
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
                  <li key={post.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.author} · {formatDate(post.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
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
                    <li key={comment.id} className="py-2.5">
                      <p className="line-clamp-2 text-sm">“{comment.excerpt}”</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {comment.author} on {comment.postTitle} · {formatDate(comment.createdAt)}
                      </p>
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
                    <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{describeActivity(entry)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
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
