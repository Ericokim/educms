import { Router } from 'express'
import { STAFF_ROLES } from '@educms/shared'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { listCategories, listTags } from '../repositories/taxonomy.repository.js'
import { sendSuccess } from '../utils/responses.js'

// Read-only list endpoints used by the post editor.
// Full categories/tags CRUD arrives in Phase 7.
export const categoryRoutes = Router()
categoryRoutes.get('/', authMiddleware, requireRole(...STAFF_ROLES), async (_req, res) => {
  sendSuccess(res, 'Categories', await listCategories())
})

export const tagRoutes = Router()
tagRoutes.get('/', authMiddleware, requireRole(...STAFF_ROLES), async (_req, res) => {
  sendSuccess(res, 'Tags', await listTags())
})
