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
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, roles: EVERYONE },
  { label: 'Posts', to: '/admin/posts', icon: FileText, roles: STAFF },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree, roles: [ROLES.ADMIN] },
  { label: 'Tags', to: '/admin/tags', icon: Tags, roles: [ROLES.ADMIN] },
  { label: 'Comments', to: '/admin/comments', icon: MessagesSquare, roles: [ROLES.ADMIN, ROLES.EDITOR] },
  { label: 'Media', to: '/admin/media', icon: Image, roles: STAFF },
  { label: 'Users', to: '/admin/users', icon: Users, roles: [ROLES.ADMIN] },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.EDITOR] },
]

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
