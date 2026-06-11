import { Eye, FileText, MessagesSquare, Users as UsersIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StatCard } from '@/components/shared/StatCard'
import { useDashboard } from '@/features/dashboard/useDashboard'
import { usePostAnalytics, useUserAnalytics } from './hooks'

const monthChartConfig = {
  count: { label: 'Posts', color: 'var(--chart-2)' },
} satisfies ChartConfig

const categoryChartConfig = {
  totalViews: { label: 'Views', color: 'var(--chart-3)' },
} satisfies ChartConfig

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1).toLocaleDateString(undefined, {
    month: 'short',
  })
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-72 rounded-xl" />
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const posts = usePostAnalytics()
  const users = useUserAnalytics()
  const summary = useDashboard()

  const isPending = posts.isPending || users.isPending
  const isError = posts.isError || users.isError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">How your content and authors are performing</p>
      </div>

      {isPending ? (
        <AnalyticsSkeleton />
      ) : isError ? (
        <ErrorState
          message="The analytics couldn’t be loaded."
          onRetry={() => {
            void posts.refetch()
            void users.refetch()
          }}
        />
      ) : (
        <div className="space-y-4">
          {summary.data && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total views"
                value={summary.data.stats.totalViews.toLocaleString()}
                icon={Eye}
              />
              <StatCard
                label="Published posts"
                value={summary.data.stats.publishedPosts}
                icon={FileText}
              />
              <StatCard
                label="Pending comments"
                value={summary.data.stats.pendingComments}
                icon={MessagesSquare}
              />
              <StatCard
                label="Active users"
                value={summary.data.stats.activeUsers}
                icon={UsersIcon}
              />
            </div>
          )}
          <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Posts per month</CardTitle>
              <CardDescription>New posts created, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.data.postsPerMonth.length === 0 ? (
                <EmptyState title="No posts yet" />
              ) : (
                <ChartContainer config={monthChartConfig} className="h-56 w-full">
                  <BarChart data={posts.data.postsPerMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Views by category</CardTitle>
              <CardDescription>Total views across all posts in each category</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.data.byCategory.length === 0 ? (
                <EmptyState title="No categorized posts yet" />
              ) : (
                <ChartContainer config={categoryChartConfig} className="h-56 w-full">
                  <BarChart data={posts.data.byCategory} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalViews" fill="var(--color-totalViews)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top content</CardTitle>
              <CardDescription>Most viewed posts</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.data.topPosts.length === 0 ? (
                <EmptyState title="No posts yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.data.topPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-56">
                          <p className="truncate font-medium">{post.title}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{post.author}</TableCell>
                        <TableCell>
                          <StatusBadge status={post.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {post.viewCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Author performance</CardTitle>
                <CardDescription>Posts and views per author</CardDescription>
              </CardHeader>
              <CardContent>
                {users.data.authorPerformance.length === 0 ? (
                  <EmptyState title="No authored posts yet" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-right">Posts</TableHead>
                        <TableHead className="text-right">Published</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.data.authorPerformance.map((author) => (
                        <TableRow key={author.userId}>
                          <TableCell className="font-medium">{author.username}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {author.postCount}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {author.publishedCount}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {author.totalViews.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Users by role</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {users.data.byRole.map((entry) => (
                      <li key={entry.role} className="flex items-center justify-between">
                        <RoleBadge role={entry.role} />
                        <span className="tabular-nums">{entry.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {posts.data.commentsByStatus.map((entry) => (
                      <li key={entry.status} className="flex items-center justify-between">
                        <StatusBadge status={entry.status} />
                        <span className="tabular-nums">{entry.count}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
