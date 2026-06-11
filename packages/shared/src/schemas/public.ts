import { z } from 'zod'

export const listPublicPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
  categorySlug: z.string().trim().max(120).optional(),
  tagSlug: z.string().trim().max(60).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
})

export type ListPublicPostsQuery = z.output<typeof listPublicPostsQuerySchema>

export const publicSearchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search needs at least 2 characters').max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
})

export type PublicSearchQuery = z.output<typeof publicSearchQuerySchema>

export const publicCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, 'Comment must be at least 2 characters')
    .max(2000, 'Comment must be at most 2000 characters'),
})

export type PublicCommentValues = z.output<typeof publicCommentSchema>
