import type { CategorySummary, TagSummary } from '@educms/shared'
import { query } from '../database/pool.js'

export async function listCategories(): Promise<CategorySummary[]> {
  const result = await query<CategorySummary>(
    'SELECT id, name, slug FROM categories ORDER BY name'
  )
  return result.rows
}

export async function listTags(): Promise<TagSummary[]> {
  const result = await query<TagSummary>('SELECT id, name, slug FROM tags ORDER BY name')
  return result.rows
}
