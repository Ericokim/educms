import type {
  CommentItem,
  CommentStatus,
  ListCommentsQuery,
  Paginated,
} from '@educms/shared'
import { pool, query } from '../database/pool.js'

interface CommentRow {
  id: number
  post_id: number
  post_title: string
  author: string
  content: string
  status: CommentStatus
  created_at: Date
}

function toItem(row: CommentRow): CommentItem {
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post_title,
    author: row.author,
    content: row.content,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listComments(
  filters: ListCommentsQuery
): Promise<Paginated<CommentItem>> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`c.status = $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (filters.page - 1) * filters.limit
  params.push(filters.limit, offset)

  const [result, countResult] = await Promise.all([
    pool.query<CommentRow>(
      `SELECT c.id, c.post_id, p.title AS post_title,
              coalesce(u.username, 'guest') AS author,
              c.content, c.status, c.created_at
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       LEFT JOIN users u ON u.id = c.user_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query<{ total: string }>(
      `SELECT count(*) AS total FROM comments c ${where}`,
      params.slice(0, params.length - 2)
    ),
  ])
  const total = Number(countResult.rows[0].total)

  return {
    items: result.rows.map(toItem),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  }
}

export async function getCommentById(id: number): Promise<CommentItem | null> {
  const result = await query<CommentRow>(
    `SELECT c.id, c.post_id, p.title AS post_title,
            coalesce(u.username, 'guest') AS author,
            c.content, c.status, c.created_at
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id]
  )
  return result.rows[0] ? toItem(result.rows[0]) : null
}

export async function insertComment(
  postId: number,
  userId: number,
  content: string
): Promise<number> {
  const result = await query<{ id: number }>(
    'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
    [postId, userId, content]
  )
  return result.rows[0].id
}

export async function setCommentStatus(id: number, status: CommentStatus): Promise<void> {
  await query('UPDATE comments SET status = $2, updated_at = now() WHERE id = $1', [
    id,
    status,
  ])
}
