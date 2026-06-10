import type {
  Paginated,
  PostDetail,
  PostFormValues,
  PostListItem,
  PostVersionDetail,
  PostVersionSummary,
  User,
} from '@educms/shared'
import { POST_STATUSES, ROLES } from '@educms/shared'
import { withTransaction } from '../database/pool.js'
import { logActivity } from '../repositories/activityLog.repository.js'
import * as posts from '../repositories/post.repository.js'
import { conflict, forbidden, notFound } from '../utils/httpError.js'
import { slugify } from '../utils/slugify.js'

function canManageAll(user: User): boolean {
  return user.role === ROLES.ADMIN || user.role === ROLES.EDITOR
}

function assertCanAccess(user: User, post: { authorId: number }): void {
  if (!canManageAll(user) && post.authorId !== user.id) {
    throw forbidden('You can only access your own posts')
  }
}

async function resolveSlug(
  form: PostFormValues,
  excludeId?: number
): Promise<string> {
  const base = form.slug ? form.slug : slugify(form.title)
  if (!base) throw conflict('Could not derive a slug from the title')

  if (form.slug) {
    // An explicit slug must be free; do not silently rename it.
    if (await posts.slugExists(base, excludeId)) {
      throw conflict(`The slug "${base}" is already in use`)
    }
    return base
  }

  let candidate = base
  for (let i = 2; await posts.slugExists(candidate, excludeId); i++) {
    candidate = `${base}-${i}`
  }
  return candidate
}

function toWriteData(form: PostFormValues, slug: string): posts.PostWriteData {
  return {
    title: form.title,
    slug,
    excerpt: form.excerpt || null,
    content: form.content,
    categoryId: form.categoryId ?? null,
    metaTitle: form.metaTitle || null,
    metaDescription: form.metaDescription || null,
    metaKeywords: form.metaKeywords || null,
  }
}

export async function listPosts(
  user: User,
  query: posts.PostFilters
): Promise<Paginated<PostListItem>> {
  const filters = { ...query }
  if (!canManageAll(user)) {
    filters.authorId = user.id
  }
  return posts.listPosts(filters)
}

export async function getPost(user: User, id: number): Promise<PostDetail> {
  const post = await posts.getPostById(id)
  if (!post) throw notFound('Post not found')
  assertCanAccess(user, post)
  return post
}

export async function getPublishedPostBySlug(slug: string): Promise<PostDetail> {
  const post = await posts.getPostBySlug(slug)
  if (!post || post.status !== POST_STATUSES.PUBLISHED) {
    throw notFound('Post not found')
  }
  return post
}

export async function createPost(user: User, form: PostFormValues): Promise<PostDetail> {
  const slug = await resolveSlug(form)
  const data = toWriteData(form, slug)

  const postId = await withTransaction(async (tx) => {
    const id = await posts.insertPost(tx, data, user.id)
    await posts.setPostTags(tx, id, form.tagIds)
    await posts.insertVersion(
      tx,
      id,
      { ...snapshotFromData(data), status: POST_STATUSES.DRAFT },
      user.id
    )
    return id
  })

  await logActivity(user.id, 'post.created', 'post', postId, { title: data.title })
  const created = await posts.getPostById(postId)
  if (!created) throw notFound('Post not found')
  return created
}

function snapshotFromData(data: posts.PostWriteData) {
  return {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    metaKeywords: data.metaKeywords,
  }
}

function contentChanged(existing: PostDetail, data: posts.PostWriteData): boolean {
  return (
    existing.title !== data.title ||
    existing.content !== data.content ||
    existing.excerpt !== data.excerpt ||
    existing.metaTitle !== data.metaTitle ||
    existing.metaDescription !== data.metaDescription ||
    existing.metaKeywords !== data.metaKeywords
  )
}

export async function updatePost(
  user: User,
  id: number,
  form: PostFormValues
): Promise<PostDetail> {
  const existing = await posts.getPostById(id)
  if (!existing) throw notFound('Post not found')
  assertCanAccess(user, existing)

  const slug = form.slug && form.slug !== existing.slug
    ? await resolveSlug(form, id)
    : existing.slug
  const data = toWriteData(form, slug)

  await withTransaction(async (tx) => {
    await posts.updatePostRow(tx, id, data)
    await posts.setPostTags(tx, id, form.tagIds)
    if (contentChanged(existing, data)) {
      await posts.insertVersion(
        tx,
        id,
        { ...snapshotFromData(data), status: existing.status },
        user.id
      )
    }
  })

  await logActivity(user.id, 'post.updated', 'post', id, { title: data.title })
  const updated = await posts.getPostById(id)
  if (!updated) throw notFound('Post not found')
  return updated
}

export async function publishPost(user: User, id: number): Promise<PostDetail> {
  const existing = await posts.getPostById(id)
  if (!existing) throw notFound('Post not found')
  assertCanAccess(user, existing)

  await posts.setPostStatus(id, POST_STATUSES.PUBLISHED, true)
  await logActivity(user.id, 'post.published', 'post', id, { title: existing.title })
  const updated = await posts.getPostById(id)
  if (!updated) throw notFound('Post not found')
  return updated
}

export async function archivePost(user: User, id: number): Promise<PostDetail> {
  const existing = await posts.getPostById(id)
  if (!existing) throw notFound('Post not found')
  assertCanAccess(user, existing)

  await posts.setPostStatus(id, POST_STATUSES.ARCHIVED, false)
  await logActivity(user.id, 'post.archived', 'post', id, { title: existing.title })
  const updated = await posts.getPostById(id)
  if (!updated) throw notFound('Post not found')
  return updated
}

export async function deletePost(user: User, id: number): Promise<void> {
  const existing = await posts.getPostById(id)
  if (!existing) throw notFound('Post not found')
  assertCanAccess(user, existing)

  await posts.deletePostRow(id)
  await logActivity(user.id, 'post.deleted', 'post', id, { title: existing.title })
}

export async function listPostVersions(
  user: User,
  postId: number
): Promise<PostVersionSummary[]> {
  const post = await posts.getPostById(postId)
  if (!post) throw notFound('Post not found')
  assertCanAccess(user, post)
  return posts.listVersions(postId)
}

export async function rollbackPost(
  user: User,
  postId: number,
  versionId: number
): Promise<PostDetail> {
  const post = await posts.getPostById(postId)
  if (!post) throw notFound('Post not found')
  assertCanAccess(user, post)

  const version: PostVersionDetail | null = await posts.getVersion(postId, versionId)
  if (!version) throw notFound('Version not found')

  const data: posts.PostWriteData = {
    title: version.title,
    slug: post.slug,
    excerpt: version.excerpt,
    content: version.content,
    categoryId: post.categoryId,
    metaTitle: version.metaTitle,
    metaDescription: version.metaDescription,
    metaKeywords: version.metaKeywords,
  }

  await withTransaction(async (tx) => {
    await posts.updatePostRow(tx, postId, data)
    // The restored state becomes a new version so history stays linear.
    await posts.insertVersion(
      tx,
      postId,
      { ...snapshotFromData(data), status: post.status },
      user.id
    )
  })

  await logActivity(user.id, 'post.rolled_back', 'post', postId, {
    toVersion: version.versionNumber,
  })
  const updated = await posts.getPostById(postId)
  if (!updated) throw notFound('Post not found')
  return updated
}
