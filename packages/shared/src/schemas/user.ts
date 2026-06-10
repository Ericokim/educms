import { z } from 'zod'
import { ROLES } from '../constants/roles.js'

const roleEnum = z.enum([ROLES.ADMIN, ROLES.EDITOR, ROLES.AUTHOR, ROLES.SUBSCRIBER])

const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50)
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dots, hyphens, and underscores')

const passwordField = z.string().min(8, 'Password must be at least 8 characters').max(100)

const nameField = z.string().trim().max(100).optional().or(z.literal(''))

export const createUserSchema = z.object({
  username: usernameField,
  email: z.email('Enter a valid email address'),
  password: passwordField,
  firstName: nameField,
  lastName: nameField,
  role: roleEnum,
})

export type CreateUserValues = z.output<typeof createUserSchema>

export const updateUserSchema = z.object({
  username: usernameField,
  email: z.email('Enter a valid email address'),
  password: passwordField.optional().or(z.literal('')),
  firstName: nameField,
  lastName: nameField,
})

export type UpdateUserValues = z.output<typeof updateUserSchema>

export const updateRoleSchema = z.object({
  role: roleEnum,
})

export type UpdateRoleValues = z.output<typeof updateRoleSchema>

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  role: roleEnum.optional(),
  search: z.string().trim().max(100).optional(),
})

export type ListUsersQuery = z.output<typeof listUsersQuerySchema>
