import { Router } from 'express'
import { STAFF_ROLES } from '@educms/shared'
import { dashboard } from '../controllers/analytics.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

export const analyticsRoutes = Router()

analyticsRoutes.get('/dashboard', authMiddleware, requireRole(...STAFF_ROLES), dashboard)
