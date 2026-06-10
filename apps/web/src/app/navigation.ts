import {
  BarChart3,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  MessagesSquare,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ROLES, STAFF_ROLES, type Role } from '@educms/shared'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
}

const STAFF = STAFF_ROLES
const EVERYONE: Role[] = [...STAFF, ROLES.SUBSCRIBER]

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: EVERYONE },
  { label: 'Posts', to: '/posts', icon: FileText, roles: STAFF },
  { label: 'Categories', to: '/categories', icon: FolderTree, roles: [ROLES.ADMIN] },
  { label: 'Tags', to: '/tags', icon: Tags, roles: [ROLES.ADMIN] },
  { label: 'Comments', to: '/comments', icon: MessagesSquare, roles: [ROLES.ADMIN, ROLES.EDITOR] },
  { label: 'Media', to: '/media', icon: Image, roles: STAFF },
  { label: 'Users', to: '/users', icon: Users, roles: [ROLES.ADMIN] },
  { label: 'Analytics', to: '/analytics', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.EDITOR] },
]

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
