import type {
  ListPublicPostsQuery,
  Paginated,
  PublicCategory,
  PublicComment,
  PublicCommentValues,
  PublicPostDetail,
  PublicPostSummary,
  User,
} from '@educms/shared'
import { logActivity } from '../repositories/activityLog.repository.js'
import { insertComment } from '../repositories/comment.repository.js'
import * as publicRepo from '../repositories/public.repository.js'
import { notFound } from '../utils/httpError.js'

export function listPosts(
  query: ListPublicPostsQuery
): Promise<Paginated<PublicPostSummary>> {
  return publicRepo.listPublishedPosts(query)
}

export async function getPostBySlug(slug: string): Promise<PublicPostDetail> {
  const post = await publicRepo.getPublishedBySlug(slug)
  if (!post) throw notFound('Article not found')
  return post
}

export function listCategories(): Promise<PublicCategory[]> {
  return publicRepo.listPublicCategories()
}

export async function listComments(slug: string): Promise<PublicComment[]> {
  const postId = await publicRepo.getPublishedPostId(slug)
  if (postId === null) throw notFound('Article not found')
  return publicRepo.listApprovedComments(postId)
}

export async function submitComment(
  user: User,
  slug: string,
  values: PublicCommentValues
): Promise<void> {
  const postId = await publicRepo.getPublishedPostId(slug)
  if (postId === null) throw notFound('Article not found')

  const id = await insertComment(postId, user.id, values.content)
  await logActivity(user.id, 'comment.created', 'comment', id, { postId })
}

export async function recordView(slug: string): Promise<void> {
  const updated = await publicRepo.incrementViewCount(slug)
  if (!updated) throw notFound('Article not found')
}
