import { z } from 'zod'

export const updateMediaSchema = z.object({
  altText: z.string().trim().max(255).optional().or(z.literal('')),
  caption: z.string().trim().max(500).optional().or(z.literal('')),
})

export type UpdateMediaValues = z.output<typeof updateMediaSchema>

export const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
})

export type ListMediaQuery = z.output<typeof listMediaQuerySchema>
