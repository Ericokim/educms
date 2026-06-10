import type {
  ListPostsQuery,
  Paginated,
  PostDetail,
  PostListItem,
  PostStatus,
  PostVersionDetail,
  PostVersionSummary,
  TagSummary,
} from '@educms/shared'
import { pool, type Queryable } from '../database/pool.js'

interface PostRow {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  status: PostStatus
  author_id: number
  author: string
  category_id: number | null
  category_name: string | null
  featured_image_id: number | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  view_count: number
  published_at: Date | null
  created_at: Date
  updated_at: Date
  tags: TagSummary[]
  total?: string
}

const POST_SELECT = `
  SELECT p.*, u.username AS author, c.name AS category_name,
         coalesce(
           json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
                    ORDER BY t.name)
           FILTER (WHERE t.id IS NOT NULL), '[]'
         ) AS tags
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id`

const POST_GROUP_BY = 'GROUP BY p.id, u.username, c.name'

function toListItem(row: PostRow): PostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    excerpt: row.excerpt,
    authorId: row.author_id,
    author: row.author,
    categoryId: row.category_id,
    categoryName: row.category_name,
    tags: row.tags,
    viewCount: row.view_count,
    publishedAt: row.published_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function toDetail(row: PostRow): PostDetail {
  return {
    ...toListItem(row),
    content: row.content,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    featuredImageId: row.featured_image_id,
  }
}

export interface PostFilters extends ListPostsQuery {
  /** Restrict results to a single author (RBAC for the author role). */
  authorId?: number
}

export async function listPosts(filters: PostFilters): Promise<Paginated<PostListItem>> {
  const conditions: string[] = []
  const params: unknown[] = []

  function add(condition: string, value: unknown) {
    params.push(value)
    conditions.push(condition.replace('?', `$${params.length}`))
  }

  if (filters.status) add('p.status = ?', filters.status)
  if (filters.categoryId) add('p.category_id = ?', filters.categoryId)
  if (filters.authorId) add('p.author_id = ?', filters.authorId)
  if (filters.tagId) {
    add('EXISTS (SELECT 1 FROM post_tags ptf WHERE ptf.post_id = p.id AND ptf.tag_id = ?)', filters.tagId)
  }
  if (filters.search) {
    const escaped = filters.search.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    add('p.title ILIKE ?', `%${escaped}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (filters.page - 1) * filters.limit
  params.push(filters.limit, offset)

  const [result, countResult] = await Promise.all([
    pool.query<PostRow>(
      `${POST_SELECT}
       ${where}
       ${POST_GROUP_BY}
       ORDER BY p.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query<{ total: string }>(
      `SELECT count(*) AS total FROM posts p ${where}`,
      params.slice(0, params.length - 2)
    ),
  ])
  const total = Number(countResult.rows[0].total)

  return {
    items: result.rows.map(toListItem),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  }
}

export async function getPostById(id: number): Promise<PostDetail | null> {
  const result = await pool.query<PostRow>(
    `${POST_SELECT} WHERE p.id = $1 ${POST_GROUP_BY}`,
    [id]
  )
  return result.rows[0] ? toDetail(result.rows[0]) : null
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const result = await pool.query<PostRow>(
    `${POST_SELECT} WHERE p.slug = $1 ${POST_GROUP_BY}`,
    [slug]
  )
  return result.rows[0] ? toDetail(result.rows[0]) : null
}

export async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const result = excludeId
    ? await pool.query('SELECT 1 FROM posts WHERE slug = $1 AND id <> $2', [slug, excludeId])
    : await pool.query('SELECT 1 FROM posts WHERE slug = $1', [slug])
  return (result.rowCount ?? 0) > 0
}

export interface PostWriteData {
  title: string
  slug: string
  excerpt: string | null
  content: string
  categoryId: number | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
}

