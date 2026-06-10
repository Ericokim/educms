import { z } from 'zod'

const slugField = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
  .optional()
  .or(z.literal(''))

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: slugField,
  description: z.string().trim().max(500).optional().or(z.literal('')),
})

export type CategoryFormValues = z.output<typeof categoryFormSchema>

export const tagFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  slug: slugField,
})

export type TagFormValues = z.output<typeof tagFormSchema>
