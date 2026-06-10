import { Router } from 'express'
import { z } from 'zod'
import { ROLES, STAFF_ROLES, categoryFormSchema, tagFormSchema } from '@educms/shared'
import * as taxonomyController from '../controllers/taxonomy.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export const categoryRoutes = Router()
categoryRoutes.use(authMiddleware)

categoryRoutes.get('/', requireRole(...STAFF_ROLES), taxonomyController.getCategories)
categoryRoutes.post(
  '/',
  requireRole(ROLES.ADMIN),
  validateRequest({ body: categoryFormSchema }),
  taxonomyController.createCategory
)
categoryRoutes.patch(
  '/:id',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: idParamsSchema, body: categoryFormSchema }),
  taxonomyController.updateCategory
)
categoryRoutes.delete(
  '/:id',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: idParamsSchema }),
  taxonomyController.deleteCategory
)

export const tagRoutes = Router()
tagRoutes.use(authMiddleware)

tagRoutes.get('/', requireRole(...STAFF_ROLES), taxonomyController.getTags)
tagRoutes.post(
  '/',
  requireRole(ROLES.ADMIN),
  validateRequest({ body: tagFormSchema }),
  taxonomyController.createTag
)
tagRoutes.patch(
  '/:id',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: idParamsSchema, body: tagFormSchema }),
  taxonomyController.updateTag
)
tagRoutes.delete(
  '/:id',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: idParamsSchema }),
  taxonomyController.deleteTag
)
