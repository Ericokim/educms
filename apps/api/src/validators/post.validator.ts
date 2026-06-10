import { z } from 'zod'

// Post schemas are shared with the frontend editor.
export { postFormSchema, listPostsQuerySchema } from '@educms/shared'

export const postIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const rollbackParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  versionId: z.coerce.number().int().positive(),
})

export const slugParamsSchema = z.object({
  slug: z.string().min(1).max(280),
})
