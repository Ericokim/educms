import { ROLES, STAFF_ROLES, type Role } from '@educms/shared'

export interface NavItem {
  label: string
  to: string
  roles: Role[]
}

const STAFF = STAFF_ROLES
const EVERYONE: Role[] = [...STAFF, ROLES.SUBSCRIBER]

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', roles: EVERYONE },
  { label: 'Posts', to: '/posts', roles: STAFF },
  { label: 'Categories', to: '/categories', roles: [ROLES.ADMIN] },
  { label: 'Tags', to: '/tags', roles: [ROLES.ADMIN] },
  { label: 'Comments', to: '/comments', roles: [ROLES.ADMIN, ROLES.EDITOR] },
  { label: 'Media', to: '/media', roles: STAFF },
  { label: 'Users', to: '/users', roles: [ROLES.ADMIN] },
  { label: 'Analytics', to: '/analytics', roles: [ROLES.ADMIN, ROLES.EDITOR] },
]

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
