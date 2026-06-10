import { Router } from 'express'
import { z } from 'zod'
import { ROLES, createCommentSchema, listCommentsQuerySchema } from '@educms/shared'
import * as commentController from '../controllers/comment.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { commentRateLimiter } from '../middleware/rateLimiter.js'
import { validateRequest } from '../middleware/validateRequest.js'

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() })
const MODERATORS = [ROLES.ADMIN, ROLES.EDITOR] as const

export const commentRoutes = Router()
commentRoutes.use(authMiddleware)

commentRoutes.get(
  '/',
  requireRole(...MODERATORS),
  validateRequest({ query: listCommentsQuerySchema }),
  commentController.list
)
// Any authenticated user (including subscribers) can comment on published posts.
commentRoutes.post(
  '/',
  commentRateLimiter,
  validateRequest({ body: createCommentSchema }),
  commentController.create
)
commentRoutes.patch(
  '/:id/approve',
  requireRole(...MODERATORS),
  validateRequest({ params: idParamsSchema }),
  commentController.approve
)
commentRoutes.patch(
  '/:id/spam',
  requireRole(...MODERATORS),
  validateRequest({ params: idParamsSchema }),
  commentController.spam
)
commentRoutes.patch(
  '/:id/trash',
  requireRole(...MODERATORS),
  validateRequest({ params: idParamsSchema }),
  commentController.trash
)
