import { z } from 'zod'

export const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  content: z
    .string()
    .trim()
    .min(2, 'Comment must be at least 2 characters')
    .max(2000, 'Comment must be at most 2000 characters'),
})

export type CreateCommentValues = z.output<typeof createCommentSchema>

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'approved', 'spam', 'trash']).optional(),
})

export type ListCommentsQuery = z.output<typeof listCommentsQuerySchema>
