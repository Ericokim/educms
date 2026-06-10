import type {
  CommentItem,
  CommentStatus,
  CreateCommentValues,
  ListCommentsQuery,
  Paginated,
  User,
} from '@educms/shared'
import { COMMENT_STATUSES, POST_STATUSES } from '@educms/shared'
import { logActivity } from '../repositories/activityLog.repository.js'
import * as comments from '../repositories/comment.repository.js'
import { getPostById } from '../repositories/post.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'

export function listComments(query: ListCommentsQuery): Promise<Paginated<CommentItem>> {
  return comments.listComments(query)
}

export async function createComment(
  user: User,
  values: CreateCommentValues
): Promise<CommentItem> {
  const post = await getPostById(values.postId)
  if (!post) throw notFound('Post not found')
  if (post.status !== POST_STATUSES.PUBLISHED) {
    throw badRequest('Comments are only allowed on published posts')
  }

  const id = await comments.insertComment(values.postId, user.id, values.content)
  await logActivity(user.id, 'comment.created', 'comment', id, { postId: values.postId })

  const created = await comments.getCommentById(id)
  if (!created) throw notFound('Comment not found')
  return created
}

const MODERATION_ACTIONS: Record<string, { status: CommentStatus; action: string }> = {
  approve: { status: COMMENT_STATUSES.APPROVED, action: 'comment.approved' },
  spam: { status: COMMENT_STATUSES.SPAM, action: 'comment.marked_spam' },
  trash: { status: COMMENT_STATUSES.TRASH, action: 'comment.trashed' },
}

export async function moderateComment(
  user: User,
  id: number,
  moderation: 'approve' | 'spam' | 'trash'
): Promise<CommentItem> {
  const existing = await comments.getCommentById(id)
  if (!existing) throw notFound('Comment not found')

  const { status, action } = MODERATION_ACTIONS[moderation]
  await comments.setCommentStatus(id, status)
  await logActivity(user.id, action, 'comment', id, { postId: existing.postId })

  const updated = await comments.getCommentById(id)
  if (!updated) throw notFound('Comment not found')
  return updated
}