export async function insertPost(
  db: Queryable,
  data: PostWriteData,
  authorId: number
): Promise<number> {
  const result = await db.query<{ id: number }>(
    `INSERT INTO posts
       (title, slug, excerpt, content, author_id, category_id,
        meta_title, meta_description, meta_keywords)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      data.title,
      data.slug,
      data.excerpt,
      data.content,
      authorId,
      data.categoryId,
      data.metaTitle,
      data.metaDescription,
      data.metaKeywords,
    ]
  )
  return result.rows[0].id
}

export async function updatePostRow(
  db: Queryable,
  id: number,
  data: PostWriteData
): Promise<void> {
  await db.query(
    `UPDATE posts SET
       title = $2, slug = $3, excerpt = $4, content = $5, category_id = $6,
       meta_title = $7, meta_description = $8, meta_keywords = $9, updated_at = now()
     WHERE id = $1`,
    [
      id,
      data.title,
      data.slug,
      data.excerpt,
      data.content,
      data.categoryId,
      data.metaTitle,
      data.metaDescription,
      data.metaKeywords,
    ]
  )
}

export async function setPostTags(
  db: Queryable,
  postId: number,
  tagIds: number[]
): Promise<void> {
  await db.query('DELETE FROM post_tags WHERE post_id = $1', [postId])
  if (tagIds.length === 0) return
  const values = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ')
  await db.query(`INSERT INTO post_tags (post_id, tag_id) VALUES ${values}`, [
    postId,
    ...tagIds,
  ])
}

export async function setPostStatus(
  id: number,
  status: PostStatus,
  setPublishedAt: boolean
): Promise<void> {
  await pool.query(
    `UPDATE posts SET status = $2,
       published_at = CASE WHEN $3 AND published_at IS NULL THEN now() ELSE published_at END,
       updated_at = now()
     WHERE id = $1`,
    [id, status, setPublishedAt]
  )
}

export async function deletePostRow(id: number): Promise<void> {
  await pool.query('DELETE FROM posts WHERE id = $1', [id])
}

export async function nextVersionNumber(db: Queryable, postId: number): Promise<number> {
  const result = await db.query<{ next: number }>(
    'SELECT coalesce(max(version_number), 0)::int + 1 AS next FROM post_versions WHERE post_id = $1',
    [postId]
  )
  return result.rows[0].next
}

export interface VersionSnapshot {
  title: string
  content: string
  excerpt: string | null
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  status: PostStatus
}

export async function insertVersion(
  db: Queryable,
  postId: number,
  snapshot: VersionSnapshot,
  createdBy: number
): Promise<number> {
  const versionNumber = await nextVersionNumber(db, postId)
  await db.query(
    `INSERT INTO post_versions
       (post_id, version_number, title, content, excerpt,
        meta_title, meta_description, meta_keywords, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      postId,
      versionNumber,
      snapshot.title,
      snapshot.content,
      snapshot.excerpt,
      snapshot.metaTitle,
      snapshot.metaDescription,
      snapshot.metaKeywords,
      snapshot.status,
      createdBy,
    ]
  )
  return versionNumber
}

interface VersionRow {
  id: number
  version_number: number
  title: string
  content: string
  excerpt: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  status: PostStatus
  created_by_name: string | null
  created_at: Date
}

export async function listVersions(postId: number): Promise<PostVersionSummary[]> {
  const result = await pool.query<VersionRow>(
    `SELECT v.*, u.username AS created_by_name
     FROM post_versions v
     LEFT JOIN users u ON u.id = v.created_by
     WHERE v.post_id = $1
     ORDER BY v.version_number DESC`,
    [postId]
  )
  return result.rows.map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    title: row.title,
    status: row.status,
    createdBy: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function getVersion(
  postId: number,
  versionId: number
): Promise<PostVersionDetail | null> {
  const result = await pool.query<VersionRow>(
    `SELECT v.*, u.username AS created_by_name
     FROM post_versions v
     LEFT JOIN users u ON u.id = v.created_by
     WHERE v.post_id = $1 AND v.id = $2`,
    [postId, versionId]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    versionNumber: row.version_number,
    title: row.title,
    status: row.status,
    createdBy: row.created_by_name,
    createdAt: row.created_at.toISOString(),
    content: row.content,
    excerpt: row.excerpt,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
  }
}
