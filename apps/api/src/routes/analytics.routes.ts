import { Router } from 'express'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import * as analyticsController from '../controllers/analytics.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

export const analyticsRoutes = Router()
analyticsRoutes.use(authMiddleware)

// The dashboard feeds every staff member's home page; the detailed
// analytics page is admin/editor only (matching the frontend navigation).
analyticsRoutes.get('/dashboard', requireRole(...STAFF_ROLES), analyticsController.dashboard)
analyticsRoutes.get(
  '/posts',
  requireRole(ROLES.ADMIN, ROLES.EDITOR),
  analyticsController.posts
)
analyticsRoutes.get(
  '/users',
  requireRole(ROLES.ADMIN, ROLES.EDITOR),
  analyticsController.users
)
