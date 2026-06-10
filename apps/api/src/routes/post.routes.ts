import { Router } from 'express'
import { ROLES, STAFF_ROLES } from '@educms/shared'
import * as postController from '../controllers/post.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  listPostsQuerySchema,
  postFormSchema,
  postIdParamsSchema,
  rollbackParamsSchema,
  slugParamsSchema,
} from '../validators/post.validator.js'

export const postRoutes = Router()

postRoutes.use(authMiddleware)

// Author access (own posts) is enforced in the service layer.
postRoutes.get(
  '/',
  requireRole(...STAFF_ROLES),
  validateRequest({ query: listPostsQuerySchema }),
  postController.list
)
postRoutes.get(
  '/slug/:slug',
  validateRequest({ params: slugParamsSchema }),
  postController.getBySlug
)
postRoutes.get(
  '/:id',
  requireRole(...STAFF_ROLES),
  validateRequest({ params: postIdParamsSchema }),
  postController.getById
)
postRoutes.post(
  '/',
  requireRole(...STAFF_ROLES),
  validateRequest({ body: postFormSchema }),
  postController.create
)
postRoutes.patch(
  '/:id',
  requireRole(...STAFF_ROLES),
  validateRequest({ params: postIdParamsSchema, body: postFormSchema }),
  postController.update
)
postRoutes.patch(
  '/:id/publish',
  requireRole(ROLES.ADMIN, ROLES.EDITOR),
  validateRequest({ params: postIdParamsSchema }),
  postController.publish
)
postRoutes.patch(
  '/:id/archive',
  requireRole(ROLES.ADMIN, ROLES.EDITOR),
  validateRequest({ params: postIdParamsSchema }),
  postController.archive
)
postRoutes.delete(
  '/:id',
  requireRole(ROLES.ADMIN),
  validateRequest({ params: postIdParamsSchema }),
  postController.remove
)
postRoutes.get(
  '/:id/versions',
  requireRole(...STAFF_ROLES),
  validateRequest({ params: postIdParamsSchema }),
  postController.versions
)
postRoutes.post(
  '/:id/rollback/:versionId',
  requireRole(ROLES.ADMIN, ROLES.EDITOR),
  validateRequest({ params: rollbackParamsSchema }),
  postController.rollback
)
