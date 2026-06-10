import type { CategoryItem, TagItem } from '@educms/shared'
import { query } from '../database/pool.js'

// --- Categories ---

export async function listCategories(): Promise<CategoryItem[]> {
  const result = await query<{
    id: number
    name: string
    slug: string
    description: string | null
    post_count: number
  }>(
    `SELECT c.id, c.name, c.slug, c.description, count(p.id)::int AS post_count
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

export async function categoryExists(id: number): Promise<boolean> {
  const result = await query('SELECT 1 FROM categories WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

export async function categoryConflict(
  name: string,
  slug: string,
  excludeId?: number
): Promise<'name' | 'slug' | null> {
  const result = await query<{ name: string; slug: string }>(
    `SELECT name, slug FROM categories
     WHERE (lower(name) = lower($1) OR slug = $2) AND ($3::int IS NULL OR id <> $3)`,
    [name, slug, excludeId ?? null]
  )
  if (result.rows.length === 0) return null
  return result.rows.some((row) => row.name.toLowerCase() === name.toLowerCase())
    ? 'name'
    : 'slug'
}

export async function insertCategory(
  name: string,
  slug: string,
  description: string | null
): Promise<number> {
  const result = await query<{ id: number }>(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING id',
    [name, slug, description]
  )
  return result.rows[0].id
}

export async function updateCategory(
  id: number,
  name: string,
  slug: string,
  description: string | null
): Promise<void> {
  await query(
    'UPDATE categories SET name = $2, slug = $3, description = $4, updated_at = now() WHERE id = $1',
    [id, name, slug, description]
  )
}

export async function deleteCategory(id: number): Promise<void> {
  await query('DELETE FROM categories WHERE id = $1', [id])
}

// --- Tags ---

export async function listTags(): Promise<TagItem[]> {
  const result = await query<{
    id: number
    name: string
    slug: string
    post_count: number
  }>(
    `SELECT t.id, t.name, t.slug, count(pt.post_id)::int AS post_count
     FROM tags t
     LEFT JOIN post_tags pt ON pt.tag_id = t.id
     GROUP BY t.id
     ORDER BY t.name`
  )
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    postCount: row.post_count,
  }))
}

export async function tagExists(id: number): Promise<boolean> {
  const result = await query('SELECT 1 FROM tags WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

export async function tagConflict(
  name: string,
  slug: string,
  excludeId?: number
): Promise<'name' | 'slug' | null> {
  const result = await query<{ name: string; slug: string }>(
    `SELECT name, slug FROM tags
     WHERE (lower(name) = lower($1) OR slug = $2) AND ($3::int IS NULL OR id <> $3)`,
    [name, slug, excludeId ?? null]
  )
  if (result.rows.length === 0) return null
  return result.rows.some((row) => row.name.toLowerCase() === name.toLowerCase())
    ? 'name'
    : 'slug'
}

export async function insertTag(name: string, slug: string): Promise<number> {
  const result = await query<{ id: number }>(
    'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
    [name, slug]
  )
  return result.rows[0].id
}

export async function updateTag(id: number, name: string, slug: string): Promise<void> {
  await query('UPDATE tags SET name = $2, slug = $3, updated_at = now() WHERE id = $1', [
    id,
    name,
    slug,
  ])
}

export async function deleteTag(id: number): Promise<void> {
  await query('DELETE FROM tags WHERE id = $1', [id])
}
