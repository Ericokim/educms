import { z } from 'zod'

/** Form/body schema shared by the post editor UI and the API. */
export const postFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  slug: z
    .string()
    .trim()
    .max(280)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
    .optional()
    .or(z.literal('')),
  excerpt: z.string().trim().max(500).optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  categoryId: z.number().int().positive().nullable().optional(),
  tagIds: z.array(z.number().int().positive()).max(20).default([]),
  metaTitle: z.string().trim().max(255).optional().or(z.literal('')),
  metaDescription: z.string().trim().max(500).optional().or(z.literal('')),
  metaKeywords: z.string().trim().max(255).optional().or(z.literal('')),
})

export type PostFormInput = z.input<typeof postFormSchema>
export type PostFormValues = z.output<typeof postFormSchema>

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  tagId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
})

export type ListPostsQuery = z.output<typeof listPostsQuerySchema>
