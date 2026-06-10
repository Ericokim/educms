import type {
  ActivityEntry,
  DashboardStats,
  PendingComment,
  RecentPost,
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
