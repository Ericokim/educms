export const POST_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export type PostStatus = (typeof POST_STATUSES)[keyof typeof POST_STATUSES]

export const ALL_POST_STATUSES: PostStatus[] = Object.values(POST_STATUSES)

export const COMMENT_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SPAM: 'spam',
  TRASH: 'trash',
} as const

export type CommentStatus = (typeof COMMENT_STATUSES)[keyof typeof COMMENT_STATUSES]

export const ALL_COMMENT_STATUSES: CommentStatus[] = Object.values(COMMENT_STATUSES)
