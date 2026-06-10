import type {
  ActivityEntry,
  AuthorPerformance,
  CategoryPerformance,
  CommentStatusCount,
  DashboardStats,
  MonthlyCount,
  PendingComment,
  RecentPost,
  RoleCount,
  TopPost,
} from '@educms/shared'
import { query } from '../database/pool.js'

export async function getDashboardStats(): Promise<DashboardStats> {
  const result = await query<{
    published_posts: number
    draft_posts: number
    archived_posts: number
    total_views: number
    pending_comments: number
    active_users: number
    media_count: number
    categories_count: number
    tags_count: number
  }>(
    `SELECT
       (SELECT count(*)::int FROM posts WHERE status = 'published') AS published_posts,
       (SELECT count(*)::int FROM posts WHERE status = 'draft') AS draft_posts,
       (SELECT count(*)::int FROM posts WHERE status = 'archived') AS archived_posts,
       (SELECT coalesce(sum(view_count), 0)::int FROM posts) AS total_views,
       (SELECT count(*)::int FROM comments WHERE status = 'pending') AS pending_comments,
       (SELECT count(*)::int FROM users WHERE is_active) AS active_users,
       (SELECT count(*)::int FROM media) AS media_count,
       (SELECT count(*)::int FROM categories) AS categories_count,
       (SELECT count(*)::int FROM tags) AS tags_count`
  )
  const row = result.rows[0]
  return {
    publishedPosts: row.published_posts,
    draftPosts: row.draft_posts,
    archivedPosts: row.archived_posts,
    totalViews: row.total_views,
    pendingComments: row.pending_comments,
    activeUsers: row.active_users,
    mediaCount: row.media_count,
    categoriesCount: row.categories_count,
    tagsCount: row.tags_count,
  }
}

export async function getRecentPosts(limit = 5): Promise<RecentPost[]> {
  const result = await query<{
    id: number
    title: string
    slug: string
    status: RecentPost['status']
    author: string
    updated_at: Date
  }>(
    `SELECT p.id, p.title, p.slug, p.status, u.username AS author, p.updated_at
     FROM posts p
     JOIN users u ON u.id = p.author_id
     ORDER BY p.updated_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    author: row.author,
    updatedAt: row.updated_at.toISOString(),
  }))
}

export async function getPendingComments(limit = 5): Promise<PendingComment[]> {
  const result = await query<{
    id: number
    excerpt: string
    post_title: string
    author: string
    created_at: Date
  }>(
    `SELECT c.id, left(c.content, 120) AS excerpt, p.title AS post_title,
            coalesce(u.username, 'guest') AS author, c.created_at
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.status = 'pending'
     ORDER BY c.created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows.map((row) => ({
    id: row.id,
    excerpt: row.excerpt,
    postTitle: row.post_title,
    author: row.author,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function getTopPosts(limit = 10): Promise<TopPost[]> {
  const result = await query<{
    id: number
    title: string
    slug: string
    status: TopPost['status']
    author: string
    view_count: number
  }>(
    `SELECT p.id, p.title, p.slug, p.status, u.username AS author, p.view_count
     FROM posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.status <> 'draft'
     ORDER BY p.view_count DESC, p.id
     LIMIT $1`,
    [limit]
  )
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    author: row.author,
    viewCount: row.view_count,
  }))
}

export async function getCategoryPerformance(): Promise<CategoryPerformance[]> {
  const result = await query<{
    category: string
    post_count: number
    total_views: number
  }>(
    `SELECT coalesce(c.name, 'Uncategorized') AS category,
            count(p.id)::int AS post_count,
            coalesce(sum(p.view_count), 0)::int AS total_views
     FROM posts p
     LEFT JOIN categories c ON c.id = p.category_id
     GROUP BY c.name
     ORDER BY total_views DESC`
  )
  return result.rows.map((row) => ({
    category: row.category,
    postCount: row.post_count,
    totalViews: row.total_views,
  }))
}

export async function getPostsPerMonth(months = 6): Promise<MonthlyCount[]> {
  // generate_series fills months with no posts so the chart axis is complete.
  const result = await query<{ month: string; count: number }>(
    `SELECT to_char(m.month, 'YYYY-MM') AS month, count(p.id)::int AS count
     FROM generate_series(
       date_trunc('month', now()) - ($1 - 1) * interval '1 month',
       date_trunc('month', now()),
       interval '1 month'
     ) AS m(month)
     LEFT JOIN posts p ON date_trunc('month', p.created_at) = m.month
     GROUP BY m.month
     ORDER BY m.month`,
    [months]
  )
  return result.rows
}

export async function getCommentsByStatus(): Promise<CommentStatusCount[]> {
  const result = await query<{ status: CommentStatusCount['status']; count: number }>(
    'SELECT status, count(*)::int AS count FROM comments GROUP BY status ORDER BY status'
  )
  return result.rows
}

export async function getUsersByRole(): Promise<RoleCount[]> {
  const result = await query<{ role: RoleCount['role']; count: number }>(
    'SELECT role, count(*)::int AS count FROM users GROUP BY role ORDER BY count DESC'
  )
  return result.rows
}

export async function getAuthorPerformance(): Promise<AuthorPerformance[]> {
  const result = await query<{
    user_id: number
    username: string
    post_count: number
    published_count: number
    total_views: number
  }>(
    `SELECT u.id AS user_id, u.username,
            count(p.id)::int AS post_count,
            count(p.id) FILTER (WHERE p.status = 'published')::int AS published_count,
            coalesce(sum(p.view_count), 0)::int AS total_views
     FROM users u
     JOIN posts p ON p.author_id = u.id
     GROUP BY u.id, u.username
     ORDER BY total_views DESC`
  )
  return result.rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    postCount: row.post_count,
    publishedCount: row.published_count,
    totalViews: row.total_views,
  }))
}

export async function getRecentActivity(limit = 8): Promise<ActivityEntry[]> {
  const result = await query<{
    id: number
    action: string
    entity_type: string | null
    entity_id: number | null
    username: string | null
    created_at: Date
  }>(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, u.username, a.created_at
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    username: row.username,
    createdAt: row.created_at.toISOString(),
  }))
}
