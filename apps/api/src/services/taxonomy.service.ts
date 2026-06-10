import type { CategoryFormValues, TagFormValues, User } from '@educms/shared'
import { logActivity } from '../repositories/activityLog.repository.js'
import * as taxonomy from '../repositories/taxonomy.repository.js'
import { conflict, notFound } from '../utils/httpError.js'
import { slugify } from '../utils/slugify.js'

function resolveSlug(name: string, explicit?: string): string {
  const slug = explicit || slugify(name)
  if (!slug) throw conflict('Could not derive a slug from the name')
  return slug
}

function conflictError(kind: 'name' | 'slug', entity: string): never {
  throw conflict(
    kind === 'name'
      ? `A ${entity} with this name already exists`
      : `A ${entity} with this slug already exists`
  )
}

// --- Categories ---

export async function createCategory(user: User, form: CategoryFormValues) {
  const slug = resolveSlug(form.name, form.slug)
  const existing = await taxonomy.categoryConflict(form.name, slug)
  if (existing) conflictError(existing, 'category')

  const id = await taxonomy.insertCategory(form.name, slug, form.description || null)
  await logActivity(user.id, 'category.created', 'category', id, { name: form.name })
  return { id }
}

export async function updateCategory(user: User, id: number, form: CategoryFormValues) {
  if (!(await taxonomy.categoryExists(id))) throw notFound('Category not found')

  const slug = resolveSlug(form.name, form.slug)
  const existing = await taxonomy.categoryConflict(form.name, slug, id)
  if (existing) conflictError(existing, 'category')

  await taxonomy.updateCategory(id, form.name, slug, form.description || null)
  await logActivity(user.id, 'category.updated', 'category', id, { name: form.name })
}

export async function deleteCategory(user: User, id: number) {
  if (!(await taxonomy.categoryExists(id))) throw notFound('Category not found')
  // posts.category_id is ON DELETE SET NULL: posts keep existing, uncategorized.
  await taxonomy.deleteCategory(id)
  await logActivity(user.id, 'category.deleted', 'category', id)
}

// --- Tags ---

export async function createTag(user: User, form: TagFormValues) {
  const slug = resolveSlug(form.name, form.slug)
  const existing = await taxonomy.tagConflict(form.name, slug)
  if (existing) conflictError(existing, 'tag')

  const id = await taxonomy.insertTag(form.name, slug)
  await logActivity(user.id, 'tag.created', 'tag', id, { name: form.name })
  return { id }
}

export async function updateTag(user: User, id: number, form: TagFormValues) {
  if (!(await taxonomy.tagExists(id))) throw notFound('Tag not found')

  const slug = resolveSlug(form.name, form.slug)
  const existing = await taxonomy.tagConflict(form.name, slug, id)
  if (existing) conflictError(existing, 'tag')

  await taxonomy.updateTag(id, form.name, slug)
  await logActivity(user.id, 'tag.updated', 'tag', id, { name: form.name })
}

export async function deleteTag(user: User, id: number) {
  if (!(await taxonomy.tagExists(id))) throw notFound('Tag not found')
  // post_tags rows cascade; posts themselves are untouched.
  await taxonomy.deleteTag(id)
  await logActivity(user.id, 'tag.deleted', 'tag', id)
}
