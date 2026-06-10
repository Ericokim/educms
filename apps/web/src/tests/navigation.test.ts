import { describe, expect, it } from 'vitest'
import { ROLES } from '@educms/shared'
import { navItemsForRole } from '@/app/navigation'

function labelsFor(role: Parameters<typeof navItemsForRole>[0]) {
  return navItemsForRole(role).map((item) => item.label)
}

describe('role-based navigation', () => {
  it('shows everything to admins', () => {
    expect(labelsFor(ROLES.ADMIN)).toEqual([
      'Dashboard',
      'Posts',
      'Categories',
      'Tags',
      'Comments',
      'Media',
      'Users',
      'Analytics',
    ])
  })

  it('hides user and taxonomy management from editors', () => {
    const labels = labelsFor(ROLES.EDITOR)
    expect(labels).toContain('Comments')
    expect(labels).toContain('Analytics')
    expect(labels).not.toContain('Users')
    expect(labels).not.toContain('Categories')
    expect(labels).not.toContain('Tags')
  })

  it('limits authors to content tools', () => {
    expect(labelsFor(ROLES.AUTHOR)).toEqual(['Dashboard', 'Posts', 'Media'])
  })

  it('limits subscribers to the dashboard', () => {
    expect(labelsFor(ROLES.SUBSCRIBER)).toEqual(['Dashboard'])
  })
})
