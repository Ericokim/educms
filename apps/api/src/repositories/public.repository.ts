import type {
  ListPublicPostsQuery,
  Paginated,
  PublicCategory,
  PublicComment,
  PublicPostDetail,
  PublicPostSummary,
  TagSummary,
} from '@educms/shared'
import { pool, query } from '../database/pool.js'

interface PublicPostRow {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  author: string
  category_name: string | null
  category_slug: string | null
  category_id: number | null
  tags: TagSummary[]
  featured_image_path: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  published_at: Date
  view_count: number
}

function readingMinutes(content: string): number {
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function toSummary(row: PublicPostRow): PublicPostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    author: row.author,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    tags: row.tags,
    featuredImageUrl: row.featured_image_path,
    publishedAt: row.published_at.toISOString(),
    viewCount: row.view_count,
    readingMinutes: readingMinutes(row.content),
  }
}

const PUBLIC_SELECT = `
  SELECT p.id, p.title, p.slug, p.excerpt, p.content,
         coalesce(nullif(btrim(concat(u.first_name, ' ', u.last_name)), ''), u.username) AS author,
         c.name AS category_name, c.slug AS category_slug, c.id AS category_id,
         m.path AS featured_image_path,
         p.meta_title, p.meta_description, p.meta_keywords,
         p.published_at, p.view_count,
         coalesce(
           json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
                    ORDER BY t.name)
           FILTER (WHERE t.id IS NOT NULL), '[]'
         ) AS tags
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN media m ON m.id = p.featured_image_id
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id`

const PUBLIC_GROUP_BY = 'GROUP BY p.id, u.id, c.id, m.path'

export async function listPublishedPosts(
  filters: ListPublicPostsQuery
): Promise<Paginated<PublicPostSummary>> {
  const conditions: string[] = ["p.status = 'published'"]
  const params: unknown[] = []

  if (filters.categorySlug) {
    params.push(filters.categorySlug)
    conditions.push(
      `p.category_id = (SELECT id FROM categories WHERE slug = $${params.length})`
    )
  }
  if (filters.tagSlug) {
    params.push(filters.tagSlug)
    conditions.push(
      `EXISTS (SELECT 1 FROM post_tags ptf JOIN tags tf ON tf.id = ptf.tag_id
               WHERE ptf.post_id = p.id AND tf.slug = $${params.length})`
    )
  }
  if (filters.search) {
    const escaped = filters.search.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    params.push(`%${escaped}%`)
    conditions.push(
      `(p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length} OR p.content ILIKE $${params.length})`
    )
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const orderBy =
    filters.sort === 'popular'
      ? 'ORDER BY p.view_count DESC, p.published_at DESC'
      : 'ORDER BY p.published_at DESC'
  const offset = (filters.page - 1) * filters.limit
  params.push(filters.limit, offset)

  const [result, countResult] = await Promise.all([
    pool.query<PublicPostRow>(
      `${PUBLIC_SELECT} ${where} ${PUBLIC_GROUP_BY} ${orderBy}
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
    items: result.rows.map(toSummary),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  }
}

export async function getPublishedBySlug(slug: string): Promise<PublicPostDetail | null> {
  const result = await query<PublicPostRow>(
    `${PUBLIC_SELECT} WHERE p.slug = $1 AND p.status = 'published' ${PUBLIC_GROUP_BY}`,
    [slug]
  )
  const row = result.rows[0]
  if (!row) return null

  const related = await getRelatedPosts(row.id, row.category_id)
  return {
    ...toSummary(row),
    content: row.content,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    related,
  }
}

async function getRelatedPosts(
  postId: number,
  categoryId: number | null,
  limit = 3
): Promise<PublicPostSummary[]> {
  // Same category first, then newest published as a fallback fill.
  const result = await query<PublicPostRow>(
    `${PUBLIC_SELECT}
     WHERE p.status = 'published' AND p.id <> $1
     ${PUBLIC_GROUP_BY}
     ORDER BY (p.category_id = $2) DESC NULLS LAST, p.published_at DESC
     LIMIT $3`,
    [postId, categoryId, limit]
  )
  return result.rows.map(toSummary)
}

export async function listPublicCategories(): Promise<PublicCategory[]> {
  const result = await query<{
    id: number
    name: string
    slug: string
    description: string | null
    post_count: number
  }>(
    `SELECT c.id, c.name, c.slug, c.description,
            count(p.id) FILTER (WHERE p.status = 'published')::int AS post_count
     FROM categories c
     LEFT JOIN posts p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name`
  )
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    postCount: row.post_count,
  }))
}

export async function listApprovedComments(postId: number): Promise<PublicComment[]> {
  const result = await query<{
    id: number
    author: string
    content: string
    created_at: Date
  }>(
    `SELECT c.id,
            coalesce(nullif(btrim(concat(u.first_name, ' ', u.last_name)), ''), u.username, 'Reader') AS author,
            c.content, c.created_at
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1 AND c.status = 'approved'
     ORDER BY c.created_at ASC`,
    [postId]
  )
  return result.rows.map((row) => ({
    id: row.id,
    author: row.author,
    content: row.content,
    createdAt: row.created_at.toISOString(),
  }))
}

/** Returns the post id when the slug is a published post, else null. */
export async function getPublishedPostId(slug: string): Promise<number | null> {
  const result = await query<{ id: number }>(
    "SELECT id FROM posts WHERE slug = $1 AND status = 'published'",
    [slug]
  )
  return result.rows[0]?.id ?? null
}

export async function incrementViewCount(slug: string): Promise<boolean> {
  const result = await query(
    "UPDATE posts SET view_count = view_count + 1 WHERE slug = $1 AND status = 'published'",
    [slug]
  )
  return (result.rowCount ?? 0) > 0
}
