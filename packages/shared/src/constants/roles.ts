export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  SUBSCRIBER: 'subscriber',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: Role[] = Object.values(ROLES)

/** Roles that work in the admin panel on content (everyone but subscribers). */
export const STAFF_ROLES: Role[] = [ROLES.ADMIN, ROLES.EDITOR, ROLES.AUTHOR]
